export interface ExaminerContext {
  greeting: string;
  examinerName: string;
  examinerId: string;
  department: string;
  institution: string;
  examination: string;
  subject: string;
  subjectCode: string;
  evaluationCenter: string;
  session: string;
  currentBatch: string;
  nextPendingScriptId: string;
}

export interface WorkSummaryMetrics {
  assignedScripts: number;
  completed: number;
  pending: number;
  needsReview: number;
  lastUpdated: string;
}

export type ScriptStatus = "AI Ready" | "Needs Review" | "Attention" | "Completed";
export type RiskLevel = "Low Risk" | "Medium Risk" | "High Risk" | "Low" | "Medium" | "High";

export interface EvaluationQueueScript {
  id: string;
  scriptId: string;
  totalAnswers: number;
  detectedAnswers: number;
  status: ScriptStatus;
  riskLevel: RiskLevel;
  actionLabel: "Evaluate →" | "Review →";
  confidenceScore: number;
  updatedAt: string;
  priorityNote?: string;
}

export interface AttentionItem {
  id: string;
  questionNumber: string;
  scriptId: string;
  issueTitle: string;
  issueDetail: string;
  supportingInfo: string;
  severity: "High" | "Medium" | "Low";
  actionText?: string;
  pageNumber?: number;
  timestamp?: string;
  reason?: string;
  recommendedAction?: string;
  delta?: string;
}

export interface ProgressMetrics {
  completedScripts: number;
  totalAssigned: number;
  percentage: number;
  averageTimePerScript: string;
  averageTimeContext: string;
  estimatedRemainingWorkload: string;
  targetDeadline: string;
  isBenchmarkDemo: boolean;
  totalEvaluationTimeToday?: string;
}

export interface RecentActivityItem {
  id: string;
  time?: string;
  title?: string;
  detail?: string;
  category: "submission" | "review" | "completion" | "flag" | "session";
  scriptRef?: string;
  description?: string;
  scriptId?: string;
  timestamp?: string;
  href?: string;
}

export interface MarkDistributionBucket {
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
  isMedianBucket?: boolean;
}

export interface MarkingOverviewData {
  averageMarks: number;
  medianMarks: number;
  highestMarks: number;
  lowestMarks: number;
  maxMarks: number;
  totalEvaluatedScripts: number;
  totalAssignedScripts: number;
  totalQuestionsEvaluated: number;
  markDistribution: MarkDistributionBucket[];
}

export interface QuestionMarkingSummary {
  questionNumber: string;
  topic: string;
  section: string;
  attempts: number;
  averageMarks: number;
  maxMarks: number;
  needsReview: number;
  primaryAttentionReason?: string;
  flagSeverity?: "low" | "medium" | "high";
  reviewUrl: string;
}

export interface AttentionReasonItem {
  reason: string;
  count: number;
  percentage: number;
  category: "Confidence" | "Disagreement" | "Vision/OCR" | "Legibility" | "Rubric";
}

export interface AttentionRiskReportData {
  highRiskCount: number;
  criticalRiskCount: number;
  secondEvaluationCount: number;
  moderationCount: number;
  flaggedEvaluationsCount: number;
  commonReasons: AttentionReasonItem[];
}

export interface AiVsExaminerWorkflowData {
  aiAcceptedCount: number;
  aiOverriddenCount: number;
  aiAcceptanceRate: number;
  criteriaChangedCount: number;
  sentForReviewCount: number;
  totalCompletedSheets: number;
}

export interface ExaminerReportsDataset {
  summary: WorkSummaryMetrics;
  markingOverview: MarkingOverviewData;
  questions: QuestionMarkingSummary[];
  attentionRisk: AttentionRiskReportData;
  workflow: AiVsExaminerWorkflowData;
  progress: ProgressMetrics;
  recentActivity: RecentActivityItem[];
}

export const EXAMINER_CONTEXT: ExaminerContext = {
  greeting: "Good Morning, Examiner",
  examinerName: "Prof. R. K. Sharma",
  examinerId: "EX-8042",
  department: "Department of Computer Science & Engineering",
  institution: "State Board of Technical Examinations, MP",
  examination: "B.Tech CSE • Semester III",
  subject: "Engineering Mathematics III",
  subjectCode: "CS-301",
  evaluationCenter: "MPOnline Evaluation Center #04, Bhopal",
  session: "Winter Session 2025-26",
  currentBatch: "Batch B-03 (Digital Scans)",
  nextPendingScriptId: "A-10492",
};

