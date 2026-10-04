/**
 * ANKLYZE Phase 10 - AI Evaluation Types & Zod Schemas
 * "Analyse the marks, not just the paper."
 * 
 * Strict Zod validation for AI evaluation output.
 * Rejects malformed responses, fabricated evidence, out-of-range marks.
 */

import { z } from 'zod';

// AI Output Zod Schemas
export const evaluationEvidenceSchema = z.object({
  pageId: z.string().min(1, 'pageId required'),
  pageNumber: z.number().optional(),
  answerRegionId: z.string().nullable().optional(),
  text: z.string().optional().default(''),
  extractedText: z.string().optional(),
  reason: z.string().optional().default('Evidence supporting score'),
  evidenceType: z.string().optional().default('OCR_TEXT'),
  boundingBox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  relevanceScore: z.number().optional(),
});

export const evaluationCriterionResultSchema = z.object({
  criterionId: z.string().min(1, 'criterionId required'),
  status: z.enum([
    'SATISFIED',
    'PARTIALLY_SATISFIED',
    'NOT_SATISFIED',
    'NOT_ASSESSABLE',
    'REQUIRES_REVIEW',
  ]).default('PARTIALLY_SATISFIED'),
  suggestedMarks: z.number().min(0),
  maxMarks: z.number().positive().optional().default(1),
  confidenceScore: z.number().min(0).max(1).default(0.8),
  reasoning: z.string().optional(),
  evidenceSummary: z.string().optional().default(''),
  evidence: z.array(evaluationEvidenceSchema).default([]),
});

export const evaluationIssueSchema = z.union([
  z.string().transform((s) => ({
    issueType: 'LOW_CONFIDENCE',
    severity: 'MEDIUM' as const,
    message: s,
    requiresReview: false,
  })),
  z.object({
    issueType: z.string().default('LOW_CONFIDENCE'),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    message: z.string().min(1, 'issue message required'),
    requiresReview: z.boolean().default(false),
  }),
]);

export const aiEvaluationResponseSchema = z.object({
  questionAttemptId: z.string().optional(),
  overallAssessment: z.object({
    summary: z.string().min(1, 'Assessment summary required'),
    suggestedMarks: z.number().min(0),
    maxMarks: z.number().positive(),
    confidenceScore: z.number().min(0).max(1),
    confidenceBand: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    alternateMethodDetected: z.boolean().optional().default(false),
    alternateMethodName: z.string().optional(),
  }),
  criteria: z.array(evaluationCriterionResultSchema).min(1, 'At least one criterion result required'),
  issues: z.array(evaluationIssueSchema).default([]),
  requiresReview: z.boolean().default(false),
  reviewReason: z.string().optional(),
});

export const evaluationResponseSchema = aiEvaluationResponseSchema;
export type EvaluationAIResponse = AIEvaluationResponse;
export type AIEvaluationResponse = z.infer<typeof aiEvaluationResponseSchema>;
export type AIEvaluationCriterionResult = z.infer<typeof evaluationCriterionResultSchema>;
export type AIEvaluationEvidence = z.infer<typeof evaluationEvidenceSchema>;
export type AIEvaluationIssue = z.infer<typeof evaluationIssueSchema>;

export interface EvaluationCriterionInput {
  id: string;
  name: string;
  description?: string;
  maximumMarks: number;
  partialCreditAllowed?: boolean;
  alternateMethodAccepted?: boolean;
}

export interface EvaluationAnswerRegionInput {
  id: string;
  pageId?: string;
  pageNumber?: number;
  extractedText?: string;
  regionType?: string;
  ocrLineConfidence?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

// Normalized evaluation result after validation and grounding
export interface NormalizedEvaluationResult {
  assessmentSummary: string;
  suggestedMarks: number;
  maxMarks: number;
  confidenceScore: number;
  confidenceBand: 'HIGH' | 'MEDIUM' | 'LOW';
  requiresReview: boolean;
  provider: string;
  model: string;
  promptVersion: string;
  pipelineVersion: string;
  fallbackUsed: boolean;
  processingDurationMs: number;
  criteria: Array<{
    criterionId: string;
    criterionName: string;
    status: string;
    suggestedMarks: number;
    maxMarks: number;
    confidenceScore: number;
    evidenceSummary: string;
    evidence: Array<{
      pageId: string | null;
      answerRegionId: string | null;
      extractedText: string;
      reason: string;
      pageNumber: number | null;
    }>;
  }>;
  issues: Array<{
    issueType: string;
    severity: string;
    message: string;
    requiresReview: boolean;
  }>;
}

/**
 * Validates raw AI JSON output against schema and grounds evidence references
 * against actual database entities.
 */
export function validateAndGroundEvaluationResponse(
  rawJsonText: string,
  validCriterionIds: Set<string>,
  validPageIds: Set<string>,
  validRegionIds: Set<string>,
  criterionNameMap: Map<string, string>,
  pageNumberMap: Map<string, number>,
  maxMarks: number,
  meta: {
    provider: string;
    model: string;
    promptVersion: string;
    pipelineVersion: string;
    fallbackUsed: boolean;
    processingDurationMs: number;
  }
): { success: true; data: NormalizedEvaluationResult } | { success: false; error: string; rawText: string } {
  // Strip code fences
  let cleaned = rawJsonText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
  cleaned = cleaned.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    return { success: false, error: `AI output is not valid JSON: ${err.message}`, rawText: rawJsonText };
  }

