export interface ResultQuestionItem {
  id: string;
  questionAttemptId: string;
  questionNumber: string;
  section?: string;
  maximumMarks: number;
  awardedMarks: number;
  status: "AGGREGATED" | "MODERATED" | "REVALUATED" | "EXCLUDED";
  sourceDecisionId: string;
  sourceDecisionVersion: number;
  sourceExaminerName: string;
  sourceModerationDecisionId?: string;
  sourceModeratorName?: string;
  feedbackSnippet?: string;
}

export interface ResultValidationIssueItem {
  id: string;
  ruleCode: string;
  severity: "BLOCKING" | "WARNING" | "INFO";
  message: string;
  entityType?: string;
  entityId?: string;
  blocking: boolean;
  resolvedAt?: string;
  resolvedByName?: string;
}

export interface ResultHistoryItem {
  id: string;
  version: number;
  status: "DRAFT" | "VALIDATING" | "BLOCKED" | "VALIDATED" | "APPROVED" | "SUPERSEDED" | "REVALUATION_PENDING" | "REVALUATED";
  totalMarks: number;
  maximumMarks: number;
  percentage: number;
  resultCode: string;
  approvedAt?: string;
  approvedByName?: string;
  fingerprint: string;
  createdAt: string;
  supersedesResultId?: string;
  revaluationReason?: string;
}

export interface ResultDetailData {
  id: string;
  examId: string;
  examTitle: string;
  examCode: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  scriptId: string;
  candidateReference: string; // Anonymous e.g. "CAND-7890-CS301"
  version: number;
  status: "DRAFT" | "VALIDATING" | "BLOCKED" | "VALIDATED" | "APPROVED" | "SUPERSEDED" | "REVALUATION_PENDING" | "REVALUATED";
  validationStatus: "NOT_RUN" | "PASSED" | "WARNING" | "BLOCKED";
  totalMarks: number;
  maximumMarks: number;
  percentage: number;
  resultCode: string; // "DISTINCTION" | "FIRST_CLASS" | "PASS" | "FAIL"
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedById?: string;
  approvedByName?: string;
  supersedesResultId?: string;
  fingerprint: string;
  questions: ResultQuestionItem[];
  validationIssues: ResultValidationIssueItem[];
  history: ResultHistoryItem[];
  revaluation?: {
    id: string;
    scope: "FULL_RESULT_REVIEW" | "QUESTION_SPECIFIC_REVIEW";
    status: "REQUESTED" | "AUTHORIZED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
    reason: string;
    questionNumber?: string;
    requestedBy: string;
    requestedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    scoreDelta?: number;
    previousTotal?: number;
    newTotal?: number;
  };
}

