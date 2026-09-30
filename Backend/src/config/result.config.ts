export const RESULT_CONFIG = {
  // Default passing marks percentage if not explicitly defined in Exam
  DEFAULT_PASSING_PERCENTAGE: 40.0,
  DISTINCTION_PERCENTAGE: 75.0,
  FIRST_CLASS_PERCENTAGE: 60.0,

  // Rule codes and default severity classification
  RULES: {
    MISSING_QUESTION_DECISION: {
      code: "RESULT-COV-001",
      message: "Required evaluable question attempt has no finalized examiner decision.",
      severity: "BLOCKING" as const,
    },
    UNRESOLVED_DUPLICATE_ATTEMPT: {
      code: "RESULT-COV-002",
      message: "Multiple candidate attempts detected for question without authoritative resolution.",
      severity: "BLOCKING" as const,
    },
    UNRESOLVED_UNREADABLE_ANSWER: {
      code: "RESULT-COV-003",
      message: "Unresolved unreadable answer attempt blocks examination result.",
      severity: "BLOCKING" as const,
    },
    ACTIVE_MODERATION_CASE: {
      code: "RESULT-MOD-001",
      message: "Active or unresolved moderation review case on question attempt.",
      severity: "BLOCKING" as const,
    },
    UNRESOLVED_DOUBLE_EVAL_DISAGREEMENT: {
      code: "RESULT-DBL-001",
      message: "Unresolved double-evaluation discrepancy requires senior review resolution.",
      severity: "BLOCKING" as const,
    },
    QUESTION_MARKS_EXCEED_MAX: {
      code: "RESULT-MRK-001",
      message: "Awarded question marks exceed configured question maximum.",
      severity: "BLOCKING" as const,
    },
    TOTAL_MARKS_INCONSISTENT: {
      code: "RESULT-MRK-002",
      message: "Aggregated sum of question marks does not equal result total marks.",
      severity: "BLOCKING" as const,
    },
    NEGATIVE_MARKS_VIOLATION: {
      code: "RESULT-MRK-003",
      message: "Negative marks detected while negative marking is disabled for this examination.",
      severity: "BLOCKING" as const,
    },
    QUESTION_PAPER_TOTAL_MISMATCH: {
      code: "RESULT-EXAM-001",
      message: "Sum of evaluable question maximum marks does not match exam maximum marks.",
      severity: "BLOCKING" as const,
    },
    MISSING_SOURCE_DECISION: {
      code: "RESULT-PROV-001",
      message: "Question mark is missing an immutable authoritative source decision reference.",
      severity: "BLOCKING" as const,
    },
    INVALID_SOURCE_DECISION_STATE: {
      code: "RESULT-STATE-001",
      message: "Source decision is in DRAFT, CANCELLED, or invalid state.",
      severity: "BLOCKING" as const,
    },
    OPTIONAL_SECTION_CHOICE_INFO: {
      code: "RESULT-SEC-001",
      message: "Candidate answered optional alternative in Section B.",
      severity: "WARNING" as const,
    },
  },
};

import crypto from "crypto";

export function calculateResultFingerprint(payload: {
  scriptId: string;
  version: number;
  totalAwardedMarks: number;
  totalMaxMarks: number;
  questionMarks: Array<{
    questionNumber: string | number;
    awardedMarks: number;
    maxMarks?: number;
    sourceDecisionId?: string | null;
    sourceModerationDecisionId?: string | null;
  }>;
}): string {
  const dataStr = JSON.stringify({
    scriptId: payload.scriptId,
    version: payload.version,
    total: payload.totalAwardedMarks,
    max: payload.totalMaxMarks,
    q: payload.questionMarks.map((q) => ({
      num: q.questionNumber,
      awarded: q.awardedMarks,
      max: q.maxMarks || 0,
      dec: q.sourceDecisionId || null,
      mod: q.sourceModerationDecisionId || null,
    })),
  });
  return crypto.createHash("sha256").update(dataStr).digest("hex");
}

export const RESULT_VALIDATION_RULES = RESULT_CONFIG.RULES;
export const RESULT_VALIDATION_CONFIG = RESULT_CONFIG;
export class ResultValidationEngine {}

