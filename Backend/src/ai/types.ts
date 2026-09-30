export type AIProviderType = 'gemini' | 'groq' | 'mock';

export type ConfidenceBand = 'HIGH' | 'MEDIUM' | 'LOW';

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type RubricIssueType = 
  | 'AMBIGUITY'
  | 'INCOMPLETE_RULE'
  | 'MARK_MISMATCH'
  | 'POLICY_CONFLICT';

export interface HumanCriterionInput {
  name: string;
  description: string;
  maxMarks: number;
  orderIndex: number;
}

export interface QuestionAnalysisInput {
  id: string;
  questionNumber: string;
  text: string;
  maxMarks: number;
  modelAnswer?: string;
  humanCriteria: HumanCriterionInput[];
}

export interface RubricAnalysisInput {
  subject: {
    code: string;
    name: string;
  };
  examTitle: string;
  markingScheme: {
    id: string;
    version: number;
    instructions?: string;
    totalMarks: number;
  };
  questions: QuestionAnalysisInput[];
}

export interface NormalizedRubricCriterion {
  name: string;
  description: string;
  maxMarks: number;
  partialCreditAllowed: boolean;
  alternateMethodAccepted: boolean;
  orderIndex: number;
}

export interface NormalizedRubricIssue {
  type: RubricIssueType;
  severity: IssueSeverity;
  issue: string;
  explanation: string;
  suggestedClarification?: string;
  affectedQuestionId?: string;
}

export interface NormalizedRubricQuestion {
  questionId: string;
  criteria: NormalizedRubricCriterion[];
  specialInstructions: string[];
  issues: NormalizedRubricIssue[];
  isReviewRequired: boolean;
}

export interface NormalizedRubricAnalysisResult {
  confidence: number;
  confidenceBand: ConfidenceBand;
  overallStatus: 'READY_FOR_REVIEW' | 'REVIEW_REQUIRED';
  provider: string;
  model: string;
  promptVersion: string;
  fallbackUsed: boolean;
  rawResponseSummary?: string;
  questions: NormalizedRubricQuestion[];
  globalIssues: NormalizedRubricIssue[];
  processingDurationMs: number;
}

export interface AIProviderResult {
  rawJsonText: string;
  provider: string;
  model: string;
  latencyMs: number;
}

export class AIProviderError extends Error {
  public readonly isTransient: boolean;
  public readonly provider: string;
  public readonly statusCode?: number;

  constructor(message: string, provider: string, isTransient: boolean = false, statusCode?: number) {
    super(message);
    this.name = 'AIProviderError';
    this.provider = provider;
    this.isTransient = isTransient;
    this.statusCode = statusCode;
  }
}
