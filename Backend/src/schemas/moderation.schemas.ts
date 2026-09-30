import { z } from "zod";

export const createModerationCaseSchema = z.object({
  questionAttemptId: z.string().uuid("Invalid question attempt ID"),
  evaluationId: z.string().uuid("Invalid evaluation ID").optional(),
  riskAssessmentId: z.string().uuid("Invalid risk assessment ID").optional(),
  doubleEvaluationResultId: z.string().uuid("Invalid double evaluation result ID").optional(),
  triggerReason: z.string().min(3, "Trigger reason is required"),
  overallRiskScore: z.number().min(0).max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const assignModeratorSchema = z.object({
  moderatorId: z.string().uuid("Invalid moderator user ID"),
});

export const resolveModerationCaseSchema = z.object({
  resolutionType: z.enum([
    "ACCEPT_EXISTING_DECISION",
    "MODIFY_MARKS",
    "REQUEST_RE_EVALUATION",
    "RETURN_TO_EXAMINER",
    "ESCALATE",
  ]),
  marksBefore: z.number().min(0, "Marks before must be non-negative"),
  marksAfter: z.number().min(0, "Marks after must be non-negative"),
  reason: z.string().min(5, "Resolution reason must be at least 5 characters"),
  criterionOverrides: z
    .array(
      z.object({
        criterionId: z.string(),
        criterionName: z.string(),
        marksAwarded: z.number().min(0),
        comment: z.string().optional(),
      })
    )
    .optional(),
  notes: z.string().optional(),
});

export const escalateModerationCaseSchema = z.object({
  reason: z.string().min(5, "Escalation reason must be at least 5 characters"),
});
