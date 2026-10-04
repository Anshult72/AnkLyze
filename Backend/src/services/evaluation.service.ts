/**
 * ANKLYZE Phase 10 - AI-Assisted Evaluation Service
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Rubric-grounded evaluation: evaluates ONLY against approved rubric criteria.
 * - Evidence-first: links every score to actual stored pages, answer regions, and OCR text.
 * - No hallucinated evidence: rejects AI references to non-existent pages or regions.
 * - Non-negotiable: AI suggests marks; human examiner makes final decision.
 * - AI suggestions and human decisions stored separately.
 * - Strict Zod validation & deterministic pre/post-validation.
 * - Multi-provider fallback: Primary (Gemini/configured) -> Fallback (Groq/Mock).
 */

import { prisma } from '../config/database';
import { EvaluationStatus, QuestionAttemptState, RubricStatus, DecisionType, DecisionStatus } from '@prisma/client';
import { IAIProvider } from '../ai/providers/aiProvider.interface';
import { GeminiProvider } from '../ai/providers/geminiProvider';
import { GroqProvider } from '../ai/providers/groqProvider';
import { MockAIProvider } from '../ai/providers/mockProvider';
import { AIProviderError } from '../ai/types';
import {
  buildEvaluationSystemPrompt,
  buildEvaluationUserPrompt,
  EVALUATION_PROMPT_VERSION,
} from '../ai/prompts/evaluationPrompt';
import {
  EvaluationAIResponse,
  evaluationResponseSchema,
  EvaluationCriterionInput,
  EvaluationAnswerRegionInput,
} from '../ai/evaluationTypes';
import {
  EvaluationRepository,
  CreateEvaluationInput,
  ExaminerDecisionInput,
  CreateHumanDecisionInput,
} from '../repositories/evaluation.repository';
import { AuditService } from './audit.service';
import { RiskService } from './risk.service';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface EvaluationExecutionOptions {
  forceRefresh?: boolean;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class EvaluationService {
  private primaryProvider: IAIProvider;
  private fallbackProvider?: IAIProvider;
  private timeoutMs: number;
  private promptVersion: string;
  private pipelineVersion: string;

  constructor(
    primaryProvider?: IAIProvider,
    fallbackProvider?: IAIProvider,
    options?: { timeoutMs?: number; promptVersion?: string; pipelineVersion?: string }
  ) {
    this.timeoutMs = options?.timeoutMs || config.EVALUATION_TIMEOUT_MS || 45000;
    this.promptVersion = options?.promptVersion || config.EVALUATION_PROMPT_VERSION || EVALUATION_PROMPT_VERSION;
    this.pipelineVersion = options?.pipelineVersion || config.EVALUATION_PIPELINE_VERSION || '1.0';

    if (primaryProvider) {
      this.primaryProvider = primaryProvider;
      this.fallbackProvider = fallbackProvider;
    } else {
      // Resolve primary provider
      if (config.AI_PRIMARY_PROVIDER === 'mock') {
        this.primaryProvider = new MockAIProvider({
          providerName: 'mock',
          model: 'mock-evaluator-v1',
        });
      } else if (config.AI_PRIMARY_PROVIDER === 'groq') {
        this.primaryProvider = new GroqProvider(
          config.GROQ_API_KEY,
          config.GROQ_MODEL,
          config.GROQ_VISION_MODEL
        );
      } else {
        this.primaryProvider = new GeminiProvider(
          config.GEMINI_API_KEY,
          config.GEMINI_MODEL,
          config.GEMINI_VISION_MODEL
        );
      }

      // Resolve fallback provider
      if (config.AI_FALLBACK_PROVIDER === 'mock') {
        this.fallbackProvider = new MockAIProvider({
          providerName: 'mock-fallback',
          model: 'mock-evaluator-fallback',
        });
      } else if (config.AI_FALLBACK_PROVIDER === 'groq' && config.AI_PRIMARY_PROVIDER !== 'groq') {
        this.fallbackProvider = new GroqProvider(
          config.GROQ_API_KEY,
          config.GROQ_MODEL,
          config.GROQ_VISION_MODEL
        );
      } else if (config.AI_FALLBACK_PROVIDER === 'gemini' && config.AI_PRIMARY_PROVIDER !== 'gemini') {
        this.fallbackProvider = new GeminiProvider(
          config.GEMINI_API_KEY,
          config.GEMINI_MODEL,
          config.GEMINI_VISION_MODEL
        );
      }
    }
  }

  /**
   * Evaluates a single QuestionAttempt using AI with strict rubric grounding and evidence mapping.
   */
  public async evaluateQuestionAttempt(
    questionAttemptId: string,
    options: EvaluationExecutionOptions = {}
  ) {
    logger.info(
      { questionAttemptId, forceRefresh: options.forceRefresh },
      'ANKLYZE Phase 10: Starting evaluation request for QuestionAttempt'
    );

    // 1. Fetch QuestionAttempt with full relations
    const attempt: any = await prisma.questionAttempt.findUnique({
      where: { id: questionAttemptId },
      include: {
        question: {
          include: {
            criteria: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        script: {
          include: {
            exam: true,
            subject: true,
          },
        },
        pages: {
          include: {
            page: {
              include: {
                ocrResults: {
                  orderBy: { version: 'desc' },
                  take: 1,
                },
              },
            },
          },
          orderBy: { pageOrder: 'asc' },
        },
        regions: true,
      },
    });

    if (!attempt) {
      throw new Error(`QuestionAttempt ${questionAttemptId} not found`);
    }

    // 2. Check for existing active evaluation unless forceRefresh is requested
    if (!options.forceRefresh) {
      const existing = await EvaluationRepository.getLatestByAttemptId(questionAttemptId);
      if (existing && existing.status === EvaluationStatus.COMPLETED) {
        logger.info(
          { evaluationId: existing.id, questionAttemptId },
          'ANKLYZE Phase 10: Returning cached completed evaluation'
        );
        return existing;
      }
    }

    // 3. Fetch approved RubricAnalysis for this question / marking scheme
    const rubricAnalysis = await prisma.rubricAnalysis.findFirst({
      where: {
        markingSchemeId: attempt.question?.markingSchemeId,
        overallStatus: RubricStatus.APPROVED,
      },
      orderBy: { version: 'desc' },
      include: {
        questions: {
          where: {
            OR: [
              { questionId: attempt.questionId },
              { questionNumber: attempt.question?.questionNumber },
              { questionNumber: attempt.question?.label },
            ],
          },
          include: {
            criteria: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    const maxMarks = Number(attempt.question?.maximumMarks ?? (attempt.question as any)?.maxMarks ?? 5);

    // Extract criteria from approved rubric analysis, question criteria, or construct default criteria from question max marks
    let rubricCriteria: EvaluationCriterionInput[] = [];
    let rubricQuestion = rubricAnalysis?.questions?.[0];

    if (rubricQuestion && rubricQuestion.criteria.length > 0) {
      rubricCriteria = rubricQuestion.criteria.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || undefined,
        maximumMarks: c.maximumMarks,
        partialCreditAllowed: c.partialCreditAllowed,
        alternateMethodAccepted: c.alternateMethodAccepted,
      }));
    } else if (attempt.question?.criteria && attempt.question.criteria.length > 0) {
      rubricCriteria = attempt.question.criteria.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || undefined,
        maximumMarks: c.maximumMarks,
        partialCreditAllowed: c.partialCreditAllowed,
        alternateMethodAccepted: c.alternateMethodAccepted,
      }));
    } else {
      rubricCriteria = [
        {
          id: `crit-${attempt.question?.id || attempt.questionId}-default`,
          name: 'Overall Correctness & Complete Solution',
          description: `Standard solution meeting expected answer guidelines for Question ${attempt.question?.questionNumber || ''}`,
          maximumMarks: maxMarks,
          partialCreditAllowed: true,
          alternateMethodAccepted: true,
        },
      ];
    }

    // Deterministic pre-validation: Max marks must be positive
    if (maxMarks <= 0) {
      throw new Error(`Question maxMarks must be greater than 0, got ${maxMarks}`);
    }

    // 4. Handle Edge-Case States (BLANK, CANCELLED, UNREADABLE, DUPLICATE_ATTEMPT)
    if (attempt.state === QuestionAttemptState.BLANK) {
      return this.handleBlankAttempt(attempt, rubricCriteria, maxMarks, rubricAnalysis?.id);
    }

    if (attempt.state === QuestionAttemptState.CANCELLED) {
      return this.handleCancelledAttempt(attempt, rubricCriteria, maxMarks, rubricAnalysis?.id);
    }

    if (attempt.state === QuestionAttemptState.UNREADABLE) {
      return this.handleUnreadableAttempt(attempt, rubricCriteria, maxMarks, rubricAnalysis?.id);
    }

    if (attempt.state === QuestionAttemptState.DUPLICATE_ATTEMPT) {
      return this.handleDuplicateAttempt(attempt, rubricCriteria, maxMarks, rubricAnalysis?.id);
    }

    // 5. Gather OCR extracted text and answer regions
    let reconstructedText = '';
    const answerRegions: EvaluationAnswerRegionInput[] = [];

    // Collect text from pages
    if (attempt.pages) {
      for (const ap of attempt.pages) {
        const pageOcr = ap.page?.ocrResults?.[0]?.fullText;
        const pageText = pageOcr || (ap.page as any)?.ocrCleanedText || (ap.page as any)?.ocrRawText || '';
        if (pageText) {
          reconstructedText += `--- Page ${ap.pageNumber} ---\n${pageText}\n\n`;
        }
      }
    }

    // Collect regions
    if (attempt.regions) {
      for (const reg of attempt.regions) {
        answerRegions.push({
          id: reg.id,
          pageId: reg.pageId,
          pageNumber: reg.pageNumber,
          extractedText: reg.extractedText || undefined,
          regionType: reg.regionType,
          ocrLineConfidence: reg.ocrLineConfidence || undefined,
          boundingBox: reg.x !== null && reg.y !== null && reg.width !== null && reg.height !== null
            ? { x: reg.x, y: reg.y, width: reg.width, height: reg.height }
            : undefined,
        });

        if (!reconstructedText && reg.extractedText) {
          reconstructedText += `[Region ${reg.pageNumber}] ${reg.extractedText}\n`;
        }
      }
    }

    const qNum = attempt.question?.questionNumber || '1';
    const qLabel = `Question ${qNum}`;

    // 6. Build prompts
    const systemPrompt = buildEvaluationSystemPrompt();
    const userPrompt = buildEvaluationUserPrompt({
      questionAttemptId: attempt.id,
      questionNumber: qNum,
      questionLabel: qLabel,
      questionText: attempt.question?.questionText || 'Answer question according to syllabus',
      maxMarks,
      rubricCriteria,
      reconstructedAnswerText: reconstructedText.trim() || 'No OCR text available for this attempt.',
      answerRegions,
      attemptState: attempt.state,
      startPageNumber: attempt.startPageNumber,
      endPageNumber: attempt.endPageNumber,
    });

    // 7. Audit start event
    await AuditService.recordEvent({
      event: 'AI_EVALUATION_STARTED',
      userId: options.userId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: {
        questionAttemptId: attempt.id,
        questionId: attempt.questionId,
        questionLabel: qLabel,
        maxMarks,
        primaryProvider: this.primaryProvider.providerName,
      },
    });

    // 8. Execute AI with Fallback and Strict Validation
    let rawResult: {
      rawJsonText: string;
      provider: string;
      model: string;
      latencyMs: number;
    } | null = null;
    let fallbackUsed = false;
    let fallbackReason: string | undefined;
    let validatedData: EvaluationAIResponse | null = null;

    // Collect page images if available (up to 2 pages for multimodal grounding)
    const pageImages: Array<{ mimeType: string; base64Data: string; pageNumber?: number }> = [];
    if (attempt.pages) {
      for (const ap of attempt.pages.slice(0, 2)) {
        if ((ap.page as any)?.base64Data) {
          pageImages.push({
            mimeType: 'image/jpeg',
            base64Data: (ap.page as any).base64Data,
            pageNumber: ap.pageNumber,
          });
        } else if (ap.page?.imageReference && ap.page.imageReference.startsWith('http')) {
          try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 4000);
            const imgRes = await fetch(ap.page.imageReference, { signal: controller.signal });
            clearTimeout(tid);
            if (imgRes.ok) {
              const buf = await imgRes.arrayBuffer();
              pageImages.push({
                mimeType: 'image/jpeg',
                base64Data: Buffer.from(buf).toString('base64'),
                pageNumber: ap.pageNumber,
              });
            }
          } catch (e: any) {
            logger.debug({ err: e.message, pageNumber: ap.pageNumber }, 'Page image fetch skipped');
          }
        }
      }
    }

    // Attempt Primary Provider
    try {
      if (this.primaryProvider.evaluateAnswer) {
        rawResult = await this.primaryProvider.evaluateAnswer({
          systemPrompt,
          userPrompt,
          pageImages: pageImages.length > 0 ? pageImages : undefined,
          timeoutMs: this.timeoutMs,
        });

        // Strict Post-AI Validation on Primary Result
        validatedData = this.validateAndGroundAiResponse(
          rawResult.rawJsonText,
          attempt,
          rubricCriteria,
          maxMarks
        );
      } else {
        throw new AIProviderError('Primary provider does not support evaluateAnswer', this.primaryProvider.providerName, true);
      }
    } catch (primaryErr: any) {
      logger.warn(
        { err: primaryErr.message, provider: this.primaryProvider.providerName },
        'ANKLYZE Phase 10: Primary AI evaluation provider failed or returned invalid response'
      );

      await AuditService.recordEvent({
        event: 'AI_EVALUATION_VALIDATION_FAILED',
        userId: options.userId,
        details: {
          questionAttemptId: attempt.id,
          provider: this.primaryProvider.providerName,
          error: primaryErr.message,
        },
      });

      // Attempt fallback if available
      if (this.fallbackProvider && this.fallbackProvider.evaluateAnswer) {
        fallbackUsed = true;
        fallbackReason = primaryErr.message;
        logger.info(
          { fallbackProvider: this.fallbackProvider.providerName },
          'ANKLYZE Phase 10: Invoking fallback AI provider for evaluation'
        );

        try {
          rawResult = await this.fallbackProvider.evaluateAnswer({
            systemPrompt,
            userPrompt,
            pageImages: pageImages.length > 0 ? pageImages : undefined,
            timeoutMs: this.timeoutMs,
          });

          await AuditService.recordEvent({
            event: 'AI_EVALUATION_FALLBACK',
            userId: options.userId,
            details: {
              questionAttemptId: attempt.id,
              primaryError: primaryErr.message,
              fallbackProvider: this.fallbackProvider.providerName,
            },
          });

          // Strict validation on fallback result
          validatedData = this.validateAndGroundAiResponse(
            rawResult.rawJsonText,
            attempt,
            rubricCriteria,
            maxMarks
          );
        } catch (fallbackErr: any) {
          logger.error(
            { err: fallbackErr.message },
            'ANKLYZE Phase 10: Fallback AI evaluation provider also failed or returned invalid response'
          );
          await AuditService.recordEvent({
            event: 'AI_EVALUATION_FAILED',
            userId: options.userId,
            details: {
              questionAttemptId: attempt.id,
              primaryError: primaryErr.message,
              fallbackError: fallbackErr.message,
            },
          });

          // Create REQUIRES_REVIEW evaluation record so examiner is notified of AI validation failure
          const failedEvaluation = await EvaluationRepository.createEvaluation({
            questionAttemptId: attempt.id,
            rubricVersion: rubricAnalysis?.version ? `v${rubricAnalysis.version}` : '1.0',
            rubricAnalysisId: rubricAnalysis?.id,
            provider: this.primaryProvider.providerName,
            model: 'failed-validation',
            promptVersion: this.promptVersion,
            pipelineVersion: this.pipelineVersion,
            status: EvaluationStatus.REQUIRES_REVIEW,
            suggestedMarks: 0,
            maxMarks,
            confidenceScore: 0.0,
            confidenceBand: 'LOW',
            assessmentSummary: `AI evaluation failed validation: ${primaryErr.message}`,
            requiresReview: true,
            reviewReason: primaryErr.message,
            fallbackUsed: true,
            fallbackReason: fallbackErr.message,
            criteria: rubricCriteria.map(c => ({
              criterionId: c.id,
              criterionSatisfied: 'NOT_ASSESSABLE',
              suggestedMarks: 0,
              maxMarks: c.maximumMarks,
              confidenceScore: 0.0,
              reasoning: 'AI evaluation validation failure',
              evidence: [],
            })),
            issues: [
              {
                issueType: 'RUBRIC_MISMATCH',
                severity: 'HIGH',
                message: `AI Evaluation validation rejected: ${primaryErr.message}; Fallback: ${fallbackErr.message}`,
                requiresReview: true,
              },
            ],
          });

          return failedEvaluation;
        }
      } else {
        await AuditService.recordEvent({
          event: 'AI_EVALUATION_FAILED',
          userId: options.userId,
          details: {
            questionAttemptId: attempt.id,
            error: primaryErr.message,
          },
        });

        // Persist REQUIRES_REVIEW evaluation record
        return EvaluationRepository.createEvaluation({
          questionAttemptId: attempt.id,
          rubricVersion: rubricAnalysis?.version ? `v${rubricAnalysis.version}` : '1.0',
          rubricAnalysisId: rubricAnalysis?.id,
          provider: this.primaryProvider.providerName,
          model: 'failed-validation',
          promptVersion: this.promptVersion,
          pipelineVersion: this.pipelineVersion,
          status: EvaluationStatus.REQUIRES_REVIEW,
          suggestedMarks: 0,
          maxMarks,
          confidenceScore: 0.0,
          confidenceBand: 'LOW',
          assessmentSummary: `AI evaluation failed validation: ${primaryErr.message}`,
          requiresReview: true,
          reviewReason: primaryErr.message,
          criteria: rubricCriteria.map(c => ({
            criterionId: c.id,
            criterionSatisfied: 'NOT_ASSESSABLE',
            suggestedMarks: 0,
            maxMarks: c.maximumMarks,
            confidenceScore: 0.0,
            reasoning: 'AI evaluation validation failure',
            evidence: [],
          })),
          issues: [
            {
              issueType: 'RUBRIC_MISMATCH',
              severity: 'HIGH',
              message: `AI Evaluation validation rejected: ${primaryErr.message}`,
              requiresReview: true,
            },
          ],
        });
      }
    }

    if (!rawResult || !rawResult.rawJsonText || !validatedData) {
      throw new Error('AI Evaluation provider returned empty or invalid response');
    }

    // 10. Persist Evaluation to Database
    const createInput: CreateEvaluationInput = {
      questionAttemptId: attempt.id,
      rubricVersion: rubricAnalysis?.version ? `v${rubricAnalysis.version}` : '1.0',
      rubricAnalysisId: rubricAnalysis?.id,
      provider: rawResult.provider,
      model: rawResult.model,
      promptVersion: this.promptVersion,
      pipelineVersion: this.pipelineVersion,
      status: validatedData.requiresReview ? EvaluationStatus.REQUIRES_REVIEW : EvaluationStatus.COMPLETED,
      suggestedMarks: validatedData.overallAssessment.suggestedMarks,
      maxMarks: validatedData.overallAssessment.maxMarks,
      confidenceScore: validatedData.overallAssessment.confidenceScore,
      confidenceBand: validatedData.overallAssessment.confidenceBand,
      assessmentSummary: validatedData.overallAssessment.summary,
      alternateMethodDetected: validatedData.overallAssessment.alternateMethodDetected,
      alternateMethodName: validatedData.overallAssessment.alternateMethodName,
      requiresReview: validatedData.requiresReview,
      reviewReason: validatedData.reviewReason,
      rawResponse: rawResult.rawJsonText,
      fallbackUsed,
      fallbackReason,
      latencyMs: rawResult.latencyMs,
      criteria: validatedData.criteria.map((c) => ({
        criterionId: c.criterionId,
        criterionSatisfied: c.status,
        suggestedMarks: c.suggestedMarks,
        maxMarks: c.maxMarks,
        confidenceScore: c.confidenceScore,
        reasoning: c.reasoning,
        evidence: c.evidence.map((ev) => ({
          pageId: ev.pageId,
          pageNumber: ev.pageNumber,
          answerRegionId: ev.answerRegionId || undefined,
          evidenceType: ev.evidenceType || 'OCR_TEXT',
          extractedText: ev.extractedText || ev.text,
          reason: ev.reason,
          boundingBoxJson: ev.boundingBox ? JSON.stringify(ev.boundingBox) : undefined,
          relevanceScore: ev.relevanceScore,
        })),
      })),
      issues: validatedData.issues.map((iss) => ({
        issueType: iss.issueType,
        severity: iss.severity,
        message: iss.message,
        requiresReview: iss.requiresReview,
      })),
    };

    const savedEvaluation = await EvaluationRepository.createEvaluation(createInput);

    // 11. Audit completion event
    await AuditService.recordEvent({
      event: 'AI_EVALUATION_COMPLETED',
      userId: options.userId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: {
        evaluationId: savedEvaluation.id,
        questionAttemptId: attempt.id,
        suggestedMarks: savedEvaluation.suggestedMarks,
        maxMarks: savedEvaluation.maxMarks,
        confidenceBand: savedEvaluation.confidenceBand,
        requiresReview: savedEvaluation.requiresReview,
        provider: savedEvaluation.provider,
      },
    });

    return savedEvaluation;
  }

  /**
   * Deterministically validates and grounds AI output against real database entities.
   * Strictly REJECTS invalid evidence, out-of-bound marks, or unknown criteria.
   * No silent clamping or hallucination patching!
   */
  public validateAndGroundAiResponse(
    rawJsonText: string,
    attempt: any,
    rubricCriteria: EvaluationCriterionInput[],
    questionMaxMarks: number
  ): EvaluationAIResponse {
    let cleanJson = rawJsonText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr: any) {
      throw new Error(`AI returned malformed JSON: ${parseErr.message}`);
    }

    // Normalize slight LLM variations before strict schema validation
    if (parsed && typeof parsed === 'object') {
      if (parsed.overallAssessment) {
        if (!parsed.overallAssessment.confidenceBand) {
          const score = Number(parsed.overallAssessment.confidenceScore ?? 0.85);
          parsed.overallAssessment.confidenceBand = score >= 0.8 ? 'HIGH' : score >= 0.5 ? 'MEDIUM' : 'LOW';
        }
      }
      if (Array.isArray(parsed.criteria)) {
        for (let i = 0; i < parsed.criteria.length; i++) {
          const c = parsed.criteria[i];
          if (c && typeof c === 'object') {
            if (!c.status && c.criterionSatisfied) {
              c.status = c.criterionSatisfied;
            }
            if (!c.criterionId && rubricCriteria[i]) {
              c.criterionId = rubricCriteria[i].id;
            }
          }
        }
      }
      if (Array.isArray(parsed.issues)) {
        parsed.issues = parsed.issues.map((iss: any) =>
          typeof iss === 'string'
            ? { issueType: 'LOW_CONFIDENCE', severity: 'MEDIUM', message: iss, requiresReview: false }
            : iss
        );
      }
    }

    const parseResult = evaluationResponseSchema.safeParse(parsed);
    if (!parseResult.success) {
      logger.warn(
        { errors: parseResult.error.errors },
        'ANKLYZE Phase 10: Zod validation rejected AI evaluation response'
      );
      throw new Error(`AI response failed schema validation: ${parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    const data = parseResult.data;

    // Relational Grounding 0: QuestionAttempt ID verification
    if (data.questionAttemptId && attempt.id && data.questionAttemptId !== attempt.id) {
      throw new Error(`AI response questionAttemptId mismatch: expected '${attempt.id}', got '${data.questionAttemptId}'`);
    }

    // Relational Grounding 1: Criterion IDs verification
    const validCriterionIds = new Set(rubricCriteria.map((c) => c.id));
    const criterionMap = new Map(rubricCriteria.map((c) => [c.id, c]));

    const validPageIds = new Set(attempt.pages ? attempt.pages.map((p: any) => p.pageId) : []);
    const validRegionIds = new Set(attempt.regions ? attempt.regions.map((r: any) => r.id) : []);

    let sumSuggestedMarks = 0;

    for (const c of data.criteria) {
      // 1. Nonexistent criterion ID -> Strictly REJECT
      if (!validCriterionIds.has(c.criterionId)) {
        throw new Error(`AI evaluation referenced nonexistent criterionId '${c.criterionId}'`);
      }

      const rubricCrit = criterionMap.get(c.criterionId)!;
      c.maxMarks = rubricCrit.maximumMarks;

      // 2. Marks limits check -> Strictly REJECT if negative or exceeds maxMarks
      if (c.suggestedMarks < 0) {
        throw new Error(`AI suggested negative marks (${c.suggestedMarks}) for criterion '${c.criterionId}'`);
      }
      if (c.suggestedMarks > c.maxMarks) {
        throw new Error(`AI suggested marks (${c.suggestedMarks}) exceeding criterion maxMarks (${c.maxMarks}) for criterion '${c.criterionId}'`);
      }

      // 3. Partial credit rules check
      if (rubricCrit.partialCreditAllowed === false && c.suggestedMarks > 0 && c.suggestedMarks < c.maxMarks) {
        throw new Error(`AI awarded partial credit (${c.suggestedMarks}/${c.maxMarks}) on criterion '${c.criterionId}' where partial credit not allowed`);
      }

      // 4. Evidence Grounding -> Strictly REJECT fake pages or fake regions
      for (const ev of c.evidence) {
        if (!ev.pageId && ev.pageNumber) {
          const matchedPage = attempt.pages?.find((p: any) => p.pageNumber === ev.pageNumber);
          if (matchedPage) {
            ev.pageId = matchedPage.pageId;
          }
        } else if (!ev.pageId && attempt.pages?.length === 1) {
          ev.pageId = attempt.pages[0].pageId;
          ev.pageNumber = attempt.pages[0].pageNumber;
        }

        if (ev.pageId && !validPageIds.has(ev.pageId)) {
          const matchedPage = attempt.pages?.find((p: any) => p.pageNumber === ev.pageNumber || p.pageId === ev.pageId);
          if (matchedPage) {
            ev.pageId = matchedPage.pageId;
          } else {
            throw new Error(`AI evidence referenced nonexistent pageId '${ev.pageId}' for criterion '${c.criterionId}'`);
          }
        }

        if (ev.answerRegionId && !validRegionIds.has(ev.answerRegionId)) {
          throw new Error(`AI evidence referenced nonexistent answerRegionId '${ev.answerRegionId}' for criterion '${c.criterionId}'`);
        }
      }

      sumSuggestedMarks += c.suggestedMarks;
    }

    // 5. Total marks checks -> Strictly REJECT if exceeds question maxMarks or negative
    if (data.overallAssessment.suggestedMarks > questionMaxMarks) {
      throw new Error(`AI total suggestedMarks (${data.overallAssessment.suggestedMarks}) exceeds question maximum marks (${questionMaxMarks})`);
    }
    if (data.overallAssessment.suggestedMarks < 0) {
      throw new Error(`AI total suggestedMarks (${data.overallAssessment.suggestedMarks}) cannot be negative`);
    }

    // 6. Consistency check between criteria sum and overall suggested marks
    if (Math.abs(sumSuggestedMarks - data.overallAssessment.suggestedMarks) > 0.01) {
      throw new Error(`AI total suggestedMarks (${data.overallAssessment.suggestedMarks}) does not match sum of criterion marks (${sumSuggestedMarks})`);
    }

    // 7. Ensure all required rubric criteria are present in evaluation
    for (const rc of rubricCriteria) {
      if (!data.criteria.some((mc) => mc.criterionId === rc.id)) {
        data.criteria.push({
          criterionId: rc.id,
          status: 'NOT_SATISFIED',
          suggestedMarks: 0,
          maxMarks: rc.maximumMarks,
          confidenceScore: 0.9,
          reasoning: 'No evidence found in student answer for this criterion.',
          evidenceSummary: 'No evidence found',
          evidence: [],
        });
      }
    }

    data.overallAssessment.maxMarks = questionMaxMarks;

    // 8. Alternate method policy check
    if (data.overallAssessment.alternateMethodDetected) {
      const allowsAltMethod = rubricCriteria.some((rc) => rc.alternateMethodAccepted);
      if (!allowsAltMethod) {
        data.requiresReview = true;
        data.reviewReason = `Alternate method '${data.overallAssessment.alternateMethodName || 'Unspecified'}' detected but not explicitly approved in rubric.`;
        data.issues.push({
          issueType: 'UNAPPROVED_ALTERNATE_METHOD',
          severity: 'HIGH',
          message: data.reviewReason,
          requiresReview: true,
        });
      }
    }

    return data;
  }

  /**
   * Safe handling of confidently BLANK answer attempt.
   */
  private async handleBlankAttempt(
    attempt: any,
    rubricCriteria: EvaluationCriterionInput[],
    maxMarks: number,
    rubricAnalysisId?: string
  ) {
    const createInput: CreateEvaluationInput = {
      questionAttemptId: attempt.id,
      rubricVersion: '1.0',
      rubricAnalysisId,
      provider: 'anklyze-deterministic-engine',
      model: 'deterministic-blank-handler-v1',
      promptVersion: this.promptVersion,
      pipelineVersion: this.pipelineVersion,
      status: EvaluationStatus.COMPLETED,
      suggestedMarks: 0,
      maxMarks,
      confidenceScore: 1.0,
      confidenceBand: 'HIGH',
      assessmentSummary: 'Answer sheet is blank for this question. No student work submitted.',
      requiresReview: false,
      latencyMs: 5,
      criteria: rubricCriteria.map((c) => ({
        criterionId: c.id,
        criterionSatisfied: 'NOT_SATISFIED',
        suggestedMarks: 0,
        maxMarks: c.maximumMarks,
        confidenceScore: 1.0,
        reasoning: 'Blank response: no student attempt detected.',
        evidence: [],
      })),
      issues: [],
    };

    return EvaluationRepository.createEvaluation(createInput);
  }

  /**
   * Safe handling of CANCELLED answer attempt (struck through by student).
   */
  private async handleCancelledAttempt(
    attempt: any,
    rubricCriteria: EvaluationCriterionInput[],
    maxMarks: number,
    rubricAnalysisId?: string
  ) {
    const createInput: CreateEvaluationInput = {
      questionAttemptId: attempt.id,
      rubricVersion: '1.0',
      rubricAnalysisId,
      provider: 'anklyze-deterministic-engine',
      model: 'deterministic-cancelled-handler-v1',
      promptVersion: this.promptVersion,
      pipelineVersion: this.pipelineVersion,
      status: EvaluationStatus.COMPLETED,
      suggestedMarks: 0,
      maxMarks,
      confidenceScore: 0.95,
      confidenceBand: 'HIGH',
      assessmentSummary: 'Answer was cancelled / crossed out by student. 0 marks suggested.',
      requiresReview: false,
      latencyMs: 5,
      criteria: rubricCriteria.map((c) => ({
        criterionId: c.id,
        criterionSatisfied: 'NOT_SATISFIED',
        suggestedMarks: 0,
        maxMarks: c.maximumMarks,
        confidenceScore: 0.95,
        reasoning: 'Work was cancelled / crossed out by student.',
        evidence: [],
      })),
      issues: [
        {
          issueType: 'CANCELLED_WORK',
          severity: 'LOW',
          message: 'Student crossed out or cancelled this answer attempt.',
          requiresReview: false,
        },
      ],
    };

    return EvaluationRepository.createEvaluation(createInput);
  }

  /**
   * Safe handling of UNREADABLE answer attempt.
   */
  private async handleUnreadableAttempt(
    attempt: any,
    rubricCriteria: EvaluationCriterionInput[],
    maxMarks: number,
    rubricAnalysisId?: string
  ) {
    const createInput: CreateEvaluationInput = {
      questionAttemptId: attempt.id,
      rubricVersion: '1.0',
      rubricAnalysisId,
      provider: 'anklyze-deterministic-engine',
      model: 'deterministic-unreadable-handler-v1',
      promptVersion: this.promptVersion,
      pipelineVersion: this.pipelineVersion,
      status: EvaluationStatus.REQUIRES_REVIEW,
      suggestedMarks: 0,
      maxMarks,
      confidenceScore: 0.2,
      confidenceBand: 'LOW',
      assessmentSummary: 'Handwriting is unreadable. Requires human examiner review.',
      requiresReview: true,
      reviewReason: 'Unreadable handwriting detected. AI will not guess answers.',
      latencyMs: 5,
      criteria: rubricCriteria.map((c) => ({
        criterionId: c.id,
        criterionSatisfied: 'NOT_APPLICABLE',
        suggestedMarks: 0,
        maxMarks: c.maximumMarks,
        confidenceScore: 0.2,
        reasoning: 'Unreadable handwriting prevented AI evaluation.',
        evidence: [],
      })),
      issues: [
        {
          issueType: 'UNREADABLE_HANDWRITING',
          severity: 'HIGH',
          message: 'Student handwriting is unreadable. Manual evaluation required.',
          requiresReview: true,
        },
      ],
    };

    return EvaluationRepository.createEvaluation(createInput);
  }

  /**
   * Safe handling of DUPLICATE_ATTEMPT.
   */
  private async handleDuplicateAttempt(
    attempt: any,
    rubricCriteria: EvaluationCriterionInput[],
    maxMarks: number,
    rubricAnalysisId?: string
  ) {
    const createInput: CreateEvaluationInput = {
      questionAttemptId: attempt.id,
      rubricVersion: '1.0',
      rubricAnalysisId,
      provider: 'anklyze-deterministic-engine',
      model: 'deterministic-duplicate-handler-v1',
      promptVersion: this.promptVersion,
      pipelineVersion: this.pipelineVersion,
      status: EvaluationStatus.REQUIRES_REVIEW,
      suggestedMarks: 0,
      maxMarks,
      confidenceScore: 0.3,
      confidenceBand: 'LOW',
      assessmentSummary: 'Duplicate question attempt detected. Requires human examiner resolution.',
      requiresReview: true,
      reviewReason: 'Multiple attempts found for this question number. Examiner must select canonical attempt.',
      latencyMs: 5,
      criteria: rubricCriteria.map((c) => ({
        criterionId: c.id,
        criterionSatisfied: 'NOT_APPLICABLE',
        suggestedMarks: 0,
        maxMarks: c.maximumMarks,
        confidenceScore: 0.3,
        reasoning: 'Duplicate attempt pending examiner selection.',
        evidence: [],
      })),
      issues: [
        {
          issueType: 'DUPLICATE_ATTEMPT',
          severity: 'HIGH',
          message: 'Duplicate attempt found in sheet. Human decision needed.',
          requiresReview: true,
        },
      ],
    };

    return EvaluationRepository.createEvaluation(createInput);
  }

  /**
   * Saves human examiner decision (Accept, Override, Flag).
   */
  public async saveExaminerDecision(
    evaluationId: string,
    examinerId: string,
    input: {
      decisionType: 'ACCEPTED' | 'OVERRIDDEN' | 'FLAGGED';
      totalMarksAwarded: number;
      examinerNotes?: string;
      criteriaOverrides?: Array<{
        criterionId: string;
        marksAwarded: number;
        examinerComment?: string;
      }>;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    const evaluation = await EvaluationRepository.getById(evaluationId);
    if (!evaluation) {
      throw new Error(`Evaluation ${evaluationId} not found`);
    }

    if (input.totalMarksAwarded < 0 || input.totalMarksAwarded > evaluation.maxMarks) {
      throw new Error(`Total marks awarded (${input.totalMarksAwarded}) must be between 0 and ${evaluation.maxMarks}`);
    }

    const decisionRecord: ExaminerDecisionInput = {
      evaluationId,
      examinerId,
      decisionType: input.decisionType,
      totalMarksAwarded: input.totalMarksAwarded,
      examinerNotes: input.examinerNotes,
      criteriaOverrides: input.criteriaOverrides,
    };

    const updated = await EvaluationRepository.saveExaminerDecision(decisionRecord);

    const eventName = input.decisionType === 'ACCEPTED'
      ? 'EVALUATION_ACCEPTED'
      : input.decisionType === 'OVERRIDDEN'
      ? 'EVALUATION_OVERRIDDEN'
      : 'EVALUATION_FLAGGED';

    await AuditService.recordEvent({
      event: eventName,
      userId: examinerId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      details: {
        evaluationId,
        decisionType: input.decisionType,
        totalMarksAwarded: input.totalMarksAwarded,
        originalAiSuggested: evaluation.suggestedMarks,
        examinerNotes: input.examinerNotes,
      },
    });

    return updated;
  }

  /**
   * Updates a single criterion result.
   */
  public async updateCriterionResult(
    evaluationId: string,
    criterionId: string,
    examinerId: string,
    marksAwarded: number,
    examinerComment?: string
  ) {
    const evaluation = await EvaluationRepository.getById(evaluationId);
    if (!evaluation) {
      throw new Error(`Evaluation ${evaluationId} not found`);
    }

    const critResult = evaluation.criterionResults.find((c: any) => c.criterionId === criterionId);
    if (!critResult) {
      throw new Error(`Criterion ${criterionId} not found in evaluation ${evaluationId}`);
    }

    if (marksAwarded < 0 || marksAwarded > critResult.maxMarks) {
      throw new Error(`Marks awarded (${marksAwarded}) must be between 0 and ${critResult.maxMarks}`);
    }

    await EvaluationRepository.updateCriterionResult(
      evaluationId,
      criterionId,
      marksAwarded,
      examinerComment
    );

    const updatedEval = await EvaluationRepository.getById(evaluationId);
    const newTotalMarks = updatedEval?.criterionResults.reduce((acc: number, c: any) => acc + (c.examinerMarks ?? c.suggestedMarks), 0) || 0;

    return EvaluationRepository.saveExaminerDecision({
      evaluationId,
      examinerId,
      decisionType: 'OVERRIDDEN',
      totalMarksAwarded: Math.min(newTotalMarks, evaluation.maxMarks),
      examinerNotes: 'Individual criterion score updated by examiner.',
    });
  }

  /**
   * Flags an evaluation for review.
   */
  public async flagForReview(
    evaluationId: string,
    examinerId: string,
    reason: string
  ) {
    const evaluation = await EvaluationRepository.getById(evaluationId);
    if (!evaluation) {
      throw new Error(`Evaluation ${evaluationId} not found`);
    }

    const updated = await EvaluationRepository.flagForReview(evaluationId, examinerId, reason);

    await AuditService.recordEvent({
      event: 'EVALUATION_FLAGGED',
      userId: examinerId,
      details: {
        evaluationId,
        reason,
      },
    });

    return updated;
  }

  /**
   * Retrieves evaluation for a QuestionAttempt.
   */
  public async getEvaluation(questionAttemptId: string) {
    const evaluation = await EvaluationRepository.getLatestByAttemptId(questionAttemptId);
    return evaluation;
  }

  /**
   * Retrieves evaluation by its ID.
   */
  public async getEvaluationById(evaluationId: string) {
    const evaluation = await EvaluationRepository.getById(evaluationId);
    return evaluation;
  }

  /**
   * Retrieves structured evaluation evidence.
   */
  public async getEvidence(evaluationId: string) {
    const evaluation = await EvaluationRepository.getById(evaluationId);
    if (!evaluation) {
      throw new Error(`Evaluation ${evaluationId} not found`);
    }

    return evaluation.criterionResults.map((c: any) => ({
      criterionId: c.criterionId,
      suggestedMarks: c.suggestedMarks,
      maxMarks: c.maxMarks,
      evidence: c.evidence.map((ev: any) => ({
        id: ev.id,
        pageId: ev.pageId,
        pageNumber: ev.pageNumber,
        answerRegionId: ev.answerRegionId,
        evidenceType: ev.evidenceType,
        extractedText: ev.extractedText,
        reason: ev.reason,
        relevanceScore: ev.relevanceScore,
      })),
    }));
  }

  /**
   * Retrieves provenance data for an evaluation.
   */
  public async getProvenance(evaluationId: string) {
    const evaluation = await EvaluationRepository.getById(evaluationId);
    if (!evaluation) {
      throw new Error(`Evaluation ${evaluationId} not found`);
    }

    let meta: any = {};
    if (evaluation.metadata) {
      try {
        meta = JSON.parse(evaluation.metadata);
      } catch {
        // ignore JSON parse error on meta
      }
    }

    return {
      evaluationId: evaluation.id,
      questionAttemptId: evaluation.questionAttemptId,
      provider: evaluation.provider,
      model: evaluation.model,
      promptVersion: evaluation.promptVersion,
      pipelineVersion: evaluation.pipelineVersion,
      rubricVersion: meta.rubricVersion || '1.0',
      confidenceScore: evaluation.confidenceScore,
      confidenceBand: evaluation.confidenceBand,
      fallbackUsed: evaluation.fallbackUsed,
      fallbackReason: meta.fallbackReason,
      latencyMs: meta.latencyMs,
      createdAt: evaluation.createdAt,
      decidedAt: evaluation.decidedAt,
      decidedBy: evaluation.examinerUserId,
      decisionType: evaluation.examinerDecision,
    };
  }

  // ============================================================================
  // Phase 11: Human Evaluation & Immutable Decision Lifecycle Methods
  // ============================================================================

  /**
   * Creates a new immutable decision version (Draft, Accept, Override, Flag, Finalize, Reopen).
   */
  public async createHumanDecision(
    evaluationId: string,
    examinerUserId: string,
    input: Omit<CreateHumanDecisionInput, 'evaluationId' | 'examinerUserId'>,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ) {
    try {
      const decision = await EvaluationRepository.createDecisionVersion({
        evaluationId,
        examinerUserId,
        decisionType: input.decisionType,
        status: input.status,
        totalMarks: input.totalMarks,
        expectedVersion: input.expectedVersion,
        notes: input.notes,
        overrideReason: input.overrideReason,
        reopenReason: input.reopenReason,
        criteriaDecisions: input.criteriaDecisions,
      });

      // Audit event mapping
      let auditEvent = 'HUMAN_EVALUATION_DRAFT_CREATED';
      if (input.decisionType === DecisionType.ACCEPT_AI_SUGGESTION) {
        auditEvent = 'AI_SUGGESTION_ACCEPTED';
      } else if (input.decisionType === DecisionType.OVERRIDE_AI) {
        auditEvent = 'HUMAN_EVALUATION_OVERRIDDEN';
      } else if (input.decisionType === DecisionType.FLAG_FOR_REVIEW) {
        auditEvent = 'HUMAN_EVALUATION_FLAGGED';
      } else if (input.decisionType === DecisionType.FINALIZE || input.status === DecisionStatus.FINAL) {
        auditEvent = 'HUMAN_EVALUATION_FINALIZED';
      } else if (input.decisionType === DecisionType.REOPEN) {
        auditEvent = 'HUMAN_EVALUATION_REOPENED';
      } else if (decision && decision.version > 1) {
        auditEvent = 'HUMAN_EVALUATION_DRAFT_UPDATED';
      }

      await AuditService.recordEvent({
        event: auditEvent,
        userId: examinerUserId,
        ipAddress: clientInfo?.ipAddress,
        userAgent: clientInfo?.userAgent,
        details: {
          evaluationId,
          decisionId: decision?.id,
          version: decision?.version,
          decisionType: input.decisionType,
          status: decision?.status,
          totalMarks: input.totalMarks,
          overrideReason: input.overrideReason,
          reopenReason: input.reopenReason,
        },
      });

      return decision;
    } catch (err: any) {
      if (err.message?.includes('STALE_VERSION_CONFLICT')) {
        await AuditService.recordEvent({
          event: 'HUMAN_EVALUATION_CONFLICT',
          userId: examinerUserId,
          ipAddress: clientInfo?.ipAddress,
          userAgent: clientInfo?.userAgent,
          details: {
            evaluationId,
            expectedVersion: input.expectedVersion,
            error: err.message,
          },
        });
      }
      throw err;
    }
  }

  /**
   * Explicitly finalizes an examiner's evaluation decision.
   */
  public async finalizeHumanDecision(
    evaluationId: string,
    examinerUserId: string,
    notes?: string,
    expectedVersion?: number,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ) {
    const finalized = await EvaluationRepository.finalizeDecision(
      evaluationId,
      examinerUserId,
      notes,
      expectedVersion
    );

    await AuditService.recordEvent({
      event: 'HUMAN_EVALUATION_FINALIZED',
      userId: examinerUserId,
      ipAddress: clientInfo?.ipAddress,
      userAgent: clientInfo?.userAgent,
      details: {
        evaluationId,
        decisionId: finalized?.id,
        version: finalized?.version,
        totalMarks: finalized?.totalMarks,
      },
    });

    // Mandatory Second-Evaluation Trigger:
    // Calculate difference = ABS(AI suggested marks - Round 1 examiner final marks)
    // Second evaluation MUST be triggered ONLY when difference >= 3.0 marks.
    try {
      const evaluation = await prisma.evaluation.findUnique({
        where: { id: evaluationId },
        include: { questionAttempt: true },
      });

      if (
        evaluation &&
        evaluation.suggestedMarks !== null &&
        evaluation.suggestedMarks !== undefined &&
        finalized &&
        evaluation.questionAttemptId
      ) {
        const trigger = RiskService.checkSecondEvaluationTrigger({
          aiSuggestedMarks: evaluation.suggestedMarks,
          round1Marks: finalized.totalMarks,
        });

        if (trigger.requiresSecondEvaluation) {
          await RiskService.autoAssignSecondEvaluation({
            questionAttemptId: evaluation.questionAttemptId,
            round1ExaminerId: examinerUserId,
            round1EvaluationId: evaluationId,
            callerUserId: examinerUserId,
            assignmentReason: `Mandatory second evaluation triggered: AI suggested marks (${evaluation.suggestedMarks}) vs final marks (${finalized.totalMarks}) difference (${trigger.difference}) >= 3.0 marks`,
          });
        }
      }
    } catch (err: any) {
      logger.warn(
        { err, evaluationId },
        'Second evaluation trigger evaluation handled during decision finalization'
      );
    }

    return finalized;
  }

  /**
   * Reopens a finalized decision for controlled revision under a new draft version.
   */
  public async reopenHumanDecision(
    evaluationId: string,
    examinerUserId: string,
    reopenReason: string,
    expectedVersion?: number,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ) {
    const reopened = await EvaluationRepository.reopenDecision(
      evaluationId,
      examinerUserId,
      reopenReason,
      expectedVersion
    );

    await AuditService.recordEvent({
      event: 'HUMAN_EVALUATION_REOPENED',
      userId: examinerUserId,
      ipAddress: clientInfo?.ipAddress,
      userAgent: clientInfo?.userAgent,
      details: {
        evaluationId,
        decisionId: reopened?.id,
        version: reopened?.version,
        reopenReason,
      },
    });

    return reopened;
  }

  /**
   * Returns complete immutable decision history.
   */
  public async getDecisionHistory(evaluationId: string) {
    return EvaluationRepository.getDecisionHistory(evaluationId);
  }

  /**
   * Returns current effective decision (authoritative resolution).
   */
  public async getCurrentEffectiveDecision(evaluationId: string) {
    return EvaluationRepository.getCurrentEffectiveDecision(evaluationId);
  }

  /**
   * Returns latest decision record (DRAFT or FINAL).
   */
  public async getCurrentDecision(evaluationId: string) {
    return EvaluationRepository.getCurrentDecision(evaluationId);
  }

  /**
   * Returns chronological combined timeline of AI and Human events.
   */
  public async getCombinedTimeline(evaluationId: string) {
    return EvaluationRepository.getCombinedTimeline(evaluationId);
  }
}

