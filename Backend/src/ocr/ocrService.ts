/**
 * ANKLYZE Phase 8 - OCR Service Orchestrator
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Decouples document processing pipeline from specific OCR vendor SDKs.
 * - Bounded retry handling: retries only TRANSIENT / TIMEOUT / RATE_LIMIT errors.
 * - Never retries authentication or invalid argument errors.
 * - Supports runtime provider swapping for hermetic test execution.
 */

import { IOCRProvider } from "./ocr.interface";
import { GoogleVisionOCRProvider } from "./googleVisionProvider";
import { MockOCRProvider } from "./mockOCRProvider";
import { NormalizedPageOCRResult, OCRProcessPageInput, OCRProviderError } from "./types";
import { config } from "../config/env";
import { logger } from "../utils/logger";

export class OCRService {
  private activeProvider: IOCRProvider;
  private readonly defaultMockProvider: MockOCRProvider;
  private readonly googleVisionProvider: GoogleVisionOCRProvider;

  constructor(customProvider?: IOCRProvider) {
    this.defaultMockProvider = new MockOCRProvider();
    this.googleVisionProvider = new GoogleVisionOCRProvider();

    if (customProvider) {
      this.activeProvider = customProvider;
    } else if (config.OCR_PRIMARY_PROVIDER === "google-vision") {
      this.activeProvider = this.googleVisionProvider;
      logger.info({ configured: this.googleVisionProvider.getIsConfigured() }, "OCRService: Active OCR Provider is GoogleVisionOCRProvider");
    } else {
      if (config.NODE_ENV === "production") {
        throw new Error("Mock OCR cannot be used in production");
      }
      this.activeProvider = this.defaultMockProvider;
      logger.info(
        { requested: config.OCR_PRIMARY_PROVIDER },
        "OCRService: Active OCR Provider is MockOCRProvider (credentials not present or mock configured)"
      );
    }
  }

  public async processPage(input: OCRProcessPageInput): Promise<NormalizedPageOCRResult> {
    return this.processPageWithRetry(input);
  }

  public getActiveProviderName(): string {
    return this.activeProvider.name;
  }

  public setProvider(provider: IOCRProvider): void {
    logger.info({ provider: provider.name }, "OCRService: Swapped active OCR provider");
    this.activeProvider = provider;
  }

  public resetToDefault(): void {
    if (config.OCR_PRIMARY_PROVIDER === "google-vision") {
      this.activeProvider = this.googleVisionProvider;
    } else {
      if (config.NODE_ENV === "production") {
        throw new Error("Mock OCR cannot be used in production");
      }
      this.activeProvider = this.defaultMockProvider;
    }
  }

  public getMockProvider(): MockOCRProvider {
    return this.defaultMockProvider;
  }

  /**
   * Processes a single page with bounded retry on transient errors
   */
  public async processPageWithRetry(
    input: OCRProcessPageInput,
    maxRetries: number = config.OCR_MAX_RETRIES
  ): Promise<NormalizedPageOCRResult> {
    let attempts = 0;
    let lastError: any = null;

    while (attempts <= maxRetries) {
      attempts++;
      try {
        const result = await this.activeProvider.processPage(input);
        if (attempts > 1) {
          logger.info(
            { pageNumber: input.pageNumber, attempts },
            "OCRService: Succeeded on retry attempt"
          );
        }
        return result;
      } catch (err: any) {
        lastError = err;
        const isRetryable = err instanceof OCRProviderError ? err.isRetryable : false;
        const category = err instanceof OCRProviderError ? err.category : "UNKNOWN";

        logger.warn(
          {
            pageNumber: input.pageNumber,
            attempt: attempts,
            isRetryable,
            category,
            error: err.message,
          },
          "OCRService: Page OCR attempt failed"
        );

        // Do not retry non-transient / invalid request errors
        if (!isRetryable || attempts > maxRetries) {
          break;
        }

        // Bounded backoff before next attempt
        const delayMs = Math.min(100 * Math.pow(2, attempts - 1), 1000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError || new OCRProviderError("OCR processing failed after retries", "UNKNOWN", false);
  }
}

export const ocrService = new OCRService();
