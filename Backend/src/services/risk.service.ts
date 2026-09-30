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
}
