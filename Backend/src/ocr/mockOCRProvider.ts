/**
 * ANKLYZE Phase 8 - Mock OCR Provider
 * Hermetic, deterministic implementation for testing and offline development.
 */

import { IOCRProvider } from "./ocr.interface";
import {
  BoundingBox,
  NormalizedPageOCRResult,
  OCRBlock,
  OCRProcessPageInput,
  OCRProviderError,
} from "./types";

export class MockOCRProvider implements IOCRProvider {
  public readonly name = "mock-ocr";
  public readonly defaultFeature = "DOCUMENT_TEXT_DETECTION";

  private simulateTransientError = false;
  private simulateNonTransientError = false;
  private transientErrorCount = 0;
  private maxTransientErrorsBeforeSuccess = 0;
  private customConfidence: number | null = null;
  private callCount = 0;

  public setSimulateTransientError(enable: boolean, times: number = 1): void {
    this.simulateTransientError = enable;
    this.transientErrorCount = 0;
    this.maxTransientErrorsBeforeSuccess = times;
  }

  public simulateTransientFailure(times: number = 1): void {
    this.setSimulateTransientError(true, times);
  }

  public setSimulateNonTransientError(enable: boolean): void {
    this.simulateNonTransientError = enable;
  }

  public simulateNonTransientFailure(): void {
    this.setSimulateNonTransientError(true);
  }

  public setCustomConfidence(confidence: number | null): void {
    this.customConfidence = confidence;
  }

  public getCallCount(): number {
    return this.callCount;
  }

  public reset(): void {
    this.simulateTransientError = false;
    this.simulateNonTransientError = false;
    this.transientErrorCount = 0;
    this.maxTransientErrorsBeforeSuccess = 0;
    this.customConfidence = null;
    this.callCount = 0;
  }

  public resetFailures(): void {
    this.reset();
  }

  public async processPage(input: OCRProcessPageInput): Promise<NormalizedPageOCRResult> {
    this.callCount++;

    if (this.simulateNonTransientError) {
      throw new OCRProviderError(
        "Invalid document payload: Malformed image header",
        "INVALID_REQUEST",
        false,
        400
      );
    }

    if (this.simulateTransientError) {
      if (this.transientErrorCount < this.maxTransientErrorsBeforeSuccess) {
        this.transientErrorCount++;
        throw new OCRProviderError(
          "Google Cloud Vision API: 503 Service Unavailable (backend quota or momentary timeout)",
          "TRANSIENT",
          true,
          503
        );
      }
    }

    const confidence = this.customConfidence !== null ? this.customConfidence : 0.92;
    const pageNum = input.pageNumber;

    // Generate realistic student answer handwritten OCR text for mock execution
    const mockSampleLines = [
      `Section A - Answer to Question 01`,
      `Let f(z) = u(x, y) + i v(x, y) be an analytic function in the complex domain D.`,
      `By Cauchy-Riemann differential equations: ∂u/∂x = ∂v/∂y and ∂u/∂y = -∂v/∂x.`,
      `Differentiating partially with respect to x gives ∂²u/∂x² = ∂²v/∂x∂y.`,
      `Applying harmonic equation gives Laplace equation ∇²u = 0. Hence harmonic conjugate is verified.`,
    ];

    const fullText = mockSampleLines.join("\n");

    const createBox = (x: number, y: number, width: number, height: number): BoundingBox => ({
      x,
      y,
      width,
      height,
      vertices: [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
      ],
    });

    const blocks: OCRBlock[] = [
      {
        blockType: "TEXT",
        text: mockSampleLines[0],
        confidence,
        boundingBox: createBox(50, 80, 600, 35),
        paragraphs: [
          {
            text: mockSampleLines[0],
            confidence,
            boundingBox: createBox(50, 80, 600, 35),
            words: mockSampleLines[0].split(" ").map((w, idx) => ({
              text: w,
              confidence,
              boundingBox: createBox(50 + idx * 80, 80, 70, 30),
            })),
          },
        ],
      },
      {
        blockType: "TEXT",
        text: mockSampleLines.slice(1).join("\n"),
        confidence,
        boundingBox: createBox(50, 140, 700, 280),
        paragraphs: mockSampleLines.slice(1).map((line, pIdx) => ({
          text: line,
          confidence,
          boundingBox: createBox(50, 140 + pIdx * 50, 680, 40),
          words: line.split(" ").map((w, wIdx) => ({
            text: w,
            confidence,
            boundingBox: createBox(50 + wIdx * 45, 140 + pIdx * 50, 40, 30),
          })),
        })),
      },
    ];

    return {
      pageNumber: pageNum,
      fullText,
      confidence,
      languageCode: input.languageHints?.[0] || "en",
      blocks,
      provider: "mock-ocr",
      feature: "DOCUMENT_TEXT_DETECTION",
      pipelineVersion: "ocr-v1",
      metadata: {
        latencyMs: 12,
        width: input.width || 800,
        height: input.height || 1100,
        retryCount: this.transientErrorCount,
        model: "mock-vision-v1",
        detectedLanguages: [{ languageCode: "en", confidence: 0.99 }],
      },
    };
  }
}
