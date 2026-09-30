/**
 * ANKLYZE Phase 9 - Multimodal AI Answer Reconstruction Service
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Hybrid Stage 2: invoked ONLY for visually ambiguous pages / uncertain mappings.
 * - Primary provider: Gemini. Fallback: Groq (strictly on eligible transient failures).
 * - Validates AI JSON output strictly with Zod.
 * - Deterministic grounding: rejects/flags unknown question IDs or non-existent page IDs.
 * - Strictly NO marks, NO answer scoring.
 */

import { IAIProvider } from './providers/aiProvider.interface';
import { GeminiProvider } from './providers/geminiProvider';
import { GroqProvider } from './providers/groqProvider';
import { MockAIProvider } from './providers/mockProvider';
import { AIProviderError } from './types';
import {
  VisionReconstructionAIRequest,
  VisionReconstructionAIResponse,
  visionReconstructionResponseSchema,
} from './visionTypes';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface VisionReconstructionExecutionResult {
  data: VisionReconstructionAIResponse;
  provider: string;
  model: string;
  promptVersion: string;
  fallbackUsed: boolean;
  latencyMs: number;
}

export class VisionReconstructionService {
  private primaryProvider: IAIProvider;
  private fallbackProvider?: IAIProvider;

  constructor(
    primaryProvider?: IAIProvider,
    fallbackProvider?: IAIProvider
  ) {
    if (primaryProvider) {
      this.primaryProvider = primaryProvider;
      this.fallbackProvider = fallbackProvider;
    } else {
      // Instantiate based on configuration
      if (config.AI_PRIMARY_PROVIDER === 'mock') {
        this.primaryProvider = new MockAIProvider({
          providerName: 'mock',
          model: 'mock-vision-v1',
        });
      } else {
        this.primaryProvider = new GeminiProvider(
          config.GEMINI_API_KEY,
          config.GEMINI_MODEL,
          config.GEMINI_VISION_MODEL
        );
      }

      if (config.AI_FALLBACK_PROVIDER === 'groq') {
        this.fallbackProvider = new GroqProvider(
          config.GROQ_API_KEY,
          config.GROQ_MODEL,
          config.GROQ_VISION_MODEL
        );
      } else if (config.AI_FALLBACK_PROVIDER === 'mock') {
        this.fallbackProvider = new MockAIProvider({
          providerName: 'mock-fallback',
          model: 'mock-vision-fallback-v1',
        });
      }
    }
  }

  public setProviders(primary: IAIProvider, fallback?: IAIProvider): void {
    this.primaryProvider = primary;
    this.fallbackProvider = fallback;
  }

  /**
   * Executes multimodal AI reconstruction with strict fallback rules.
   */
  public async reconstructAmbiguities(
    request: VisionReconstructionAIRequest
  ): Promise<VisionReconstructionExecutionResult> {
    let rawResult;
    let fallbackUsed = false;
    let activeProvider = this.primaryProvider;

    try {
      if (!this.primaryProvider.analyzeVisionContext) {
        throw new AIProviderError(
          `Primary provider ${this.primaryProvider.providerName} does not implement analyzeVisionContext`,
          this.primaryProvider.providerName,
          false
        );
      }
      rawResult = await this.primaryProvider.analyzeVisionContext(request);
    } catch (primaryErr: any) {
      const isTransient = primaryErr instanceof AIProviderError ? primaryErr.isTransient : false;

      logger.warn(
        {
          provider: this.primaryProvider.providerName,
          isTransient,
          error: primaryErr.message,
        },
        'Primary multimodal AI provider failed for answer reconstruction'
      );

      // Fallback ONLY on eligible transient/provider failures
      if (isTransient && this.fallbackProvider && this.fallbackProvider.analyzeVisionContext) {
        logger.info(
          { fallbackProvider: this.fallbackProvider.providerName },
          'Initiating Groq fallback for multimodal answer reconstruction'
        );
        fallbackUsed = true;
        activeProvider = this.fallbackProvider;
        rawResult = await this.fallbackProvider.analyzeVisionContext(request);
      } else {
        throw primaryErr;
      }
    }

    // Parse and validate with Zod
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawResult.rawJsonText);
    } catch (parseErr: any) {
      throw new AIProviderError(
        `Multimodal AI returned invalid non-JSON string: ${parseErr.message}`,
        activeProvider.providerName,
        false
      );
    }

    const zodValidation = visionReconstructionResponseSchema.safeParse(parsedJson);
    if (!zodValidation.success) {
      const issues = zodValidation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new AIProviderError(
        `Multimodal AI output failed ANKLYZE schema validation: ${issues}`,
        activeProvider.providerName,
        false
      );
    }

    // Deterministic Grounding Verification
    const validatedData = this.groundAndVerify(zodValidation.data, request);

    return {
      data: validatedData,
      provider: rawResult.provider,
      model: rawResult.model,
      promptVersion: config.RECONSTRUCTION_PROMPT_VERSION,
      fallbackUsed,
      latencyMs: rawResult.latencyMs,
    };
  }

  /**
   * Grounds AI output against canonical database question IDs and page IDs.
   * Does NOT silently invent or mutate IDs; flags review cases when ungrounded items occur.
   */
  private groundAndVerify(
    data: VisionReconstructionAIResponse,
    request: VisionReconstructionAIRequest
  ): VisionReconstructionAIResponse {
    const validQuestionIds = new Set(request.questions.map((q) => q.id));
    const validPageIds = new Set(request.ambiguousPages.map((p) => p.pageId));

    const groundedAttempts = [];
    const reviewCases = [...(data.reviewCases || [])];

    for (const attempt of data.attempts) {
      if (!validQuestionIds.has(attempt.questionId)) {
        reviewCases.push({
          issue: 'UNGROUNDED_QUESTION_ID',
          pageIds: attempt.pageIds,
          questionId: attempt.questionId,
          confidence: attempt.confidence,
          reason: `AI output referenced non-existent question ID '${attempt.questionId}'. Flagged for review.`,
        });
        continue;
      }

      // Check if page IDs exist in provided pages
      const ungroundedPages = attempt.pageIds.filter((pid) => !validPageIds.has(pid));
      if (ungroundedPages.length > 0) {
        reviewCases.push({
          issue: 'UNGROUNDED_PAGE_ID',
          pageIds: attempt.pageIds,
          questionId: attempt.questionId,
          confidence: attempt.confidence,
          reason: `AI output referenced non-existent page IDs [${ungroundedPages.join(', ')}]. Flagged for review.`,
        });
        continue;
      }

      groundedAttempts.push(attempt);
    }

    return {
      ...data,
      attempts: groundedAttempts,
      reviewCases,
    };
  }
}

export const visionReconstructionService = new VisionReconstructionService();