export const WORK_SUMMARY_DATA: WorkSummaryMetrics = {
  assignedScripts: 120,
  completed: 74,
  pending: 46,
  needsReview: 12,
  lastUpdated: "Today, 09:30 AM",
};

export const EVALUATION_QUEUE_DATA: EvaluationQueueScript[] = [
  {
    id: "script-10492",
    scriptId: "SHEET A-10492",
    totalAnswers: 12,
    detectedAnswers: 12,
    status: "AI Ready",
    riskLevel: "Low Risk",
    actionLabel: "Evaluate →",
    confidenceScore: 97,
    updatedAt: "08:45 AM",
  },
  {
    id: "script-10493",
    scriptId: "SHEET A-10493",
    totalAnswers: 12,
    detectedAnswers: 11,
    status: "Needs Review",
    riskLevel: "Medium Risk",
    actionLabel: "Review →",
    confidenceScore: 81,
    updatedAt: "08:41 AM",
    priorityNote: "Q07 step-mark divergence",
  },
  {
    id: "script-10494",
    scriptId: "SHEET A-10494",
    totalAnswers: 12,
    detectedAnswers: 10,
    status: "Attention",
    riskLevel: "High Risk",
    actionLabel: "Review →",
    confidenceScore: 68,
    updatedAt: "08:38 AM",
    priorityNote: "Q04 handwriting illegible",
  },
  {
    id: "script-10495",
    scriptId: "SHEET A-10495",
    totalAnswers: 12,
    detectedAnswers: 12,
    status: "AI Ready",
    riskLevel: "Low Risk",
    actionLabel: "Evaluate →",
    confidenceScore: 95,
    updatedAt: "08:30 AM",
  },
  {
    id: "script-10496",
    scriptId: "SHEET A-10496",
    totalAnswers: 12,
    detectedAnswers: 12,
    status: "AI Ready",
    riskLevel: "Low Risk",
    actionLabel: "Evaluate →",
    confidenceScore: 94,
    updatedAt: "08:24 AM",
  },
  {
    id: "script-10497",
    scriptId: "SHEET A-10497",
    totalAnswers: 12,
    detectedAnswers: 9,
    status: "Needs Review",
    riskLevel: "Medium Risk",
    actionLabel: "Review →",
    confidenceScore: 78,
    updatedAt: "08:18 AM",
    priorityNote: "Q09 dual attempt in Section II",
  },
  {
    id: "script-10498",
    scriptId: "SHEET A-10498",
    totalAnswers: 12,
    detectedAnswers: 12,
    status: "AI Ready",
    riskLevel: "Low Risk",
    actionLabel: "Evaluate →",
    confidenceScore: 98,
    updatedAt: "08:10 AM",
  },
  {
    id: "script-10499",
    scriptId: "SHEET A-10499",
    totalAnswers: 12,
    detectedAnswers: 11,
    status: "Needs Review",
    riskLevel: "Medium Risk",
    actionLabel: "Review →",
    confidenceScore: 83,
    updatedAt: "08:02 AM",
  },
];

export const ATTENTION_ITEMS_DATA: AttentionItem[] = [
  {
    id: "att-1",
    questionNumber: "Q04",
    scriptId: "SHEET A-10494",
    issueTitle: "Low AI confidence",
    issueDetail: "Handwriting partially unclear",
    supportingInfo: "54% confidence",
    severity: "High",
    actionText: "Review",
    pageNumber: 4,
    timestamp: "08:28",
  },
  {
    id: "att-2",
    questionNumber: "Q07",
    scriptId: "SHEET A-10493",
    issueTitle: "AI / Examiner disagreement",
    issueDetail: "Discrepancy in formula derivation step score",
    supportingInfo: "AI suggested 6 • Current mark 3",
    severity: "Medium",
    actionText: "Review",
    pageNumber: 7,
    timestamp: "08:39",
  },
  {
    id: "att-3",
    questionNumber: "Q09",
    scriptId: "SHEET A-10497",
    issueTitle: "Unusual response pattern",
    issueDetail: "Candidate attempted both optional sub-questions in Section B",
    supportingInfo: "Review recommended",
    severity: "Medium",
    actionText: "Review",
    pageNumber: 9,
    timestamp: "08:18",
  },
  {
    id: "att-4",
    questionNumber: "Q12",
    scriptId: "SHEET A-10488",
    issueTitle: "Blank scan threshold variance",
    issueDetail: "Page 14 marked blank by scanner but faint margin notes detected",
    supportingInfo: "Verification required before final moderation",
    severity: "High",
    actionText: "Review",
    pageNumber: 14,
    timestamp: "07:55",
  },
];

