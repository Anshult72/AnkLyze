/**
 * ANKLYZE Phase 12 - Risk & Double Evaluation Routes
 * "Analyse the marks, not just the paper."
 */

import { Router } from 'express';
import { RiskController } from '../controllers/risk.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Question Attempt Risk Assessment Endpoints
router.post(
  '/question-attempts/:id/risk-assess',
  requireAuth,
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  RiskController.assessRisk
);

router.get(
  '/question-attempts/:id/risk',
  requireAuth,
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  RiskController.getLatestRisk
);

router.get(
  '/question-attempts/:id/risk/history',
  requireAuth,
  requireRole('HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  RiskController.getRiskHistory
);

// Adaptive Double Evaluation Endpoints
router.post(
  '/question-attempts/:id/second-evaluation',
  requireAuth,
  requireRole('HEAD_EXAMINER', 'SUPER_ADMIN'),
  RiskController.requestSecondEvaluation
);

router.get(
  '/question-attempts/:id/eligible-second-examiners',
  requireAuth,
  requireRole('HEAD_EXAMINER', 'SUPER_ADMIN'),
  RiskController.getEligibleSecondExaminers
);

router.patch(
  '/evaluation-rounds/:id/reassign',
  requireAuth,
  requireRole('HEAD_EXAMINER', 'SUPER_ADMIN'),
  RiskController.reassignSecondEvaluation
);

router.get(
  '/question-attempts/:id/evaluation-rounds',
  requireAuth,
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  RiskController.getEvaluationRounds
);

router.get(
  '/evaluation-rounds/:id',
  requireAuth,
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  RiskController.getEvaluationRoundById
);

router.post(
  '/evaluation-rounds/:id/complete',
  requireAuth,
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'SUPER_ADMIN'),
  RiskController.completeEvaluationRound
);

router.post(
  '/evaluation-rounds/:id/agree',
  requireAuth,
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'SUPER_ADMIN'),
  RiskController.agreeEvaluationRound
);

router.post(
  '/evaluation-rounds/:id/disagree',
  requireAuth,
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'SUPER_ADMIN'),
  RiskController.disagreeEvaluationRound
);

router.get(
  '/question-attempts/:id/double-evaluation-result',
  requireAuth,
  requireRole('HEAD_EXAMINER', 'MODERATOR', 'SUPER_ADMIN'),
  RiskController.getDoubleEvaluationResult
);

router.get(
  '/examiner/my-independent-evaluations',
  requireAuth,
  requireRole('EXAMINER', 'HEAD_EXAMINER', 'SUPER_ADMIN'),
  RiskController.getMyIndependentEvaluations
);

export default router;
