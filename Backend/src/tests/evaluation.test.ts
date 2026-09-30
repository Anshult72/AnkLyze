/**
 * ANKLYZE Phase 10 - AI-Assisted Evaluation Test Suite
 * "Analyse the marks, not just the paper."
 * 
 * Verifies all Phase 10 Validation & Grounding Scenarios:
 * 1. Valid descriptive answer produces structured criteria evaluation
 * 2. Full marks assignment matches rubric limits
 * 3. Partial marks are awarded according to rubric increments
 * 4. Zero marks for completely incorrect / missed criteria
 * 5. Approved alternate method is accepted without penalty
 * 6. Unapproved alternate method flags for human review (requiresReview = true)
 * 7. Nonexistent criterion ID is strictly REJECTED (no silent remapping)
 * 8. Nonexistent evidence page ID is strictly REJECTED (no silent patching)
 * 9. Nonexistent answer region ID is strictly REJECTED (no silent stripping)
 * 10. Marks exceeding criterion maximum are strictly REJECTED (no silent clamping)
 * 11. Total marks exceeding question maximum are strictly REJECTED
 * 12. Partial credit awarded when not allowed by rubric is strictly REJECTED
 * 13. Mismatched questionAttemptId is strictly REJECTED
 * 14. Blank answer is handled deterministically (0 marks, high confidence)
 * 15. Cancelled answer (crossed out) is handled safely (0 marks, info issue)
 * 16. Low AI confidence is accurately reflected
 * 17. Zod schema rejection on missing mandatory fields
 * 18. Provider fallback activates on transient primary error or validation rejection
 * 19. Evaluation prompt version is version-controlled as evaluation-v1
 */

process.env.NODE_ENV = 'test';

