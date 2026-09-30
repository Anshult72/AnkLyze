import { z } from "zod";

export const generateResultSchema = z.object({
  scriptId: z.string().uuid("Invalid scriptId format"),
  forceNewVersion: z.boolean().optional().default(false),
});

export const validateResultParamSchema = z.object({
  id: z.string().uuid("Invalid result ID format"),
});

export const approveResultSchema = z.object({
  notes: z.string().optional(),
});

export const requestRevaluationSchema = z.object({
  resultId: z.string().uuid("Invalid resultId format"),
  questionAttemptId: z.string().uuid("Invalid questionAttemptId format").optional(),
  scope: z.enum(["FULL_RESULT_REVIEW", "QUESTION_SPECIFIC_REVIEW"]).default("FULL_RESULT_REVIEW"),
  reason: z.string().min(5, "Revaluation reason must be at least 5 characters"),
});

export const authorizeRevaluationSchema = z.object({
  authorize: z.boolean(),
  notes: z.string().optional(),
});

export const completeRevaluationSchema = z.object({
  changedQuestionDecisions: z
    .array(
      z.object({
        questionAttemptId: z.string().uuid(),
        newMarks: z.number().min(0),
        reason: z.string().min(3),
      })
    )
    .min(1, "At least one question decision must be updated to complete revaluation"),
});

export const listResultsQuerySchema = z.object({
  examId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  scriptId: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "VALIDATING", "BLOCKED", "VALIDATED", "APPROVED", "SUPERSEDED", "REVALUATION_PENDING", "REVALUATED"]).optional(),
  validationStatus: z.enum(["PASSED", "WARNING", "BLOCKED"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
