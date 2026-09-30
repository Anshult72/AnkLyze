/**
 * ANKLYZE Phase 7 - Script Intake Zod Validation Schemas
 * "Analyse the marks, not just the paper."
 */

import { z } from "zod";

export const createScriptBatchSchema = z.object({
  examId: z.string().uuid("Invalid examId format"),
  subjectId: z.string().uuid("Invalid subjectId format"),
  batchCode: z
    .string()
    .min(3, "batchCode must be at least 3 characters")
    .max(50, "batchCode must not exceed 50 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "batchCode can only contain alphanumeric characters, hyphens, and underscores")
    .optional(),
  source: z
    .string()
    .max(100)
    .default("DIGITAL_SCANNER"),
  notes: z
    .string()
    .max(1000)
    .optional(),
});

export const scriptBatchQuerySchema = z.object({
  examId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  status: z
    .enum(["CREATED", "UPLOADING", "COMPLETED", "PARTIAL_FAILURE", "FAILED", "READY_FOR_PROCESSING"])
    .optional(),
});

export const scriptListQuerySchema = z.object({
  examId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  status: z
    .enum(["UPLOADING", "UPLOADED", "VALIDATING", "VALIDATED", "READY_FOR_PROCESSING", "PROCESSING", "PROCESSING_FAILED", "REJECTED"])
    .optional(),
  search: z.string().max(100).optional(),
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 25)),
});

export type CreateScriptBatchDto = z.infer<typeof createScriptBatchSchema>;
export type ScriptBatchQueryDto = z.infer<typeof scriptBatchQuerySchema>;
export type ScriptListQueryDto = z.infer<typeof scriptListQuerySchema>;
