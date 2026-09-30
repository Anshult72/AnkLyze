export interface CalibrationConfig {
  toleranceMarks: number;
  acceptableDeviationPercentage: number;
  minItemsPerSet: number;
}

export const CALIBRATION_CONFIG: CalibrationConfig = {
  toleranceMarks: 0.5,
  acceptableDeviationPercentage: 0.15, // 15% delta tolerance
  minItemsPerSet: 1,
};

export function generateCalibrationFeedback(params: {
  awardedMarks: number;
  referenceMarks: number;
  criteriaDifferences: Array<{
    criterionId: string;
    criterionName: string;
    awardedMarks: number;
    referenceMarks: number;
    explanation?: string;
  }>;
}): string {
  const delta = params.awardedMarks - params.referenceMarks;
  const absDelta = Math.abs(delta);

  if (absDelta === 0 && params.criteriaDifferences.length === 0) {
    return "Complete alignment with authorized reference marking across all criteria.";
  }

  if (absDelta <= CALIBRATION_CONFIG.toleranceMarks && params.criteriaDifferences.length === 0) {
    return `Awarded marks closely aligned with reference (${delta > 0 ? "+" : ""}${delta.toFixed(1)} marks) within standard tolerance.`;
  }

  const primaryDiff = params.criteriaDifferences[0];
  const critNote = primaryDiff
    ? ` The largest difference occurred on criterion "${primaryDiff.criterionName}" where reference awarded ${primaryDiff.referenceMarks.toFixed(1)} marks.`
    : "";

  if (delta > 0) {
    return `Evaluator scored ${absDelta.toFixed(1)} marks higher than reference standard.${critNote}`;
  } else {
    return `Evaluator scored ${absDelta.toFixed(1)} marks lower than reference standard.${critNote}`;
  }
}
