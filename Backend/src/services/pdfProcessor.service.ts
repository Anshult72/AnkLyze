/**
 * ANKLYZE Phase 8 - PDF & Page Processing Service
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Uses pure JavaScript/TypeScript pdf-lib for cross-platform zero-native-compilation PDF inspection.
 * - Extracts and isolates individual pages while preserving 100% of the original document.
 * - Computes basic page quality metrics (dimensions, aspect ratio, orientation).
 * - Never modifies the original PDF destructively.
 */

import { PDFDocument } from "pdf-lib";
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
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();

      logger.info({ pageCount }, "PDFProcessorService: Loaded PDF successfully");

      const pages: ExtractedPageArtifact[] = [];

      for (let i = 0; i < pageCount; i++) {
        const pageNumber = i + 1;
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        const rotation = page.getRotation().angle;

        // Create an isolated single-page PDF document
        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(pdfDoc, [i]);
        singleDoc.addPage(copiedPage);
        const singlePageBytes = await singleDoc.save();
        const pageBuffer = Buffer.from(singlePageBytes);

        const qualityScore = this.calculateQualityScore({
          width,
          height,
          fileSize: pageBuffer.length,
          rotation,
        });

        pages.push({
          pageNumber,
          buffer: pageBuffer,
          mimeType: "application/pdf",
          width: Math.round(width),
          height: Math.round(height),
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
      throw new Error(`PDF processing failed: ${err.message}`);
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
