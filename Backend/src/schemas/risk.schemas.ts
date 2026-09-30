/**
 * ANKLYZE Phase 12 - Risk & Double Evaluation Zod Validation Schemas
 * "Analyse the marks, not just the paper."
 */

import { z } from 'zod';

export const riskAssessParamsSchema = z.object({
  id: z.string().min(1, 'Question attempt ID is required'),
});

export const requestSecondEvaluationBodySchema = z.object({
  assignedUserId: z.string().optional(),
});

export const completeRoundParamsSchema = z.object({
  id: z.string().min(1, 'Round ID is required'),
});

export const completeRoundBodySchema = z.object({
  evaluationId: z.string().optional(),
});
