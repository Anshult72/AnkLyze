/**
 * ANKLYZE Phase 9 - Multimodal AI Answer Reconstruction Types
 * "Analyse the marks, not just the paper."
 * 
 * Strict boundary:
 * Reconstructs document structure and question-to-page mappings only.
 * NO marks, NO rubric scoring, NO grading.
 */

import { z } from 'zod';

export type ReconstructionState =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'BLANK'
  | 'CONTINUATION'
  | 'DUPLICATE_ATTEMPT'
  | 'UNREADABLE'
  | 'REQUIRES_REVIEW';

export interface VisionContextPageInput {
  pageId: string;
  pageNumber: number;
  imageReference?: string;
  imageBase64?: string;
  ocrFullText: string;
  ocrConfidence: number;
  blocksSummary?: string;
  qualityScore?: number;
}

export interface VisionReconstructionAIRequest {
  scriptId: string;
  scriptCode: string;
  subjectCode: string;
  subjectName: string;
  examTitle: string;
  questions: Array<{
    id: string;
    questionNumber: string;
    questionText: string;
    maximumMarks: number;
  }>;
  ambiguousPages: VisionContextPageInput[];
  deterministicCandidates?: Array<{
    pageNumber: number;
    detectedLabel?: string;
    candidateQuestionId?: string;
    reason: string;
  }>;
  task: string;
  timeoutMs: number;
}

// Zod Schemas for Multimodal AI Output Validation
export const visionQuestionCandidateSchema = z.object({
  questionId: z.string().min(1, 'questionId cannot be empty'),
  detectedLabel: z.string().min(1, 'detectedLabel cannot be empty'),
  confidence: z.number().min(0).max(1),
});

export const visionPageCandidateSchema = z.object({
  pageId: z.string().min(1, 'pageId cannot be empty'),
  pageNumber: z.number().int().min(1).optional(),
  questionCandidates: z.array(visionQuestionCandidateSchema).default([]),
});

export const visionReconstructionAttemptSchema = z.object({
  questionId: z.string().min(1, 'questionId cannot be empty'),
  attemptIndex: z.number().int().min(1).default(1),
  state: z.enum([
    'ACTIVE',
    'CANCELLED',
    'BLANK',
    'CONTINUATION',
    'DUPLICATE_ATTEMPT',
    'UNREADABLE',
    'REQUIRES_REVIEW',
  ]),
  pageIds: z.array(z.string().min(1)).min(1, 'At least one pageId required per attempt'),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1, 'reason is required'),
});

export const visionReviewCaseSchema = z.object({
  issue: z.string().min(1),
  pageIds: z.array(z.string().min(1)),
  questionId: z.string().optional(),
  detectedLabel: z.string().optional(),
  candidateQuestionIds: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
});

export const visionReconstructionResponseSchema = z.object({
  scriptId: z.string().min(1),
  pages: z.array(visionPageCandidateSchema).default([]),
  attempts: z.array(visionReconstructionAttemptSchema).default([]),
  reviewCases: z.array(visionReviewCaseSchema).default([]),
  overallConfidence: z.number().min(0).max(1).default(0.9),
  summary: z.string().optional(),
});

export type VisionReconstructionAIResponse = z.infer<typeof visionReconstructionResponseSchema>;