export const PROGRESS_METRICS_DATA: ProgressMetrics = {
  completedScripts: 74,
  totalAssigned: 120,
  percentage: 62,
  averageTimePerScript: "3m 42s",
  averageTimeContext: "Moving average across today's evaluated sheets",
  estimatedRemainingWorkload: "~2h 50m",
  targetDeadline: "17:00 IST (Shift End)",
  isBenchmarkDemo: true,
  totalEvaluationTimeToday: "4h 34m",
};

export const RECENT_ACTIVITY_DATA: RecentActivityItem[] = [
  {
    id: "act-1",
    time: "08:42",
    title: "Sheet A-10491 submitted",
    detail: "Total 56/70 recorded • All 12 questions verified",
    category: "submission",
    scriptRef: "SHEET A-10491",
    href: "/examiner/evaluations",
  },
  {
    id: "act-2",
    time: "08:39",
    title: "Q7 marked for review",
    detail: "Sheet A-10493 flagged for step-score moderation",
    category: "review",
    scriptRef: "SHEET A-10493",
    href: "/examiner/evaluate/A-10493",
  },
  {
    id: "act-3",
    time: "08:35",
    title: "Sheet A-10490 completed",
    detail: "Total 61/70 finalized by Dr. Sharma",
    category: "completion",
    scriptRef: "SHEET A-10490",
    href: "/examiner/evaluations",
  },
  {
    id: "act-4",
    time: "08:28",
    title: "AI flagged Q4 for low confidence",
    detail: "Sheet A-10494 moved to Attention queue",
    category: "flag",
    scriptRef: "SHEET A-10494",
    href: "/examiner/evaluate/A-10494",
  },
  {
    id: "act-5",
    time: "08:15",
    title: "Evaluation session resumed",
    detail: "Batch B-03 active • Terminal Station 04 verified",
    category: "session",
    href: "/examiner/dashboard",
  },
];

export const MARKING_OVERVIEW_DATA: MarkingOverviewData = {
  averageMarks: 56.8,
  medianMarks: 58.0,
  highestMarks: 68.0,
  lowestMarks: 31.0,
  maxMarks: 70.0,
  totalEvaluatedScripts: 74,
  totalAssignedScripts: 120,
  totalQuestionsEvaluated: 888, // 74 completed sheets * 12 questions
  markDistribution: [
    { range: "0–20", min: 0, max: 20, count: 0, percentage: 0 },
    { range: "21–30", min: 21, max: 30, count: 0, percentage: 0 },
    { range: "31–40", min: 31, max: 40, count: 6, percentage: 8.1 },
    { range: "41–50", min: 41, max: 50, count: 14, percentage: 18.9 },
    { range: "51–60", min: 51, max: 60, count: 38, percentage: 51.4, isMedianBucket: true },
    { range: "61–70", min: 61, max: 70, count: 16, percentage: 21.6 },
  ],
};

