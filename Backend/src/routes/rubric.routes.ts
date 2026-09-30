import { Router } from 'express';
import { rubricController } from '../controllers/rubric.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  modifyCriterionBodySchema,
  rejectRubricBodySchema,
  resolveIssueBodySchema,
} from '../schemas/rubric.schemas';

// Routes mounted at /api/v1/marking-schemes
export const rubricSchemeRoutes = Router();

// POST /api/v1/marking-schemes/:id/analyze - Trigger AI Rubric Analysis
rubricSchemeRoutes.post(
  '/:id/analyze',
  requireAuth,
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER'),
  (req, res, next) => {
    rubricController.analyzeMarkingScheme(req, res, next);
  }
);

// GET /api/v1/marking-schemes/:id/analyses - List analysis versions
rubricSchemeRoutes.get(
  '/:id/analyses',
  requireAuth,
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER', 'EXAMINER'),
  (req, res, next) => {
    rubricController.listAnalyses(req, res, next);
  }
);

// Routes mounted at /api/v1/marking-scheme-analyses
export const rubricAnalysisRoutes = Router();

// GET /api/v1/marking-scheme-analyses/:analysisId - View specific analysis
rubricAnalysisRoutes.get(
  '/:analysisId',
  requireAuth,
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER', 'EXAMINER'),
  (req, res, next) => {
    rubricController.getAnalysis(req, res, next);
  }
);

// PATCH /api/v1/marking-scheme-analyses/:analysisId - Modify criteria (Human provenance)
rubricAnalysisRoutes.patch(
  '/:analysisId',
  requireAuth,
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER'),
  validateRequest({ body: modifyCriterionBodySchema }),
  (req, res, next) => {
    rubricController.modifyCriterion(req, res, next);
  }
);

// POST /api/v1/marking-scheme-analyses/:analysisId/approve - Approve Rubric
rubricAnalysisRoutes.post(
  '/:analysisId/approve',
  requireAuth,
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER'),
  (req, res, next) => {
    rubricController.approveAnalysis(req, res, next);
  }
);

// POST /api/v1/marking-scheme-analyses/:analysisId/reject - Reject Rubric
rubricAnalysisRoutes.post(
  '/:analysisId/reject',
  requireAuth,
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER'),
  validateRequest({ body: rejectRubricBodySchema }),
  (req, res, next) => {
    rubricController.rejectAnalysis(req, res, next);
  }
);

// POST /api/v1/marking-scheme-analyses/:analysisId/reanalyze - Re-analyze (New version)
rubricAnalysisRoutes.post(
  '/:analysisId/reanalyze',
  requireAuth,
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER'),
  (req, res, next) => {
    rubricController.reanalyze(req, res, next);
  }
);

// POST /api/v1/marking-scheme-analyses/issues/:issueId/resolve - Resolve detected ambiguity
rubricAnalysisRoutes.post(
  '/issues/:issueId/resolve',
  requireAuth,
  requireRole('SUPER_ADMIN', 'HEAD_EXAMINER'),
  validateRequest({ body: resolveIssueBodySchema }),
  (req, res, next) => {
    rubricController.resolveIssue(req, res, next);
  }
);
