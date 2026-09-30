export interface ModerationCaseSummary {
  id: string;
  caseNumber: string;
  scriptId: string;
  questionNumber: string;
  subject: string;
  subjectCode: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "ASSIGNED" | "IN_REVIEW" | "RESOLVED" | "ESCALATED";
  triggerReason: string;
  triggerDetail: string;
  overallRiskScore: number;
  riskBand: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  round1Marks: number;
  round2Marks: number;
  maxMarks: number;
  aiSuggestedMarks: number;
  markDelta: number;
  normalizedDelta: number;
  assignedModerator?: string;
  createdAt: string;
}

export const MODERATION_SUMMARY_METRICS = {
  totalCases: 28,
  activeBacklog: 8,
  criticalCount: 3,
  highCount: 5,
  inReviewCount: 2,
  resolvedCount: 20,
};

export const MOCK_MODERATION_CASES: ModerationCaseSummary[] = [
  {
    id: "case-01",
    caseNumber: "MOD-2026-0001",
    scriptId: "A-10492",
    questionNumber: "Q04",
    subject: "Engineering Mathematics III",
    subjectCode: "CS-301",
    priority: "CRITICAL",
    status: "OPEN",
    triggerReason: "DOUBLE_EVALUATION_DISAGREEMENT",
    triggerDetail: "Round 1 (5.0/7) and Round 2 (3.5/7) diverged by 1.5 marks (21.4%). Requires senior examiner resolution.",
    overallRiskScore: 68,
    riskBand: "HIGH",
    round1Marks: 5.0,
    round2Marks: 3.5,
    maxMarks: 7.0,
    aiSuggestedMarks: 5.0,
    markDelta: 1.5,
    normalizedDelta: 0.214,
    assignedModerator: undefined,
    createdAt: "2026-01-15T09:30:00Z",
  },
  {
    id: "case-02",
    caseNumber: "MOD-2026-0002",
    scriptId: "A-10495",
    questionNumber: "Q09",
    subject: "Engineering Mathematics III",
    subjectCode: "CS-301",
    priority: "CRITICAL",
    status: "IN_REVIEW",
    triggerReason: "CRITICAL_RISK",
    triggerDetail: "Candidate attempted both Section II optional alternatives (dual attempt). Risk score 84.",
    overallRiskScore: 84,
    riskBand: "CRITICAL",
    round1Marks: 5.5,
    round2Marks: 4.0,
    maxMarks: 8.0,
    aiSuggestedMarks: 5.5,
    markDelta: 1.5,
    normalizedDelta: 0.187,
    assignedModerator: "Dr. Anita Verma (Moderator)",
    createdAt: "2026-01-15T08:15:00Z",
  },
  {
    id: "case-03",
    caseNumber: "MOD-2026-0003",
    scriptId: "A-10498",
    questionNumber: "Q07",
    subject: "Engineering Mathematics III",
    subjectCode: "CS-301",
    priority: "HIGH",
    status: "ASSIGNED",
    triggerReason: "MANUAL_EXAMINER_FLAG",
    triggerDetail: "Examiner flagged for partial credit verification on complex boundary integral proof.",
    overallRiskScore: 58,
    riskBand: "HIGH",
    round1Marks: 6.0,
    round2Marks: 6.0,
    maxMarks: 8.0,
    aiSuggestedMarks: 6.0,
    markDelta: 0.0,
    normalizedDelta: 0.0,
    assignedModerator: "Prof. M. Joshi (Head Examiner)",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "case-04",
    caseNumber: "MOD-2026-0004",
    scriptId: "A-10502",
    questionNumber: "Q02",
    subject: "Engineering Mathematics III",
    subjectCode: "CS-301",
    priority: "HIGH",
    status: "OPEN",
    triggerReason: "AI_HUMAN_LARGE_DISAGREEMENT",
    triggerDetail: "AI scored 2.0/4 but examiner awarded 4.0/4 (+50% delta) due to alternate trigonometric method.",
    overallRiskScore: 52,
    riskBand: "HIGH",
    round1Marks: 4.0,
    round2Marks: 4.0,
    maxMarks: 4.0,
    aiSuggestedMarks: 2.0,
    markDelta: 2.0,
    normalizedDelta: 0.50,
    assignedModerator: undefined,
    createdAt: "2026-01-15T11:20:00Z",
  },
  {
    id: "case-05",
    caseNumber: "MOD-2026-0005",
    scriptId: "A-10490",
    questionNumber: "Q03",
    subject: "Engineering Mathematics III",
    subjectCode: "CS-301",
    priority: "MEDIUM",
    status: "RESOLVED",
    triggerReason: "MEDIUM_RISK_VARIANCE",
    triggerDetail: "Minor notation ambiguity on Laurent series radius of convergence.",
    overallRiskScore: 32,
    riskBand: "MEDIUM",
    round1Marks: 4.5,
    round2Marks: 4.5,
    maxMarks: 6.0,
    aiSuggestedMarks: 4.5,
    markDelta: 0.0,
    normalizedDelta: 0.0,
    assignedModerator: "Dr. Anita Verma",
    createdAt: "2026-01-14T14:00:00Z",
  },
];
