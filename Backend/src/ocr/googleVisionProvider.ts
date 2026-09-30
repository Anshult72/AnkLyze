/**
 * ANKLYZE Phase 8 - Google Cloud Vision OCR Provider
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Uses DOCUMENT_TEXT_DETECTION for dense handwritten and printed exam text.
 * - Extracts hierarchical OCR layout: full text, blocks, paragraphs, words, bounding boxes, confidence.
 * - Normalizes provider output into ANKLYZE's internal format.
 * - Categorizes errors cleanly (transient vs non-transient) for bounded retry logic.
 * - Never logs or exposes credentials.
 */

import { ImageAnnotatorClient } from "@google-cloud/vision";
import { IOCRProvider } from "./ocr.interface";
import {
  BoundingBox,
  NormalizedPageOCRResult,
  OCRBlock,
  OCRParagraph,
  OCRProcessPageInput,
  OCRProviderError,
  OCRWord,
} from "./types";
import { config } from "../config/env";
import { logger } from "../utils/logger";

export class GoogleVisionOCRProvider implements IOCRProvider {
  public readonly name = "google-vision";
  public readonly defaultFeature = "DOCUMENT_TEXT_DETECTION";

  private client: ImageAnnotatorClient | null = null;
  private isConfigured = false;

  constructor() {
    try {
      const options: any = {};
      if (config.GOOGLE_APPLICATION_CREDENTIALS) {
        options.keyFilename = config.GOOGLE_APPLICATION_CREDENTIALS;
      }
      if (config.GOOGLE_CLOUD_PROJECT_ID) {
        options.projectId = config.GOOGLE_CLOUD_PROJECT_ID;
      }
      if (config.GOOGLE_VISION_API_KEY) {
        options.apiKey = config.GOOGLE_VISION_API_KEY;
      }

      // Check if credentials or keyfile available
      if (
        config.GOOGLE_APPLICATION_CREDENTIALS ||
        config.GOOGLE_VISION_API_KEY ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS
      ) {
        this.client = new ImageAnnotatorClient(options);
        this.isConfigured = true;
        logger.info("GoogleVisionOCRProvider: Initialized with Google Cloud credentials");
      } else {
        logger.warn(
          "GoogleVisionOCRProvider: No Google Cloud credentials found in environment. Real cloud OCR calls will fail."
        );
      }
    } catch (err: any) {
      logger.error({ error: err.message }, "GoogleVisionOCRProvider initialization error");
    }
  }

  public getIsConfigured(): boolean {
    return this.isConfigured;
  }

  public async processPage(input: OCRProcessPageInput): Promise<NormalizedPageOCRResult> {
    if (!this.client || !this.isConfigured) {
      throw new OCRProviderError(
        "Google Cloud Vision API is not configured. Please supply GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_VISION_API_KEY.",
        "AUTHENTICATION_FAILURE",
        false,
        401
      );
    }

    const startTime = Date.now();

    try {
      const languageHints =
        input.languageHints && input.languageHints.length > 0
          ? input.languageHints
          : ["en", "hi"];

      const [result] = await this.client.documentTextDetection({
        image: { content: input.buffer },
        imageContext: {
          languageHints,
        },
      });

      const latencyMs = Date.now() - startTime;
      const fullTextAnnotation = result.fullTextAnnotation;

      if (!fullTextAnnotation || !fullTextAnnotation.text) {
        return {
          pageNumber: input.pageNumber,
          fullText: "",
          confidence: 1.0, // Empty page has trivial confidence
          blocks: [],
          provider: "google-vision",
          feature: "DOCUMENT_TEXT_DETECTION",
          pipelineVersion: config.OCR_PIPELINE_VERSION,
          metadata: {
            latencyMs,
            isEmpty: true,
          },
        };
      }

      return this.normalizeVisionResponse(fullTextAnnotation, input.pageNumber, latencyMs);
    } catch (err: any) {
      const errorCategory = this.classifyGoogleError(err);
      const isRetryable =
        errorCategory === "TRANSIENT" ||
        errorCategory === "TIMEOUT" ||
        errorCategory === "RATE_LIMIT";

      throw new OCRProviderError(
        `Google Cloud Vision OCR failed: ${err.message}`,
        errorCategory,
        isRetryable,
        err.code || 500,
        err
      );
    }
  }

