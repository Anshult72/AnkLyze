/**
 * ANKLYZE Phase 10 - Evaluation API Schemas
 * "Analyse the marks, not just the paper."
 * 
 * Zod validation schemas for evaluation request bodies and parameters.
 */

import { z } from 'zod';

export const evaluateAttemptBodySchema = z.object({
  forceRefresh: z.boolean().optional().default(false),
});

export const examinerDecisionBodySchema = z.object({
  decisionType: z.enum(['ACCEPTED', 'OVERRIDDEN', 'FLAGGED']),
  totalMarksAwarded: z.number().min(0, 'Total marks cannot be negative'),
  examinerNotes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  criteriaOverrides: z
    .array(
      z.object({
        criterionId: z.string().min(1, 'Criterion ID is required'),
        marksAwarded: z.number().min(0, 'Marks cannot be negative'),
        examinerComment: z.string().max(500, 'Comment cannot exceed 500 characters').optional(),
      })
    )
    .optional(),
});

export const updateCriterionBodySchema = z.object({
  marksAwarded: z.number().min(0, 'Marks cannot be negative'),
  examinerComment: z.string().max(500, 'Comment cannot exceed 500 characters').optional(),
});

export const flagReviewBodySchema = z.object({
  reason: z
    .string()
    .min(3, 'Review reason must be at least 3 characters')
    .max(500, 'Review reason must not exceed 500 characters'),
});

// ------------------------------------------------------------------------------
// Phase 11: Human Evaluation & Immutable Provenance Schemas
// ------------------------------------------------------------------------------

export const createDecisionBodySchema = z.object({
  expectedVersion: z.number().int().min(0).optional(),
  decisionType: z.enum([
    'ACCEPT_AI_SUGGESTION',
    'OVERRIDE_AI',
    'SAVE_DRAFT',
    'FLAG_FOR_REVIEW',
    'FINALIZE',
    'REOPEN',
  ]),
  status: z.enum(['DRAFT', 'FINAL']).optional().default('DRAFT'),
  totalMarks: z.number().min(0, 'Total marks cannot be negative'),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
  overrideReason: z.string().max(1000, 'Override reason cannot exceed 1000 characters').optional(),
  reopenReason: z.string().max(1000, 'Reopen reason cannot exceed 1000 characters').optional(),
  criteriaDecisions: z
    .array(
      z.object({
        criterionId: z.string().min(1, 'Criterion ID is required'),
        criterionName: z.string().optional(),
        marksAwarded: z.number().min(0, 'Marks awarded cannot be negative'),
        examinerComment: z.string().max(500, 'Comment cannot exceed 500 characters').optional(),
      })
    )
    .optional(),
});

export const finalizeDecisionBodySchema = z.object({
  expectedVersion: z.number().int().min(0).optional(),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
});

export const reopenDecisionBodySchema = z.object({
  reopenReason: z
    .string()
    .min(3, 'Reopen reason must be at least 3 characters')
    .max(1000, 'Reopen reason must not exceed 1000 characters'),
  expectedVersion: z.number().int().min(0).optional(),
});

