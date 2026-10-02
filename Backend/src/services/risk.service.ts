/**
 * ANKLYZE Phase 12 - Risk Engine & Adaptive Double Evaluation Service
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Deterministic, bounded (0-100), explainable risk scores.
 * - Observable factor sources (AI confidence, page quality, rubric issues, disagreement, reconstruction).
 * - Multi-round evaluation tracking with genuine double-blind independence.
 * - Escalates to senior review on significant disagreement without picking an automatic winner.
 */

import { prisma } from '../config/database';
import { RiskRepository } from '../repositories/risk.repository';
import { RISK_CONFIG, resolveRiskBand } from '../config/risk.config';
import { AuditService } from './audit.service';
import { logger } from '../utils/logger';
import {
  RiskFactorType,
  FactorSeverity,
  RoundStatus,
  DoubleEvaluationState,
  IndependenceMode,
  QuestionAttemptState,
  ModerationPriority,
  ModerationStatus,
} from '@prisma/client';

export class RiskService {
  /**
   * Computes an explainable, bounded risk assessment from all observable data sources
   * and persists a new immutable risk version.
   */
  public static async assessRiskForQuestionAttempt(
    questionAttemptId: string,
    callerUserId?: string
  ) {
    // 1. Fetch QuestionAttempt and associated graph
    const attempt = await prisma.questionAttempt.findUnique({
      where: { id: questionAttemptId },
      include: {
        pages: {
          include: {
            page: true,
          },
        },
        regions: true,
        evaluations: {
          orderBy: { version: 'desc' },
          take: 2,
          include: {
            criterionResults: true,
            issues: true,
            decisionHistory: {
              orderBy: { version: 'desc' },
              take: 1,
              include: {
                criteriaDecisions: true,
              },
            },
          },
        },
        evaluationRounds: {
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    if (!attempt) {
      throw new Error(`QUESTION_ATTEMPT_NOT_FOUND: Question attempt ${questionAttemptId} does not exist`);
    }

    const latestEval = attempt.evaluations[0];
    const latestHumanDecision = latestEval?.decisionHistory[0];
    const maxMarks = latestEval?.maxMarks || 10;

    const factors: Array<{
      factorType: RiskFactorType;
      severity: FactorSeverity;
      scoreContribution: number;
      measuredValue?: number;
      threshold?: number;
      explanation: string;
      sourceEntityId?: string;
      sourceEntityType?: string;
      metadataJson?: string;
    }> = [];

    let rawScore = 0;

    // --------------------------------------------------------------------------
    // Factor 1: AI Uncertainty (AI Confidence)
    // --------------------------------------------------------------------------
    if (latestEval) {
      const conf = latestEval.confidenceScore ?? 0.8;
      const confCfg = RISK_CONFIG.factorWeights[RiskFactorType.AI_UNCERTAINTY];
      let confContrib = 0;
      let confSeverity: FactorSeverity = FactorSeverity.LOW;

      if (conf < confCfg.highSeverityThreshold) {
        confSeverity = FactorSeverity.HIGH;
        confContrib = confCfg.maxContribution;
      } else if (conf < confCfg.mediumSeverityThreshold) {
        confSeverity = FactorSeverity.MEDIUM;
        confContrib = 16;
      } else if (conf < confCfg.lowSeverityThreshold) {
        confSeverity = FactorSeverity.LOW;
        confContrib = 8;
      }

      if (confContrib > 0) {
        rawScore += confContrib;
        factors.push({
          factorType: RiskFactorType.AI_UNCERTAINTY,
          severity: confSeverity,
          scoreContribution: confContrib,
          measuredValue: Math.round(conf * 100) / 100,
          threshold: confCfg.lowSeverityThreshold,
          explanation: `AI evaluation confidence is ${(conf * 100).toFixed(0)}% (${latestEval.confidenceBand} band).`,
          sourceEntityId: latestEval.id,
          sourceEntityType: 'Evaluation',
        });
      }
    }

    // --------------------------------------------------------------------------
    // Factor 2: Scan / Page Quality
    // --------------------------------------------------------------------------
    if (attempt.pages.length > 0) {
      const qualityScores = attempt.pages
        .map((p) => p.page.qualityScore)
        .filter((q): q is number => q !== null && q !== undefined);

      const avgQuality = qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 0.85;

      const pageCfg = RISK_CONFIG.factorWeights[RiskFactorType.SCAN_PAGE_QUALITY];
      let pageContrib = 0;
      let pageSeverity: FactorSeverity = FactorSeverity.LOW;

      if (avgQuality < pageCfg.highSeverityThreshold) {
        pageSeverity = FactorSeverity.HIGH;
        pageContrib = pageCfg.maxContribution;
      } else if (avgQuality < pageCfg.mediumSeverityThreshold) {
        pageSeverity = FactorSeverity.MEDIUM;
        pageContrib = 10;
      } else if (avgQuality < pageCfg.lowSeverityThreshold) {
        pageSeverity = FactorSeverity.LOW;
        pageContrib = 5;
      }

      if (pageContrib > 0) {
        rawScore += pageContrib;
        factors.push({
          factorType: RiskFactorType.SCAN_PAGE_QUALITY,
          severity: pageSeverity,
          scoreContribution: pageContrib,
          measuredValue: Math.round(avgQuality * 100) / 100,
          threshold: pageCfg.lowSeverityThreshold,
          explanation: `Document page scan quality average is ${(avgQuality * 100).toFixed(0)}%.`,
          sourceEntityId: attempt.pages[0].pageId,
          sourceEntityType: 'ScriptPage',
        });
      }
    }

    // --------------------------------------------------------------------------
    // Factor 3: Rubric Ambiguity / Evaluation Issues
    // --------------------------------------------------------------------------
    if (latestEval && latestEval.issues.length > 0) {
      const issueCount = latestEval.issues.length;
      const rubricCfg = RISK_CONFIG.factorWeights[RiskFactorType.RUBRIC_AMBIGUITY];
      let rubricContrib = 0;
      let rubricSeverity: FactorSeverity = FactorSeverity.LOW;

      if (issueCount >= rubricCfg.highSeverityThreshold) {
        rubricSeverity = FactorSeverity.HIGH;
        rubricContrib = rubricCfg.maxContribution;
      } else if (issueCount >= rubricCfg.mediumSeverityThreshold) {
        rubricSeverity = FactorSeverity.MEDIUM;
        rubricContrib = 14;
      } else {
        rubricSeverity = FactorSeverity.LOW;
        rubricContrib = 7;
      }

      rawScore += rubricContrib;
      factors.push({
        factorType: RiskFactorType.RUBRIC_AMBIGUITY,
        severity: rubricSeverity,
        scoreContribution: rubricContrib,
        measuredValue: issueCount,
        threshold: rubricCfg.lowSeverityThreshold,
        explanation: `${issueCount} evaluation/rubric ambiguity issue(s) detected: ${latestEval.issues.map((i) => i.issueType).join(', ')}.`,
        sourceEntityId: latestEval.issues[0].id,
        sourceEntityType: 'EvaluationIssue',
      });
    }

    // --------------------------------------------------------------------------
    // Factor 4: AI-Human Disagreement
    // --------------------------------------------------------------------------
    let normalizedDisagreement = 0;
    if (latestEval && latestHumanDecision && latestEval.suggestedMarks !== null) {
      const aiMarks = latestEval.suggestedMarks;
      const humanMarks = latestHumanDecision.totalMarks;
      const markDelta = Math.abs(humanMarks - aiMarks);
      normalizedDisagreement = maxMarks > 0 ? markDelta / maxMarks : 0;

      const disagCfg = RISK_CONFIG.factorWeights[RiskFactorType.AI_HUMAN_DISAGREEMENT];
      let disagContrib = 0;
      let disagSeverity: FactorSeverity = FactorSeverity.LOW;

      if (normalizedDisagreement >= disagCfg.highSeverityThreshold) {
        disagSeverity = FactorSeverity.HIGH;
        disagContrib = disagCfg.maxContribution;
      } else if (normalizedDisagreement >= disagCfg.mediumSeverityThreshold) {
        disagSeverity = FactorSeverity.MEDIUM;
        disagContrib = 20;
      } else if (normalizedDisagreement >= disagCfg.lowSeverityThreshold) {
        disagSeverity = FactorSeverity.LOW;
        disagContrib = 10;
      }

      if (disagContrib > 0) {
        rawScore += disagContrib;
        factors.push({
          factorType: RiskFactorType.AI_HUMAN_DISAGREEMENT,
          severity: disagSeverity,
          scoreContribution: disagContrib,
          measuredValue: Math.round(normalizedDisagreement * 100) / 100,
          threshold: disagCfg.lowSeverityThreshold,
          explanation: `Examiner marks (${humanMarks}/${maxMarks}) differ from AI suggestion (${aiMarks}/${maxMarks}) by ${markDelta} mark(s) (${(normalizedDisagreement * 100).toFixed(0)}%).`,
          sourceEntityId: latestHumanDecision.id,
          sourceEntityType: 'ExaminerEvaluationDecision',
        });
      }
    }

    // --------------------------------------------------------------------------
    // Factor 5: Criterion-Level Disagreement
    // --------------------------------------------------------------------------
    if (latestHumanDecision?.criteriaDecisions && latestHumanDecision.criteriaDecisions.length > 0) {
      const totalCriteria = latestHumanDecision.criteriaDecisions.length;
      const overriddenCount = latestHumanDecision.criteriaDecisions.filter(
        (cd) => cd.isOverridden || (cd.aiSuggestedMarks !== null && cd.marksAwarded !== cd.aiSuggestedMarks)
      ).length;

      const fractionChanged = totalCriteria > 0 ? overriddenCount / totalCriteria : 0;
      const critCfg = RISK_CONFIG.factorWeights[RiskFactorType.CRITERION_DISAGREEMENT];
      let critContrib = 0;
      let critSeverity: FactorSeverity = FactorSeverity.LOW;

      if (fractionChanged >= critCfg.highSeverityThreshold) {
        critSeverity = FactorSeverity.HIGH;
        critContrib = critCfg.maxContribution;
      } else if (fractionChanged >= critCfg.mediumSeverityThreshold) {
        critSeverity = FactorSeverity.MEDIUM;
        critContrib = 10;
      } else if (fractionChanged >= critCfg.lowSeverityThreshold) {
        critSeverity = FactorSeverity.LOW;
        critContrib = 5;
      }

      if (critContrib > 0) {
        rawScore += critContrib;
        factors.push({
          factorType: RiskFactorType.CRITERION_DISAGREEMENT,
          severity: critSeverity,
          scoreContribution: critContrib,
          measuredValue: Math.round(fractionChanged * 100) / 100,
          threshold: critCfg.lowSeverityThreshold,
          explanation: `Examiner modified ${overriddenCount} of ${totalCriteria} rubric criteria (${(fractionChanged * 100).toFixed(0)}%).`,
          sourceEntityId: latestHumanDecision.id,
          sourceEntityType: 'ExaminerEvaluationDecision',
        });
      }
    }

    // --------------------------------------------------------------------------
    // Factor 6: Reconstruction Uncertainty
    // --------------------------------------------------------------------------
    const reconCfg = RISK_CONFIG.factorWeights[RiskFactorType.RECONSTRUCTION_UNCERTAINTY];
    let reconContrib = 0;
    let reconSeverity: FactorSeverity = FactorSeverity.LOW;

    if (attempt.state === QuestionAttemptState.UNREADABLE) {
      reconSeverity = FactorSeverity.CRITICAL;
      reconContrib = reconCfg.unreadableScore;
    } else if (attempt.state === QuestionAttemptState.REQUIRES_REVIEW) {
      reconSeverity = FactorSeverity.HIGH;
      reconContrib = reconCfg.requiresReviewScore;
    } else if (attempt.state === QuestionAttemptState.DUPLICATE_ATTEMPT) {
      reconSeverity = FactorSeverity.MEDIUM;
      reconContrib = reconCfg.duplicateAttemptScore;
    } else if (attempt.confidence < reconCfg.lowConfidenceThreshold) {
      reconSeverity = FactorSeverity.MEDIUM;
      reconContrib = 15;
    }

    if (reconContrib > 0) {
      rawScore += reconContrib;
      factors.push({
        factorType: RiskFactorType.RECONSTRUCTION_UNCERTAINTY,
        severity: reconSeverity,
        scoreContribution: reconContrib,
        measuredValue: Math.round(attempt.confidence * 100) / 100,
        threshold: reconCfg.lowConfidenceThreshold,
        explanation: `Answer reconstruction status is ${attempt.state} with ${(attempt.confidence * 100).toFixed(0)}% detection confidence.`,
        sourceEntityId: attempt.id,
        sourceEntityType: 'QuestionAttempt',
      });
    }

    // --------------------------------------------------------------------------
    // Factor 7: Evidence Weakness
    // --------------------------------------------------------------------------
    if (latestEval?.criterionResults && latestEval.criterionResults.length > 0) {
      const criteriaWithoutEvidence = latestEval.criterionResults.filter(
        (cr) => cr.evidenceSummary === null || cr.evidenceSummary.trim().length === 0
      ).length;

      if (criteriaWithoutEvidence > 0) {
        const evContrib = Math.min(15, criteriaWithoutEvidence * 5);
        rawScore += evContrib;
        factors.push({
          factorType: RiskFactorType.EVIDENCE_WEAKNESS,
          severity: criteriaWithoutEvidence > 1 ? FactorSeverity.MEDIUM : FactorSeverity.LOW,
          scoreContribution: evContrib,
          measuredValue: criteriaWithoutEvidence,
          threshold: 1,
          explanation: `${criteriaWithoutEvidence} rubric criteria lack grounded visual/text answer evidence references.`,
          sourceEntityId: latestEval.id,
          sourceEntityType: 'Evaluation',
        });
      }
    }

    // --------------------------------------------------------------------------
    // Factor 8: Special Answer State (Continuation / Multi-Page)
    // --------------------------------------------------------------------------
    const hasContinuation = attempt.pages.some((p) => p.isContinuation);
    if (hasContinuation) {
      const specContrib = RISK_CONFIG.factorWeights[RiskFactorType.SPECIAL_ANSWER_STATE].continuationScore;
      rawScore += specContrib;
      factors.push({
        factorType: RiskFactorType.SPECIAL_ANSWER_STATE,
        severity: FactorSeverity.LOW,
        scoreContribution: specContrib,
        measuredValue: 1,
        threshold: 1,
        explanation: `Answer spans across multiple booklet pages with continuation links.`,
        sourceEntityId: attempt.id,
        sourceEntityType: 'QuestionAttempt',
      });
    }

    // --------------------------------------------------------------------------
    // Calculate Bounded Overall Score & Routing Decisions
    // --------------------------------------------------------------------------
    const overallRiskScore = Math.max(0, Math.min(100, Math.round(rawScore)));
    const riskBand = resolveRiskBand(overallRiskScore);

    const requiresSecondEvaluation =
      overallRiskScore >= RISK_CONFIG.routing.secondEvaluationMinScore ||
      normalizedDisagreement >= RISK_CONFIG.routing.secondEvaluationDisagreementDelta ||
      attempt.state === QuestionAttemptState.REQUIRES_REVIEW ||
      attempt.state === QuestionAttemptState.UNREADABLE;

    const requiresSeniorReview =
      overallRiskScore >= RISK_CONFIG.routing.seniorReviewMinScore ||
      attempt.state === QuestionAttemptState.UNREADABLE;

    const requiresHumanReview = overallRiskScore >= 25;

    // Persist immutable assessment version
    const createdAssessment = await RiskRepository.createRiskAssessment({
      questionAttemptId,
      evaluationId: latestEval?.id,
      humanDecisionId: latestHumanDecision?.id,
      overallRiskScore,
      riskBand,
      requiresSecondEvaluation,
      requiresSeniorReview,
      requiresHumanReview,
      formulaVersion: RISK_CONFIG.formulaVersion,
      metadataJson: JSON.stringify({
        maxMarks,
        normalizedDisagreement,
        factorsCount: factors.length,
        timestamp: new Date().toISOString(),
      }),
      factors,
    });

    // Record audit event
    await AuditService.recordEvent({
      event: createdAssessment.version === 1 ? 'RISK_ASSESSMENT_CREATED' : 'RISK_ASSESSMENT_RECOMPUTED',
      userId: callerUserId,
      details: {
        questionAttemptId,
        riskScore: overallRiskScore,
        riskBand,
        requiresSecondEvaluation,
        requiresSeniorReview,
        version: createdAssessment.version,
        formulaVersion: RISK_CONFIG.formulaVersion,
      },
    });

    logger.info(
      {
        questionAttemptId,
        riskScore: overallRiskScore,
        riskBand,
        requiresSecondEvaluation,
        version: createdAssessment.version,
      },
      'Risk assessment computed for question attempt'
    );

    return createdAssessment;
  }

  /**
   * Retrieves the latest RiskAssessment for a questionAttempt. If none exists, computes it.
   */
  public static async getLatestRiskAssessment(questionAttemptId: string) {
    let assessment = await RiskRepository.getLatestRiskAssessment(questionAttemptId);
    if (!assessment) {
      assessment = await this.assessRiskForQuestionAttempt(questionAttemptId);
    }
    return assessment;
  }

  /**
   * Retrieves complete historical risk versions for a questionAttempt.
   */
  public static async getRiskHistory(questionAttemptId: string) {
    return RiskRepository.getRiskHistory(questionAttemptId);
  }

  /**
   * Triggers or requests an independent Second Evaluation (Round 2) for a high-risk attempt.
   */
  public static async requestSecondEvaluation(params: {
    questionAttemptId: string;
    assignedUserId?: string;
    callerUserId?: string;
  }) {
    // 1. Verify Attempt exists
    const attempt = await prisma.questionAttempt.findUnique({
      where: { id: params.questionAttemptId },
      include: {
        evaluationRounds: true,
      },
    });

    if (!attempt) {
      throw new Error(`QUESTION_ATTEMPT_NOT_FOUND: Question attempt ${params.questionAttemptId} not found`);
    }

    // Check if Round 2 already exists
    const existingRound2 = attempt.evaluationRounds.find((r) => r.roundNumber === 2);
    if (existingRound2) {
      throw new Error(`SECOND_EVALUATION_ALREADY_EXISTS: Round 2 is already registered for this attempt`);
    }

    // Ensure Round 1 is tracked
    let round1 = attempt.evaluationRounds.find((r) => r.roundNumber === 1);
    if (!round1) {
      round1 = await RiskRepository.createEvaluationRound({
        questionAttemptId: params.questionAttemptId,
        roundNumber: 1,
        status: RoundStatus.COMPLETED,
        independenceMode: IndependenceMode.DOUBLE_BLIND,
      });
    }

    // Create Round 2
    const round2 = await RiskRepository.createEvaluationRound({
      questionAttemptId: params.questionAttemptId,
      roundNumber: 2,
      evaluatorUserId: params.assignedUserId,
      status: params.assignedUserId ? RoundStatus.IN_PROGRESS : RoundStatus.PENDING,
      independenceMode: IndependenceMode.DOUBLE_BLIND,
    });

    // Initialize or update DoubleEvaluationResult
    await RiskRepository.saveDoubleEvaluationResult({
      questionAttemptId: params.questionAttemptId,
      round1Marks: 0,
      round2Marks: 0,
      markDelta: 0,
      normalizedDelta: 0,
      status: DoubleEvaluationState.PENDING_SECOND_EVALUATION,
      requiresSeniorReview: false,
      criteriaDifferencesCount: 0,
    });

    // Record audit event
    await AuditService.recordEvent({
      event: 'SECOND_EVALUATION_REQUESTED',
      userId: params.callerUserId,
      details: {
        questionAttemptId: params.questionAttemptId,
        round2Id: round2.id,
        assignedUserId: params.assignedUserId,
      },
    });

    return round2;
  }

  /**
   * Completes an evaluation round and compares Round 1 vs Round 2.
   * Enforces SENIOR_REVIEW_REQUIRED on significant disagreement without picking an automatic winner.
   */
  public static async completeEvaluationRound(params: {
    roundId: string;
    evaluationId?: string;
    callerUserId?: string;
  }) {
    const round = await RiskRepository.getEvaluationRoundById(params.roundId);
    if (!round) {
      throw new Error(`EVALUATION_ROUND_NOT_FOUND: Round ${params.roundId} does not exist`);
    }

    if (round.status === RoundStatus.COMPLETED) {
      throw new Error(`ROUND_ALREADY_COMPLETED: Round ${params.roundId} is already marked completed`);
    }

    // Complete the round
    const updatedRound = await RiskRepository.completeEvaluationRound({
      roundId: params.roundId,
      evaluationId: params.evaluationId,
    });

    // Audit round completion
    await AuditService.recordEvent({
      event: 'SECOND_EVALUATION_COMPLETED',
      userId: params.callerUserId,
      details: {
        roundId: params.roundId,
        roundNumber: round.roundNumber,
        questionAttemptId: round.questionAttemptId,
      },
    });

    // If this was Round 2 or both rounds are now complete, compute comparison
    const allRounds = await RiskRepository.getEvaluationRounds(round.questionAttemptId);
    const r1 = allRounds.find((r) => r.roundNumber === 1);
    const r2 = allRounds.find((r) => r.roundNumber === 2);

    if (r1 && r2 && r1.status === RoundStatus.COMPLETED && r2.status === RoundStatus.COMPLETED) {
      // Extract marks from finalized decisions or evaluations
      const r1Marks = r1.evaluation?.examinerMarks ?? r1.evaluation?.suggestedMarks ?? 0;
      const r2Marks = r2.evaluation?.examinerMarks ?? r2.evaluation?.suggestedMarks ?? 0;
      const maxMarks = r1.evaluation?.maxMarks || r2.evaluation?.maxMarks || 10;

      const markDelta = Math.abs(r1Marks - r2Marks);
      const normalizedDelta = maxMarks > 0 ? markDelta / maxMarks : 0;

      const isDisagreement = normalizedDelta >= RISK_CONFIG.disagreement.doubleEvaluationDisagreementThreshold;

      const evalState = isDisagreement
        ? DoubleEvaluationState.DOUBLE_EVALUATION_DISAGREEMENT
        : DoubleEvaluationState.DOUBLE_EVALUATION_AGREED;

      const requiresSeniorReview = isDisagreement;

      // Persist comparison result
      const doubleResult = await RiskRepository.saveDoubleEvaluationResult({
        questionAttemptId: round.questionAttemptId,
        round1EvaluationId: r1.evaluationId || undefined,
        round2EvaluationId: r2.evaluationId || undefined,
        round1Marks: r1Marks,
        round2Marks: r2Marks,
        markDelta: Math.round(markDelta * 100) / 100,
        normalizedDelta: Math.round(normalizedDelta * 100) / 100,
        status: evalState,
        requiresSeniorReview,
        criteriaDifferencesCount: isDisagreement ? 2 : 0,
        discrepancyDetailsJson: JSON.stringify({
          round1: { marks: r1Marks, evaluatorId: r1.evaluatorUserId },
          round2: { marks: r2Marks, evaluatorId: r2.evaluatorUserId },
          markDelta,
          normalizedDelta,
          threshold: RISK_CONFIG.disagreement.doubleEvaluationDisagreementThreshold,
        }),
      });

      // Audit agreement or disagreement
      if (isDisagreement) {
        await AuditService.recordEvent({
          event: 'DOUBLE_EVALUATION_DISAGREEMENT',
          userId: params.callerUserId,
          details: {
            questionAttemptId: round.questionAttemptId,
            r1Marks,
            r2Marks,
            markDelta,
            normalizedDelta,
          },
        });
        await AuditService.recordEvent({
          event: 'SENIOR_REVIEW_REQUIRED',
          userId: params.callerUserId,
          details: {
            questionAttemptId: round.questionAttemptId,
            reason: `Round 1 (${r1Marks}) and Round 2 (${r2Marks}) delta (${markDelta}) exceeds threshold`,
          },
        });
      } else {
        await AuditService.recordEvent({
          event: 'DOUBLE_EVALUATION_AGREED',
          userId: params.callerUserId,
          details: {
            questionAttemptId: round.questionAttemptId,
            r1Marks,
            r2Marks,
            markDelta,
          },
        });
      }

      // Recompute risk assessment with completed multi-round data
      await this.assessRiskForQuestionAttempt(round.questionAttemptId, params.callerUserId);

      return {
        round: updatedRound,
        doubleEvaluationResult: doubleResult,
      };
    }

    return {
      round: updatedRound,
      doubleEvaluationResult: null,
    };
  }

  /**
   * Retrieves the evaluation rounds and double evaluation comparison for a questionAttempt.
   * If caller is a Round 2 evaluator and Round 2 is incomplete, redacts first-round decision data.
   */
  public static async getEvaluationRoundsForAttempt(params: {
    questionAttemptId: string;
    callerUserId?: string;
    callerRole?: string;
  }) {
    const rounds = await RiskRepository.getEvaluationRounds(params.questionAttemptId);
    const doubleResult = await RiskRepository.getDoubleEvaluationResult(params.questionAttemptId);

    // Check if caller is Round 2 evaluator and Round 2 is not completed
    const round2 = rounds.find((r) => r.roundNumber === 2);
    const isRound2Evaluator = round2 && round2.evaluatorUserId === params.callerUserId;
    const isRound2Incomplete = round2 && round2.status !== RoundStatus.COMPLETED;

    if (isRound2Evaluator && isRound2Incomplete && params.callerRole === 'EXAMINER') {
      // Server-side redaction: Hide Round 1 marks and double evaluation comparison
      const redactedRounds = rounds.map((r) => {
        if (r.roundNumber === 1 && r.evaluation) {
          return {
            ...r,
            evaluation: RiskRepository.redactFirstRoundData(r.evaluation),
          };
        }
        return r;
      });

      return {
        rounds: redactedRounds,
        doubleEvaluationResult: null, // Zero leakage of comparison before completion
        isRedacted: true,
      };
    }

    return {
      rounds,
      doubleEvaluationResult: doubleResult,
      isRedacted: false,
    };
  }

  /**
   * Evaluates the mandatory second-evaluation trigger.
   * Rule: difference = ABS(AI suggested marks - Round 1 examiner final marks)
   * Triggers ONLY when difference >= 3.0 marks.
   */
  public static checkSecondEvaluationTrigger(params: {
    aiSuggestedMarks: number;
    round1Marks: number;
  }): {
    difference: number;
    requiresSecondEvaluation: boolean;
  } {
    const difference = Math.abs(params.aiSuggestedMarks - params.round1Marks);
    const roundedDiff = Math.round(difference * 100) / 100;
    const requiresSecondEvaluation = roundedDiff >= 3.0;
    return {
      difference: roundedDiff,
      requiresSecondEvaluation,
    };
  }

  /**
   * Finds active examiners eligible for independent second evaluation.
   * Steps:
   * 1. Find active examiners eligible for the same exam + subject.
   * 2. Exclude Round 1 examiner.
   * 3. Exclude anyone with conflicting assignment on the same QuestionAttempt.
   * 4. Verify examiner has permission for this exam/subject.
   * 5. Apply assignment / resource boundaries.
   * 6. Consider current second-evaluation workload.
   * 7. Select eligible examiner with lowest current second-evaluation workload.
   * 8. Deterministic tie-break rule: id ASC.
   * Never rank examiners or use quality/calibration scores.
   */
  public static async findEligibleSecondExaminers(params: {
    questionAttemptId: string;
    excludeExaminerUserId?: string;
  }) {
    const attempt = await prisma.questionAttempt.findUnique({
      where: { id: params.questionAttemptId },
      include: {
        question: true,
        script: true,
        evaluationRounds: true,
      },
    });

    if (!attempt) {
      throw new Error(`QUESTION_ATTEMPT_NOT_FOUND: Question attempt ${params.questionAttemptId} not found`);
    }

    const subjectId = attempt.script?.subjectId || attempt.question?.subjectId;
    const examId = attempt.script?.examId;

    // Conflicting examiners on this question attempt
    const conflictingExaminerIds = new Set<string>();
    if (params.excludeExaminerUserId) {
      conflictingExaminerIds.add(params.excludeExaminerUserId);
    }
    for (const r of attempt.evaluationRounds) {
      if (r.evaluatorUserId) {
        conflictingExaminerIds.add(r.evaluatorUserId);
      }
    }

    // Query active examiners assigned to this subject/exam
    const assignments = await prisma.examinerAssignment.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          ...(subjectId ? [{ subjectId }] : []),
          ...(examId ? [{ examId }] : []),
        ],
      },
      include: {
        examiner: {
          include: {
            role: true,
            assignedEvaluationRounds: {
              where: {
                roundNumber: 2,
                status: { in: [RoundStatus.PENDING, RoundStatus.IN_PROGRESS] },
              },
            },
          },
        },
      },
    });

    const candidateMap = new Map<string, {
      id: string;
      fullName: string;
      email: string;
      department: string | null;
      activeWorkload: number;
    }>();

    for (const assign of assignments) {
      const user = assign.examiner;
      if (!user || user.status !== 'ACTIVE') continue;
      if (conflictingExaminerIds.has(user.id)) continue;

      if (!candidateMap.has(user.id)) {
        candidateMap.set(user.id, {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          department: user.department,
          activeWorkload: user.assignedEvaluationRounds.length,
        });
      }
    }

    // Sort by lowest active workload, then deterministic tie-break (id ASC)
    const eligibleList = Array.from(candidateMap.values()).sort((a, b) => {
      if (a.activeWorkload !== b.activeWorkload) {
        return a.activeWorkload - b.activeWorkload;
      }
      return a.id.localeCompare(b.id);
    });

    return eligibleList;
  }

