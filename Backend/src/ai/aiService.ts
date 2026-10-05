import { IAIProvider } from './providers/aiProvider.interface';
import { GeminiProvider } from './providers/geminiProvider';
import { GroqProvider } from './providers/groqProvider';
import { OpenRouterProvider } from './providers/openRouterProvider';
import {
  RubricAnalysisInput,
  NormalizedRubricAnalysisResult,
  AIProviderError,
} from './types';
import {
  buildRubricAnalysisSystemPrompt,
  buildRubricAnalysisUserPrompt,
  PROMPT_VERSION,
} from './prompts/rubricAnalysisPrompt';
import { validateAndNormalizeAiResponse } from './schemas';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface AIServiceOptions {
  primaryProvider?: IAIProvider;
  fallbackProvider?: IAIProvider;
  timeoutMs?: number;
  promptVersion?: string;
}

export class AIService {
  private primaryProvider: IAIProvider;
  private fallbackProvider?: IAIProvider;
  private timeoutMs: number;
  private promptVersion: string;

  constructor(options: AIServiceOptions = {}) {
    this.timeoutMs = options.timeoutMs || config.AI_REQUEST_TIMEOUT_MS;
    this.promptVersion = options.promptVersion || config.RUBRIC_PROMPT_VERSION || PROMPT_VERSION;

    // Primary provider resolution
    if (options.primaryProvider) {
      this.primaryProvider = options.primaryProvider;
    } else {
      switch (config.AI_PRIMARY_PROVIDER) {
        case 'gemini':
          this.primaryProvider = new GeminiProvider(config.GEMINI_API_KEY, config.GEMINI_MODEL);
          break;
        case 'groq':
          this.primaryProvider = new GroqProvider(config.GROQ_API_KEY, config.GROQ_MODEL);
          break;
        case 'openrouter':
          this.primaryProvider = new OpenRouterProvider(config.OPENROUTER_API_KEY, config.OPENROUTER_MODEL);
          break;
        default:
          this.primaryProvider = new GeminiProvider(config.GEMINI_API_KEY, config.GEMINI_MODEL);
          break;
      }
    }

    // Fallback provider resolution
    if (options.fallbackProvider) {
      this.fallbackProvider = options.fallbackProvider;
    } else if (config.AI_FALLBACK_PROVIDER !== 'none') {
      switch (config.AI_FALLBACK_PROVIDER) {
        case 'groq':
          this.fallbackProvider = new GroqProvider(config.GROQ_API_KEY, config.GROQ_MODEL);
          break;
        case 'openrouter':
          this.fallbackProvider = new OpenRouterProvider(config.OPENROUTER_API_KEY, config.OPENROUTER_MODEL);
          break;
        case 'gemini':
          this.fallbackProvider = new GeminiProvider(config.GEMINI_API_KEY, config.GEMINI_MODEL);
          break;
        default:
          this.fallbackProvider = new GroqProvider(config.GROQ_API_KEY, config.GROQ_MODEL);
          break;
      }
    }
  }

  /**
   * Set custom providers for testing or dynamic override
   */
  setProviders(primary: IAIProvider, fallback?: IAIProvider): void {
    this.primaryProvider = primary;
    this.fallbackProvider = fallback;
  }

  /**
   * Executes AI rubric analysis with primary provider and bounded transient fallback
   */
  async analyzeMarkingScheme(input: RubricAnalysisInput): Promise<NormalizedRubricAnalysisResult> {
    const systemPrompt = buildRubricAnalysisSystemPrompt();
    const userPrompt = buildRubricAnalysisUserPrompt(input);
    const overallStartTime = Date.now();

    logger.info(
      {
        markingSchemeId: input.markingScheme.id,
        exam: input.examTitle,
        questionCount: input.questions.length,
        primaryProvider: this.primaryProvider.providerName,
        fallbackProvider: this.fallbackProvider?.providerName,
        promptVersion: this.promptVersion,
      },
      'ANKLYZE AI: Starting rubric analysis request'
    );

    let rawResult: {
      rawJsonText: string;
      provider: string;
      model: string;
      latencyMs: number;
    } | null = null;

    let fallbackUsed = false;

    // 1. Attempt Primary Provider
    try {
      rawResult = await this.primaryProvider.generateRubricAnalysis(
        systemPrompt,
        userPrompt,
        this.timeoutMs
      );
      logger.info(
        {
          provider: rawResult.provider,
          model: rawResult.model,
          latencyMs: rawResult.latencyMs,
        },
        'ANKLYZE AI: Primary provider successfully returned response'
      );
    } catch (primaryErr: any) {
      const isTransient = primaryErr instanceof AIProviderError ? primaryErr.isTransient : false;
      const primaryProviderName = this.primaryProvider.providerName;

      logger.warn(
        {
          primaryProvider: primaryProviderName,
          error: primaryErr.message,
          isTransient,
        },
        'ANKLYZE AI: Primary provider failed'
      );

      // Only fallback if the failure is transient and a fallback provider is available
      if (isTransient && this.fallbackProvider) {
        logger.info(
          {
            fallbackProvider: this.fallbackProvider.providerName,
            reason: 'Transient failure on primary provider',
          },
          'ANKLYZE AI: Initiating fallback provider'
        );

        try {
          rawResult = await this.fallbackProvider.generateRubricAnalysis(
            systemPrompt,
            userPrompt,
            this.timeoutMs
          );
          fallbackUsed = true;
          logger.info(
            {
              provider: rawResult.provider,
              model: rawResult.model,
              latencyMs: rawResult.latencyMs,
            },
            'ANKLYZE AI: Fallback provider successfully returned response'
          );
        } catch (fallbackErr: any) {
          logger.error(
            {
              primaryError: primaryErr.message,
              fallbackError: fallbackErr.message,
            },
            'ANKLYZE AI: Both primary and fallback providers failed'
          );
          throw new AIProviderError(
            `AI Rubric Analysis failed: Primary provider (${primaryProviderName}: ${primaryErr.message}) and Fallback provider (${this.fallbackProvider.providerName}: ${fallbackErr.message}) both failed.`,
            'multi-provider-failure',
            false
          );
        }
      } else {
        // Non-transient or no fallback configured: do NOT blindly retry
        throw primaryErr;
      }
    }

    if (!rawResult) {
      throw new AIProviderError('No response received from AI providers', 'unknown', false);
    }

    // 2. Validate and Normalize with Zod Schema
    const totalDurationMs = Date.now() - overallStartTime;
    const normalizationResult = validateAndNormalizeAiResponse(
      rawResult.rawJsonText,
      input,
      {
        provider: rawResult.provider,
        model: rawResult.model,
        promptVersion: this.promptVersion,
        fallbackUsed,
        processingDurationMs: totalDurationMs,
      }
    );

    if (!normalizationResult.success) {
      logger.error(
        {
          provider: rawResult.provider,
          error: normalizationResult.error,
          rawOutputSnippet: normalizationResult.rawText?.substring(0, 500),
        },
        'ANKLYZE AI: Schema validation failed for AI output'
      );
      throw new Error(`AI generated invalid rubric format: ${normalizationResult.error}`);
    }

    return normalizationResult.data;
  }
}

export const aiService = new AIService();
