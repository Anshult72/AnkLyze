/**
 * ANKLYZE Phase 8 - OCR & Document Processing Types
 * "Analyse the marks, not just the paper."
 * 
 * Strict boundary:
 * OCR extracts text, layout, bounding boxes, and confidence.
 * Multimodal AI evaluation and scoring belong strictly to Phase 9+.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  vertices?: Array<{ x: number; y: number }>;
}

export interface OCRSymbol {
  text: string;
  confidence: number;
}

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox?: BoundingBox;
  symbols?: OCRSymbol[];
}

export interface OCRParagraph {
  text: string;
  confidence: number;
  words: OCRWord[];
  boundingBox?: BoundingBox;
}

export interface OCRBlock {
  blockType?: string; // e.g. "TEXT", "TABLE", "PICTURE"
  text: string;
  confidence: number;
  paragraphs: OCRParagraph[];
  boundingBox?: BoundingBox;
}

export interface NormalizedPageOCRResult {
  pageNumber: number;
  fullText: string;
  confidence: number; // Normalized 0.0 - 1.0
  languageCode?: string;
  blocks: OCRBlock[];
  provider: "google-vision" | "mock" | string;
  feature: "DOCUMENT_TEXT_DETECTION" | string;
  pipelineVersion: string; // e.g. "ocr-v1"
  metadata?: {
    latencyMs?: number;
    width?: number;
    height?: number;
    retryCount?: number;
    model?: string;
    detectedLanguages?: Array<{ languageCode: string; confidence: number }>;
    [key: string]: unknown;
  };
}

export type OCRErrorCategory =
  | "TRANSIENT"
  | "NON_TRANSIENT"
  | "INVALID_REQUEST"
  | "AUTHENTICATION_FAILURE"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "UNKNOWN";

export class OCRProviderError extends Error {
  public readonly category: OCRErrorCategory;
  public readonly isRetryable: boolean;
  public readonly statusCode?: number;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    category: OCRErrorCategory,
    isRetryable: boolean,
    statusCode?: number,
    originalError?: unknown
  ) {
    super(message);
    this.name = "OCRProviderError";
    this.category = category;
    this.isRetryable = isRetryable;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }

  public get code(): string {
    return this.category;
  }

  public get isTransient(): boolean {
    return this.isRetryable;
  }
}

export interface OCRProcessPageInput {
  pageNumber: number;
  buffer: Buffer;
  mimeType: string;
  width?: number;
  height?: number;
  languageHints?: string[];
}