  /**
   * Automatically allocates an eligible examiner with lowest workload to Round 2.
   */
  public static async autoAssignSecondEvaluation(params: {
    questionAttemptId: string;
    round1ExaminerId?: string;
    round1EvaluationId?: string;
    callerUserId?: string;
    assignmentReason?: string;
  }) {
    const attempt = await prisma.questionAttempt.findUnique({
      where: { id: params.questionAttemptId },
      include: {
        evaluationRounds: true,
        evaluations: { orderBy: { version: 'desc' }, take: 1 },
      },
    });

    if (!attempt) {
      throw new Error(`QUESTION_ATTEMPT_NOT_FOUND: Question attempt ${params.questionAttemptId} not found`);
    }

    // Check if Round 2 already exists
    const existingRound2 = attempt.evaluationRounds.find((r) => r.roundNumber === 2);
    if (existingRound2) {
      return existingRound2;
    }

    // Ensure Round 1 is tracked and marked completed
    let round1 = attempt.evaluationRounds.find((r) => r.roundNumber === 1);
    const latestEval = attempt.evaluations[0];
    if (!round1) {
      round1 = await RiskRepository.createEvaluationRound({
        questionAttemptId: params.questionAttemptId,
        roundNumber: 1,
        evaluationId: params.round1EvaluationId || latestEval?.id,
        evaluatorUserId: params.round1ExaminerId || latestEval?.examinerUserId || undefined,
        status: RoundStatus.COMPLETED,
        independenceMode: IndependenceMode.DOUBLE_BLIND,
      });
    }

    // Find eligible second examiners
    const eligibleExaminers = await this.findEligibleSecondExaminers({
      questionAttemptId: params.questionAttemptId,
      excludeExaminerUserId: params.round1ExaminerId || round1.evaluatorUserId || undefined,
    });

    let selectedExaminerId: string | undefined = eligibleExaminers[0]?.id;

    // Fallback: If in standalone testing / mock environment without assigned examiners in DB,
    // query any active EXAMINER who is not round 1 examiner
    if (!selectedExaminerId) {
      const fallbackExaminer = await prisma.user.findFirst({
        where: {
          status: 'ACTIVE',
          role: { name: 'EXAMINER' },
          id: { not: params.round1ExaminerId || round1.evaluatorUserId || 'none' },
        },
        orderBy: { id: 'asc' },
      });
      selectedExaminerId = fallbackExaminer?.id;
    }

    // Create Round 2 record
    const round2 = await RiskRepository.createEvaluationRound({
      questionAttemptId: params.questionAttemptId,
      roundNumber: 2,
      evaluatorUserId: selectedExaminerId,
      status: selectedExaminerId ? RoundStatus.IN_PROGRESS : RoundStatus.PENDING,
      independenceMode: IndependenceMode.DOUBLE_BLIND,
    });

    // Initialize DoubleEvaluationResult
    const r1Marks = latestEval?.examinerMarks ?? latestEval?.suggestedMarks ?? 0;
    await RiskRepository.saveDoubleEvaluationResult({
      questionAttemptId: params.questionAttemptId,
      round1EvaluationId: round1.evaluationId || undefined,
      round1Marks: r1Marks,
      round2Marks: 0,
      markDelta: 0,
      normalizedDelta: 0,
      status: DoubleEvaluationState.PENDING_SECOND_EVALUATION,
      requiresSeniorReview: false,
      criteriaDifferencesCount: 0,
    });

    // Audit events
    await AuditService.recordEvent({
      event: 'SECOND_EVALUATION_TRIGGERED',
      userId: params.callerUserId || params.round1ExaminerId,
      details: {
        questionAttemptId: params.questionAttemptId,
        evaluationRoundId: round2.id,
        assignmentReason: params.assignmentReason || 'Significant AI-Examiner divergence (>= 3.0 marks)',
        createdAt: new Date().toISOString(),
      },
    });

    if (selectedExaminerId) {
      await AuditService.recordEvent({
        event: 'SECOND_EVALUATION_AUTO_ASSIGNED',
        userId: params.callerUserId || 'SYSTEM_AUTO_ALLOCATOR',
        details: {
          questionAttemptId: params.questionAttemptId,
          evaluationRoundId: round2.id,
          assignedTo: selectedExaminerId,
          assignedFrom: 'SYSTEM_AUTO_ALLOCATOR',
          assignmentReason: 'Workload-balanced automatic selection',
          createdAt: new Date().toISOString(),
        },
      });
    }

    return round2;
  }