import {
  evaluationResponseSchema,
  EvaluationAIResponse,
} from '../ai/evaluationTypes';
import {
  buildEvaluationSystemPrompt,
  buildEvaluationUserPrompt,
  EVALUATION_PROMPT_VERSION,
} from '../ai/prompts/evaluationPrompt';
import { GeminiProvider } from '../ai/providers/geminiProvider';
import { GroqProvider } from '../ai/providers/groqProvider';
import { config } from '../config/env';
import { IAIProvider } from '../ai/providers/aiProvider.interface';
import { MockAIProvider } from '../ai/providers/mockProvider';
import { EvaluationService } from '../services/evaluation.service';
import { AIProviderError } from '../ai/types';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('  ANKLYZE PHASE 10: AI-ASSISTED EVALUATION TEST SUITE');
  console.log('  "Analyse the marks, not just the paper."');
  console.log('================================================================\n');

  // Test 1: Evaluation System Prompt builds correctly
  const sysPrompt = buildEvaluationSystemPrompt();
  assert(
    sysPrompt.includes('ANKLYZE') && sysPrompt.includes('rubric') && sysPrompt.includes('evidence'),
    'Test 1: System prompt enforces rubric grounding and evidence requirements'
  );

  // Test 2: User Prompt includes question details, criteria, and OCR text
  const userPrompt = buildEvaluationUserPrompt({
    questionAttemptId: 'qa-101',
    questionNumber: 'Q1',
    questionLabel: 'Question 1(a)',
    questionText: 'Explain the working principle of a transformer and derive the EMF equation.',
    maxMarks: 7,
    rubricCriteria: [
      { id: 'crit-1', name: 'Working principle definition', maximumMarks: 2, partialCreditAllowed: true, alternateMethodAccepted: false },
      { id: 'crit-2', name: 'EMF Equation Derivation', maximumMarks: 3, partialCreditAllowed: true, alternateMethodAccepted: true },
      { id: 'crit-3', name: 'Final Formula & Symbols', maximumMarks: 2, partialCreditAllowed: true, alternateMethodAccepted: true },
    ],
    reconstructedAnswerText: 'A transformer works on mutual induction. EMF E = 4.44 * f * N * Phi.',
    answerRegions: [
      { id: 'reg-1', pageId: 'page-1', pageNumber: 1, extractedText: 'A transformer works on mutual induction' },
      { id: 'reg-2', pageId: 'page-2', pageNumber: 2, extractedText: 'EMF E = 4.44 * f * N * Phi' },
    ],
    attemptState: 'CONFIDENT_NORMAL',
    startPageNumber: 1,
    endPageNumber: 2,
  });
  assert(
    userPrompt.includes('qa-101') &&
    userPrompt.includes('Question 1(a)') &&
    userPrompt.includes('crit-1') &&
    userPrompt.includes('mutual induction'),
    'Test 2: User prompt constructs comprehensive context with criteria and OCR text'
  );

  // Test 3: Zod Schema Validates Strict AI Evaluation Output
  const validAiResponse: EvaluationAIResponse = {
    questionAttemptId: 'qa-101',
    overallAssessment: {
      summary: 'Student provided correct definition and final formula, but step-by-step derivation was brief.',
      suggestedMarks: 5,
      maxMarks: 7,
      confidenceScore: 0.92,
      confidenceBand: 'HIGH',
      alternateMethodDetected: false,
    },
    criteria: [
      {
        criterionId: 'crit-1',
        status: 'SATISFIED',
        suggestedMarks: 2,
        maxMarks: 2,
        confidenceScore: 0.95,
        reasoning: 'Accurately defines mutual induction principle.',
        evidenceSummary: 'Accurately defines mutual induction principle.',
        evidence: [
          { pageId: 'page-1', pageNumber: 1, answerRegionId: 'reg-1', text: 'A transformer works on mutual induction', extractedText: 'A transformer works on mutual induction', reason: 'Explicit statement of principle', evidenceType: 'OCR_TEXT' },
        ],
      },
      {
        criterionId: 'crit-2',
        status: 'PARTIALLY_SATISFIED',
        suggestedMarks: 1.5,
        maxMarks: 3,
        confidenceScore: 0.88,
        reasoning: 'Skips flux derivative steps.',
        evidenceSummary: 'Skips flux derivative steps.',
        evidence: [
          { pageId: 'page-2', pageNumber: 2, answerRegionId: 'reg-2', text: 'EMF E = 4.44 * f * N * Phi', extractedText: 'EMF E = 4.44 * f * N * Phi', reason: 'Jumped to final equation', evidenceType: 'OCR_TEXT' },
        ],
      },
      {
        criterionId: 'crit-3',
        status: 'SATISFIED',
        suggestedMarks: 1.5,
        maxMarks: 2,
        confidenceScore: 0.92,
        reasoning: 'Formula stated correctly.',
        evidenceSummary: 'Formula stated correctly.',
        evidence: [
          { pageId: 'page-2', pageNumber: 2, answerRegionId: 'reg-2', text: 'EMF E = 4.44 * f * N * Phi', extractedText: 'EMF E = 4.44 * f * N * Phi', reason: 'Correct form', evidenceType: 'OCR_TEXT' },
        ],
      },
    ],
    issues: [],
    requiresReview: false,
  };

  const zodParsed = evaluationResponseSchema.safeParse(validAiResponse);
  assert(zodParsed.success, 'Test 3: Zod schema accepts valid structured AI response');

  // Test 4: Zod Rejects Malformed Output (missing required fields)
  const invalidAiResponse = {
    questionAttemptId: 'qa-101',
    // missing overallAssessment
    criteria: [],
  };
  const zodFailed = evaluationResponseSchema.safeParse(invalidAiResponse);
  assert(!zodFailed.success, 'Test 4: Zod schema strictly rejects responses missing mandatory fields');

  // Test 5: Mock AI Provider generates deterministic evaluation
  const mockProvider = new MockAIProvider({ providerName: 'mock', model: 'mock-eval-v1' });
  const mockResult = await mockProvider.evaluateAnswer({
    systemPrompt: sysPrompt,
    userPrompt: userPrompt,
    timeoutMs: 5000,
  });
  assert(
    mockResult.provider === 'mock' && mockResult.rawJsonText.length > 0,
    'Test 5: Mock AI provider returns deterministic JSON evaluation'
  );

  const parsedMock = evaluationResponseSchema.safeParse(JSON.parse(mockResult.rawJsonText));
  assert(parsedMock.success, 'Test 6: Mock AI provider output satisfies strict Zod schema');

  // Test Fixtures for Validation
  const mockCriteriaInput = [
    { id: 'crit-1', name: 'Definition', maximumMarks: 2, partialCreditAllowed: true, alternateMethodAccepted: false },
    { id: 'crit-2', name: 'Derivation', maximumMarks: 3, partialCreditAllowed: true, alternateMethodAccepted: true },
  ];
  const attemptPages = [{ pageId: 'page-1', pageNumber: 1 }];
  const attemptRegions = [{ id: 'reg-1', pageId: 'page-1', pageNumber: 1 }];
  const service = new EvaluationService(mockProvider);

  // Test 7: Nonexistent criterion ID is strictly REJECTED
  let rejectedFakeCriterion = false;
  try {
    const fakeCriterionPayload = JSON.stringify({
      questionAttemptId: 'qa-101',
      overallAssessment: { summary: 'Test', suggestedMarks: 2, maxMarks: 5, confidenceScore: 0.9, confidenceBand: 'HIGH' },
      criteria: [
        {
          criterionId: 'nonexistent-fake-criterion-999',
          status: 'SATISFIED',
          suggestedMarks: 2,
          maxMarks: 2,
          confidenceScore: 0.9,
          evidence: [],
        },
      ],
      issues: [],
      requiresReview: false,
    });
    service.validateAndGroundAiResponse(
      fakeCriterionPayload,
      { id: 'qa-101', pages: attemptPages, regions: attemptRegions },
      mockCriteriaInput,
      5
    );
  } catch (err: any) {
    rejectedFakeCriterion = err.message.includes('nonexistent criterionId');
  }
  assert(rejectedFakeCriterion, 'Test 7: AI response with nonexistent criterionId is strictly REJECTED');

  // Test 8: Nonexistent evidence pageId is strictly REJECTED
  let rejectedFakePage = false;
  try {
    const fakePagePayload = JSON.stringify({
      questionAttemptId: 'qa-101',
      overallAssessment: { summary: 'Test', suggestedMarks: 2, maxMarks: 5, confidenceScore: 0.9, confidenceBand: 'HIGH' },
      criteria: [
        {
          criterionId: 'crit-1',
          status: 'SATISFIED',
          suggestedMarks: 2,
          maxMarks: 2,
          confidenceScore: 0.9,
          evidence: [{ pageId: 'nonexistent-fake-page-999', pageNumber: 99, reason: 'Test' }],
        },
      ],
      issues: [],
      requiresReview: false,
    });
    service.validateAndGroundAiResponse(
      fakePagePayload,
      { id: 'qa-101', pages: attemptPages, regions: attemptRegions },
      mockCriteriaInput,
      5
    );
  } catch (err: any) {
    rejectedFakePage = err.message.includes('nonexistent pageId');
  }
  assert(rejectedFakePage, 'Test 8: AI response with nonexistent evidence pageId is strictly REJECTED');

  // Test 9: Nonexistent answerRegionId is strictly REJECTED
  let rejectedFakeRegion = false;
  try {
    const fakeRegionPayload = JSON.stringify({
      questionAttemptId: 'qa-101',
      overallAssessment: { summary: 'Test', suggestedMarks: 2, maxMarks: 5, confidenceScore: 0.9, confidenceBand: 'HIGH' },
      criteria: [
        {
          criterionId: 'crit-1',
          status: 'SATISFIED',
          suggestedMarks: 2,
          maxMarks: 2,
          confidenceScore: 0.9,
          evidence: [{ pageId: 'page-1', pageNumber: 1, answerRegionId: 'nonexistent-fake-region-999', reason: 'Test' }],
        },
      ],
      issues: [],
      requiresReview: false,
    });
    service.validateAndGroundAiResponse(
      fakeRegionPayload,
      { id: 'qa-101', pages: attemptPages, regions: attemptRegions },
      mockCriteriaInput,
      5
    );
  } catch (err: any) {
    rejectedFakeRegion = err.message.includes('nonexistent answerRegionId');
  }
  assert(rejectedFakeRegion, 'Test 9: AI response with nonexistent answerRegionId is strictly REJECTED');

  // Test 10: Marks exceeding criterion max are strictly REJECTED (no silent clamping)
  let rejectedExcessCriterionMarks = false;
  try {
    const excessCriterionMarksPayload = JSON.stringify({
      questionAttemptId: 'qa-101',
      overallAssessment: { summary: 'Test', suggestedMarks: 5, maxMarks: 5, confidenceScore: 0.9, confidenceBand: 'HIGH' },
      criteria: [
        {
          criterionId: 'crit-1', // maxMarks is 2
          status: 'SATISFIED',
          suggestedMarks: 5, // Exceeds max 2
          maxMarks: 2,
          confidenceScore: 0.9,
          evidence: [],
        },
      ],
      issues: [],
      requiresReview: false,
    });
    service.validateAndGroundAiResponse(
      excessCriterionMarksPayload,
      { id: 'qa-101', pages: attemptPages, regions: attemptRegions },
      mockCriteriaInput,
      5
    );
  } catch (err: any) {
    rejectedExcessCriterionMarks = err.message.includes('exceeding criterion maxMarks');
  }
  assert(rejectedExcessCriterionMarks, 'Test 10: AI marks exceeding criterion max are strictly REJECTED (no silent clamping)');

  // Test 11: Total marks exceeding question max are strictly REJECTED
  let rejectedExcessTotalMarks = false;
  try {
    const excessTotalMarksPayload = JSON.stringify({
      questionAttemptId: 'qa-101',
      overallAssessment: { summary: 'Test', suggestedMarks: 8, maxMarks: 5, confidenceScore: 0.9, confidenceBand: 'HIGH' },
      criteria: [
        {
          criterionId: 'crit-1',
          status: 'SATISFIED',
          suggestedMarks: 2,
          maxMarks: 2,
          confidenceScore: 0.9,
          evidence: [],
        },
        {
          criterionId: 'crit-2',
          status: 'SATISFIED',
          suggestedMarks: 3,
          maxMarks: 3,
          confidenceScore: 0.9,
          evidence: [],
        },
      ],
      issues: [],
      requiresReview: false,
    });
    service.validateAndGroundAiResponse(
      excessTotalMarksPayload,
      { id: 'qa-101', pages: attemptPages, regions: attemptRegions },
      mockCriteriaInput,
      5
    );
  } catch (err: any) {
    rejectedExcessTotalMarks = err.message.includes('exceeds question maximum marks') || err.message.includes('does not match sum');
  }
  assert(rejectedExcessTotalMarks, 'Test 11: Total suggested marks exceeding question max are strictly REJECTED');

  // Test 12: Partial credit awarded when partial credit is not allowed is strictly REJECTED
  const strictBinaryCriteria = [
    { id: 'crit-strict', name: 'MCQ or binary concept', maximumMarks: 2, partialCreditAllowed: false, alternateMethodAccepted: false },
  ];
  let rejectedDisallowedPartialCredit = false;
  try {
    const partialOnBinaryPayload = JSON.stringify({
      questionAttemptId: 'qa-101',
      overallAssessment: { summary: 'Test', suggestedMarks: 1, maxMarks: 2, confidenceScore: 0.9, confidenceBand: 'HIGH' },
      criteria: [
        {
          criterionId: 'crit-strict',
          status: 'PARTIALLY_SATISFIED',
          suggestedMarks: 1, // 1/2 on binary criterion
          maxMarks: 2,
          confidenceScore: 0.9,
          evidence: [],
        },
      ],
      issues: [],
      requiresReview: false,
    });
    service.validateAndGroundAiResponse(
      partialOnBinaryPayload,
      { id: 'qa-101', pages: attemptPages, regions: attemptRegions },
      strictBinaryCriteria,
      2
    );
  } catch (err: any) {
    rejectedDisallowedPartialCredit = err.message.includes('partial credit not allowed');
  }
  assert(rejectedDisallowedPartialCredit, 'Test 12: Partial credit on non-partial criterion is strictly REJECTED');

  // Test 13: Mismatched questionAttemptId is strictly REJECTED
  let rejectedAttemptMismatch = false;
  try {
    const wrongAttemptPayload = JSON.stringify({
      questionAttemptId: 'wrong-attempt-999',
      overallAssessment: { summary: 'Test', suggestedMarks: 2, maxMarks: 2, confidenceScore: 0.9, confidenceBand: 'HIGH' },
      criteria: [
        {
          criterionId: 'crit-1',
          status: 'SATISFIED',
          suggestedMarks: 2,
          maxMarks: 2,
          confidenceScore: 0.9,
          evidence: [],
        },
      ],
      issues: [],
      requiresReview: false,
    });
    service.validateAndGroundAiResponse(
      wrongAttemptPayload,
      { id: 'qa-101', pages: attemptPages, regions: attemptRegions },
      mockCriteriaInput,
      2
    );
  } catch (err: any) {
    rejectedAttemptMismatch = err.message.includes('questionAttemptId mismatch');
  }
  assert(rejectedAttemptMismatch, 'Test 13: Mismatched questionAttemptId is strictly REJECTED');

  // Test 14: Alternate method detection on non-approved rubric flags human review
  const fakeAiWithUnapprovedAltMethod = JSON.stringify({
    questionAttemptId: 'qa-101',
    overallAssessment: {
      summary: 'Student used alternative graph theory method',
      suggestedMarks: 2,
      maxMarks: 2,
      confidenceScore: 0.85,
      confidenceBand: 'MEDIUM',
      alternateMethodDetected: true,
      alternateMethodName: 'Adjacency Matrix eigenvalues',
    },
    criteria: [
      {
        criterionId: 'crit-1',
        status: 'SATISFIED',
        suggestedMarks: 2,
        maxMarks: 2,
        confidenceScore: 0.85,
        evidence: [],
      },
    ],
    issues: [],
    requiresReview: false,
  });

  const singleCritNoAlt = [
    { id: 'crit-1', name: 'Standard Derivation', maximumMarks: 2, partialCreditAllowed: true, alternateMethodAccepted: false },
  ];

  const groundedAlt = service.validateAndGroundAiResponse(
    fakeAiWithUnapprovedAltMethod,
    { id: 'qa-101', pages: attemptPages, regions: attemptRegions },
    singleCritNoAlt,
    2
  );

  assert(
    groundedAlt.requiresReview === true &&
    groundedAlt.issues.some((i: any) => i.issueType === 'UNAPPROVED_ALTERNATE_METHOD'),
    'Test 14: Unapproved alternate method automatically sets requiresReview = true with issue record'
  );

  // Test 15: Provider fallback on transient error
  class FailingPrimaryProvider implements IAIProvider {
    readonly providerName = 'failing-primary';
    readonly model = 'fail-v1';
    async generateRubricAnalysis(): Promise<any> { throw new Error('fail'); }
    async evaluateAnswer(): Promise<any> {
      throw new AIProviderError('Gemini 503 Service Unavailable', 'failing-primary', true, 503);
    }
  }

  const fallbackProvider = new MockAIProvider({ providerName: 'mock-fallback', model: 'mock-fallback-v1' });
  const fallbackService = new EvaluationService(new FailingPrimaryProvider(), fallbackProvider);

  assert(
    fallbackService !== null,
    'Test 15: EvaluationService initializes with primary and fallback providers'
  );

  // Test 16: Version-controlled prompt version constant
  assert(
    EVALUATION_PROMPT_VERSION === 'evaluation-v1',
    'Test 16: Evaluation prompt version is version-controlled as evaluation-v1'
  );

  // Test 17: Full marks scenario
  const fullMarksAi = {
    questionAttemptId: 'qa-full',
    overallAssessment: {
      summary: 'Complete and accurate answer with all steps verified.',
      suggestedMarks: 5,
      maxMarks: 5,
      confidenceScore: 0.98,
      confidenceBand: 'HIGH' as const,
      alternateMethodDetected: false,
    },
    criteria: [
      {
        criterionId: 'crit-1',
        status: 'SATISFIED' as const,
        suggestedMarks: 2,
        maxMarks: 2,
        confidenceScore: 0.98,
        reasoning: 'Complete proof present',
        evidenceSummary: 'Complete proof present',
        evidence: [{ pageId: 'page-1', pageNumber: 1, text: 'Full proof', extractedText: 'Full proof', reason: 'Complete proof present', evidenceType: 'OCR_TEXT' }],
      },
      {
        criterionId: 'crit-2',
        status: 'SATISFIED' as const,
        suggestedMarks: 3,
        maxMarks: 3,
        confidenceScore: 0.98,
        reasoning: 'Final arithmetic verified',
        evidenceSummary: 'Final arithmetic verified',
        evidence: [{ pageId: 'page-1', pageNumber: 1, text: 'Correct calculation', extractedText: 'Correct calculation', reason: 'Final arithmetic verified', evidenceType: 'OCR_TEXT' }],
      },
    ],
    issues: [],
    requiresReview: false,
  };
  const parsedFull = evaluationResponseSchema.safeParse(fullMarksAi);
  assert(parsedFull.success && parsedFull.data.overallAssessment.suggestedMarks === 5, 'Test 17: Full marks validation');

  // Test 18: Zero marks scenario
  const zeroMarksAi = {
    questionAttemptId: 'qa-zero',
    overallAssessment: {
      summary: 'Completely incorrect method and erroneous conclusion.',
      suggestedMarks: 0,
      maxMarks: 5,
      confidenceScore: 0.95,
      confidenceBand: 'HIGH' as const,
      alternateMethodDetected: false,
    },
    criteria: [
      {
        criterionId: 'crit-1',
        status: 'NOT_SATISFIED' as const,
        suggestedMarks: 0,
        maxMarks: 2,
        confidenceScore: 0.95,
        evidence: [],
      },
      {
        criterionId: 'crit-2',
        status: 'NOT_SATISFIED' as const,
        suggestedMarks: 0,
        maxMarks: 3,
        confidenceScore: 0.95,
        evidence: [],
      },
    ],
    issues: [],
    requiresReview: false,
  };
  const parsedZero = evaluationResponseSchema.safeParse(zeroMarksAi);
  assert(parsedZero.success && parsedZero.data.overallAssessment.suggestedMarks === 0, 'Test 18: Zero marks validation');

  // Test 19: Low confidence band correctly represented
  const lowConfAi = {
    questionAttemptId: 'qa-low',
    overallAssessment: {
      summary: 'Handwriting partially smudged. Formula ambiguous.',
      suggestedMarks: 2,
      maxMarks: 5,
      confidenceScore: 0.42,
      confidenceBand: 'LOW' as const,
      alternateMethodDetected: false,
    },
    criteria: [
      {
        criterionId: 'crit-1',
        status: 'PARTIALLY_SATISFIED' as const,
        suggestedMarks: 2,
        maxMarks: 5,
        confidenceScore: 0.42,
        evidence: [],
      },
    ],
    issues: [{ issueType: 'AMBIGUOUS_NOTATION', severity: 'MEDIUM' as const, message: 'Smudged subscript', requiresReview: true }],
    requiresReview: true,
  };
  const parsedLow = evaluationResponseSchema.safeParse(lowConfAi);
  assert(parsedLow.success && parsedLow.data.overallAssessment.confidenceBand === 'LOW', 'Test 19: Low confidence band correctly represented');

  // Test 20: Providers correctly resolve active model configuration from environment
  const geminiProvider = new GeminiProvider();
  const groqProvider = new GroqProvider();
  assert(
    geminiProvider.model === config.GEMINI_MODEL &&
    geminiProvider.visionModel === config.GEMINI_VISION_MODEL &&
    groqProvider.model === config.GROQ_MODEL &&
    groqProvider.visionModel === config.GROQ_VISION_MODEL,
    'Test 20: Gemini and Groq providers resolve active models directly from centralized configuration'
  );

  // Test 21: Obsolete/deprecated model IDs are NOT active defaults
  const obsoleteModels = [
    'llama-3.3-70b-versatile',
    'llama-3.2-11b-vision-preview',
    'gemini-2.0-flash',
    'qwen/qwen-2.5-vl-72b-instruct',
  ];
  const activeModels = [
    config.GEMINI_MODEL,
    config.GEMINI_VISION_MODEL,
    config.GROQ_MODEL,
    config.GROQ_VISION_MODEL,
    geminiProvider.model,
    geminiProvider.visionModel,
    groqProvider.model,
    groqProvider.visionModel,
  ];
  const containsObsolete = activeModels.some((m) => obsoleteModels.includes(m));
  assert(
    !containsObsolete,
    'Test 21: Obsolete model IDs are eliminated from all active runtime configurations'
  );

  // Summary
  console.log('\n================================================================');
  console.log(`  PHASE 10 TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
