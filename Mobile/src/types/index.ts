/**
 * ANKLYZE Phase 15 - Mobile Domain Types
 * "Analyse the marks, not just the paper."
 */

export interface MobileUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  department?: string | null;
  institution?: string | null;
}

export interface MobileScriptItem {
  id: string;
  scriptCode: string;
  batchCode: string;
  subjectCode: string;
  subjectName: string;
  status: string;
  totalPages: number;
  evaluatedQuestions: number;
  totalQuestions: number;
}

export interface MobileQuestionAttempt {
  id: string;
  questionNumber: string;
  questionText: string;
  maximumMarks: number;
  awardedMarks?: number | null;
  status: "PENDING" | "EVALUATED" | "FINALIZED" | "FLAGGED";
  pages: {
    pageNumber: number;
    pageImageUrl: string;
    ocrText?: string;
  }[];
  criteria: MobileCriterion[];
  aiSuggestion?: {
    suggestedMarks: number;
    confidenceScore: number;
    summary: string;
  };
  humanDecision?: {
    totalMarks: number;
    status: "DRAFT" | "FINAL";
    overrideReason?: string;
    notes?: string;
    version: number;
  };
  riskAssessment?: {
    compositeScore: number;
    riskBand: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    requiresSeniorReview: boolean;
  };
}

export interface MobileCriterion {
  id: string;
  name: string;
  description?: string;
  maximumMarks: number;
  suggestedMarks: number;
  awardedMarks: number;
  isOverridden: boolean;
  evidenceText?: string;
}