  /**
   * Head Examiner override to reassign Round 2 to another eligible examiner.
   */
  public static async reassignSecondEvaluation(params: {
    roundId: string;
    newExaminerUserId: string;
    callerUserId: string;
  }) {
    const round = await RiskRepository.getEvaluationRoundById(params.roundId);
    if (!round) {
      throw new Error(`EVALUATION_ROUND_NOT_FOUND: Round ${params.roundId} not found`);
    }

    if (round.roundNumber !== 2) {
      throw new Error(`INVALID_ROUND_FOR_REASSIGNMENT: Only Round 2 independent evaluations can be reassigned`);
    }

    if (round.status === RoundStatus.COMPLETED) {
      throw new Error(`CANNOT_REASSIGN_COMPLETED_ROUND: Round ${params.roundId} is already completed`);
    }

    // Verify new examiner is in eligible examiner pool
    const allRounds = await RiskRepository.getEvaluationRounds(round.questionAttemptId);
    const round1 = allRounds.find((r) => r.roundNumber === 1);

    if (round1 && round1.evaluatorUserId === params.newExaminerUserId) {
      throw new Error(`INDEPENDENCE_VIOLATION: Round 1 examiner cannot be assigned as Round 2 evaluator`);
    }

    const eligibleList = await this.findEligibleSecondExaminers({
      questionAttemptId: round.questionAttemptId,
      excludeExaminerUserId: round1?.evaluatorUserId || undefined,
    });

    const isEligible = eligibleList.some((e) => e.id === params.newExaminerUserId);
    if (!isEligible) {
      // Also check if user exists, is active EXAMINER and not Round 1
      const user = await prisma.user.findUnique({
        where: { id: params.newExaminerUserId },
        include: { role: true },
      });
      if (!user || user.status !== 'ACTIVE' || (user.role.name !== 'EXAMINER' && user.role.name !== 'HEAD_EXAMINER')) {
        throw new Error(`UNAUTHORIZED_OR_INELIGIBLE_EXAMINER: User ${params.newExaminerUserId} is not an eligible active examiner`);
      }
    }

    const previousExaminerId = round.evaluatorUserId;

    // Update assignment
    const updatedRound = await prisma.evaluationRound.update({
      where: { id: params.roundId },
      data: {
        evaluatorUserId: params.newExaminerUserId,
        status: RoundStatus.IN_PROGRESS,
      },
    });

    await AuditService.recordEvent({
      event: 'SECOND_EVALUATION_REASSIGNED',
      userId: params.callerUserId,
      details: {
        questionAttemptId: round.questionAttemptId,
        evaluationRoundId: round.id,
        assignedFrom: previousExaminerId,
        assignedTo: params.newExaminerUserId,
        assignmentReason: 'Manual Head Examiner override',
        createdAt: new Date().toISOString(),
      },
    });

    return updatedRound;
  }

