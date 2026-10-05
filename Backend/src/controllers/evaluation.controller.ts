/**
 * ANKLYZE Phase 10 - AI-Assisted Evaluation Controller
 * "Analyse the marks, not just the paper."
 * 
 * REST API handlers for AI evaluation and human decision making.
 */

import { Request, Response, NextFunction } from 'express';
import { EvaluationService } from '../services/evaluation.service';
import {
  evaluateAttemptBodySchema,
  examinerDecisionBodySchema,
  updateCriterionBodySchema,
  flagReviewBodySchema,
  createDecisionBodySchema,
  finalizeDecisionBodySchema,
  reopenDecisionBodySchema,
} from '../schemas/evaluation.schemas';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../utils/logger';
import { realtimeService } from '../services/realtime.service';

function getParam(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : (val as string);
}

export class EvaluationController {
  private evaluationService: EvaluationService;

  constructor(evaluationService?: EvaluationService) {
    this.evaluationService = evaluationService || new EvaluationService();
  }

  /**
   * POST /api/v1/question-attempts/:id/evaluate
   * Triggers AI evaluation for a specific QuestionAttempt.
   */
  public async evaluateAttempt(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const attemptId = getParam(req, 'id');
      const user = (req as any).user;
      const parseResult = evaluateAttemptBodySchema.safeParse(req.body || {});

      if (!parseResult.success) {
        ApiResponse.error(
          res,
          { code: 'VALIDATION_ERROR', message: 'Invalid evaluation request body' },
          400
        );
        return;
      }

      const evaluation = await this.evaluationService.evaluateQuestionAttempt(attemptId, {
        forceRefresh: parseResult.data.forceRefresh,
        forceProvider: parseResult.data.provider,
        userId: user?.id,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      realtimeService.emitEvaluationStatusUpdated(evaluation.id, attemptId, {
        status: evaluation.status,
        suggestedMarks: evaluation.suggestedMarks,
        confidence: evaluation.confidenceScore,
      });

      ApiResponse.success(res, evaluation, 200);
    } catch (err: any) {
      logger.error({ err, attemptId: req.params.id }, 'Evaluation request failed');
      ApiResponse.error(
        res,
        {
          code: 'EVALUATION_ERROR',
          message: err.message || 'Evaluation processing failed',
        },
        500
      );
    }
  }

  /**
   * GET /api/v1/question-attempts/:id/evaluation
   * Retrieves the current/latest evaluation for a QuestionAttempt.
   */
  public async getEvaluation(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const attemptId = getParam(req, 'id');
      const evaluation = await this.evaluationService.getEvaluation(attemptId);

      if (!evaluation) {
        ApiResponse.error(
          res,
          {
            code: 'NOT_FOUND',
            message: `No evaluation found for question attempt ${attemptId}`,
          },
          404
        );
        return;
      }

      ApiResponse.success(res, evaluation, 200);
    } catch (err: any) {
      logger.error({ err, attemptId: req.params.id }, 'Failed to retrieve evaluation');
      ApiResponse.error(
        res,
        {
          code: 'EVALUATION_FETCH_ERROR',
          message: err.message || 'Failed to fetch evaluation',
        },
        500
      );
    }
  }

