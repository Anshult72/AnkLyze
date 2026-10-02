import { notFound } from "next/navigation";

/**
 * Calibration is decommissioned and not part of the active ANKLYZE product.
 * Core Principle: "AI suggests, examiner decides."
 * Subjective student answers vary significantly, and predefined reference calibration
 * is superseded by deterministic risk moderation and institutional consensus review.
 */
export default function ExaminerCalibrationPage() {
  notFound();
}