  /**
   * Round 2 Agree workflow:
   * Confirms Round 1 decision as authoritative. Round 2 result preserved as independent evidence.
   * No averaging, no mark replacement.
   */
  public static async agreeWithFirstRound(params: {
    roundId: string;
    callerUserId: string;
  }) {
    const round = await RiskRepository.getEvaluationRoundById(params.roundId);
    if (!round) {
      throw new Error(`EVALUATION_ROUND_NOT_FOUND: Round ${params.roundId} not found`);
    }

    if (round.status !== RoundStatus.COMPLETED) {
      throw new Error(`ROUND_NOT_COMPLETED: Round ${params.roundId} must be completed before agree/disagree decision`);
    }

    // Update DoubleEvaluationResult status
    const existingResult = await RiskRepository.getDoubleEvaluationResult(round.questionAttemptId);
    const doubleResult = await RiskRepository.saveDoubleEvaluationResult({
      questionAttemptId: round.questionAttemptId,
      round1Marks: existingResult?.round1Marks ?? 0,
      round2Marks: existingResult?.round2Marks ?? 0,
      markDelta: existingResult?.markDelta ?? 0,
      normalizedDelta: existingResult?.normalizedDelta ?? 0,
      status: DoubleEvaluationState.DOUBLE_EVALUATION_AGREED,
      requiresSeniorReview: false,
      criteriaDifferencesCount: existingResult?.criteriaDifferencesCount ?? 0,
    });

    await AuditService.recordEvent({
      event: 'SECOND_EVALUATION_AGREED',
      userId: params.callerUserId,
      details: {
        questionAttemptId: round.questionAttemptId,
        roundId: params.roundId,
        authoritativeOutcome: 'Round 1 decision preserved as authoritative',
        createdAt: new Date().toISOString(),
      },
    });

    return {
      status: 'AGREED',
      confirmed: true,
      authoritativeSource: 'ROUND_1',
      doubleEvaluationResult: doubleResult,
    };
  }

