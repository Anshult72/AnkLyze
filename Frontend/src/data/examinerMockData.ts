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
    scriptId: "SCRIPT A-10492",
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
    scriptId: "SCRIPT A-10493",
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
    scriptId: "SCRIPT A-10494",
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
    scriptId: "SCRIPT A-10495",
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
    scriptId: "SCRIPT A-10496",
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
    scriptId: "SCRIPT A-10497",
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
    scriptId: "SCRIPT A-10498",
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
    scriptId: "SCRIPT A-10499",
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
    scriptId: "SCRIPT A-10494",
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
    scriptId: "SCRIPT A-10493",
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
    scriptId: "SCRIPT A-10497",
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
    scriptId: "SCRIPT A-10488",
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
  averageTimeContext: "Moving average across today's evaluated scripts",
  estimatedRemainingWorkload: "~2h 50m",
  targetDeadline: "17:00 IST (Shift End)",
  isBenchmarkDemo: true,
};

export const RECENT_ACTIVITY_DATA: RecentActivityItem[] = [
  {
    id: "act-1",
    time: "08:42",
    title: "Script A-10491 submitted",
    detail: "Total 56/70 recorded • All 12 questions verified",
    category: "submission",
    scriptRef: "SCRIPT A-10491",
  },
  {
    id: "act-2",
    time: "08:39",
    title: "Q7 marked for review",
    detail: "Script A-10493 flagged for step-score moderation",
    category: "review",
    scriptRef: "SCRIPT A-10493",
  },
  {
    id: "act-3",
    time: "08:35",
    title: "Script A-10490 completed",
    detail: "Total 61/70 finalized by Dr. Sharma",
    category: "completion",
    scriptRef: "SCRIPT A-10490",
  },
  {
    id: "act-4",
    time: "08:28",
    title: "AI flagged Q4 for low confidence",
    detail: "Script A-10494 moved to Attention queue",
    category: "flag",
    scriptRef: "SCRIPT A-10494",
  },
  {
    id: "act-5",
    time: "08:15",
    title: "Evaluation session resumed",
    detail: "Batch B-03 active • Terminal Station 04 verified",
    category: "session",
  },
];