export const QUESTION_WISE_MARKING_DATA: QuestionMarkingSummary[] = [
  {
    questionNumber: "Q01",
    topic: "Polar Cauchy-Riemann Equations",
    section: "Section A",
    attempts: 74,
    averageMarks: 3.4,
    maxMarks: 4,
    needsReview: 1,
    primaryAttentionReason: "Notation clarity",
    flagSeverity: "low",
    reviewUrl: "/examiner/review",
  },
  {
    questionNumber: "Q02",
    topic: "Cauchy's Integral Formula",
    section: "Section A",
    attempts: 74,
    averageMarks: 3.6,
    maxMarks: 4,
    needsReview: 2,
    primaryAttentionReason: "Contour singularity",
    flagSeverity: "low",
    reviewUrl: "/examiner/review",
  },
  {
    questionNumber: "Q03",
    topic: "Taylor Series Expansion & Convergence",
    section: "Section B",
    attempts: 74,
    averageMarks: 4.6,
    maxMarks: 6,
    needsReview: 3,
    primaryAttentionReason: "Radius of convergence",
    flagSeverity: "medium",
    reviewUrl: "/examiner/review",
  },
  {
    questionNumber: "Q04",
    topic: "Fourier Heat Conduction Formulation",
    section: "Section B",
    attempts: 74,
    averageMarks: 4.8,
    maxMarks: 7,
    needsReview: 9,
    primaryAttentionReason: "Low AI confidence • Illegible step",
    flagSeverity: "high",
    reviewUrl: "/examiner/evaluate/A-10494",
  },
  {
    questionNumber: "Q05",
    topic: "Laplace Equation in Polar Coordinates",
    section: "Section B",
    attempts: 73,
    averageMarks: 5.1,
    maxMarks: 7,
    needsReview: 2,
    primaryAttentionReason: "Boundary condition proof",
    flagSeverity: "low",
    reviewUrl: "/examiner/review",
  },
  {
    questionNumber: "Q06",
    topic: "Residue Theorem & Pole Evaluation",
    section: "Section B",
    attempts: 74,
    averageMarks: 4.9,
    maxMarks: 6,
    needsReview: 1,
    primaryAttentionReason: "Sum of residues sign error",
    flagSeverity: "low",
    reviewUrl: "/examiner/review",
  },
  {
    questionNumber: "Q07",
    topic: "Complex Boundary Integral Step Proof",
    section: "Section C",
    attempts: 72,
    averageMarks: 4.2,
    maxMarks: 7,
    needsReview: 8,
    primaryAttentionReason: "Step-score divergence",
    flagSeverity: "high",
    reviewUrl: "/examiner/evaluate/A-10493",
  },
  {
    questionNumber: "Q08",
    topic: "Wave Equation Separation of Variables",
    section: "Section C",
    attempts: 74,
    averageMarks: 5.4,
    maxMarks: 7,
    needsReview: 2,
    primaryAttentionReason: "Eigenvalue orthogonality",
    flagSeverity: "low",
    reviewUrl: "/examiner/review",
  },
  {
    questionNumber: "Q09",
    topic: "Optional Alternative • Dual Method",
    section: "Section B",
    attempts: 71,
    averageMarks: 4.5,
    maxMarks: 6,
    needsReview: 6,
    primaryAttentionReason: "Dual attempt detected",
    flagSeverity: "medium",
    reviewUrl: "/examiner/evaluate/A-10497",
  },
  {
    questionNumber: "Q10",
    topic: "Green's Theorem Planar Contour",
    section: "Section C",
    attempts: 74,
    averageMarks: 4.1,
    maxMarks: 5,
    needsReview: 1,
    primaryAttentionReason: "Orientation sign error",
    flagSeverity: "low",
    reviewUrl: "/examiner/review",
  },
  {
    questionNumber: "Q11",
    topic: "Fourier Transform Symmetry Properties",
    section: "Section C",
    attempts: 73,
    averageMarks: 4.7,
    maxMarks: 6,
    needsReview: 3,
    primaryAttentionReason: "Kernel integral limits",
    flagSeverity: "medium",
    reviewUrl: "/examiner/review",
  },
  {
    questionNumber: "Q12",
    topic: "Conformal Mapping & Bilinear Transf.",
    section: "Section C",
    attempts: 70,
    averageMarks: 3.8,
    maxMarks: 5,
    needsReview: 4,
    primaryAttentionReason: "Blank scan threshold variance",
    flagSeverity: "medium",
    reviewUrl: "/examiner/review",
  },
];

export const ATTENTION_RISK_REPORT_DATA: AttentionRiskReportData = {
  highRiskCount: 7,
  criticalRiskCount: 3,
  secondEvaluationCount: 4,
  moderationCount: 2,
  flaggedEvaluationsCount: 12, // Matches WORK_SUMMARY_DATA.needsReview
  commonReasons: [
    { reason: "Low AI confidence", count: 6, percentage: 35, category: "Confidence" },
    { reason: "AI–examiner disagreement", count: 4, percentage: 24, category: "Disagreement" },
    { reason: "Reconstruction uncertainty", count: 3, percentage: 18, category: "Vision/OCR" },
    { reason: "Handwriting illegibility", count: 2, percentage: 12, category: "Legibility" },
    { reason: "Rubric ambiguity / Dual attempt", count: 2, percentage: 12, category: "Rubric" },
  ],
};