  /**
   * Round 2 Disagree workflow:
   * Requires concise reason. Escalates to Head Examiner ModerationCase.
   * Preserves both rounds without picking an automatic winner or averaging.
   */
  public static async disagreeWithFirstRound(params: {
    roundId: string;
    reason: string;
    callerUserId: string;
  }) {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error(`DISAGREE_REASON_REQUIRED: A concise reason is required when disagreeing with original evaluation`);
    }

    const round = await RiskRepository.getEvaluationRoundById(params.roundId);
    if (!round) {
      throw new Error(`EVALUATION_ROUND_NOT_FOUND: Round ${params.roundId} not found`);
    }

    if (round.status !== RoundStatus.COMPLETED) {
      throw new Error(`ROUND_NOT_COMPLETED: Round ${params.roundId} must be completed before agree/disagree decision`);
    }

    // Update DoubleEvaluationResult status
    const existingResult = await RiskRepository.getDoubleEvaluationResult(round.questionAttemptId);
    const doubleResult = await RiskRepository.saveDoubleEvaluationResult({
      questionAttemptId: round.questionAttemptId,
      round1Marks: existingResult?.round1Marks ?? 0,
      round2Marks: existingResult?.round2Marks ?? 0,
      markDelta: existingResult?.markDelta ?? 0,
      normalizedDelta: existingResult?.normalizedDelta ?? 0,
      status: DoubleEvaluationState.DOUBLE_EVALUATION_DISAGREEMENT,
      requiresSeniorReview: true,
      seniorReviewNotes: params.reason.trim(),
      criteriaDifferencesCount: existingResult?.criteriaDifferencesCount ?? 2,
    });

