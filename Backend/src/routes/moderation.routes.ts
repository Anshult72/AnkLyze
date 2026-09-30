import { Router } from "express";
import { ModerationController } from "../controllers/moderation.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// Apply auth middleware to all moderation routes
router.use(requireAuth);

// Summary metrics (Head Examiner, Moderator, Super Admin)
router.get(
  "/summary",
  requireRole("MODERATOR", "HEAD_EXAMINER", "SUPER_ADMIN"),
  ModerationController.getSummary
);

// List cases
router.get(
  "/cases",
  requireRole("MODERATOR", "HEAD_EXAMINER", "SUPER_ADMIN"),
  ModerationController.listCases
);

// Create case (Head Examiner, Super Admin, System Evaluator)
router.post(
  "/cases",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN", "EXAMINER", "MODERATOR"),
  ModerationController.createCase
);

// Get single case
router.get(
  "/cases/:id",
  requireRole("MODERATOR", "HEAD_EXAMINER", "SUPER_ADMIN"),
  ModerationController.getCase
);

// Assign moderator
router.post(
  "/cases/:id/assign",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN"),
  ModerationController.assignModerator
);

// Start review
router.post(
  "/cases/:id/start",
  requireRole("MODERATOR", "HEAD_EXAMINER", "SUPER_ADMIN"),
  ModerationController.startReview
);

// Resolve case
router.post(
  "/cases/:id/resolve",
  requireRole("MODERATOR", "HEAD_EXAMINER", "SUPER_ADMIN"),
  ModerationController.resolveCase
);

// Escalate case
router.post(
  "/cases/:id/escalate",
  requireRole("MODERATOR", "HEAD_EXAMINER", "SUPER_ADMIN"),
  ModerationController.escalateCase
);

export default router;
