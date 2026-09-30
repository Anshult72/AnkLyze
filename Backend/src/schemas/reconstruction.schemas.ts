/**
 * ANKLYZE Phase 9 - Reconstruction REST API Validation Schemas
 * "Analyse the marks, not just the paper."
 */

import { z } from 'zod';

export const reconstructScriptBodySchema = z.object({
  forceRerun: z.boolean().optional().default(false),
});

export const resolveAttemptBodySchema = z.object({
  state: z
    .enum([
      'ACTIVE',
      'CANCELLED',
      'BLANK',
      'CONTINUATION',
      'DUPLICATE_ATTEMPT',
      'UNREADABLE',
      'REQUIRES_REVIEW',
    ])
    .optional(),
  questionId: z.string().uuid('Invalid question ID format').optional(),
  reason: z
    .string()
    .min(3, 'Resolution reason must be at least 3 characters')
    .max(500, 'Resolution reason must not exceed 500 characters'),
});

export const patchAttemptBodySchema = z.object({
  state: z
    .enum([
      'ACTIVE',
      'CANCELLED',
      'BLANK',
      'CONTINUATION',
      'DUPLICATE_ATTEMPT',
      'UNREADABLE',
      'REQUIRES_REVIEW',
    ])
    .optional(),
  questionId: z.string().uuid('Invalid question ID format').optional(),
  reason: z.string().max(500).optional(),
});

export const linkSupplementaryBodySchema = z.object({
  supplementaryScriptId: z.string().uuid('Invalid supplementary script ID format'),
  barcodeValue: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export type ReconstructScriptBodyDto = z.infer<typeof reconstructScriptBodySchema>;
export type ResolveAttemptBodyDto = z.infer<typeof resolveAttemptBodySchema>;
export type PatchAttemptBodyDto = z.infer<typeof patchAttemptBodySchema>;
export type LinkSupplementaryBodyDto = z.infer<typeof linkSupplementaryBodySchema>;
