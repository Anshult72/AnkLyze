/**
 * ANKLYZE Phase 10 - AI-Assisted Evaluation Routes
 * "Analyse the marks, not just the paper."
 * 
 * RBAC Rules:
 * - EXAMINER, HEAD_EXAMINER, SUPER_ADMIN: Evaluate attempt, Retry evaluation, Save decision, Update criterion score.
 * - MODERATOR, EXAMINER, HEAD_EXAMINER, SUPER_ADMIN: Read evaluation, Flag for review, Read evidence, Read provenance.
 */

import { Router } from 'express';
import { evaluationController } from '../controllers/evaluation.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { aiEvaluationRateLimiter } from '../middleware/security.middleware';

// Routes for question attempts evaluation
export const evaluationAttemptRoutes = Router();
evaluationAttemptRoutes.use(requireAuth);

evaluationAttemptRoutes.post(
  '/:id/evaluate',
  aiEvaluationRateLimiter,
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'SUPER_ADMIN'),
  evaluationController.evaluateAttempt.bind(evaluationController)
);

evaluationAttemptRoutes.get(
  '/:id/evaluation',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  evaluationController.getEvaluation.bind(evaluationController)
);

evaluationAttemptRoutes.post(
  '/:id/evaluate/retry',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'SUPER_ADMIN'),
  evaluationController.retryEvaluation.bind(evaluationController)
);

// Routes for evaluations
export const evaluationRoutes = Router();
evaluationRoutes.use(requireAuth);

evaluationRoutes.patch(
  '/:id/decision',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'SUPER_ADMIN'),
  evaluationController.saveDecision.bind(evaluationController)
);

evaluationRoutes.patch(
  '/:id/criteria/:criterionId',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'SUPER_ADMIN'),
  evaluationController.updateCriterion.bind(evaluationController)
);

evaluationRoutes.post(
  '/:id/flag-review',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  evaluationController.flagReview.bind(evaluationController)
);

evaluationRoutes.get(
  '/:id/evidence',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  evaluationController.getEvidence.bind(evaluationController)
);

evaluationRoutes.get(
  '/:id/provenance',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  evaluationController.getProvenance.bind(evaluationController)
);

// Phase 11: Human Evaluation & Immutable Decision Lifecycle Endpoints
evaluationRoutes.get(
  '/:id/decisions',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  evaluationController.getDecisions.bind(evaluationController)
);

evaluationRoutes.get(
  '/:id/current-decision',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  evaluationController.getCurrentDecision.bind(evaluationController)
);

evaluationRoutes.post(
  '/:id/decisions',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'SUPER_ADMIN'),
  evaluationController.createDecision.bind(evaluationController)
);

evaluationRoutes.post(
  '/:id/finalize',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'SUPER_ADMIN'),
  evaluationController.finalizeDecision.bind(evaluationController)
);

evaluationRoutes.post(
  '/:id/reopen',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'SUPER_ADMIN'),
  evaluationController.reopenDecision.bind(evaluationController)
);

evaluationRoutes.get(
  '/:id/history',
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  evaluationController.getTimelineHistory.bind(evaluationController)
);

