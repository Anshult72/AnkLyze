import { Router } from "express";
import { resultController } from "../controllers/result.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// All Revaluation routes require active authentication
router.use(requireAuth);

// List revaluations
router.get(
  "/",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "MODERATOR", "EXAMINER"),
  resultController.listRevaluations
);

// Get single revaluation request
router.get(
  "/:id",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "MODERATOR", "EXAMINER"),
  resultController.getRevaluationById
);

// Authorize or reject revaluation (HEAD_EXAMINER or SUPER_ADMIN)
router.post(
  "/:id/authorize",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN"),
  resultController.authorizeRevaluation
);

// Complete revaluation with changed question decisions
router.post(
  "/:id/complete",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "MODERATOR", "EXAMINER"),
  resultController.completeRevaluation
);

export default router;
export { router as revaluationRoutes };
