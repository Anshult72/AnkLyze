/**
 * ANKLYZE Phase 10 - Evaluation Repository
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Versioned evaluation records preserving full provenance and AI suggestions.
 * - Criterion-level scoring, evidence linking, and issue tracking.
 * - Human decisions stored separately / versioned without overwriting original AI suggestions.
 * - Strictly enforces relational integrity across QuestionAttempt, RubricCriterion, Page, and Region.
 */

import { prisma } from '../config/database';
import {
  EvaluationStatus,
  EvaluationCriterionStatus,
  EvaluationIssueType,
  IssueSeverity,
  ConfidenceBand,
  DecisionType,
  DecisionStatus,
} from '@prisma/client';

export interface CreateHumanDecisionInput {
  evaluationId: string;
  examinerUserId: string;
  decisionType: DecisionType;
  status?: DecisionStatus;
  totalMarks: number;
  expectedVersion?: number;
  notes?: string;
  overrideReason?: string;
  reopenReason?: string;
  criteriaDecisions?: Array<{
    criterionId: string;
    criterionName?: string;
    marksAwarded: number;
    examinerComment?: string;
  }>;
}

export interface CreateEvaluationInput {
  questionAttemptId: string;
  rubricVersion?: string;
  rubricAnalysisId?: string;
  provider: string;
  model: string;
  promptVersion: string;
  pipelineVersion: string;
  status: EvaluationStatus;
  suggestedMarks: number;
  maxMarks: number;
  confidenceScore: number;
  confidenceBand: 'HIGH' | 'MEDIUM' | 'LOW';
  assessmentSummary?: string;
  alternateMethodDetected?: boolean;
  alternateMethodName?: string;
  requiresReview?: boolean;
  reviewReason?: string;
  rawResponse?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  latencyMs?: number;
  criteria: Array<{
    criterionId: string;
    criterionName?: string;
    criterionSatisfied: string; // 'SATISFIED' | 'PARTIALLY_SATISFIED' | 'NOT_SATISFIED' | 'NOT_ASSESSABLE' | 'REQUIRES_REVIEW'
    suggestedMarks: number;
    maxMarks: number;
    confidenceScore: number;
    reasoning?: string;
    evidence: Array<{
      pageId?: string;
      pageNumber?: number;
      answerRegionId?: string;
      evidenceType: string;
      extractedText?: string;
      reason?: string;
      boundingBoxJson?: string;
      relevanceScore?: number;
    }>;
  }>;
  issues?: Array<{
    issueType: string;
    severity: string;
    message: string;
    requiresReview?: boolean;
  }>;
}

export interface ExaminerDecisionInput {
  evaluationId: string;
  examinerId: string;
  decisionType: 'ACCEPTED' | 'OVERRIDDEN' | 'FLAGGED';
  totalMarksAwarded: number;
  examinerNotes?: string;
  criteriaOverrides?: Array<{
    criterionId: string;
    marksAwarded: number;
    examinerComment?: string;
  }>;
}

function mapToCriterionStatus(status: string): EvaluationCriterionStatus {
  switch (status) {
    case 'SATISFIED': return EvaluationCriterionStatus.SATISFIED;
    case 'PARTIALLY_SATISFIED': return EvaluationCriterionStatus.PARTIALLY_SATISFIED;
    case 'NOT_SATISFIED': return EvaluationCriterionStatus.NOT_SATISFIED;
    case 'NOT_ASSESSABLE': return EvaluationCriterionStatus.NOT_ASSESSABLE;
    case 'REQUIRES_REVIEW': return EvaluationCriterionStatus.REQUIRES_REVIEW;
    default: return EvaluationCriterionStatus.NOT_ASSESSABLE;
  }
}