export const AI_VS_EXAMINER_WORKFLOW_DATA: AiVsExaminerWorkflowData = {
  aiAcceptedCount: 61,
  aiOverriddenCount: 13,
  aiAcceptanceRate: 82.4, // (61 / 74) * 100
  criteriaChangedCount: 24,
  sentForReviewCount: 8,
  totalCompletedSheets: 74, // 61 + 13 = 74
};

export const EXAMINER_REPORTS_DATA: ExaminerReportsDataset = {
  summary: WORK_SUMMARY_DATA,
  markingOverview: MARKING_OVERVIEW_DATA,
  questions: QUESTION_WISE_MARKING_DATA,
  attentionRisk: ATTENTION_RISK_REPORT_DATA,
  workflow: AI_VS_EXAMINER_WORKFLOW_DATA,
  progress: PROGRESS_METRICS_DATA,
  recentActivity: RECENT_ACTIVITY_DATA,
};

// The desk uses the same queue, review, workflow, and batch records as the
// corresponding pages. Only the session-specific "today" counts are sampled.
export const EXAMINER_TODAY_DATA = {
  completedToday: 18,
  completedSinceLastSession: 12,
  isSample: true,
} as const;

export const getSheetCode = (reference: string) =>
  reference.replace(/^(?:SCRIPT|SHEET)\s+/i, "").trim();

export function getExaminerDashboardModel({
  context = EXAMINER_CONTEXT,
  summary = WORK_SUMMARY_DATA,
  queue = EVALUATION_QUEUE_DATA,
  attention = ATTENTION_ITEMS_DATA,
  activity = RECENT_ACTIVITY_DATA,
  today = EXAMINER_TODAY_DATA,
}: {
  context?: ExaminerContext;
  summary?: WorkSummaryMetrics;
  queue?: EvaluationQueueScript[];
  attention?: AttentionItem[];
  activity?: RecentActivityItem[];
  today?: { completedToday: number; completedSinceLastSession: number; isSample: boolean };
} = {}) {
  const pending = Math.max(0, summary.assignedScripts - summary.completed);
  const completion = summary.assignedScripts > 0
    ? Math.round((summary.completed / summary.assignedScripts) * 100)
    : 0;
  const next = queue.find((sheet) => getSheetCode(sheet.scriptId) === context.nextPendingScriptId)
    ?? queue.find((sheet) => sheet.status === "AI Ready")
    ?? queue[0]
    ?? null;
  const queuePreview = next
    ? [next, ...queue.filter((sheet) => sheet.id !== next.id)].slice(0, 4)
    : [];
  const availableCodes = new Set(queue.map((sheet) => getSheetCode(sheet.scriptId)));
  const attentionPreview = [...attention]
    .sort((a, b) => Number(b.severity === "High") - Number(a.severity === "High"))
    .slice(0, 3)
    .map((item) => ({
      ...item,
      href: availableCodes.has(getSheetCode(item.scriptId))
        ? `/examiner/evaluate/${getSheetCode(item.scriptId)}`
        : "/examiner/review",
    }));
  const recentActivity = activity.slice(0, 4).map((event) => ({
    ...event,
    href: event.href?.startsWith("/examiner/evaluate/")
      && availableCodes.has(event.href.split("/").at(-1) ?? "")
      ? event.href
      : undefined,
  }));

  return {
    next,
    pending,
    completion,
    openReviewCount: attention.length,
    highPriorityCount: attention.filter((item) => item.severity === "High").length,
    queuePreview,
    attentionPreview,
    recentActivity,
    today: {
      completedToday: Math.min(today.completedToday, summary.completed),
      completedSinceLastSession: Math.min(today.completedSinceLastSession, today.completedToday, summary.completed),
      isSample: today.isSample,
    },
    workflow: AI_VS_EXAMINER_WORKFLOW_DATA,
    averageTimePerSheet: PROGRESS_METRICS_DATA.averageTimePerScript,
    estimatedRemainingWorkload: PROGRESS_METRICS_DATA.estimatedRemainingWorkload,
  };
}