  /**
   * Normalizes Google Cloud Vision fullTextAnnotation into ANKLYZE canonical OCR structure
   */
  public normalizeAnnotation(
    annotation: any,
    pageNumber: number,
    latencyMs: number = 50
  ): NormalizedPageOCRResult {
    return this.normalizeVisionResponse(annotation, pageNumber, latencyMs);
  }

  public normalizeVisionResponse(
    annotation: any,
    pageNumber: number,
    latencyMs: number
  ): NormalizedPageOCRResult {
    const fullText = annotation.text || "";
    const blocks: OCRBlock[] = [];
    let totalConfidenceSum = 0;
    let totalConfidenceCount = 0;
    const detectedLanguages: Array<{ languageCode: string; confidence: number }> = [];

    const pages = annotation.pages || [];
    for (const page of pages) {
      if (page.property?.detectedLanguages) {
        for (const lang of page.property.detectedLanguages) {
          detectedLanguages.push({
            languageCode: lang.languageCode || "en",
            confidence: lang.confidence || 0.9,
          });
        }
      }

      for (const block of page.blocks || []) {
        const blockConfidence = block.confidence ?? 0.9;
        totalConfidenceSum += blockConfidence;
        totalConfidenceCount++;

        const paragraphs: OCRParagraph[] = [];
        let blockText = "";

        for (const para of block.paragraphs || []) {
          const words: OCRWord[] = [];
          let paraText = "";

          for (const word of para.words || []) {
            const wordSymbols = (word.symbols || []).map((s: any) => s.text || "").join("");
            const wordConfidence = word.confidence ?? blockConfidence;

            words.push({
              text: wordSymbols,
              confidence: wordConfidence,
              boundingBox: this.extractBoundingBox(word.boundingBox),
            });

            paraText += (paraText ? " " : "") + wordSymbols;
          }

          paragraphs.push({
            text: paraText,
            confidence: para.confidence ?? blockConfidence,
            words,
            boundingBox: this.extractBoundingBox(para.boundingBox),
          });

          blockText += (blockText ? "\n" : "") + paraText;
        }

        blocks.push({
          blockType: block.blockType || "TEXT",
          text: blockText,
          confidence: blockConfidence,
          paragraphs,
          boundingBox: this.extractBoundingBox(block.boundingBox),
        });
      }
    }

    const avgConfidence =
      pages[0]?.confidence ??
      (totalConfidenceCount > 0 ? totalConfidenceSum / totalConfidenceCount : 0.9);

    return {
      pageNumber,
      fullText,
      confidence: parseFloat(avgConfidence.toFixed(4)),
      languageCode: detectedLanguages[0]?.languageCode || "en",
      blocks,
      provider: "google-vision",
      feature: "DOCUMENT_TEXT_DETECTION",
      pipelineVersion: config.OCR_PIPELINE_VERSION,
      metadata: {
        latencyMs,
        detectedLanguages,
        model: "builtin/document-text",
      },
    };
  }

  private extractBoundingBox(box: any): BoundingBox | undefined {
    if (!box || !box.vertices || box.vertices.length === 0) {
      return undefined;
    }

    const xs = box.vertices.map((v: any) => v.x || 0);
    const ys = box.vertices.map((v: any) => v.y || 0);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
      vertices: box.vertices.map((v: any) => ({ x: v.x || 0, y: v.y || 0 })),
    };
  }

  private classifyGoogleError(err: any): OCRProviderError["category"] {
    const code = err.code || err.statusCode;
    const msg = (err.message || "").toLowerCase();

    if (code === 429 || code === 8 || msg.includes("quota") || msg.includes("rate limit")) {
      return "RATE_LIMIT";
    }
    if (code === 4 || code === 504 || msg.includes("deadline") || msg.includes("timeout")) {
      return "TIMEOUT";
    }
    if (code === 14 || code === 503 || msg.includes("unavailable") || msg.includes("service")) {
      return "TRANSIENT";
    }
    if (code === 16 || code === 401 || code === 403 || msg.includes("unauthenticated") || msg.includes("permission")) {
      return "AUTHENTICATION_FAILURE";
    }
    if (code === 3 || code === 400 || msg.includes("invalid") || msg.includes("bad request")) {
      return "INVALID_REQUEST";
    }

    return "UNKNOWN";
  }
}