function mapToIssueType(type: string): EvaluationIssueType {
  switch (type) {
    case 'LOW_CONFIDENCE': return EvaluationIssueType.LOW_CONFIDENCE;
    case 'AMBIGUOUS_ANSWER':
    case 'AMBIGUOUS_NOTATION': return EvaluationIssueType.AMBIGUOUS_ANSWER;
    case 'ALTERNATE_METHOD_DETECTED':
    case 'UNAPPROVED_ALTERNATE_METHOD': return EvaluationIssueType.ALTERNATE_METHOD_DETECTED;
    case 'MARK_BOUNDARY': return EvaluationIssueType.MARK_BOUNDARY;
    case 'UNREADABLE_REGION':
    case 'UNREADABLE_HANDWRITING': return EvaluationIssueType.UNREADABLE_REGION;
    case 'MULTIPLE_ATTEMPTS':
    case 'DUPLICATE_ATTEMPT': return EvaluationIssueType.MULTIPLE_ATTEMPTS;
    case 'RUBRIC_MISMATCH': return EvaluationIssueType.RUBRIC_MISMATCH;
    default: return EvaluationIssueType.LOW_CONFIDENCE;
  }
}

function mapToIssueSeverity(sev: string): IssueSeverity {
  switch (sev?.toUpperCase()) {
    case 'HIGH': return IssueSeverity.HIGH;
    case 'MEDIUM': return IssueSeverity.MEDIUM;
    case 'LOW':
    default: return IssueSeverity.LOW;
  }
}

function mapToConfidenceBand(band: string): ConfidenceBand {
  switch (band?.toUpperCase()) {
    case 'HIGH': return ConfidenceBand.HIGH;
    case 'MEDIUM': return ConfidenceBand.MEDIUM;
    case 'LOW':
    default: return ConfidenceBand.LOW;
  }
}

export class EvaluationRepository {
  /**
   * Creates a new Evaluation record along with criterion results, evidence items, and issues.
   */
  public static async createEvaluation(input: CreateEvaluationInput) {
    return prisma.$transaction(async (tx) => {
      // Mark any prior active evaluation as SUPERSEDED
      await tx.evaluation.updateMany({
        where: {
          questionAttemptId: input.questionAttemptId,
          status: { in: [EvaluationStatus.COMPLETED, EvaluationStatus.PENDING, EvaluationStatus.PROCESSING] },
        },
        data: {
          status: EvaluationStatus.SUPERSEDED,
        },
      });

      // Count existing versions
      const count = await tx.evaluation.count({
        where: { questionAttemptId: input.questionAttemptId },
      });

      const metadataObj = {
        rubricVersion: input.rubricVersion || '1.0',
        alternateMethodDetected: input.alternateMethodDetected || false,
        alternateMethodName: input.alternateMethodName,
        reviewReason: input.reviewReason,
        fallbackReason: input.fallbackReason,
        latencyMs: input.latencyMs,
      };

      const evaluation = await tx.evaluation.create({
        data: {
          questionAttemptId: input.questionAttemptId,
          version: count + 1,
          rubricAnalysisId: input.rubricAnalysisId,
          provider: input.provider,
          model: input.model,
          promptVersion: input.promptVersion,
          pipelineVersion: input.pipelineVersion,
          status: input.status,
          suggestedMarks: input.suggestedMarks,
          maxMarks: input.maxMarks,
          confidenceScore: input.confidenceScore,
          confidenceBand: mapToConfidenceBand(input.confidenceBand),
          assessmentSummary: input.assessmentSummary,
          requiresReview: input.requiresReview || false,
          fallbackUsed: input.fallbackUsed || false,
          metadata: JSON.stringify(metadataObj),
          criterionResults: {
            create: input.criteria.map((c) => ({
              criterionId: c.criterionId,
              criterionName: c.criterionName || c.criterionId,
              status: mapToCriterionStatus(c.criterionSatisfied),
              suggestedMarks: c.suggestedMarks,
              maxMarks: c.maxMarks,
              confidenceScore: c.confidenceScore,
              evidenceSummary: c.reasoning,
              evidence: {
                create: c.evidence.map((ev) => ({
                  pageId: ev.pageId,
                  pageNumber: ev.pageNumber,
                  answerRegionId: ev.answerRegionId,
                  evidenceType: ev.evidenceType,
                  extractedText: ev.extractedText,
                  reason: ev.reason,
                  relevanceScore: ev.relevanceScore ?? 1.0,
                })),
              },
            })),
          },
          issues: input.issues && input.issues.length > 0
            ? {
                create: input.issues.map((iss) => ({
                  issueType: mapToIssueType(iss.issueType),
                  severity: mapToIssueSeverity(iss.severity),
                  message: iss.message,
                  requiresReview: iss.requiresReview !== undefined ? iss.requiresReview : true,
                })),
              }
            : undefined,
        },
        include: {
          criterionResults: {
            include: {
              evidence: true,
            },
          },
          issues: true,
        },
      });

      return evaluation;
    });
  }

