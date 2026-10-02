/**
 * ANKLYZE Phase 12 - Risk & Double Evaluation Repository
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Versioned, immutable risk assessments preserving all contributing factors.
 * - Multi-round evaluation tracking (Round 1, Round 2) with strict independence.
 * - Atomic persistence using Prisma transactions.
 */

import { prisma } from '../config/database';
import {
  RiskBand,
  RiskFactorType,
  FactorSeverity,
  RoundStatus,
  DoubleEvaluationState,
  IndependenceMode,
} from '@prisma/client';

export interface CreateRiskAssessmentInput {
  questionAttemptId: string;
  evaluationId?: string;
  humanDecisionId?: string;
  overallRiskScore: number;
  riskBand: RiskBand;
  requiresSecondEvaluation: boolean;
  requiresSeniorReview: boolean;
  requiresHumanReview: boolean;
  formulaVersion: string;
  metadataJson?: string;
  factors: Array<{
    factorType: RiskFactorType;
    severity: FactorSeverity;
    scoreContribution: number;
    measuredValue?: number;
    threshold?: number;
    explanation: string;
    sourceEntityId?: string;
    sourceEntityType?: string;
    metadataJson?: string;
  }>;
}

export interface CreateEvaluationRoundInput {
  questionAttemptId: string;
  roundNumber: number;
  evaluationId?: string;
  evaluatorUserId?: string;
  evaluatorType?: string;
  status?: RoundStatus;
  independenceMode?: IndependenceMode;
}

export interface SaveDoubleEvaluationResultInput {
  questionAttemptId: string;
  round1EvaluationId?: string;
  round2EvaluationId?: string;
  round1Marks: number;
  round2Marks: number;
  markDelta: number;
  normalizedDelta: number;
  status: DoubleEvaluationState;
  requiresSeniorReview: boolean;
  criteriaDifferencesCount: number;
  discrepancyDetailsJson?: string;
  seniorReviewNotes?: string;
}

