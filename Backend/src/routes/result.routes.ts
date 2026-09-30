import { Router } from "express";
import { resultController } from "../controllers/result.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// All Result routes require active authentication
router.use(requireAuth);

// ------------------------------------------------------------------------------
// Result Generation, Listing, Validation, & Inspection
// ------------------------------------------------------------------------------

// Generate or retrieve current result
router.post(
  "/generate",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "EXAMINER", "MODERATOR"),
  resultController.generateResult
);

// List results with filters
router.get(
  "/",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "EXAMINER", "MODERATOR"),
  resultController.listResults
);

// Get single result by ID
router.get(
  "/:id",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "EXAMINER", "MODERATOR"),
  resultController.getResultById
);

// Run or refresh validation on result
router.post(
  "/:id/validate",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "MODERATOR"),
  resultController.validateResult
);

// Approve result package (HEAD_EXAMINER or SUPER_ADMIN only)
router.post(
  "/:id/approve",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN"),
  resultController.approveResult
);

// Get question mark breakdown
router.get(
  "/:id/questions",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "EXAMINER", "MODERATOR"),
  resultController.getResultQuestions
);

// Get validation issues
router.get(
  "/:id/validation",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "EXAMINER", "MODERATOR"),
  resultController.getResultValidation
);

// Get provenance traceability graph
router.get(
  "/:id/provenance",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "EXAMINER", "MODERATOR"),
  resultController.getResultProvenance
);

// Generate explainable internal report
router.get(
  "/:id/report",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "EXAMINER", "MODERATOR"),
  resultController.getExplainableReport
);

// Get immutable version history for result
router.get(
  "/:id/history",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "EXAMINER", "MODERATOR"),
  resultController.getResultHistory
);

// ------------------------------------------------------------------------------
// Revaluation Workflow Routes
// ------------------------------------------------------------------------------

// Request revaluation on an approved result
router.post(
  "/:id/revaluation",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "EXAMINER", "MODERATOR"),
  resultController.requestRevaluation
);

export default router;
export { router as resultRoutes };
