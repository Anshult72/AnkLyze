/**
 * ANKLYZE Phase 12 - Risk & Double Evaluation Controller
 * "Analyse the marks, not just the paper."
 */

import { Request, Response } from 'express';
import { RiskService } from '../services/risk.service';
import { RiskRepository } from '../repositories/risk.repository';
import { realtimeService } from '../services/realtime.service';
import {
  riskAssessParamsSchema,
  requestSecondEvaluationBodySchema,
  completeRoundParamsSchema,
  completeRoundBodySchema,
} from '../schemas/risk.schemas';

export class RiskController {
  /**
   * POST /question-attempts/:id/risk-assess
   * Computes/recomputes explainable risk assessment for a question attempt.
   */
  public static async assessRisk(req: Request, res: Response): Promise<void> {
    try {
      const { id } = riskAssessParamsSchema.parse(req.params);
      const callerUserId = (req as any).user?.id;

      const assessment = await RiskService.assessRiskForQuestionAttempt(id, callerUserId);

      realtimeService.emitRiskAssessmentUpdated(assessment.evaluationId || '', id, {
        riskScore: (assessment as any).compositeScore ?? (assessment as any).riskScore,
        riskBand: assessment.riskBand,
        requiresSeniorReview: assessment.requiresSeniorReview,
      });

      res.status(200).json({
        success: true,
        data: assessment,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid attempt ID', details: err.errors },
        });
        return;
      }
      if (err.message.includes('QUESTION_ATTEMPT_NOT_FOUND')) {
        res.status(404).json({
          success: false,
          error: { code: 'QUESTION_ATTEMPT_NOT_FOUND', message: err.message },
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
      });
    }
  }

  /**
   * GET /question-attempts/:id/risk
   * Retrieves latest risk assessment for a question attempt.
   */
  public static async getLatestRisk(req: Request, res: Response): Promise<void> {
    try {
      const { id } = riskAssessParamsSchema.parse(req.params);

      const assessment = await RiskService.getLatestRiskAssessment(id);

      res.status(200).json({
        success: true,
        data: assessment,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid attempt ID', details: err.errors },
        });
        return;
      }
      if (err.message.includes('QUESTION_ATTEMPT_NOT_FOUND')) {
        res.status(404).json({
          success: false,
          error: { code: 'QUESTION_ATTEMPT_NOT_FOUND', message: err.message },
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
      });
    }
  }

  /**
   * GET /question-attempts/:id/risk/history
   * Retrieves versioned history of risk assessments for a question attempt.
   */
  public static async getRiskHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = riskAssessParamsSchema.parse(req.params);

      const history = await RiskService.getRiskHistory(id);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid attempt ID', details: err.errors },
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
      });
    }
  }

  /**
   * POST /question-attempts/:id/second-evaluation
   * Requests or initiates an independent second evaluation (Round 2).
   */
  public static async requestSecondEvaluation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = riskAssessParamsSchema.parse(req.params);
      const body = requestSecondEvaluationBodySchema.parse(req.body || {});
      const callerUserId = (req as any).user?.id;

      const round2 = await RiskService.requestSecondEvaluation({
        questionAttemptId: id,
        assignedUserId: body.assignedUserId,
        callerUserId,
      });

      realtimeService.emitSecondEvaluationRequested(id, {
        roundId: (round2 as any).round2?.id || (round2 as any).id,
        assignedUserId: body.assignedUserId,
      });

      res.status(201).json({
        success: true,
        data: round2,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: err.errors },
        });
        return;
      }
      if (err.message.includes('SECOND_EVALUATION_ALREADY_EXISTS')) {
        res.status(409).json({
          success: false,
          error: { code: 'SECOND_EVALUATION_ALREADY_EXISTS', message: err.message },
        });
        return;
      }
      if (err.message.includes('QUESTION_ATTEMPT_NOT_FOUND')) {
        res.status(404).json({
          success: false,
          error: { code: 'QUESTION_ATTEMPT_NOT_FOUND', message: err.message },
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
      });
    }
  }

  /**
   * GET /question-attempts/:id/evaluation-rounds
   * Retrieves evaluation rounds with server-side blind redaction if caller is Round 2 evaluator.
   */
  public static async getEvaluationRounds(req: Request, res: Response): Promise<void> {
    try {
      const { id } = riskAssessParamsSchema.parse(req.params);
      const callerUserId = (req as any).user?.id;
      const callerRole = (req as any).user?.role;

      const result = await RiskService.getEvaluationRoundsForAttempt({
        questionAttemptId: id,
        callerUserId,
        callerRole,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid attempt ID', details: err.errors },
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
      });
    }
  }

  /**
   * GET /evaluation-rounds/:id
   * Retrieves a specific evaluation round by ID.
   */
  public static async getEvaluationRoundById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = completeRoundParamsSchema.parse(req.params);

      const round = await RiskRepository.getEvaluationRoundById(id);
      if (!round) {
        res.status(404).json({
          success: false,
          error: { code: 'EVALUATION_ROUND_NOT_FOUND', message: `Round ${id} not found` },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: round,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid round ID', details: err.errors },
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
      });
    }
  }

  /**
   * POST /evaluation-rounds/:id/complete
   * Marks round completed, evaluates agreement vs disagreement, and triggers senior review if delta > threshold.
   */
  public static async completeEvaluationRound(req: Request, res: Response): Promise<void> {
    try {
      const { id } = completeRoundParamsSchema.parse(req.params);
      const body = completeRoundBodySchema.parse(req.body || {});
      const callerUserId = (req as any).user?.id;

      const result = await RiskService.completeEvaluationRound({
        roundId: id,
        evaluationId: body.evaluationId,
        callerUserId,
      });

      realtimeService.emitSecondEvaluationCompleted(id, {
        roundId: id,
        status: result.round.status,
        hasDisagreement: (result as any).comparison?.hasDisagreement || false,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Validation error', details: err.errors },
        });
        return;
      }
      if (err.message.includes('ROUND_ALREADY_COMPLETED')) {
        res.status(400).json({
          success: false,
          error: { code: 'ROUND_ALREADY_COMPLETED', message: err.message },
        });
        return;
      }
      if (err.message.includes('EVALUATION_ROUND_NOT_FOUND')) {
        res.status(404).json({
          success: false,
          error: { code: 'EVALUATION_ROUND_NOT_FOUND', message: err.message },
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
      });
    }
  }

  /**
   * GET /question-attempts/:id/double-evaluation-result
   * Retrieves completed double evaluation comparison.
   */
  public static async getDoubleEvaluationResult(req: Request, res: Response): Promise<void> {
    try {
      const { id } = riskAssessParamsSchema.parse(req.params);

      const result = await RiskRepository.getDoubleEvaluationResult(id);
      if (!result) {
        res.status(404).json({
          success: false,
          error: { code: 'DOUBLE_EVALUATION_NOT_FOUND', message: 'No double evaluation found for attempt' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid attempt ID', details: err.errors },
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
      });
    }
  }
}
