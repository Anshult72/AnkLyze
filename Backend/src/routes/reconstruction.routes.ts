/**
 * ANKLYZE Phase 9 - Answer Reconstruction & Question Mapping Routes
 * "Analyse the marks, not just the paper."
 * 
 * Strict RBAC:
 * - Reconstruction Trigger & Retry: SUPER_ADMIN and HEAD_EXAMINER only.
 * - Manual Attempt Resolution & Override: SUPER_ADMIN and HEAD_EXAMINER only.
 * - Read Reconstruction & Attempts: SUPER_ADMIN, HEAD_EXAMINER, EXAMINER, MODERATOR.
 * - Supplementary Linking: SUPER_ADMIN and HEAD_EXAMINER only.
 */

import { Router } from 'express';
import { reconstructionController } from '../controllers/reconstruction.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

// Routes mounted under /api/v1/scripts
export const reconstructionScriptRoutes = Router();

reconstructionScriptRoutes.use(requireAuth);

// Read endpoints (SUPER_ADMIN, HEAD_EXAMINER, EXAMINER, MODERATOR)
reconstructionScriptRoutes.get(
  '/:scriptId/reconstruction',
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER', 'EXAMINER', 'MODERATOR'),
  reconstructionController.getReconstruction
);

reconstructionScriptRoutes.get(
  '/:scriptId/attempts',
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER', 'EXAMINER', 'MODERATOR'),
  reconstructionController.getAttempts
);

reconstructionScriptRoutes.get(
  '/:scriptId/attempts/:attemptId',
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER', 'EXAMINER', 'MODERATOR'),
  reconstructionController.getAttemptById
);

reconstructionScriptRoutes.get(
  '/:scriptId/supplementary',
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER', 'EXAMINER', 'MODERATOR'),
  reconstructionController.getSupplementaryLinks
);

// Mutating / Execution endpoints (SUPER_ADMIN, HEAD_EXAMINER only)
reconstructionScriptRoutes.post(
  '/:scriptId/reconstruct',
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER'),
  reconstructionController.reconstruct
);

reconstructionScriptRoutes.post(
  '/:scriptId/reconstruct/retry',
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER'),
  reconstructionController.retry
);

reconstructionScriptRoutes.post(
  '/:scriptId/supplementary/link',
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER'),
  reconstructionController.linkSupplementary
);

// Routes mounted under /api/v1/question-attempts
export const questionAttemptRoutes = Router();

questionAttemptRoutes.use(requireAuth);

questionAttemptRoutes.patch(
  '/:attemptId',
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER'),
  reconstructionController.patchAttempt
);

questionAttemptRoutes.post(
  '/:attemptId/resolve',
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER'),
  reconstructionController.resolveAttempt
);
