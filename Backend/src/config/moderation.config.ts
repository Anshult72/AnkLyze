import { ModerationPriority, ModerationResolutionType } from "@prisma/client";

export interface ModerationConfig {
  priorities: {
    CRITICAL: {
      slaHours: number;
      triggers: string[];
    };
    HIGH: {
      slaHours: number;
      triggers: string[];
    };
    MEDIUM: {
      slaHours: number;
      triggers: string[];
    };
    LOW: {
      slaHours: number;
      triggers: string[];
    };
  };
  allowedResolutions: ModerationResolutionType[];
}

export const MODERATION_CONFIG: ModerationConfig = {
  priorities: {
    CRITICAL: {
      slaHours: 4,
      triggers: [
        "DOUBLE_EVALUATION_DISAGREEMENT",
        "CRITICAL_RISK",
        "UNRESOLVED_SEVERE_RUBRIC_ISSUE",
        "UNREADABLE_DISPUTE",
      ],
    },
    HIGH: {
      slaHours: 12,
      triggers: [
        "HIGH_RISK_EVALUATION",
        "AI_HUMAN_LARGE_DISAGREEMENT",
        "MANUAL_EXAMINER_FLAG",
        "RECONSTRUCTION_UNCERTAINTY",
      ],
    },
    MEDIUM: {
      slaHours: 24,
      triggers: [
        "MEDIUM_RISK_VARIANCE",
        "CRITERIA_OVERRIDE_FLAG",
        "RANDOM_QUALITY_SAMPLE",
      ],
    },
    LOW: {
      slaHours: 48,
      triggers: [
        "STANDARD_AUDIT_SAMPLE",
        "ROUTINE_CHECK",
      ],
    },
  },
  allowedResolutions: [
    "ACCEPT_EXISTING_DECISION",
    "MODIFY_MARKS",
    "REQUEST_RE_EVALUATION",
    "RETURN_TO_EXAMINER",
    "ESCALATE",
  ],
};

export function determineModerationPriority(params: {
  triggerReason: string;
  overallRiskScore?: number;
  isDoubleEvalDisagreement?: boolean;
}): ModerationPriority {
  if (params.isDoubleEvalDisagreement || params.triggerReason === "DOUBLE_EVALUATION_DISAGREEMENT") {
    return "CRITICAL";
  }
  if (params.overallRiskScore !== undefined && params.overallRiskScore >= 75) {
    return "CRITICAL";
  }
  if (params.overallRiskScore !== undefined && params.overallRiskScore >= 50) {
    return "HIGH";
  }
  if (params.triggerReason === "CRITICAL_RISK" || params.triggerReason === "UNRESOLVED_SEVERE_RUBRIC_ISSUE") {
    return "CRITICAL";
  }
  if (params.triggerReason === "MANUAL_EXAMINER_FLAG" || params.triggerReason === "HIGH_RISK_EVALUATION") {
    return "HIGH";
  }
  if (params.overallRiskScore !== undefined && params.overallRiskScore >= 25) {
    return "MEDIUM";
  }
  return "LOW";
}
