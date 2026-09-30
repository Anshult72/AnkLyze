import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

// Evaluator consistency (Head Examiner, Super Admin, Moderator)
router.get(
  "/evaluators/:id/consistency",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "MODERATOR", "EXAMINER"),
  AnalyticsController.getEvaluatorConsistency
);

// Evaluator drift (Head Examiner, Super Admin)
router.get(
  "/evaluators/:id/drift",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN"),
  AnalyticsController.getEvaluatorDrift
);

// Exam operational coverage (Head Examiner, Super Admin, Moderator)
router.get(
  "/exams/:id/coverage",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "MODERATOR"),
  AnalyticsController.getExamCoverage
);

// Subject operational coverage (Head Examiner, Super Admin, Moderator)
router.get(
  "/subjects/:id/coverage",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "MODERATOR"),
  AnalyticsController.getSubjectCoverage
);

export default router;
