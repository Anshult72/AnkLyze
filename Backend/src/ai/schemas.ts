import { z } from 'zod';
import {
  NormalizedRubricAnalysisResult,
  NormalizedRubricQuestion,
  NormalizedRubricIssue,
  RubricAnalysisInput,
  ConfidenceBand,
  RubricIssueType,
} from './types';

export const issueSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const rawRubricIssueTypeSchema = z.string().transform((val): RubricIssueType => {
  const upper = val.toUpperCase();
  if (upper.includes('MISMATCH') || upper.includes('MARK')) return 'MARK_MISMATCH';
  if (upper.includes('INCOMPLETE') || upper.includes('MISSING')) return 'INCOMPLETE_RULE';
  if (upper.includes('CONFLICT') || upper.includes('POLICY')) return 'POLICY_CONFLICT';
  return 'AMBIGUITY';
});

export const aiCriterionSchema = z.object({
  name: z.string().min(1, 'Criterion name cannot be empty'),
  description: z.string().default(''),
  maxMarks: z.number().positive('Max marks must be greater than 0'),
  partialCreditAllowed: z.boolean().default(false),
  alternateMethodAccepted: z.boolean().default(false),
  orderIndex: z.number().int().default(1),
});

export const aiIssueSchema = z.object({
  type: rawRubricIssueTypeSchema.default('AMBIGUITY'),
  severity: issueSeveritySchema.default('MEDIUM'),
  issue: z.string().min(1, 'Issue description required'),
  explanation: z.string().default(''),
  suggestedClarification: z.string().optional(),
});

export const aiQuestionSchema = z.object({
  questionId: z.string().min(1, 'Question ID required'),
  criteria: z.array(aiCriterionSchema).default([]),
  specialInstructions: z.array(z.string()).default([]),
  ambiguities: z.array(aiIssueSchema).default([]),
  missingInformation: z.array(aiIssueSchema).default([]),
});

export const aiRubricResponseSchema = z.object({
  confidence: z.number().min(0).max(1).default(0.85),
  overallStatus: z.enum(['READY_FOR_REVIEW', 'REVIEW_REQUIRED']).default('READY_FOR_REVIEW'),
  summary: z.string().optional(),
  questions: z.array(aiQuestionSchema).min(1, 'At least one question must be analyzed'),
  globalIssues: z.array(aiIssueSchema).default([]),
});

export type RawAiRubricResponse = z.infer<typeof aiRubricResponseSchema>;

export function calculateConfidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.85) return 'HIGH';
  if (confidence >= 0.65) return 'MEDIUM';
  return 'LOW';
}

/**
 * Validates raw JSON string from AI and normalizes into strong internal domain structure.
 * Enforces mark-total consistency against the original questions.
 */
export function validateAndNormalizeAiResponse(
  rawJsonText: string,
  input: RubricAnalysisInput,
  meta: {
    provider: string;
    model: string;
    promptVersion: string;
    fallbackUsed: boolean;
    processingDurationMs: number;
  }
): { success: true; data: NormalizedRubricAnalysisResult } | { success: false; error: string; rawText: string } {
  let parsed: unknown;
  try {
    // Strip markdown code fences if provider enclosed response in ```json ... ```
    let cleaned = rawJsonText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();

    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    return {
      success: false,
      error: `AI output is not valid JSON: ${err.message}`,
      rawText: rawJsonText,
    };
  }

  const parseResult = aiRubricResponseSchema.safeParse(parsed);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return {
      success: false,
      error: `AI output failed schema validation: ${errorDetails}`,
      rawText: rawJsonText,
    };
  }

  const aiData = parseResult.data;
  let overallReviewRequired = aiData.overallStatus === 'REVIEW_REQUIRED';

  // Map input questions for lookup
  const questionMap = new Map(input.questions.map((q) => [q.id, q]));

  const normalizedQuestions: NormalizedRubricQuestion[] = [];

  for (const qItem of aiData.questions) {
    const originalQ = questionMap.get(qItem.questionId);
    const combinedIssues: NormalizedRubricIssue[] = [];

    // Add ambiguities
    for (const amb of qItem.ambiguities) {
      combinedIssues.push({
        type: amb.type,
        severity: amb.severity,
        issue: amb.issue,
        explanation: amb.explanation,
        suggestedClarification: amb.suggestedClarification,
        affectedQuestionId: qItem.questionId,
      });
    }

    // Add missing information
    for (const mi of qItem.missingInformation) {
      combinedIssues.push({
        type: mi.type === 'AMBIGUITY' ? 'INCOMPLETE_RULE' : mi.type,
        severity: mi.severity,
        issue: mi.issue,
        explanation: mi.explanation,
        suggestedClarification: mi.suggestedClarification,
        affectedQuestionId: qItem.questionId,
      });
    }

    // Validate marks consistency
    if (originalQ) {
      const criteriaTotal = qItem.criteria.reduce((sum, c) => sum + c.maxMarks, 0);
      const roundedTotal = Math.round(criteriaTotal * 100) / 100;
      const expectedTotal = Math.round(originalQ.maxMarks * 100) / 100;

      if (Math.abs(roundedTotal - expectedTotal) > 0.001) {
        combinedIssues.push({
          type: 'MARK_MISMATCH',
          severity: 'HIGH',
          issue: `MARK ALLOCATION INCOMPLETE: Sum of criteria marks (${roundedTotal}) does not match Question ${originalQ.questionNumber} maximum marks (${expectedTotal})`,
          explanation: `The AI-interpreted criteria total ${roundedTotal} marks, but the question is allocated ${expectedTotal} marks.`,
          suggestedClarification: `Adjust criteria marks so their sum equals exactly ${expectedTotal}.`,
          affectedQuestionId: qItem.questionId,
        });
      }
    }

    const isQuestionReviewRequired = combinedIssues.some((issue) => issue.severity === 'HIGH' || issue.severity === 'MEDIUM');
    if (isQuestionReviewRequired) {
      overallReviewRequired = true;
    }

    normalizedQuestions.push({
      questionId: qItem.questionId,
      criteria: qItem.criteria.map((c, idx) => ({
        name: c.name,
        description: c.description || '',
        maxMarks: c.maxMarks,
        partialCreditAllowed: c.partialCreditAllowed,
        alternateMethodAccepted: c.alternateMethodAccepted,
        orderIndex: c.orderIndex || idx + 1,
      })),
      specialInstructions: qItem.specialInstructions,
      issues: combinedIssues,
      isReviewRequired: isQuestionReviewRequired,
    });
  }

  const globalIssues: NormalizedRubricIssue[] = (aiData.globalIssues || []).map((gi) => ({
    type: gi.type,
    severity: gi.severity,
    issue: gi.issue,
    explanation: gi.explanation,
    suggestedClarification: gi.suggestedClarification,
  }));

  if (globalIssues.some((i) => i.severity === 'HIGH')) {
    overallReviewRequired = true;
  }

  // Final confidence band
  const confidenceBand = calculateConfidenceBand(aiData.confidence);

  return {
    success: true,
    data: {
      confidence: aiData.confidence,
      confidenceBand,
      overallStatus: overallReviewRequired ? 'REVIEW_REQUIRED' : 'READY_FOR_REVIEW',
      provider: meta.provider,
      model: meta.model,
      promptVersion: meta.promptVersion,
      fallbackUsed: meta.fallbackUsed,
      rawResponseSummary: aiData.summary,
      questions: normalizedQuestions,
      globalIssues,
      processingDurationMs: meta.processingDurationMs,
    },
  };
}
