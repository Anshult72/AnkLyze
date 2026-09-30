import { IAIProvider, EvaluationAIRequest } from './aiProvider.interface';
import { AIProviderResult, AIProviderError } from '../types';
import { VisionReconstructionAIRequest } from '../visionTypes';

export interface MockProviderOptions {
  providerName?: string;
  model?: string;
  shouldFail?: boolean;
  isTransientFailure?: boolean;
  failureMessage?: string;
  failureStatusCode?: number;
  customResponseText?: string;
  customVisionResponseText?: string;
  customEvaluationResponseText?: string;
  delayMs?: number;
}

export class MockAIProvider implements IAIProvider {
  public providerName: string;
  public model: string;
  public options: MockProviderOptions;
  public callCount = 0;

  constructor(options: MockProviderOptions = {}) {
    this.providerName = options.providerName || 'mock-provider';
    this.model = options.model || 'mock-model-v1';
    this.options = options;
  }

  setOptions(options: Partial<MockProviderOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.providerName) this.providerName = options.providerName;
    if (options.model) this.model = options.model;
  }

  async generateRubricAnalysis(
    _systemPrompt: string,
    userPrompt: string,
    _timeoutMs: number
  ): Promise<AIProviderResult> {
    this.callCount++;

    if (this.options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
    }

    if (this.options.shouldFail) {
      throw new AIProviderError(
        this.options.failureMessage || 'Simulated provider error',
        this.providerName,
        this.options.isTransientFailure !== false, // default true
        this.options.failureStatusCode || 500
      );
    }

    if (this.options.customResponseText) {
      return {
        rawJsonText: this.options.customResponseText,
        provider: this.providerName,
        model: this.model,
        latencyMs: 15,
      };
    }

    // Default mock response: parses question IDs from userPrompt if possible
    const questionIdMatches = [...userPrompt.matchAll(/Question ID: ([a-zA-Z0-9_-]+)/g)];
    const questionIds = questionIdMatches.map((m) => m[1]);

    const generatedQuestions = questionIds.length > 0 ? questionIds.map((qid, idx) => ({
      questionId: qid,
      criteria: [
        {
          name: `Core Knowledge - Section ${idx + 1}`,
          description: `Detailed and accurate answer addressing question ${idx + 1}`,
          maxMarks: 5.0,
          partialCreditAllowed: true,
          alternateMethodAccepted: true,
          orderIndex: 1,
        },
        {
          name: `Application & Reasoning`,
          description: `Practical example or step-by-step reasoning`,
          maxMarks: 2.0,
          partialCreditAllowed: true,
          alternateMethodAccepted: false,
          orderIndex: 2,
        },
      ],
      specialInstructions: ['Award full marks if all essential points are covered.'],
      ambiguities: [],
      missingInformation: [],
    })) : [
      {
        questionId: 'default-qid-1',
        criteria: [
          {
            name: 'Primary Concept',
            description: 'Accurate definition and explanation',
            maxMarks: 5.0,
            partialCreditAllowed: true,
            alternateMethodAccepted: false,
            orderIndex: 1,
          },
        ],
        specialInstructions: [],
        ambiguities: [],
        missingInformation: [],
      },
    ];

    const defaultPayload = {
      confidence: 0.92,
      overallStatus: 'READY_FOR_REVIEW',
      summary: 'Marking scheme parsed with high confidence. Criteria and partial credit rules extracted cleanly.',
      questions: generatedQuestions,
      globalIssues: [],
    };

    return {
      rawJsonText: JSON.stringify(defaultPayload),
      provider: this.providerName,
      model: this.model,
      latencyMs: 25,
    };
  }

  async analyzeVisionContext(
    request: VisionReconstructionAIRequest
  ): Promise<AIProviderResult> {
    this.callCount++;

    if (this.options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
    }

    if (this.options.shouldFail) {
      throw new AIProviderError(
        this.options.failureMessage || 'Simulated provider error',
        this.providerName,
        this.options.isTransientFailure !== false,
        this.options.failureStatusCode || 500
      );
    }

    if (this.options.customVisionResponseText) {
      return {
        rawJsonText: this.options.customVisionResponseText,
        provider: this.providerName,
        model: this.model,
        latencyMs: 15,
      };
    }

    // Deterministically generate valid grounded AI output
    const pagesPayload = request.ambiguousPages.map((page, idx) => {
      const q = request.questions[idx % request.questions.length];
      return {
        pageId: page.pageId,
        pageNumber: page.pageNumber,
        questionCandidates: q
          ? [
              {
                questionId: q.id,
                detectedLabel: q.questionNumber,
                confidence: 0.94,
              },
            ]
          : [],
      };
    });

    const attemptsPayload = request.questions.map((q, idx) => {
      const targetPage = request.ambiguousPages[idx % request.ambiguousPages.length];
      return {
        questionId: q.id,
        attemptIndex: 1,
        state: 'ACTIVE' as const,
        pageIds: targetPage ? [targetPage.pageId] : ['mock-page-id'],
        confidence: 0.92,
        reason: `AI detected ${q.questionNumber} heading and answer boundaries`,
      };
    });

    const defaultPayload = {
      scriptId: request.scriptId,
      pages: pagesPayload,
      attempts: attemptsPayload,
      reviewCases: [],
      overallConfidence: 0.92,
      summary: 'Multimodal reconstruction completed with high visual confidence.',
    };

    return {
      rawJsonText: JSON.stringify(defaultPayload),
      provider: this.providerName,
      model: this.model,
      latencyMs: 20,
    };
  }

  async evaluateAnswer(
    request: EvaluationAIRequest
  ): Promise<AIProviderResult> {
    this.callCount++;

    if (this.options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
    }

    if (this.options.shouldFail) {
      throw new AIProviderError(
        this.options.failureMessage || 'Simulated evaluation provider error',
        this.providerName,
        this.options.isTransientFailure !== false,
        this.options.failureStatusCode || 500
      );
    }

    if (this.options.customEvaluationResponseText) {
      return {
        rawJsonText: this.options.customEvaluationResponseText,
        provider: this.providerName,
        model: this.model,
        latencyMs: 18,
      };
    }

    // Parse criterion IDs from user prompt for deterministic grounded output
    const criterionMatches = [...request.userPrompt.matchAll(/Criterion ID: ([a-zA-Z0-9_-]+)/g)];
    const criterionIds = criterionMatches.map(m => m[1]);
    // Parse max marks from each criterion block
    const maxMarksMatches = [...request.userPrompt.matchAll(/Max Marks: ([0-9.]+)/g)];
    const maxMarksList = maxMarksMatches.map(m => parseFloat(m[1]));
    // Parse page IDs
    const pageIdMatches = [...request.userPrompt.matchAll(/\(ID: ([a-zA-Z0-9_-]+)\)/g)];
    const pageIds = pageIdMatches.map(m => m[1]);
    // Parse overall max marks
    const overallMaxMatch = request.userPrompt.match(/MAXIMUM MARKS: ([0-9.]+)/);
    const overallMax = overallMaxMatch ? parseFloat(overallMaxMatch[1]) : 7;

    const mockStatuses = ['SATISFIED', 'SATISFIED', 'PARTIALLY_SATISFIED', 'NOT_SATISFIED', 'SATISFIED'];
    const mockSuggestedRatios = [1.0, 1.0, 0.5, 0.0, 1.0];

    const criteriaPayload = criterionIds.map((cid, idx) => {
      const cMaxMarks = maxMarksList[idx] || 2;
      const statusIdx = idx % mockStatuses.length;
      const status = mockStatuses[statusIdx];
      const suggestedMarks = Math.round(cMaxMarks * mockSuggestedRatios[statusIdx] * 2) / 2;
      const firstPageId = pageIds[0] || 'mock-page-1';

      return {
        criterionId: cid,
        status,
        suggestedMarks,
        maxMarks: cMaxMarks,
        confidenceScore: status === 'SATISFIED' ? 0.94 : status === 'PARTIALLY_SATISFIED' ? 0.78 : 0.91,
        evidenceSummary: status === 'SATISFIED'
          ? 'Student provides correct and complete response for this criterion.'
          : status === 'PARTIALLY_SATISFIED'
            ? 'Student demonstrates partial understanding but misses key details.'
            : 'No relevant content found for this criterion in the answer.',
        evidence: status !== 'NOT_SATISFIED' ? [{
          pageId: firstPageId,
          answerRegionId: null,
          text: 'Student answer text relevant to this criterion.',
          reason: `Evidence observed on page matching ${cid}.`,
        }] : [],
      };
    });

    const totalSuggested = criteriaPayload.reduce((sum, c) => sum + c.suggestedMarks, 0);
    const clampedTotal = Math.min(totalSuggested, overallMax);
    const overallConfidence = criteriaPayload.length > 0
      ? criteriaPayload.reduce((sum, c) => sum + c.confidenceScore, 0) / criteriaPayload.length
      : 0.85;

    const defaultPayload = {
      overallAssessment: {
        summary: 'The answer demonstrates strong foundational knowledge with some gaps in application. Key concepts are correctly identified but the practical example is incomplete.',
        suggestedMarks: clampedTotal,
        maxMarks: overallMax,
        confidenceScore: Math.round(overallConfidence * 100) / 100,
        confidenceBand: overallConfidence >= 0.85 ? 'HIGH' : overallConfidence >= 0.65 ? 'MEDIUM' : 'LOW',
      },
      criteria: criteriaPayload,
      issues: [],
      requiresReview: false,
    };

    return {
      rawJsonText: JSON.stringify(defaultPayload),
      provider: this.providerName,
      model: this.model,
      latencyMs: 22,
    };
  }
}