export class RiskRepository {
  /**
   * Persists a new immutable RiskAssessment version with all associated RiskFactors in a single transaction.
   */
  public static async createRiskAssessment(input: CreateRiskAssessmentInput) {
    return prisma.$transaction(async (tx) => {
      // Find latest version for this questionAttempt
      const latest = await tx.riskAssessment.findFirst({
        where: { questionAttemptId: input.questionAttemptId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const nextVersion = (latest?.version || 0) + 1;

      const created = await tx.riskAssessment.create({
        data: {
          questionAttemptId: input.questionAttemptId,
          evaluationId: input.evaluationId,
          humanDecisionId: input.humanDecisionId,
          version: nextVersion,
          overallRiskScore: input.overallRiskScore,
          riskBand: input.riskBand,
          requiresSecondEvaluation: input.requiresSecondEvaluation,
          requiresSeniorReview: input.requiresSeniorReview,
          requiresHumanReview: input.requiresHumanReview,
          formulaVersion: input.formulaVersion,
          metadataJson: input.metadataJson,
          factors: {
            create: input.factors.map((f) => ({
              factorType: f.factorType,
              severity: f.severity,
              scoreContribution: f.scoreContribution,
              measuredValue: f.measuredValue,
              threshold: f.threshold,
              explanation: f.explanation,
              sourceEntityId: f.sourceEntityId,
              sourceEntityType: f.sourceEntityType,
              metadataJson: f.metadataJson,
            })),
          },
        },
        include: {
          factors: true,
        },
      });

      return created;
    });
  }

  /**
   * Retrieves the latest RiskAssessment for a questionAttempt.
   */
  public static async getLatestRiskAssessment(questionAttemptId: string) {
    return prisma.riskAssessment.findFirst({
      where: { questionAttemptId },
      orderBy: { version: 'desc' },
      include: {
        factors: true,
      },
    });
  }

  /**
   * Retrieves complete versioned history of RiskAssessments for a questionAttempt.
   */
  public static async getRiskHistory(questionAttemptId: string) {
    return prisma.riskAssessment.findMany({
      where: { questionAttemptId },
      orderBy: { version: 'asc' },
      include: {
        factors: true,
      },
    });
  }

  /**
   * Creates or registers an EvaluationRound (e.g. Round 1, Round 2).
   */
  public static async createEvaluationRound(input: CreateEvaluationRoundInput) {
    return prisma.evaluationRound.create({
      data: {
        questionAttemptId: input.questionAttemptId,
        roundNumber: input.roundNumber,
        evaluationId: input.evaluationId,
        evaluatorUserId: input.evaluatorUserId,
        evaluatorType: input.evaluatorType || 'EXAMINER',
        status: input.status || RoundStatus.PENDING,
        independenceMode: input.independenceMode || IndependenceMode.DOUBLE_BLIND,
        startedAt: input.status === RoundStatus.IN_PROGRESS ? new Date() : null,
      },
      include: {
        evaluatorUser: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });
  }

  /**
   * Retrieves all EvaluationRounds for a questionAttempt.
   */
  public static async getEvaluationRounds(questionAttemptId: string) {
    return prisma.evaluationRound.findMany({
      where: { questionAttemptId },
      orderBy: { roundNumber: 'asc' },
      include: {
        evaluatorUser: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        evaluation: {
          include: {
            decisionHistory: {
              where: { status: 'FINAL' },
              take: 1,
              orderBy: { version: 'desc' },
            },
          },
        },
      },
    });
  }

  /**
   * Retrieves a specific EvaluationRound by ID.
   */
  public static async getEvaluationRoundById(roundId: string) {
    return prisma.evaluationRound.findUnique({
      where: { id: roundId },
      include: {
        evaluatorUser: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        questionAttempt: true,
        evaluation: true,
      },
    });
  }

  /**
   * Completes an EvaluationRound and updates status.
   */
  public static async completeEvaluationRound(params: {
    roundId: string;
    evaluationId?: string;
  }) {
    return prisma.evaluationRound.update({
      where: { id: params.roundId },
      data: {
        status: RoundStatus.COMPLETED,
        evaluationId: params.evaluationId,
        completedAt: new Date(),
      },
      include: {
        evaluatorUser: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });
  }

  /**
   * Upserts the DoubleEvaluationResult record for a questionAttempt.
   */
  public static async saveDoubleEvaluationResult(input: SaveDoubleEvaluationResultInput) {
    return prisma.doubleEvaluationResult.upsert({
      where: { questionAttemptId: input.questionAttemptId },
      create: {
        questionAttemptId: input.questionAttemptId,
        round1EvaluationId: input.round1EvaluationId,
        round2EvaluationId: input.round2EvaluationId,
        round1Marks: input.round1Marks,
        round2Marks: input.round2Marks,
        markDelta: input.markDelta,
        normalizedDelta: input.normalizedDelta,
        status: input.status,
        requiresSeniorReview: input.requiresSeniorReview,
        criteriaDifferencesCount: input.criteriaDifferencesCount,
        discrepancyDetailsJson: input.discrepancyDetailsJson,
        seniorReviewNotes: input.seniorReviewNotes,
      },
      update: {
        round1EvaluationId: input.round1EvaluationId,
        round2EvaluationId: input.round2EvaluationId,
        round1Marks: input.round1Marks,
        round2Marks: input.round2Marks,
        markDelta: input.markDelta,
        normalizedDelta: input.normalizedDelta,
        status: input.status,
        requiresSeniorReview: input.requiresSeniorReview,
        criteriaDifferencesCount: input.criteriaDifferencesCount,
        discrepancyDetailsJson: input.discrepancyDetailsJson,
        seniorReviewNotes: input.seniorReviewNotes,
      },
    });
  }

  /**
   * Retrieves the DoubleEvaluationResult for a questionAttempt.
   */
  public static async getDoubleEvaluationResult(questionAttemptId: string) {
    return prisma.doubleEvaluationResult.findUnique({
      where: { questionAttemptId },
      include: {
        questionAttempt: {
          include: {
            pages: { include: { page: true } },
          },
        },
      },
    });
  }

  /**
   * Server-side Redaction:
   * Strips all Round 1 human marks, notes, decisions, and examiner identities when
   * serving payload to an independent Round 2 evaluator prior to Round 2 completion.
   */
  public static redactFirstRoundData<T extends Record<string, any>>(evaluationPayload: T): T {
    if (!evaluationPayload) return evaluationPayload;

    const cloned = JSON.parse(JSON.stringify(evaluationPayload));

    // Redact human decisions, notes, identities, reasons
    delete cloned.examinerDecision;
    delete cloned.examinerMarks;
    delete cloned.examinerNotes;
    delete cloned.examinerUserId;
    delete cloned.examinerUser;
    delete cloned.decidedAt;
    delete cloned.decisionHistory;
    delete cloned.overrideReason;
    delete cloned.reopenReason;
    delete cloned.markDelta;
    delete cloned.normalizedDelta;
    delete cloned.aiHumanDelta;
    delete cloned.disagreementAmount;

    // Redact human criteria marks in criterionResults
    if (Array.isArray(cloned.criterionResults)) {
      cloned.criterionResults = cloned.criterionResults.map((cr: any) => {
        const { examinerMarks, examinerOverridden, overrideReason, ...rest } = cr;
        return rest;
      });
    }

    // Redact disagreement risk factors from attached risk assessments
    if (cloned.riskAssessment && Array.isArray(cloned.riskAssessment.factors)) {
      cloned.riskAssessment.factors = cloned.riskAssessment.factors.filter(
        (f: any) => f.factorType !== 'AI_HUMAN_DISAGREEMENT' && f.factorType !== 'CRITERION_DISAGREEMENT'
      );
    }

    // Set flag indicating blind evaluation mode
    cloned.isIndependentEvaluationMode = true;

    return cloned;
  }
}