export const MOCK_RESULTS_LIST: ResultDetailData[] = [
  {
    id: "res-01",
    examId: "exam-01",
    examTitle: "Winter 2026 End-Semester Examinations",
    examCode: "EXAM-2026-W",
    subjectId: "subj-01",
    subjectName: "Computer Architecture & Organization",
    subjectCode: "CS-301",
    scriptId: "A-10492",
    candidateReference: "CAND-9921-CS301",
    version: 2,
    status: "APPROVED",
    validationStatus: "PASSED",
    totalMarks: 65.0,
    maximumMarks: 100.0,
    percentage: 65.0,
    resultCode: "FIRST_CLASS",
    createdAt: "2026-01-20T11:45:00Z",
    updatedAt: "2026-01-20T14:30:00Z",
    approvedAt: "2026-01-20T14:30:00Z",
    approvedById: "usr-head-01",
    approvedByName: "Dr. Arvind Sharma (Head Examiner)",
    supersedesResultId: "res-01-v1",
    fingerprint: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    questions: [
      {
        id: "rqm-01",
        questionAttemptId: "att-01",
        questionNumber: "Q01",
        section: "Section A",
        maximumMarks: 10.0,
        awardedMarks: 8.5,
        status: "AGGREGATED",
        sourceDecisionId: "dec-101",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
        feedbackSnippet: "Accurate pipelining timing diagram with hazard detection.",
      },
      {
        id: "rqm-02",
        questionAttemptId: "att-02",
        questionNumber: "Q02",
        section: "Section A",
        maximumMarks: 15.0,
        awardedMarks: 12.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-102",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
        feedbackSnippet: "Cache mapping derivation completed correctly; minor offset slip.",
      },
      {
        id: "rqm-03",
        questionAttemptId: "att-03",
        questionNumber: "Q03",
        section: "Section B",
        maximumMarks: 10.0,
        awardedMarks: 7.0,
        status: "MODERATED",
        sourceDecisionId: "dec-103",
        sourceDecisionVersion: 2,
        sourceExaminerName: "Prof. R. Deshmukh",
        sourceModerationDecisionId: "mod-dec-501",
        sourceModeratorName: "Dr. K. S. Verma (Senior Moderator)",
        feedbackSnippet: "Moderation resolved double-evaluation delta from 5.5 to 7.0.",
      },
      {
        id: "rqm-04",
        questionAttemptId: "att-04",
        questionNumber: "Q04",
        section: "Section B",
        maximumMarks: 15.0,
        awardedMarks: 11.5,
        status: "REVALUATED",
        sourceDecisionId: "dec-104-rev",
        sourceDecisionVersion: 2,
        sourceExaminerName: "Prof. A. Nambiar (Revaluation Board)",
        feedbackSnippet: "Revaluation verified step 3 microcode sequence (+3.0 marks adjusted).",
      },
      {
        id: "rqm-05",
        questionAttemptId: "att-05",
        questionNumber: "Q05",
        section: "Section C",
        maximumMarks: 25.0,
        awardedMarks: 14.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-105",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
        feedbackSnippet: "Branch prediction buffer layout correctly explained.",
      },
      {
        id: "rqm-06",
        questionAttemptId: "att-06",
        questionNumber: "Q06",
        section: "Section C",
        maximumMarks: 25.0,
        awardedMarks: 12.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-106",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
        feedbackSnippet: "DMA transfer sequence diagram accurate.",
      },
    ],
    validationIssues: [],
    history: [
      {
        id: "res-01-v1",
        version: 1,
        status: "SUPERSEDED",
        totalMarks: 62.0,
        maximumMarks: 100.0,
        percentage: 62.0,
        resultCode: "FIRST_CLASS",
        approvedAt: "2026-01-16T10:15:00Z",
        approvedByName: "Dr. Arvind Sharma (Head Examiner)",
        fingerprint: "f4a8b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
        createdAt: "2026-01-16T09:30:00Z",
      },
      {
        id: "res-01-v2",
        version: 2,
        status: "APPROVED",
        totalMarks: 65.0,
        maximumMarks: 100.0,
        percentage: 65.0,
        resultCode: "FIRST_CLASS",
        approvedAt: "2026-01-20T14:30:00Z",
        approvedByName: "Dr. Arvind Sharma (Head Examiner)",
        fingerprint: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        createdAt: "2026-01-20T11:45:00Z",
        supersedesResultId: "res-01-v1",
        revaluationReason: "Candidate Q04 step 3 re-evaluated by Institutional Board.",
      },
    ],
    revaluation: {
      id: "rev-2026-0012",
      scope: "QUESTION_SPECIFIC_REVIEW",
      status: "COMPLETED",
      reason: "Candidate raised revaluation for Q04 step 3 microcode calculation.",
      questionNumber: "Q04",
      requestedBy: "Registrar Office / Institutional Admin",
      requestedAt: "2026-01-18T10:00:00Z",
      reviewedBy: "Dr. Arvind Sharma (Head Examiner)",
      reviewedAt: "2026-01-19T14:00:00Z",
      scoreDelta: 3.0,
      previousTotal: 62.0,
      newTotal: 65.0,
    },
  },
  {
    id: "res-02",
    examId: "exam-01",
    examTitle: "Winter 2026 End-Semester Examinations",
    examCode: "EXAM-2026-W",
    subjectId: "subj-01",
    subjectName: "Computer Architecture & Organization",
    subjectCode: "CS-301",
    scriptId: "A-10495",
    candidateReference: "CAND-9925-CS301",
    version: 1,
    status: "BLOCKED",
    validationStatus: "BLOCKED",
    totalMarks: 48.0,
    maximumMarks: 100.0,
    percentage: 48.0,
    resultCode: "PASS",
    createdAt: "2026-01-16T12:00:00Z",
    updatedAt: "2026-01-16T12:00:00Z",
    fingerprint: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    questions: [
      {
        id: "rqm-201",
        questionAttemptId: "att-201",
        questionNumber: "Q01",
        section: "Section A",
        maximumMarks: 10.0,
        awardedMarks: 7.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-201",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-202",
        questionAttemptId: "att-202",
        questionNumber: "Q02",
        section: "Section A",
        maximumMarks: 15.0,
        awardedMarks: 10.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-202",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-203",
        questionAttemptId: "att-203",
        questionNumber: "Q03",
        section: "Section B",
        maximumMarks: 10.0,
        awardedMarks: 0.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-203-pending",
        sourceDecisionVersion: 0,
        sourceExaminerName: "Pending Moderation",
      },
      {
        id: "rqm-204",
        questionAttemptId: "att-204",
        questionNumber: "Q04",
        section: "Section B",
        maximumMarks: 15.0,
        awardedMarks: 8.5,
        status: "AGGREGATED",
        sourceDecisionId: "dec-204",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-205",
        questionAttemptId: "att-205",
        questionNumber: "Q05",
        section: "Section C",
        maximumMarks: 25.0,
        awardedMarks: 12.5,
        status: "AGGREGATED",
        sourceDecisionId: "dec-205",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-206",
        questionAttemptId: "att-206",
        questionNumber: "Q06",
        section: "Section C",
        maximumMarks: 25.0,
        awardedMarks: 10.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-206",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
    ],
    validationIssues: [
      {
        id: "val-iss-01",
        ruleCode: "RESULT-MOD-001",
        severity: "BLOCKING",
        message: "Active unresolved moderation case exists for Question Q03 (Double evaluation disagreement: R1=4.0, R2=8.0).",
        entityType: "ModerationCase",
        entityId: "mod-case-02",
        blocking: true,
      },
      {
        id: "val-iss-02",
        ruleCode: "RESULT-PROV-001",
        severity: "BLOCKING",
        message: "Question Q03 lacks finalized authoritative source decision.",
        entityType: "QuestionAttempt",
        entityId: "att-203",
        blocking: true,
      },
    ],
    history: [
      {
        id: "res-02-v1",
        version: 1,
        status: "BLOCKED",
        totalMarks: 48.0,
        maximumMarks: 100.0,
        percentage: 48.0,
        resultCode: "PASS",
        fingerprint: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
        createdAt: "2026-01-16T12:00:00Z",
      },
    ],
  },
  {
    id: "res-03",
    examId: "exam-01",
    examTitle: "Winter 2026 End-Semester Examinations",
    examCode: "EXAM-2026-W",
    subjectId: "subj-01",
    subjectName: "Computer Architecture & Organization",
    subjectCode: "CS-301",
    scriptId: "A-10498",
    candidateReference: "CAND-9928-CS301",
    version: 1,
    status: "VALIDATED",
    validationStatus: "PASSED",
    totalMarks: 82.0,
    maximumMarks: 100.0,
    percentage: 82.0,
    resultCode: "DISTINCTION",
    createdAt: "2026-01-16T14:15:00Z",
    updatedAt: "2026-01-16T14:15:00Z",
    fingerprint: "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
    questions: [
      {
        id: "rqm-301",
        questionAttemptId: "att-301",
        questionNumber: "Q01",
        maximumMarks: 10.0,
        awardedMarks: 9.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-301",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-302",
        questionAttemptId: "att-302",
        questionNumber: "Q02",
        maximumMarks: 15.0,
        awardedMarks: 13.5,
        status: "AGGREGATED",
        sourceDecisionId: "dec-302",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-303",
        questionAttemptId: "att-303",
        questionNumber: "Q03",
        maximumMarks: 10.0,
        awardedMarks: 8.5,
        status: "AGGREGATED",
        sourceDecisionId: "dec-303",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-304",
        questionAttemptId: "att-304",
        questionNumber: "Q04",
        maximumMarks: 15.0,
        awardedMarks: 13.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-304",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-305",
        questionAttemptId: "att-305",
        questionNumber: "Q05",
        maximumMarks: 25.0,
        awardedMarks: 19.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-305",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-306",
        questionAttemptId: "att-306",
        questionNumber: "Q06",
        maximumMarks: 25.0,
        awardedMarks: 19.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-306",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
    ],
    validationIssues: [],
    history: [
      {
        id: "res-03-v1",
        version: 1,
        status: "VALIDATED",
        totalMarks: 82.0,
        maximumMarks: 100.0,
        percentage: 82.0,
        resultCode: "DISTINCTION",
        fingerprint: "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
        createdAt: "2026-01-16T14:15:00Z",
      },
    ],
  },
  {
    id: "res-04",
    examId: "exam-01",
    examTitle: "Winter 2026 End-Semester Examinations",
    examCode: "EXAM-2026-W",
    subjectId: "subj-01",
    subjectName: "Computer Architecture & Organization",
    subjectCode: "CS-301",
    scriptId: "A-10502",
    candidateReference: "CAND-9932-CS301",
    version: 1,
    status: "APPROVED",
    validationStatus: "PASSED",
    totalMarks: 54.0,
    maximumMarks: 100.0,
    percentage: 54.0,
    resultCode: "PASS",
    createdAt: "2026-01-16T15:00:00Z",
    updatedAt: "2026-01-16T16:00:00Z",
    approvedAt: "2026-01-16T16:00:00Z",
    approvedById: "usr-head-01",
    approvedByName: "Dr. Arvind Sharma (Head Examiner)",
    fingerprint: "11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
    questions: [
      {
        id: "rqm-401",
        questionAttemptId: "att-401",
        questionNumber: "Q01",
        maximumMarks: 10.0,
        awardedMarks: 6.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-401",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-402",
        questionAttemptId: "att-402",
        questionNumber: "Q02",
        maximumMarks: 15.0,
        awardedMarks: 8.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-402",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-403",
        questionAttemptId: "att-403",
        questionNumber: "Q03",
        maximumMarks: 10.0,
        awardedMarks: 5.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-403",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-404",
        questionAttemptId: "att-404",
        questionNumber: "Q04",
        maximumMarks: 15.0,
        awardedMarks: 9.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-404",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-405",
        questionAttemptId: "att-405",
        questionNumber: "Q05",
        maximumMarks: 25.0,
        awardedMarks: 13.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-405",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
      {
        id: "rqm-406",
        questionAttemptId: "att-406",
        questionNumber: "Q06",
        maximumMarks: 25.0,
        awardedMarks: 13.0,
        status: "AGGREGATED",
        sourceDecisionId: "dec-406",
        sourceDecisionVersion: 1,
        sourceExaminerName: "Prof. R. Deshmukh",
      },
    ],
    validationIssues: [],
    history: [
      {
        id: "res-04-v1",
        version: 1,
        status: "APPROVED",
        totalMarks: 54.0,
        maximumMarks: 100.0,
        percentage: 54.0,
        resultCode: "PASS",
        approvedAt: "2026-01-16T16:00:00Z",
        approvedByName: "Dr. Arvind Sharma (Head Examiner)",
        fingerprint: "11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
        createdAt: "2026-01-16T15:00:00Z",
      },
    ],
  },
];
