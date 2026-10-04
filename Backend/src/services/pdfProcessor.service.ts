/**
 * ANKLYZE Phase 8 - PDF & Page Processing Service
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Renders each page to a PNG before OCR and multimodal analysis.
 * - Preserves 100% of the original document.
 * - Computes basic page quality metrics (dimensions, aspect ratio, orientation).
 * - Never modifies the original PDF destructively.
 */

import { createCanvas, DOMMatrix, ImageData } from "canvas";
import { logger } from "../utils/logger";

export interface ExtractedPageArtifact {
  pageNumber: number;
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  rotation: number;
  qualityScore: number;
}

export interface PDFInspectionResult {
  pageCount: number;
  pages: ExtractedPageArtifact[];
}

export class PDFProcessorService {
  /**
   * Inspects PDF buffer and extracts isolated page artifacts
   */
  public async processPdf(pdfBuffer: Buffer): Promise<PDFInspectionResult> {
    // PDF.js expects the browser geometry types; the server canvas supplies them.
    Object.assign(globalThis, { DOMMatrix, ImageData });
    // Keep the ESM-only PDF.js import intact when TypeScript emits CommonJS.
    const importPdfJs = new Function("moduleName", "return import(moduleName)") as
      (moduleName: string) => Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")>;
    const pdfjs = await importPdfJs("pdfjs-dist/legacy/build/pdf.mjs");
    class NodeCanvasFactory {
      create(width: number, height: number) {
        const canvas = createCanvas(width, height);
        return { canvas, context: canvas.getContext("2d") };
      }
      reset(entry: { canvas: { width: number; height: number } }, width: number, height: number) {
        entry.canvas.width = width;
        entry.canvas.height = height;
      }
      destroy(entry: { canvas: { width: number; height: number } | null; context: unknown }) {
        if (entry.canvas) {
          entry.canvas.width = 0;
          entry.canvas.height = 0;
        }
        entry.canvas = null;
        entry.context = null;
      }
    }
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      disableFontFace: false,
      isEvalSupported: false,
      CanvasFactory: NodeCanvasFactory,
    } as any);
    try {
      const pdfDoc = await loadingTask.promise;
      const pageCount = pdfDoc.numPages;

      logger.info({ pageCount }, "PDFProcessorService: Loaded PDF successfully");

      const pages: ExtractedPageArtifact[] = [];

      for (let i = 0; i < pageCount; i++) {
        const pageNumber = i + 1;
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2.5 });
        const width = Math.ceil(viewport.width);
        const height = Math.ceil(viewport.height);
        const rotation = page.rotate;
        const canvas = createCanvas(width, height);
        const context = canvas.getContext("2d");
        await page.render({ canvasContext: context as any, viewport }).promise;
        const pageBuffer = canvas.toBuffer("image/png");

        const qualityScore = this.calculateQualityScore({
          width,
          height,
          fileSize: pageBuffer.length,
          rotation,
        });

        pages.push({
          pageNumber,
          buffer: pageBuffer,
          mimeType: "image/png",
          width,
          height,
          fileSize: pageBuffer.length,
          rotation,
          qualityScore,
        });
      }

      return {
        pageCount,
        pages,
      };
    } catch (err: any) {
      logger.error({ error: err.message }, "PDFProcessorService: Failed to process PDF");
      throw new Error(`PDF processing failed: ${err.message}`, { cause: err });
    } finally {
      await loadingTask.destroy();
    }
  }

  /**
   * Calculates a basic visual quality signal (0.0 to 1.0)
   * Factors: resolution/dimensions, aspect ratio, orientation
   */
  public calculateQualityScore(metrics: {
    width: number;
    height: number;
    fileSize: number;
    rotation: number;
  }): number {
    let score = 1.0;

    // Standard A4 at 72dpi is approx 595 x 842. Standard scan at 150-300dpi is 1200+ x 1700+.
    const minDimension = Math.min(metrics.width, metrics.height);
    if (minDimension < 400) {
      score -= 0.3; // Low resolution
    } else if (minDimension < 550) {
      score -= 0.1; // Moderate resolution
    }

    // Check reasonable document aspect ratio (between 1.2 and 1.6)
    const maxDimension = Math.max(metrics.width, metrics.height);
    const aspect = maxDimension / Math.max(1, minDimension);
    if (aspect < 1.1 || aspect > 1.8) {
      score -= 0.15; // Unusual aspect ratio
    }

    // Check non-empty file size
    if (metrics.fileSize < 1024) {
      score -= 0.4; // Suspiciously small file
    }

    // Orientation: standard rotation (0, 90, 180, 270)
    if (metrics.rotation % 90 !== 0) {
      score -= 0.2; // Crooked/tilted page
    }

    return Math.max(0.1, Math.min(1.0, parseFloat(score.toFixed(2))));
  }
}

export const pdfProcessorService = new PDFProcessorService();
