/**
 * ANKLYZE — Role-Specific Dashboard Data Models
 * "Analyse the marks, not just the paper."
 * "AI suggests, examiner decides."
 * 
 * Provides coherent, deterministic, and internally consistent operational
 * datasets for:
 * 1. EXAMINER (Work Cockpit — "What should I evaluate now?")
 * 2. HEAD EXAMINER (Institutional Oversight — "What needs oversight?")
 * 3. SUPER ADMIN (Platform Operations — "What is happening across ANKLYZE?")
 */

// ============================================================================
// 1. HEAD EXAMINER DATA MODEL
// ============================================================================

export interface HeadExaminerOversightItem {
  id: string;
  title: string;
  detail: string;
  severity: "Critical" | "High" | "Standard";
  category: "Moderation" | "Risk" | "Second Evaluation" | "Disagreement";
  href: string;
  actionText: string;
}

export interface HeadExaminerDashboardData {
  session: string;
  subjectCode: string;
  subject: string;
  examination: string;
  summary: {
    assignedScripts: number;
    evaluated: number;
    pending: number;
    needsModeration: number;
    completionRate: number;
  };
  oversight: {
    moderationCasesCount: number;
    criticalRiskCount: number;
    secondEvaluationsPendingCount: number;
    unresolvedDisagreementsCount: number;
    items: HeadExaminerOversightItem[];
  };
  moderationSummary: {
    open: number;
    inReview: number;
    resolvedToday: number;
    oldestUnresolvedMinutes: number;
  };
  resultReadiness: {
    evaluationCoverage: number;
    questionsAwaitingFinalDecision: number;
    validationBlockers: number;
    status: "In Progress" | "Validation Blocked" | "Ready for Sign-off";
  };
  recentActivity: Array<{
    id: string;
    time: string;
    title: string;
    detail: string;
    href?: string;
  }>;
}

export const HEAD_EXAMINER_DASHBOARD_DATA: HeadExaminerDashboardData = {
  session: "WINTER SESSION 2025–26",
  subjectCode: "CS-301",
  subject: "Engineering Mathematics III",
  examination: "B.Tech CSE · Semester III",
  summary: {
    assignedScripts: 120,
    evaluated: 92,
    pending: 28,
    needsModeration: 6,
    completionRate: 77,
  },
  oversight: {
    moderationCasesCount: 6,
    criticalRiskCount: 3,
    secondEvaluationsPendingCount: 4,
    unresolvedDisagreementsCount: 2,
    items: [
      {
        id: "ov-mod-1",
        title: "Disagreement on Sheet A-10493 · Q07",
        detail: "Round 1 awarded 6.0 / 10 vs Round 2 awarded 3.0 / 10. AI suggested 7.0. Delta 3.0 marks requires Head Examiner resolution.",
        severity: "Critical",
        category: "Moderation",
        href: "/moderation",
        actionText: "Resolve dispute",
      },
      {
        id: "ov-risk-1",
        title: "High Variance Risk on Sheet A-10496 · Q03",
        detail: "Reconstruction continuation uncertainty detected across pages 3–4 with examiner overriding 2 of 4 rubric criteria.",
        severity: "High",
        category: "Risk",
        href: "/moderation",
        actionText: "Inspect risk factors",
      },
      {
        id: "ov-round2-1",
        title: "4 Second Evaluations Pending Completion",
        detail: "Blind independent evaluations allocated to Dr. Singh and Prof. Patel awaiting examiner mark submission.",
        severity: "Standard",
        category: "Second Evaluation",
        href: "/examiner/review",
        actionText: "Inspect allocation",
      },
      {
        id: "ov-disagree-1",
        title: "Unresolved Multi-Step Rubric Variance · Q04",
        detail: "Phasor derivation step awarded full credit without boundary statement verification under Criterion C2.",
        severity: "High",
        category: "Disagreement",
        href: "/moderation",
        actionText: "Open case M-105",
      },
    ],
  },
  moderationSummary: {
    open: 6,
    inReview: 2,
    resolvedToday: 4,
    oldestUnresolvedMinutes: 18,
  },
  resultReadiness: {
    evaluationCoverage: 84,
    questionsAwaitingFinalDecision: 18,
    validationBlockers: 2,
    status: "Validation Blocked",
  },
  recentActivity: [
    {
      id: "he-act-1",
      time: "09:14",
      title: "Q07 disagreement escalated to Head Examiner",
      detail: "Sheet A-10493 · Round 2 examiner disagreed with original 6.0 mark; routed to institutional moderation.",
      href: "/moderation",
    },
    {
      id: "he-act-2",
      time: "09:08",
      title: "Moderation case M-104 resolved",
      detail: "Head Examiner confirmed authoritative score of 5.5 / 7.0 for Sheet A-10488 · Q05.",
      href: "/moderation",
    },
    {
      id: "he-act-3",
      time: "08:58",
      title: "Second evaluation completed for A-10501 · Q04",
      detail: "Independent evaluator submitted 7.0 marks; comparison unblinded with mutual agreement confirmed.",
      href: "/examiner/review",
    },
    {
      id: "he-act-4",
      time: "08:44",
      title: "Result validation blocked on Q04",
      detail: "Sheet A-10494 requires legible diagram verification before batch sign-off.",
      href: "/admin/results",
    },
    {
      id: "he-act-5",
      time: "08:30",
      title: "Independent evaluation assigned to Dr. Singh",
      detail: "Workload-balanced allocation applied for variance >= 3.0 threshold.",
      href: "/examiner/review",
    },
  ],
};

