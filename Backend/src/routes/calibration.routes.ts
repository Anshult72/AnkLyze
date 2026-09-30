import { Router } from "express";
import { CalibrationController } from "../controllers/calibration.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

// Create calibration set (Head Examiner, Super Admin)
router.post(
  "/sets",
  requireRole("HEAD_EXAMINER", "SUPER_ADMIN"),
  CalibrationController.createSet
);

// List calibration sets (Examiner, Head Examiner, Moderator, Super Admin)
router.get(
  "/sets",
  requireRole("EXAMINER", "HEAD_EXAMINER", "MODERATOR", "SUPER_ADMIN"),
  CalibrationController.listSets
);

// Start or get calibration session (Examiner, Head Examiner, Super Admin)
router.post(
  "/sessions",
  requireRole("EXAMINER", "HEAD_EXAMINER", "SUPER_ADMIN"),
  CalibrationController.startSession
);

// Get session details (with server-side reference protection for active sessions)
router.get(
  "/sessions/:id",
  requireRole("EXAMINER", "HEAD_EXAMINER", "MODERATOR", "SUPER_ADMIN"),
  CalibrationController.getSession
);

// Submit individual item evaluation
router.post(
  "/sessions/:id/submit",
  requireRole("EXAMINER", "HEAD_EXAMINER", "SUPER_ADMIN"),
  CalibrationController.submitItem
);

// Complete calibration session
router.post(
  "/sessions/:id/complete",
  requireRole("EXAMINER", "HEAD_EXAMINER", "SUPER_ADMIN"),
  CalibrationController.completeSession
);

export default router;
