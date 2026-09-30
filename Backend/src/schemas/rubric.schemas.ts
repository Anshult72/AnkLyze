import { z } from 'zod';

export const modifyCriterionBodySchema = z.object({
  criterionId: z.string().min(1, 'criterionId is required'),
  name: z.string().min(1, 'Criterion name cannot be empty').optional(),
  description: z.string().optional(),
  maxMarks: z.number().positive('maxMarks must be positive').optional(),
  partialCreditAllowed: z.boolean().optional(),
  alternateMethodAccepted: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
  reason: z.string().optional(),
});

export const rejectRubricBodySchema = z.object({
  reason: z.string().min(3, 'Rejection reason must be at least 3 characters long'),
});

export const resolveIssueBodySchema = z.object({
  notes: z.string().optional(),
});

export type ModifyCriterionBody = z.infer<typeof modifyCriterionBodySchema>;
export type RejectRubricBody = z.infer<typeof rejectRubricBodySchema>;
export type ResolveIssueBody = z.infer<typeof resolveIssueBodySchema>;