  const parseResult = aiEvaluationResponseSchema.safeParse(parsed);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, error: `Schema validation failed: ${errorDetails}`, rawText: rawJsonText };
  }

  const aiData = parseResult.data;
  const issues: Array<{ issueType: string; severity: string; message: string; requiresReview: boolean }> = [];
  let requiresReview = aiData.requiresReview;

  // Validate overall marks
  if (aiData.overallAssessment.suggestedMarks > maxMarks) {
    return {
      success: false,
      error: `AI suggested marks (${aiData.overallAssessment.suggestedMarks}) exceed maximum (${maxMarks})`,
      rawText: rawJsonText,
    };
  }

  // Ground and validate criteria
  const groundedCriteria: NormalizedEvaluationResult['criteria'] = [];
  let criteriaMarksTotal = 0;

  for (const c of aiData.criteria) {
    // Verify criterion ID exists
    if (!validCriterionIds.has(c.criterionId)) {
      return {
        success: false,
        error: `AI referenced non-existent criterion ID: ${c.criterionId}`,
        rawText: rawJsonText,
      };
    }

    // Verify marks within range
    if (c.suggestedMarks > c.maxMarks) {
      return {
        success: false,
        error: `Criterion ${c.criterionId}: suggested marks (${c.suggestedMarks}) exceed max (${c.maxMarks})`,
        rawText: rawJsonText,
      };
    }

    criteriaMarksTotal += c.suggestedMarks;

    // Ground evidence references
    const groundedEvidence: NormalizedEvaluationResult['criteria'][0]['evidence'] = [];
    for (const ev of c.evidence) {
      // Verify page ID
      if (ev.pageId && !validPageIds.has(ev.pageId)) {
        issues.push({
          issueType: 'RUBRIC_MISMATCH',
          severity: 'MEDIUM',
          message: `Evidence references non-existent page ID: ${ev.pageId}. Evidence skipped.`,
          requiresReview: true,
        });
        requiresReview = true;
        continue;
      }

      // Verify region ID if provided
      if (ev.answerRegionId && !validRegionIds.has(ev.answerRegionId)) {
        // Don't reject, just nullify the invalid region reference
        groundedEvidence.push({
          pageId: ev.pageId || null,
          answerRegionId: null,
          extractedText: ev.text || '',
          reason: ev.reason,
          pageNumber: ev.pageId ? (pageNumberMap.get(ev.pageId) ?? null) : null,
        });
        continue;
      }

      groundedEvidence.push({
        pageId: ev.pageId || null,
        answerRegionId: ev.answerRegionId || null,
        extractedText: ev.text || '',
        reason: ev.reason,
        pageNumber: ev.pageId ? (pageNumberMap.get(ev.pageId) ?? null) : null,
      });
    }

    groundedCriteria.push({
      criterionId: c.criterionId,
      criterionName: criterionNameMap.get(c.criterionId) || c.criterionId,
      status: c.status,
      suggestedMarks: c.suggestedMarks,
      maxMarks: c.maxMarks,
      confidenceScore: c.confidenceScore,
      evidenceSummary: c.evidenceSummary,
      evidence: groundedEvidence,
    });
  }

  // Verify total doesn't exceed max
  if (criteriaMarksTotal > maxMarks + 0.001) {
    return {
      success: false,
      error: `Sum of criterion marks (${criteriaMarksTotal}) exceeds question maximum (${maxMarks})`,
      rawText: rawJsonText,
    };
  }

  // Import AI issues
  for (const issue of aiData.issues) {
    issues.push({
      issueType: issue.issueType,
      severity: issue.severity,
      message: issue.message,
      requiresReview: issue.requiresReview,
    });
    if (issue.requiresReview) requiresReview = true;
  }

  // Low confidence triggers review
  if (aiData.overallAssessment.confidenceBand === 'LOW') {
    requiresReview = true;
  }

  return {
    success: true,
    data: {
      assessmentSummary: aiData.overallAssessment.summary,
      suggestedMarks: aiData.overallAssessment.suggestedMarks,
      maxMarks: aiData.overallAssessment.maxMarks,
      confidenceScore: aiData.overallAssessment.confidenceScore,
      confidenceBand: aiData.overallAssessment.confidenceBand,
      requiresReview,
      provider: meta.provider,
      model: meta.model,
      promptVersion: meta.promptVersion,
      pipelineVersion: meta.pipelineVersion,
      fallbackUsed: meta.fallbackUsed,
      processingDurationMs: meta.processingDurationMs,
      criteria: groundedCriteria,
      issues,
    },
  };
}
