import { PrismaClient } from "@prisma/client";
import { prisma } from "../config/database";
import { RESULT_CONFIG } from "../config/result.config";

export interface ValidationIssueItem {
  ruleCode: string;
  severity: "WARNING" | "BLOCKING";
  message: string;
  entityType?: string;
  entityId?: string;
  blocking: boolean;
}

export interface ValidationResultOutput {
  passed: boolean;
  status: "PASSED" | "WARNING" | "BLOCKED";
  issues: ValidationIssueItem[];
  aggregatedMarks: {
    totalAwardedMarks: number;
    totalMaxMarks: number;
    questionBreakdowns: Array<{
      questionAttemptId: string;
      questionNumber: string;
      maximumMarks: number;
      awardedMarks: number;
      sourceDecisionId?: string;
      sourceModerationDecisionId?: string;
      status: string;
    }>;
  };
}

export class ResultValidationService {
  private db: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.db = client;
  }

  async validateScriptAttempts(scriptId: string): Promise<ValidationResultOutput> {
    const issues: ValidationIssueItem[] = [];

    // 1. Fetch AnswerScript with Exam, Subject, Reconstructions, Attempts, Decisions, and Moderation
    const script = await this.db.answerScript.findUnique({
      where: { id: scriptId },
      include: {
        exam: true,
        subject: {
          include: {
            questions: {
              where: { isArchived: false },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        reconstructions: {
          where: { status: "COMPLETED" },
          orderBy: { version: "desc" },
          take: 1,
          include: {
            attempts: {
              include: {
                question: true,
                evaluations: {
                  include: {
                    decisionHistory: {
                      orderBy: { version: "desc" },
                      take: 1,
                    },
                    evaluationRounds: true,
                  },
                },
                doubleEvaluationResult: true,
                moderationCases: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                  include: {
                    decisions: {
                      orderBy: { version: "desc" },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!script) {
      throw new Error(`AnswerScript with ID ${scriptId} not found.`);
    }

    const exam = script.exam;
    const subject = script.subject;
    const questions = subject?.questions || [];
    const latestReconstruction = script.reconstructions?.[0];
    const attempts = latestReconstruction?.attempts || [];

    // Track aggregated question marks
    const questionBreakdowns: Array<{
      questionAttemptId: string;
      questionNumber: string;
      maximumMarks: number;
      awardedMarks: number;
      sourceDecisionId?: string;
      sourceModerationDecisionId?: string;
      status: string;
    }> = [];

    let calculatedTotalAwarded = 0;
    let calculatedTotalMax = 0;

    // Check Question Paper Total Maximum Marks Match (RESULT-EXAM-001)
    const sumSubjectQuestionMax = questions.reduce((acc: number, q: { maximumMarks: number }) => acc + q.maximumMarks, 0);
    if (exam && sumSubjectQuestionMax > 0 && Math.abs(sumSubjectQuestionMax - exam.totalMarks) > 0.01) {
      issues.push({
        ruleCode: RESULT_CONFIG.RULES.QUESTION_PAPER_TOTAL_MISMATCH.code,
        severity: "BLOCKING",
        message: `Sum of question maximum marks (${sumSubjectQuestionMax}) does not match exam total marks (${exam.totalMarks}).`,
        entityType: "Exam",
        entityId: exam.id,
        blocking: true,
      });
    }

    // Check for Duplicate or Unresolved Question Attempts (RESULT-COV-002)
    const questionAttemptMap = new Map<string, typeof attempts>();
    for (const att of attempts) {
      const existing = questionAttemptMap.get(att.questionId) || [];
      existing.push(att);
      questionAttemptMap.set(att.questionId, existing);
    }

    for (const [, attList] of questionAttemptMap.entries()) {
      if (attList.length > 1) {
        // If more than one attempt exists, check if only one is ACTIVE or resolved
        const activeList = attList.filter((a: { state: string }) => a.state === "ACTIVE");
        if (activeList.length > 1) {
          issues.push({
            ruleCode: RESULT_CONFIG.RULES.UNRESOLVED_DUPLICATE_ATTEMPT.code,
            severity: "BLOCKING",
            message: `Multiple active candidate attempts detected for question ${attList[0].question.questionNumber} without authoritative resolution.`,
            entityType: "QuestionAttempt",
            entityId: activeList[0].id,
            blocking: true,
          });
        }
      }
    }

    // Process each Subject Question
    for (const question of questions) {
      const qAttempts = attempts.filter((a: { questionId: string; state: string }) => a.questionId === question.id && a.state !== "CANCELLED");

      if (qAttempts.length === 0) {
        // Missing required attempt
        issues.push({
          ruleCode: RESULT_CONFIG.RULES.MISSING_QUESTION_DECISION.code,
          severity: "BLOCKING",
          message: `Question ${question.questionNumber} has no candidate attempt or evaluation record.`,
          entityType: "Question",
          entityId: question.id,
          blocking: true,
        });
        continue;
      }

      const primaryAttempt = qAttempts.find((a: { state: string }) => a.state === "ACTIVE") || qAttempts[0];

      // Check special states
      if (primaryAttempt.state === "UNREADABLE") {
        issues.push({
          ruleCode: RESULT_CONFIG.RULES.UNRESOLVED_UNREADABLE_ANSWER.code,
          severity: "BLOCKING",
          message: `Unresolved unreadable answer attempt on question ${question.questionNumber}.`,
          entityType: "QuestionAttempt",
          entityId: primaryAttempt.id,
          blocking: true,
        });
      }

      // Check Moderation Status (RESULT-MOD-001)
      const activeModeration = primaryAttempt.moderationCases?.[0];
      let authoritativeModerationDecision: any = null;
      if (activeModeration) {
        if (activeModeration.status !== "RESOLVED") {
          issues.push({
            ruleCode: RESULT_CONFIG.RULES.ACTIVE_MODERATION_CASE.code,
            severity: "BLOCKING",
            message: `Active or unresolved moderation case (${activeModeration.caseNumber || activeModeration.id}) exists for question ${question.questionNumber}.`,
            entityType: "ModerationCase",
            entityId: activeModeration.id,
            blocking: true,
          });
        } else {
          authoritativeModerationDecision = activeModeration.decisions?.[0];
        }
      }

      // Check Double Evaluation Disagreement (RESULT-DBL-001)
      const doubleEval = primaryAttempt.doubleEvaluationResult;
      if (doubleEval && doubleEval.requiresSeniorReview && !activeModeration) {
        issues.push({
          ruleCode: RESULT_CONFIG.RULES.UNRESOLVED_DOUBLE_EVAL_DISAGREEMENT.code,
          severity: "BLOCKING",
          message: `Double evaluation disagreement on question ${question.questionNumber} requires resolved moderation review.`,
          entityType: "DoubleEvaluationResult",
          entityId: doubleEval.id,
          blocking: true,
        });
      }

      // Determine Authoritative Marks & Source Decision
      const evaluation = primaryAttempt.evaluations?.[0];
      const latestDecision = evaluation?.decisionHistory?.[0];

      let awardedMarks = 0;
      let sourceDecisionId: string | undefined = undefined;
      let sourceModerationDecisionId: string | undefined = undefined;

      if (authoritativeModerationDecision) {
        awardedMarks = authoritativeModerationDecision.marksAfter;
        sourceModerationDecisionId = authoritativeModerationDecision.id;
        sourceDecisionId = latestDecision?.id;
      } else if (latestDecision) {
        if (latestDecision.status !== "FINAL") {
          issues.push({
            ruleCode: RESULT_CONFIG.RULES.INVALID_SOURCE_DECISION_STATE.code,
            severity: "BLOCKING",
            message: `Decision for question ${question.questionNumber} is in ${latestDecision.status} state, not FINAL.`,
            entityType: "ExaminerEvaluationDecision",
            entityId: latestDecision.id,
            blocking: true,
          });
        }
        awardedMarks = latestDecision.totalMarks;
        sourceDecisionId = latestDecision.id;
      } else if (primaryAttempt.state === "BLANK") {
        awardedMarks = 0;
      } else {
        issues.push({
          ruleCode: RESULT_CONFIG.RULES.MISSING_SOURCE_DECISION.code,
          severity: "BLOCKING",
          message: `No authoritative examiner or moderation decision found for question ${question.questionNumber}.`,
          entityType: "QuestionAttempt",
          entityId: primaryAttempt.id,
          blocking: true,
        });
      }

      // Validate Marks Range (RESULT-MRK-001)
      if (awardedMarks > question.maximumMarks) {
        issues.push({
          ruleCode: RESULT_CONFIG.RULES.QUESTION_MARKS_EXCEED_MAX.code,
          severity: "BLOCKING",
          message: `Awarded marks (${awardedMarks}) exceed question ${question.questionNumber} maximum marks (${question.maximumMarks}).`,
          entityType: "Question",
          entityId: question.id,
          blocking: true,
        });
      }

      // Validate Negative Marking (RESULT-MRK-003)
      if (awardedMarks < 0) {
        issues.push({
          ruleCode: RESULT_CONFIG.RULES.NEGATIVE_MARKS_VIOLATION.code,
          severity: "BLOCKING",
          message: `Negative marks (${awardedMarks}) awarded on question ${question.questionNumber} while negative marking is disabled.`,
          entityType: "Question",
          entityId: question.id,
          blocking: true,
        });
      }

      calculatedTotalAwarded += awardedMarks;
      calculatedTotalMax += question.maximumMarks;

      questionBreakdowns.push({
        questionAttemptId: primaryAttempt.id,
        questionNumber: question.questionNumber,
        maximumMarks: question.maximumMarks,
        awardedMarks,
        sourceDecisionId,
        sourceModerationDecisionId,
        status: "FINAL",
      });
    }

    const blockingIssues = issues.filter((iss) => iss.blocking);
    const passed = blockingIssues.length === 0;
    const status: "PASSED" | "WARNING" | "BLOCKED" = !passed
      ? "BLOCKED"
      : issues.length > 0
      ? "WARNING"
      : "PASSED";

    return {
      passed,
      status,
      issues,
      aggregatedMarks: {
        totalAwardedMarks: Math.max(0, calculatedTotalAwarded),
        totalMaxMarks: calculatedTotalMax,
        questionBreakdowns,
      },
    };
  }
}

export const resultValidationService = new ResultValidationService();
