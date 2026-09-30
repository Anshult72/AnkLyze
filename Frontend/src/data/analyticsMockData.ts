export interface EvaluatorConsistencyData {
  evaluatorId: string;
  evaluatorName: string;
  subject: string;
  totalAttemptsEvaluated: number;
  meanAwardedMarks: number;
  medianAwardedMarks: number;
  meanMaxMarks: number;
  aiOverrideRate: number; // percentage e.g. 18.5%
  aiAcceptanceRate: number; // percentage e.g. 81.5%
  criterionOverrideFrequency: number;
  secondEvalDisagreementCount: number;
  moderationReferralCount: number;
  medianAbsoluteDeviationFromCalibration: number; // e.g. 0.4 marks
  calibrationCriteriaAgreementRate: number; // percentage e.g. 84.0%
}

export interface DriftObservationData {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  examTitle: string;
  subjectName: string;
  signalType: "MARK_DISTRIBUTION_SHIFT" | "OVERRIDE_RATE_SHIFT" | "DISAGREEMENT_RATE_SHIFT";
  severity: "INFO" | "MODERATE" | "SIGNIFICANT";
  status: "DETECTED" | "INSUFFICIENT_DATA" | "REVIEWED" | "DISMISSED";
  sampleSize: number;
  minSampleSize: number;
  windowStart: string;
  windowEnd: string;
  baselineMetric: number;
  currentMetric: number;
  delta: number;
  descriptiveExplanation: string;
}

export interface OperationalCoverageData {
  examId: string;
  examTitle: string;
  academicTerm: string;
  totalAssignedAttempts: number;
  evaluatedAttempts: number;
  pendingAttempts: number;
  highRiskAttempts: number;
  doubleEvaluationRequired: number;
  doubleEvaluationCompleted: number;
  moderationCasesOpen: number;
  moderationCasesResolved: number;
  calibrationAssigned: number;
  calibrationCompleted: number;
}

export const MOCK_OPERATIONAL_COVERAGE: OperationalCoverageData = {
  examId: "exam-01",
  examTitle: "B.Tech Semester Examination 2025-26",
  academicTerm: "Winter 2025-26",
  totalAssignedAttempts: 450,
  evaluatedAttempts: 378,
  pendingAttempts: 72,
  highRiskAttempts: 46,
  doubleEvaluationRequired: 54,
  doubleEvaluationCompleted: 48,
  moderationCasesOpen: 8,
  moderationCasesResolved: 20,
  calibrationAssigned: 32,
  calibrationCompleted: 29,
};

export const MOCK_EVALUATORS_CONSISTENCY: EvaluatorConsistencyData[] = [
  {
    evaluatorId: "usr-ex-01",
    evaluatorName: "Dr. Arvind Sharma",
    subject: "Engineering Mathematics III",
    totalAttemptsEvaluated: 142,
    meanAwardedMarks: 4.85,
    medianAwardedMarks: 5.0,
    meanMaxMarks: 7.0,
    aiOverrideRate: 16.2,
    aiAcceptanceRate: 83.8,
    criterionOverrideFrequency: 24,
    secondEvalDisagreementCount: 3,
    moderationReferralCount: 2,
    medianAbsoluteDeviationFromCalibration: 0.35,
    calibrationCriteriaAgreementRate: 88.5,
  },
  {
    evaluatorId: "usr-ex-02",
    evaluatorName: "Prof. Sunita Rao",
    subject: "Engineering Mathematics III",
    totalAttemptsEvaluated: 118,
    meanAwardedMarks: 4.40,
    medianAwardedMarks: 4.5,
    meanMaxMarks: 7.0,
    aiOverrideRate: 22.0,
    aiAcceptanceRate: 78.0,
    criterionOverrideFrequency: 31,
    secondEvalDisagreementCount: 4,
    moderationReferralCount: 3,
    medianAbsoluteDeviationFromCalibration: 0.50,
    calibrationCriteriaAgreementRate: 82.0,
  },
  {
    evaluatorId: "usr-ex-03",
    evaluatorName: "Er. Rajesh Kulkarni",
    subject: "Thermodynamics & Fluid Mechanics",
    totalAttemptsEvaluated: 118,
    meanAwardedMarks: 5.10,
    medianAwardedMarks: 5.0,
    meanMaxMarks: 7.0,
    aiOverrideRate: 14.4,
    aiAcceptanceRate: 85.6,
    criterionOverrideFrequency: 18,
    secondEvalDisagreementCount: 2,
    moderationReferralCount: 1,
    medianAbsoluteDeviationFromCalibration: 0.40,
    calibrationCriteriaAgreementRate: 86.0,
  },
];

export const MOCK_DRIFT_OBSERVATIONS: DriftObservationData[] = [
  {
    id: "drift-01",
    evaluatorId: "usr-ex-01",
    evaluatorName: "Dr. Arvind Sharma",
    examTitle: "B.Tech Semester Examination 2025-26",
    subjectName: "Engineering Mathematics III",
    signalType: "MARK_DISTRIBUTION_SHIFT",
    severity: "MODERATE",
    status: "DETECTED",
    sampleSize: 42,
    minSampleSize: 20,
    windowStart: "2026-01-10",
    windowEnd: "2026-01-15",
    baselineMetric: 4.1,
    currentMetric: 4.9,
    delta: 0.8,
    descriptiveExplanation: "Observed awarded mean shifted from 4.1 to 4.9 marks (+0.8 marks delta over 42 attempts).",
  },
  {
    id: "drift-02",
    evaluatorId: "usr-ex-02",
    evaluatorName: "Prof. Sunita Rao",
    examTitle: "B.Tech Semester Examination 2025-26",
    subjectName: "Engineering Mathematics III",
    signalType: "OVERRIDE_RATE_SHIFT",
    severity: "SIGNIFICANT",
    status: "DETECTED",
    sampleSize: 38,
    minSampleSize: 20,
    windowStart: "2026-01-11",
    windowEnd: "2026-01-15",
    baselineMetric: 12.0,
    currentMetric: 28.5,
    delta: 16.5,
    descriptiveExplanation: "AI override frequency changed from 12.0% to 28.5% (+16.5% shift across last 38 evaluations).",
  },
  {
    id: "drift-03",
    evaluatorId: "usr-ex-04",
    evaluatorName: "Dr. Neha Saxena",
    examTitle: "B.Tech Semester Examination 2025-26",
    subjectName: "Data Structures & Algorithms",
    signalType: "MARK_DISTRIBUTION_SHIFT",
    severity: "INFO",
    status: "INSUFFICIENT_DATA",
    sampleSize: 9,
    minSampleSize: 20,
    windowStart: "2026-01-14",
    windowEnd: "2026-01-15",
    baselineMetric: 4.5,
    currentMetric: 4.8,
    delta: 0.3,
    descriptiveExplanation: "Sample size (9 observations) is below minimum threshold (20 required). No trend inferred.",
  },
];