  /**
   * Retrieves the latest active evaluation for a given QuestionAttempt.
   */
  public static async getLatestByAttemptId(questionAttemptId: string) {
    return prisma.evaluation.findFirst({
      where: {
        questionAttemptId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        criterionResults: {
          include: {
            evidence: true,
          },
        },
        issues: true,
        questionAttempt: {
          include: {
            question: true,
            pages: {
              include: {
                page: true,
              },
            },
            regions: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves an Evaluation by its ID with full criterion and evidence hierarchy.
   */
  public static async getById(evaluationId: string) {
    return prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        criterionResults: {
          include: {
            evidence: true,
          },
        },
        issues: true,
        questionAttempt: {
          include: {
            question: true,
            pages: {
              include: {
                page: true,
              },
            },
            regions: true,
            script: true,
          },
        },
      },
    });
  }

  /**
   * Creates an immutable versioned ExaminerEvaluationDecision with criterion decisions,
   * diff computation, AI snapshot, provenance metadata, and optimistic concurrency check.
   */
  public static async createDecisionVersion(input: CreateHumanDecisionInput) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: input.evaluationId },
      include: {
        criterionResults: true,
        questionAttempt: true,
      },
    });

    if (!evaluation) {
      throw new Error(`Evaluation with ID '${input.evaluationId}' not found`);
    }

    if (input.totalMarks < 0 || input.totalMarks > evaluation.maxMarks) {
      throw new Error(
        `Total marks (${input.totalMarks}) must be between 0 and question maximum (${evaluation.maxMarks})`
      );
    }

    // Fetch the latest decision version
    const latestDecision = await prisma.examinerEvaluationDecision.findFirst({
      where: { evaluationId: input.evaluationId },
      orderBy: { version: 'desc' },
      include: { criteriaDecisions: true },
    });

    // Optimistic Concurrency Check
    if (input.expectedVersion !== undefined) {
      const currentVer = latestDecision ? latestDecision.version : 0;
      if (input.expectedVersion !== currentVer) {
        throw new Error(
          `STALE_VERSION_CONFLICT: Expected version ${input.expectedVersion}, but current version is ${currentVer}. Please reload before saving.`
        );
      }
    }

    const newVersion = latestDecision ? latestDecision.version + 1 : 1;
    const status = input.status || DecisionStatus.DRAFT;

    // Base marks before this decision
    const beforeTotal = latestDecision
      ? latestDecision.totalMarks
      : evaluation.suggestedMarks ?? 0;

    // Compute criterion-level diffs
    const criteriaChanged: Array<{
      criterionId: string;
      criterionName: string;
      before: number;
      after: number;
    }> = [];

    const criteriaList = input.criteriaDecisions || [];

    for (const crit of criteriaList) {
      const rubricCrit = evaluation.criterionResults.find((c) => c.criterionId === crit.criterionId);
      if (!rubricCrit) {
        throw new Error(`Invalid criterionId '${crit.criterionId}' not found in evaluation rubric`);
      }

      if (crit.marksAwarded < 0 || crit.marksAwarded > rubricCrit.maxMarks) {
        throw new Error(
          `Marks for criterion '${rubricCrit.criterionName}' (${crit.marksAwarded}) exceed maximum allowed (${rubricCrit.maxMarks})`
        );
      }

      const prevCrit = latestDecision?.criteriaDecisions.find((c) => c.criterionId === crit.criterionId);
      const prevMarks = prevCrit ? prevCrit.marksAwarded : rubricCrit.suggestedMarks;

      if (Math.abs(prevMarks - crit.marksAwarded) > 0.001) {
        criteriaChanged.push({
          criterionId: crit.criterionId,
          criterionName: crit.criterionName || rubricCrit.criterionName,
          before: prevMarks,
          after: crit.marksAwarded,
        });
      }
    }