  /**
   * POST /api/v1/question-attempts/:id/evaluate/retry
   * Forces re-evaluation of a QuestionAttempt.
   */
  public async retryEvaluation(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const attemptId = getParam(req, 'id');
      const user = (req as any).user;

      const requestedProvider = (req.body?.provider || req.query?.provider) as string | undefined;
      const evaluation = await this.evaluationService.evaluateQuestionAttempt(attemptId, {
        forceRefresh: true,
        forceProvider: requestedProvider,
        userId: user?.id,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      ApiResponse.success(res, evaluation, 200);
    } catch (err: any) {
      logger.error({ err, attemptId: req.params.id }, 'Retry evaluation failed');
      ApiResponse.error(
        res,
        {
          code: 'EVALUATION_RETRY_ERROR',
          message: err.message || 'Retry evaluation failed',
        },
        500
      );
    }
  }

  /**
   * PATCH /api/v1/evaluations/:id/decision
   * Persists the human examiner's final decision (Accept suggestion, Override marks, Flag).
   */
  public async saveDecision(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const evaluationId = getParam(req, 'id');
      const user = (req as any).user;
      const parseResult = examinerDecisionBodySchema.safeParse(req.body);

      if (!parseResult.success) {
        ApiResponse.error(
          res,
          {
            code: 'VALIDATION_ERROR',
            message: 'Invalid decision payload',
            details: parseResult.error.errors,
          },
          400
        );
        return;
      }

      const updated = await this.evaluationService.saveExaminerDecision(
        evaluationId,
        user?.id || 'anonymous-examiner',
        {
          decisionType: parseResult.data.decisionType,
          totalMarksAwarded: parseResult.data.totalMarksAwarded,
          examinerNotes: parseResult.data.examinerNotes,
          criteriaOverrides: parseResult.data.criteriaOverrides,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        }
      );

      ApiResponse.success(res, updated, 200);
    } catch (err: any) {
      logger.error({ err, evaluationId: req.params.id }, 'Failed to save examiner decision');
      ApiResponse.error(
        res,
        {
          code: 'DECISION_ERROR',
          message: err.message || 'Failed to save examiner decision',
        },
        500
      );
    }
  }