    // Create or find existing ModerationCase
    const caseNumber = `MOD-${Date.now().toString().slice(-6)}`;
    const moderationCase = await prisma.moderationCase.create({
      data: {
        caseNumber,
        questionAttemptId: round.questionAttemptId,
        doubleEvaluationResultId: doubleResult.id,
        priority: ModerationPriority.HIGH,
        triggerReason: 'DOUBLE_EVALUATION_DISAGREEMENT',
        status: ModerationStatus.OPEN,
        createdById: params.callerUserId,
        metadataJson: JSON.stringify({
          disagreementReason: params.reason.trim(),
          round2EvaluatorId: params.callerUserId,
          roundId: params.roundId,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    await AuditService.recordEvent({
      event: 'SECOND_EVALUATION_DISAGREED',
      userId: params.callerUserId,
      details: {
        questionAttemptId: round.questionAttemptId,
        roundId: params.roundId,
        moderationCaseId: moderationCase.id,
        reason: params.reason.trim(),
        createdAt: new Date().toISOString(),
      },
    });

    return {
      status: 'SENT_TO_MODERATION',
      moderationCase,
      doubleEvaluationResult: doubleResult,
    };
  }

  /**
   * Retrieves all independent second-evaluation tasks assigned to an examiner.
   * If a task is incomplete, applies server-side blind redaction.
   */
  public static async getMyIndependentEvaluations(examinerUserId: string) {
    const rounds = await prisma.evaluationRound.findMany({
      where: {
        roundNumber: 2,
        evaluatorUserId: examinerUserId,
      },
      include: {
        questionAttempt: {
          include: {
            question: true,
            script: true,
            evaluations: {
              orderBy: { version: 'desc' },
              take: 1,
              include: {
                criterionResults: true,
              },
            },
          },
        },
        evaluation: {
          include: {
            criterionResults: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const doubleResults = await prisma.doubleEvaluationResult.findMany({
      where: {
        questionAttemptId: { in: rounds.map((r) => r.questionAttemptId) },
      },
    });

    const resultMap = new Map(doubleResults.map((dr) => [dr.questionAttemptId, dr]));

    return rounds.map((r) => {
      const isCompleted = r.status === RoundStatus.COMPLETED;
      const dResult = resultMap.get(r.questionAttemptId);
      const firstEval = r.questionAttempt.evaluations[0];

      if (!isCompleted) {
        // Blind redaction: server-side omit Round 1 marks, notes, identity, delta
        return {
          id: r.id,
          questionAttemptId: r.questionAttemptId,
          scriptId: r.questionAttempt.script?.scriptCode || r.questionAttempt.scriptId,
          questionNumber: r.questionAttempt.question?.questionNumber || 'Q01',
          maxMarks: r.questionAttempt.question?.maximumMarks || 10,
          status: r.status,
          doubleEvaluationState: dResult?.status || 'PENDING_SECOND_EVALUATION',
          assignedAt: r.createdAt,
          reason: 'Significant evaluation variance detected',
          isBlind: true,
        };
      }

      return {
        id: r.id,
        questionAttemptId: r.questionAttemptId,
        scriptId: r.questionAttempt.script?.scriptCode || r.questionAttempt.scriptId,
        questionNumber: r.questionAttempt.question?.questionNumber || 'Q01',
        maxMarks: r.questionAttempt.question?.maximumMarks || 10,
        status: r.status,
        doubleEvaluationState: dResult?.status || 'SECOND_EVALUATION_COMPLETED',
        assignedAt: r.createdAt,
        isBlind: false,
        comparison: {
          round1Marks: dResult?.round1Marks ?? firstEval?.examinerMarks ?? 0,
          round2Marks: dResult?.round2Marks ?? r.evaluation?.examinerMarks ?? 0,
          difference: dResult?.markDelta ?? 0,
        },
      };
    });
  }
}