    // Require override reason when modifying marks or AI evaluation
    const isOverride =
      input.decisionType === DecisionType.OVERRIDE_AI ||
      Math.abs(input.totalMarks - (evaluation.suggestedMarks ?? 0)) > 0.001 ||
      criteriaChanged.length > 0;

    if (
      isOverride &&
      input.decisionType !== DecisionType.ACCEPT_AI_SUGGESTION &&
      input.decisionType !== DecisionType.FINALIZE &&
      input.decisionType !== DecisionType.REOPEN &&
      !input.overrideReason &&
      Math.abs(input.totalMarks - (evaluation.suggestedMarks ?? 0)) > 0.001
    ) {
      throw new Error('Override reason is required when modifying marks');
    }

    const diffJson = JSON.stringify({
      totalMarks: {
        before: beforeTotal,
        after: input.totalMarks,
      },
      criteriaChanged,
    });

    const aiSnapshotJson = JSON.stringify({
      evaluationId: evaluation.id,
      suggestedMarks: evaluation.suggestedMarks,
      maxMarks: evaluation.maxMarks,
      confidenceScore: evaluation.confidenceScore,
      confidenceBand: evaluation.confidenceBand,
      provider: evaluation.provider,
      model: evaluation.model,
      promptVersion: evaluation.promptVersion,
      pipelineVersion: evaluation.pipelineVersion,
      evaluatedAt: evaluation.createdAt,
    });

    const provenanceJson = JSON.stringify({
      questionAttemptId: evaluation.questionAttemptId,
      rubricAnalysisId: evaluation.rubricAnalysisId,
      examinerUserId: input.examinerUserId,
      version: newVersion,
      decisionType: input.decisionType,
      status,
      timestamp: new Date().toISOString(),
    });

    // Transactional creation of immutable decision record
    return prisma.$transaction(async (tx) => {
      const createdDecision = await tx.examinerEvaluationDecision.create({
        data: {
          evaluationId: input.evaluationId,
          version: newVersion,
          decisionType: input.decisionType,
          status,
          totalMarks: input.totalMarks,
          maxMarks: evaluation.maxMarks,
          notes: input.notes,
          overrideReason: input.overrideReason,
          reopenReason: input.reopenReason,
          examinerUserId: input.examinerUserId,
          sourceAIEvaluationId: evaluation.id,
          previousDecisionId: latestDecision ? latestDecision.id : null,
          diffJson,
          aiSnapshotJson,
          provenanceJson,
        },
      });

      // Create criterion decisions
      for (const crit of criteriaList) {
        const rubricCrit = evaluation.criterionResults.find((c) => c.criterionId === crit.criterionId);
        const isCriterionOverridden = rubricCrit
          ? Math.abs(rubricCrit.suggestedMarks - crit.marksAwarded) > 0.001
          : false;

        await tx.examinerCriterionDecision.create({
          data: {
            decisionId: createdDecision.id,
            criterionId: crit.criterionId,
            criterionName: crit.criterionName || rubricCrit?.criterionName || 'Criterion',
            marksAwarded: crit.marksAwarded,
            maxMarks: rubricCrit?.maxMarks || evaluation.maxMarks,
            aiSuggestedMarks: rubricCrit?.suggestedMarks ?? null,
            isOverridden: isCriterionOverridden,
            examinerComment: crit.examinerComment,
          },
        });

        // Also update parent evaluation criterion results for backward compatibility
        await tx.evaluationCriterionResult.updateMany({
          where: {
            evaluationId: input.evaluationId,
            criterionId: crit.criterionId,
          },
          data: {
            examinerMarks: crit.marksAwarded,
            examinerOverridden: isCriterionOverridden,
          },
        });
      }

      // Update parent evaluation summary status
      let evalStatus: EvaluationStatus = EvaluationStatus.PROCESSING;
      if (status === DecisionStatus.FINAL) {
        evalStatus = EvaluationStatus.COMPLETED;
      } else if (input.decisionType === DecisionType.FLAG_FOR_REVIEW) {
        evalStatus = EvaluationStatus.REQUIRES_REVIEW;
      }

      await tx.evaluation.update({
        where: { id: input.evaluationId },
        data: {
          examinerDecision: input.decisionType,
          examinerMarks: input.totalMarks,
          examinerNotes: input.notes || input.overrideReason,
          examinerUserId: input.examinerUserId,
          decidedAt: new Date(),
          status: evalStatus,
        },
      });

      return tx.examinerEvaluationDecision.findUnique({
        where: { id: createdDecision.id },
        include: {
          criteriaDecisions: true,
          previousDecision: true,
          examinerUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });
    });
  }