  /**
   * PATCH /api/v1/evaluations/:id/criteria/:criterionId
   * Updates a single criterion's awarded marks and comment.
   */
  public async updateCriterion(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const evaluationId = getParam(req, 'id');
      const criterionId = getParam(req, 'criterionId');
      const user = (req as any).user;
      const parseResult = updateCriterionBodySchema.safeParse(req.body);

      if (!parseResult.success) {
        ApiResponse.error(
          res,
          {
            code: 'VALIDATION_ERROR',
            message: 'Invalid criterion update payload',
          },
          400
        );
        return;
      }

      const updated = await this.evaluationService.updateCriterionResult(
        evaluationId,
        criterionId,
        user?.id || 'anonymous-examiner',
        parseResult.data.marksAwarded,
        parseResult.data.examinerComment
      );

      ApiResponse.success(res, updated, 200);
    } catch (err: any) {
      logger.error({ err, evaluationId: req.params.id }, 'Failed to update criterion result');
      ApiResponse.error(
        res,
        {
          code: 'CRITERION_UPDATE_ERROR',
          message: err.message || 'Failed to update criterion',
        },
        500
      );
    }
  }

  /**
   * POST /api/v1/evaluations/:id/flag-review
   * Flags an evaluation for review by Head Examiner / Moderator.
   */
  public async flagReview(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const evaluationId = getParam(req, 'id');
      const user = (req as any).user;
      const parseResult = flagReviewBodySchema.safeParse(req.body);

      if (!parseResult.success) {
        ApiResponse.error(
          res,
          {
            code: 'VALIDATION_ERROR',
            message: 'Invalid flag review payload',
          },
          400
        );
        return;
      }

      const updated = await this.evaluationService.flagForReview(
        evaluationId,
        user?.id || 'anonymous-examiner',
        parseResult.data.reason
      );

      ApiResponse.success(res, updated, 200);
    } catch (err: any) {
      logger.error({ err, evaluationId: req.params.id }, 'Failed to flag evaluation for review');
      ApiResponse.error(
        res,
        {
          code: 'FLAG_REVIEW_ERROR',
          message: err.message || 'Failed to flag evaluation',
        },
        500
      );
    }
  }

  /**
   * GET /api/v1/evaluations/:id/evidence
   * Retrieves structured evidence linked to criteria and pages/regions.
   */
  public async getEvidence(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const evaluationId = getParam(req, 'id');
      const evidence = await this.evaluationService.getEvidence(evaluationId);

      ApiResponse.success(res, evidence, 200);
    } catch (err: any) {
      logger.error({ err, evaluationId: req.params.id }, 'Failed to get evaluation evidence');
      ApiResponse.error(
        res,
        {
          code: 'EVIDENCE_FETCH_ERROR',
          message: err.message || 'Failed to fetch evidence',
        },
        500
      );
    }
  }

  /**
   * GET /api/v1/evaluations/:id/provenance
   * Retrieves full audit and AI provenance metadata.
   */
  public async getProvenance(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const evaluationId = getParam(req, 'id');
      const provenance = await this.evaluationService.getProvenance(evaluationId);

      ApiResponse.success(res, provenance, 200);
    } catch (err: any) {
      logger.error({ err, evaluationId: req.params.id }, 'Failed to get evaluation provenance');
      ApiResponse.error(
        res,
        {
          code: 'PROVENANCE_FETCH_ERROR',
          message: err.message || 'Failed to fetch provenance',
        },
        500
      );
    }
  }

  /**
   * GET /api/v1/evaluations/:id/decisions
   * Returns immutable human decision history.
   */
  public async getDecisions(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const evaluationId = getParam(req, 'id');
      const history = await this.evaluationService.getDecisionHistory(evaluationId);
      ApiResponse.success(res, history, 200);
    } catch (err: any) {
      logger.error({ err, evaluationId: req.params.id }, 'Failed to get decision history');
      ApiResponse.error(
        res,
        {
          code: 'DECISION_HISTORY_ERROR',
          message: err.message || 'Failed to fetch decision history',
        },
        500
      );
    }
  }

  /**
   * GET /api/v1/evaluations/:id/current-decision
   * Returns the current effective examiner decision (FINAL > DRAFT > AI advisory).
   */
  public async getCurrentDecision(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const evaluationId = getParam(req, 'id');
      const current = await this.evaluationService.getCurrentEffectiveDecision(evaluationId);
      ApiResponse.success(res, current, 200);
    } catch (err: any) {
      logger.error({ err, evaluationId: req.params.id }, 'Failed to get current effective decision');
      ApiResponse.error(
        res,
        {
          code: 'CURRENT_DECISION_ERROR',
          message: err.message || 'Failed to fetch current decision',
        },
        500
      );
    }
  }

  /**
   * POST /api/v1/evaluations/:id/decisions
   * Creates a new immutable versioned human evaluation decision.
   */
  public async createDecision(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const evaluationId = getParam(req, 'id');
      const user = (req as any).user;
      const parseResult = createDecisionBodySchema.safeParse(req.body);

      if (!parseResult.success) {
        ApiResponse.error(
          res,
          {
            code: 'VALIDATION_ERROR',
            message: 'Invalid decision payload',
            details: parseResult.error.errors,
          },
          400
        );
        return;
      }

      const decision = await this.evaluationService.createHumanDecision(
        evaluationId,
        user?.id || 'anonymous-examiner',
        {
          decisionType: parseResult.data.decisionType as any,
          status: parseResult.data.status as any,
          totalMarks: parseResult.data.totalMarks,
          expectedVersion: parseResult.data.expectedVersion,
          notes: parseResult.data.notes,
          overrideReason: parseResult.data.overrideReason,
          reopenReason: parseResult.data.reopenReason,
          criteriaDecisions: parseResult.data.criteriaDecisions,
        },
        {
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        }
      );

      if (decision) {
        realtimeService.emitEvaluationStatusUpdated(evaluationId, '', {
          decisionId: decision.id,
          version: decision.version,
          status: decision.status,
          totalMarks: decision.totalMarks,
        });
      }

      ApiResponse.success(res, decision, 201);
    } catch (err: any) {
      if (err.message?.includes('STALE_VERSION_CONFLICT')) {
        ApiResponse.error(
          res,
          {
            code: 'STALE_VERSION_CONFLICT',
            message: err.message,
          },
          409
        );
        return;
      }

      if (err.message?.includes('Override reason is required')) {
        ApiResponse.error(
          res,
          {
            code: 'OVERRIDE_REASON_REQUIRED',
            message: err.message,
          },
          400
        );
        return;
      }

      logger.error({ err, evaluationId: req.params.id }, 'Failed to create human evaluation decision');
      ApiResponse.error(
        res,
        {
          code: 'CREATE_DECISION_ERROR',
          message: err.message || 'Failed to create decision',
        },
        500
      );
    }
  }

  /**
   * POST /api/v1/evaluations/:id/finalize
   * Finalizes the current draft decision into an authoritative FINAL decision.
   */
  public async finalizeDecision(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const evaluationId = getParam(req, 'id');
      const user = (req as any).user;
      const parseResult = finalizeDecisionBodySchema.safeParse(req.body || {});

      if (!parseResult.success) {
        ApiResponse.error(
          res,
          {
            code: 'VALIDATION_ERROR',
            message: 'Invalid finalize request payload',
          },
          400
        );
        return;
      }

      const finalized = await this.evaluationService.finalizeHumanDecision(
        evaluationId,
        user?.id || 'anonymous-examiner',
        parseResult.data.notes,
        parseResult.data.expectedVersion,
        {
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        }
      );

      if (finalized) {
        realtimeService.emitEvaluationStatusUpdated(evaluationId, '', {
          decisionId: finalized.id,
          version: finalized.version,
          status: 'FINAL',
          totalMarks: finalized.totalMarks,
          finalizedAt: finalized.createdAt,
        });
      }

      ApiResponse.success(res, finalized, 200);
    } catch (err: any) {
      if (err.message?.includes('DUPLICATE_FINALIZE_ERROR')) {
        ApiResponse.error(
          res,
          {
            code: 'ALREADY_FINALIZED',
            message: err.message,
          },
          400
        );
        return;
      }

      logger.error({ err, evaluationId: req.params.id }, 'Failed to finalize decision');
      ApiResponse.error(
        res,
        {
          code: 'FINALIZE_DECISION_ERROR',
          message: err.message || 'Failed to finalize decision',
        },
        500
      );
    }
  }

  /**
   * POST /api/v1/evaluations/:id/reopen
   * Reopens a finalized decision with an explicit reason for amendment.
   */
  public async reopenDecision(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const evaluationId = getParam(req, 'id');
      const user = (req as any).user;
      const parseResult = reopenDecisionBodySchema.safeParse(req.body);

      if (!parseResult.success) {
        ApiResponse.error(
          res,
          {
            code: 'VALIDATION_ERROR',
            message: 'Invalid reopen payload. A valid reopenReason (min 3 chars) is required.',
          },
          400
        );
        return;
      }

      const reopened = await this.evaluationService.reopenHumanDecision(
        evaluationId,
        user?.id || 'anonymous-examiner',
        parseResult.data.reopenReason,
        parseResult.data.expectedVersion,
        {
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        }
      );

      ApiResponse.success(res, reopened, 200);
    } catch (err: any) {
      if (err.message?.includes('NOT_FINALIZED_ERROR')) {
        ApiResponse.error(
          res,
          {
            code: 'NOT_FINALIZED',
            message: err.message,
          },
          400
        );
        return;
      }

      logger.error({ err, evaluationId: req.params.id }, 'Failed to reopen decision');
      ApiResponse.error(
        res,
        {
          code: 'REOPEN_DECISION_ERROR',
          message: err.message || 'Failed to reopen decision',
        },
        500
      );
    }
  }

  /**
   * GET /api/v1/evaluations/:id/history
   * Returns a combined chronological timeline of AI and Human decision events.
   */
  public async getTimelineHistory(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const evaluationId = getParam(req, 'id');
      const timeline = await this.evaluationService.getCombinedTimeline(evaluationId);
      ApiResponse.success(res, timeline, 200);
    } catch (err: any) {
      logger.error({ err, evaluationId: req.params.id }, 'Failed to get timeline history');
      ApiResponse.error(
        res,
        {
          code: 'TIMELINE_FETCH_ERROR',
          message: err.message || 'Failed to fetch timeline history',
        },
        500
      );
    }
  }
}

export const evaluationController = new EvaluationController();