// ============================================================================
// 2. SUPER ADMIN DATA MODEL
// ============================================================================

export interface SuperAdminDashboardData {
  session: string;
  organization: string;
  summary: {
    activeExams: number;
    activeSubjects: number;
    scriptsIngested: number;
    evaluations: number;
  };
  operations: {
    scriptsProcessing: number;
    ocrPending: number;
    evaluationsPending: number;
    moderationCases: number;
    activeExaminersOnline: number;
    centersActive: number;
  };
  results: {
    readyForValidation: number;
    validationBlocked: number;
    approvedResults: number;
    revaluationRequests: number;
  };
  systemStatus: {
    api: { status: "Operational"; detail: "REST endpoints healthy • 38ms avg" };
    database: { status: "Operational"; detail: "PostgreSQL & Prisma pool active" };
    storage: { status: "Configured"; detail: "Local digital scan vault connected" };
    aiProvider: { status: "Configured"; detail: "Gemini Vision Multimodal ready" };
    realtime: { status: "Connected"; detail: "WebSocket event bus operational" };
  };
  recentActivity: Array<{
    id: string;
    time: string;
    title: string;
    detail: string;
    href?: string;
  }>;
}

export const SUPER_ADMIN_DASHBOARD_DATA: SuperAdminDashboardData = {
  session: "Winter Session 2025–26",
  organization: "ANKLYZE Central Examination Platform",
  summary: {
    activeExams: 4,
    activeSubjects: 18,
    scriptsIngested: 2480,
    evaluations: 1932,
  },
  operations: {
    scriptsProcessing: 42,
    ocrPending: 18,
    evaluationsPending: 548,
    moderationCases: 23,
    activeExaminersOnline: 34,
    centersActive: 6,
  },
  results: {
    readyForValidation: 3,
    validationBlocked: 1,
    approvedResults: 8,
    revaluationRequests: 5,
  },
  systemStatus: {
    api: { status: "Operational", detail: "REST endpoints healthy • 38ms avg" },
    database: { status: "Operational", detail: "PostgreSQL & Prisma pool active" },
    storage: { status: "Configured", detail: "Local digital scan vault connected" },
    aiProvider: { status: "Configured", detail: "Gemini Vision Multimodal ready" },
    realtime: { status: "Connected", detail: "WebSocket event bus operational" },
  },
  recentActivity: [
    {
      id: "sa-act-1",
      time: "09:22",
      title: "Cloud script intake batch processed",
      detail: "Batch B-04 ingested for CS-301 · 40 booklets split and OCR verified.",
      href: "/admin/scripts",
    },
    {
      id: "sa-act-2",
      time: "09:15",
      title: "Exam CS-301 activated for Winter Session 2025–26",
      detail: "Engineering Mathematics III rubric schema v2.1 committed.",
      href: "/admin/exams",
    },
    {
      id: "sa-act-3",
      time: "09:05",
      title: "Result validation completed for ME-204",
      detail: "Mechanical Engineering cohort finalized with 100% evaluation coverage.",
      href: "/admin/results",
    },
    {
      id: "sa-act-4",
      time: "08:50",
      title: "Moderation case M-104 resolved in CS-301",
      detail: "Final score authenticated by Head Examiner with full provenance recorded.",
      href: "/moderation",
    },
    {
      id: "sa-act-5",
      time: "08:40",
      title: "Revaluation request REV-2026-08 filed",
      detail: "Post-result publication review request queued for verification.",
      href: "/admin/results",
    },
  ],
};