  /**
   * Finalizes the current draft decision into an authoritative FINAL decision.
   */
  public static async finalizeDecision(
    evaluationId: string,
    examinerUserId: string,
    notes?: string,
    expectedVersion?: number
  ) {
    const latestDecision = await prisma.examinerEvaluationDecision.findFirst({
      where: { evaluationId },
      orderBy: { version: 'desc' },
      include: { criteriaDecisions: true },
    });

    if (latestDecision && latestDecision.status === DecisionStatus.FINAL) {
      throw new Error(
        `DUPLICATE_FINALIZE_ERROR: Evaluation decision is already finalized at version ${latestDecision.version}`
      );
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: { criterionResults: true },
    });

    if (!evaluation) {
      throw new Error(`Evaluation '${evaluationId}' not found`);
    }

    const totalMarks = latestDecision
      ? latestDecision.totalMarks
      : evaluation.examinerMarks ?? evaluation.suggestedMarks ?? 0;

    const criteriaDecisions = latestDecision
      ? latestDecision.criteriaDecisions.map((c) => ({
          criterionId: c.criterionId,
          criterionName: c.criterionName,
          marksAwarded: c.marksAwarded,
          examinerComment: c.examinerComment || undefined,
        }))
      : evaluation.criterionResults.map((c) => ({
          criterionId: c.criterionId,
          criterionName: c.criterionName,
          marksAwarded: c.examinerMarks ?? c.suggestedMarks,
        }));

    return this.createDecisionVersion({
      evaluationId,
      examinerUserId,
      decisionType: DecisionType.FINALIZE,
      status: DecisionStatus.FINAL,
      totalMarks,
      notes: notes || latestDecision?.notes || undefined,
      overrideReason: latestDecision?.overrideReason || undefined,
      expectedVersion,
      criteriaDecisions,
    });
  }

  /**
   * Reopens a finalized decision to allow controlled amendments under a new draft version.
   */
  public static async reopenDecision(
    evaluationId: string,
    examinerUserId: string,
    reopenReason: string,
    expectedVersion?: number
  ) {
    if (!reopenReason || reopenReason.trim().length < 3) {
      throw new Error('REOPEN_REASON_REQUIRED: A valid reason (min 3 chars) is required to reopen a finalized decision');
    }

    const latestDecision = await prisma.examinerEvaluationDecision.findFirst({
      where: { evaluationId },
      orderBy: { version: 'desc' },
      include: { criteriaDecisions: true },
    });

    if (!latestDecision || latestDecision.status !== DecisionStatus.FINAL) {
      throw new Error('NOT_FINALIZED_ERROR: Cannot reopen a decision that is not currently finalized');
    }

    const criteriaDecisions = latestDecision.criteriaDecisions.map((c) => ({
      criterionId: c.criterionId,
      criterionName: c.criterionName,
      marksAwarded: c.marksAwarded,
      examinerComment: c.examinerComment || undefined,
    }));

    return this.createDecisionVersion({
      evaluationId,
      examinerUserId,
      decisionType: DecisionType.REOPEN,
      status: DecisionStatus.DRAFT,
      totalMarks: latestDecision.totalMarks,
      reopenReason,
      notes: `Reopened from version ${latestDecision.version}: ${reopenReason}`,
      expectedVersion,
      criteriaDecisions,
    });
  }

  /**
   * Retrieves all decision versions in chronological order.
   */
  public static async getDecisionHistory(evaluationId: string) {
    return prisma.examinerEvaluationDecision.findMany({
      where: { evaluationId },
      orderBy: { version: 'asc' },
      include: {
        criteriaDecisions: true,
        examinerUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves the current latest decision (DRAFT or FINAL).
   */
  public static async getCurrentDecision(evaluationId: string) {
    return prisma.examinerEvaluationDecision.findFirst({
      where: { evaluationId },
      orderBy: { version: 'desc' },
      include: {
        criteriaDecisions: true,
        examinerUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves the effective decision:
   * 1. Latest FINAL decision if available
   * 2. Otherwise latest DRAFT decision
   * 3. Otherwise advisory AI evaluation snapshot
   */
  public static async getCurrentEffectiveDecision(evaluationId: string) {
    const finalDecision = await prisma.examinerEvaluationDecision.findFirst({
      where: { evaluationId, status: DecisionStatus.FINAL },
      orderBy: { version: 'desc' },
      include: {
        criteriaDecisions: true,
        examinerUser: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (finalDecision) {
      return {
        isOfficial: true,
        source: 'FINAL_EXAMINER_DECISION' as const,
        decision: finalDecision,
      };
    }

    const draftDecision = await prisma.examinerEvaluationDecision.findFirst({
      where: { evaluationId, status: DecisionStatus.DRAFT },
      orderBy: { version: 'desc' },
      include: {
        criteriaDecisions: true,
        examinerUser: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (draftDecision) {
      return {
        isOfficial: false,
        source: 'DRAFT_EXAMINER_DECISION' as const,
        decision: draftDecision,
      };
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: { criterionResults: true },
    });

    return {
      isOfficial: false,
      source: 'AI_ADVISORY' as const,
      evaluation,
    };
  }

  /**
   * Compiles a comprehensive chronological timeline of AI and Human events.
   */
  public static async getCombinedTimeline(evaluationId: string) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: { issues: true },
    });

    if (!evaluation) {
      throw new Error(`Evaluation '${evaluationId}' not found`);
    }

    const decisions = await this.getDecisionHistory(evaluationId);

    const timeline: Array<{
      id: string;
      timestamp: Date;
      type: 'AI_EVALUATION' | 'HUMAN_DECISION' | 'ISSUE_FLAGGED';
      title: string;
      description: string;
      marks?: { suggested?: number; awarded?: number; max: number };
      actor?: { name: string; email?: string; role?: string };
      metadata?: any;
    }> = [];

    // 1. Initial AI Evaluation event
    timeline.push({
      id: `ai-${evaluation.id}`,
      timestamp: evaluation.createdAt,
      type: 'AI_EVALUATION',
      title: 'AI Advisory Evaluation Generated',
      description: evaluation.assessmentSummary || 'Rubric-grounded evaluation generated by multimodal AI model',
      marks: {
        suggested: evaluation.suggestedMarks ?? 0,
        max: evaluation.maxMarks,
      },
      actor: {
        name: `${evaluation.provider || 'AI'} (${evaluation.model || 'Multimodal'})`,
      },
      metadata: {
        confidenceScore: evaluation.confidenceScore,
        confidenceBand: evaluation.confidenceBand,
        promptVersion: evaluation.promptVersion,
      },
    });

    // 2. Human Decisions
    for (const dec of decisions) {
      let title = 'Examiner Decision';
      if (dec.decisionType === DecisionType.ACCEPT_AI_SUGGESTION) {
        title = `Accepted AI Suggestion (v${dec.version})`;
      } else if (dec.decisionType === DecisionType.OVERRIDE_AI) {
        title = `Overrode AI Marks (v${dec.version})`;
      } else if (dec.decisionType === DecisionType.SAVE_DRAFT) {
        title = `Draft Saved (v${dec.version})`;
      } else if (dec.decisionType === DecisionType.FINALIZE) {
        title = `Decision Finalized (v${dec.version})`;
      } else if (dec.decisionType === DecisionType.REOPEN) {
        title = `Decision Reopened (v${dec.version})`;
      } else if (dec.decisionType === DecisionType.FLAG_FOR_REVIEW) {
        title = `Flagged for Review (v${dec.version})`;
      }

      let diff = null;
      if (dec.diffJson) {
        try {
          diff = JSON.parse(dec.diffJson);
        } catch (_) {}
      }

      timeline.push({
        id: dec.id,
        timestamp: dec.createdAt,
        type: 'HUMAN_DECISION',
        title,
        description: dec.notes || dec.overrideReason || dec.reopenReason || `Decision status: ${dec.status}`,
        marks: {
          awarded: dec.totalMarks,
          max: dec.maxMarks,
        },
        actor: {
          name: dec.examinerUser?.fullName || 'Examiner',
          email: dec.examinerUser?.email,
        },
        metadata: {
          version: dec.version,
          status: dec.status,
          decisionType: dec.decisionType,
          diff,
          overrideReason: dec.overrideReason,
          reopenReason: dec.reopenReason,
        },
      });
    }

    // 3. Issue flags
    for (const issue of evaluation.issues) {
      timeline.push({
        id: issue.id,
        timestamp: issue.createdAt,
        type: 'ISSUE_FLAGGED',
        title: `Issue Flagged: ${issue.issueType}`,
        description: issue.message,
        metadata: {
          severity: issue.severity,
          requiresReview: issue.requiresReview,
        },
      });
    }

    // Sort chronologically
    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return timeline;
  }

  /**
   * Updates examiner decision on an Evaluation (Backward-Compatible Wrapper).
   * Now creates an immutable versioned decision record under the hood.
   */
  public static async saveExaminerDecision(input: ExaminerDecisionInput) {
    let decisionType: DecisionType = DecisionType.OVERRIDE_AI;
    if (input.decisionType === 'ACCEPTED') {
      decisionType = DecisionType.ACCEPT_AI_SUGGESTION;
    } else if (input.decisionType === 'FLAGGED') {
      decisionType = DecisionType.FLAG_FOR_REVIEW;
    }

    return this.createDecisionVersion({
      evaluationId: input.evaluationId,
      examinerUserId: input.examinerId,
      decisionType,
      status: input.decisionType === 'FLAGGED' ? DecisionStatus.DRAFT : DecisionStatus.FINAL,
      totalMarks: input.totalMarksAwarded,
      notes: input.examinerNotes,
      criteriaDecisions: input.criteriaOverrides?.map((c) => ({
        criterionId: c.criterionId,
        marksAwarded: c.marksAwarded,
        examinerComment: c.examinerComment,
      })),
    });
  }

  /**
   * Updates a single criterion result's marks and comment.
   */
  public static async updateCriterionResult(
    evaluationId: string,
    criterionId: string,
    marksAwarded: number,
    _examinerComment?: string
  ) {
    const updated = await prisma.evaluationCriterionResult.updateMany({
      where: {
        evaluationId,
        criterionId,
      },
      data: {
        examinerMarks: marksAwarded,
        examinerOverridden: true,
      },
    });

    return updated;
  }

  /**
   * Flags an evaluation for review with a specified reason.
   */
  public static async flagForReview(
    evaluationId: string,
    examinerId: string,
    reason: string
  ) {
    return prisma.$transaction(async (tx) => {
      const evaluation = await tx.evaluation.update({
        where: { id: evaluationId },
        data: {
          status: EvaluationStatus.REQUIRES_REVIEW,
          requiresReview: true,
          examinerDecision: 'FLAGGED',
          examinerUserId: examinerId,
          decidedAt: new Date(),
          examinerNotes: reason,
        },
        include: {
          issues: true,
        },
      });

      await tx.evaluationIssue.create({
        data: {
          evaluationId,
          issueType: EvaluationIssueType.LOW_CONFIDENCE,
          severity: IssueSeverity.HIGH,
          message: reason,
          requiresReview: true,
        },
      });

      return evaluation;
    });
  }

  /**
   * Lists all evaluations for a specific QuestionAttempt for audit trail / history.
   */
  public static async listHistoryByAttemptId(questionAttemptId: string) {
    return prisma.evaluation.findMany({
      where: { questionAttemptId },
      orderBy: { createdAt: 'desc' },
      include: {
        criterionResults: true,
        issues: true,
      },
    });
  }
}
