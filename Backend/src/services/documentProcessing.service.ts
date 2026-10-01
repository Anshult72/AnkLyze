/**
 * ANKLYZE Phase 8 - Document Processing Service
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Coordinates document extraction, page rendering, OCR, layout extraction, and status transitions.
 * - Original PDF in Cloudinary is strictly preserved as the immutable ground-truth document.
 * - Failure isolation: one failing page does NOT discard other successfully extracted and OCR'd pages.
 * - Idempotent processing with versioned reprocessing provenance.
 * - Audit logging at every pipeline milestone.
 */

import {
  DocumentProcessingRepository,
  documentProcessingRepository,
} from "../repositories/documentProcessing.repository";
import { StorageService, storageService } from "../storage/storageService";
import { PDFProcessorService, pdfProcessorService } from "./pdfProcessor.service";
import { OCRService, ocrService } from "../ocr/ocrService";
import { AuditService } from "./audit.service";
import { logger } from "../utils/logger";
import {
  DocumentProcessingStatus,
  PageProcessingStatus,
  StorageProviderType,
} from "@prisma/client";

export interface ProcessDocumentOptions {
  forceReprocess?: boolean;
  languageHints?: string[];
  userContext?: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface DocumentProcessingSummary {
  scriptId: string;
  scriptCode: string;
  documentStatus: DocumentProcessingStatus;
  totalPages: number;
  completedPages: number;
  needsReviewPages: number;
  failedPages: number;
  averageConfidence: number;
  pages: Array<{
    pageNumber: number;
    processingStatus: PageProcessingStatus;
    confidence?: number;
    qualityScore?: number;
    error?: string;
  }>;
}

export class DocumentProcessingService {
  constructor(
    private readonly repo: DocumentProcessingRepository = documentProcessingRepository,
    private readonly storage: StorageService = storageService,
    private readonly pdfProcessor: PDFProcessorService = pdfProcessorService,
    private readonly ocr: OCRService = ocrService
  ) {}

  /**
   * Processes an uploaded answer script:
   * 1. Downloads original PDF from storage
   * 2. Inspects and extracts individual pages
   * 3. Stores derived page images
   * 4. Runs OCR with bounded retries
   * 5. Saves structured OCR blocks and updates document status
   */
  public async processScriptDocument(
    scriptId: string,
    options: ProcessDocumentOptions = {}
  ): Promise<DocumentProcessingSummary> {
    const script = await this.repo.findScriptWithPages(scriptId);
    if (!script) {
      throw new Error(`SCRIPT_NOT_FOUND: Answer sheet with ID ${scriptId} was not found`);
    }

    // Check idempotency: If already completed and not forced, return existing summary
    if (script.documentStatus === DocumentProcessingStatus.COMPLETED && !options.forceReprocess) {
      logger.info({ scriptId, scriptCode: script.scriptCode }, "Document already processed. Returning existing state.");
      return this.formatSummary(script);
    }

    // Audit: Requested & Started
    await AuditService.recordEvent({
      event: "DOCUMENT_PROCESSING_REQUESTED",
      userId: options.userContext?.userId,
      ipAddress: options.userContext?.ipAddress,
      userAgent: options.userContext?.userAgent,
      details: { scriptId, scriptCode: script.scriptCode, forceReprocess: !!options.forceReprocess },
    });

    await this.repo.updateScriptDocumentStatus(scriptId, DocumentProcessingStatus.PROCESSING);

    await AuditService.recordEvent({
      event: "DOCUMENT_PROCESSING_STARTED",
      userId: options.userContext?.userId,
      details: { scriptId, scriptCode: script.scriptCode },
    });

    // 1. Download original PDF from StorageService
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await this.storage.download(script.storageAssetId, script.storageReference);
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error("Downloaded PDF buffer is empty");
      }
    } catch (downloadErr: any) {
      logger.error({ scriptId, error: downloadErr.message }, "Failed to retrieve answer script from storage");
      await this.repo.updateScriptDocumentStatus(scriptId, DocumentProcessingStatus.FAILED);
      await AuditService.recordEvent({
        event: "DOCUMENT_PROCESSING_FAILED",
        userId: options.userContext?.userId,
        details: { scriptId, error: `Storage download failed: ${downloadErr.message}` },
      });
      throw new Error(`STORAGE_RETRIEVAL_FAILED: Failed to retrieve answer sheet: ${downloadErr.message}`);
    }

    // 2. Inspect PDF and extract page artifacts
    let inspection;
    try {
      inspection = await this.pdfProcessor.processPdf(pdfBuffer);
    } catch (procErr: any) {
      logger.error({ scriptId, error: procErr.message }, "PDF page extraction failed");
      await this.repo.updateScriptDocumentStatus(scriptId, DocumentProcessingStatus.FAILED);
      await AuditService.recordEvent({
        event: "DOCUMENT_PROCESSING_FAILED",
        userId: options.userContext?.userId,
        details: { scriptId, error: `PDF extraction failed: ${procErr.message}` },
      });
      throw new Error(`PDF_EXTRACTION_FAILED: Failed to parse PDF: ${procErr.message}`);
    }

    // 3. Process each page sequentially (fault isolated)
    let completedCount = 0;
    let needsReviewCount = 0;
    let failedCount = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;

    for (const pageArtifact of inspection.pages) {
      const pageNum = pageArtifact.pageNumber;

      try {
        await AuditService.recordEvent({
          event: "PAGE_PROCESSING_STARTED",
          userId: options.userContext?.userId,
          details: { scriptId, pageNumber: pageNum },
        });

        // Store derived page in StorageService
        const pageUploadResult = await this.storage.uploadPage({
          buffer: pageArtifact.buffer,
          mimeType: pageArtifact.mimeType,
          examCode: script.exam?.code || (script as any).examCode || "EXAM",
          subjectCode: script.subject?.code || (script as any).subjectCode || "SUB",
          batchCode: script.batch?.batchCode || (script as any).batchCode || "BATCH",
          scriptCode: script.scriptCode,
          pageNumber: pageNum,
        });

        const providerType =
          pageUploadResult.provider === "CLOUDINARY"
            ? StorageProviderType.CLOUDINARY
            : pageUploadResult.provider === "LOCAL"
            ? StorageProviderType.LOCAL
            : StorageProviderType.MOCK;

        // Upsert ScriptPage record
        const pageRecord = await this.repo.upsertScriptPage({
          scriptId: script.id,
          pageNumber: pageNum,
          storageProvider: providerType,
          storageAssetId: pageUploadResult.assetId,
          imageReference: pageUploadResult.referenceUrl,
          width: pageArtifact.width,
          height: pageArtifact.height,
          fileSize: pageArtifact.fileSize,
          qualityScore: pageArtifact.qualityScore,
          processingStatus: PageProcessingStatus.PROCESSING,
        });

        // Run OCR with bounded retry
        let ocrResult;
        try {
          ocrResult = await this.ocr.processPageWithRetry({
            pageNumber: pageNum,
            buffer: pageArtifact.buffer,
            mimeType: pageArtifact.mimeType,
            width: pageArtifact.width,
            height: pageArtifact.height,
            languageHints: options.languageHints,
          });
        } catch (ocrErr: any) {
          failedCount++;
          logger.error({ pageNum, error: ocrErr.message }, "OCR processing failed for page");
          await this.repo.updatePageStatus(
            pageRecord.id,
            PageProcessingStatus.FAILED,
            ocrErr.message
          );
          await AuditService.recordEvent({
            event: "PAGE_OCR_FAILED",
            userId: options.userContext?.userId,
            details: { pageId: pageRecord.id, pageNumber: pageNum, error: ocrErr.message },
          });
          continue;
        }

        // Determine next version for reprocessing provenance
        const nextVersion = await this.repo.getNextOcrVersion(pageRecord.id);

        // Store PageOCRResult
        await this.repo.createPageOcrResult({
          pageId: pageRecord.id,
          version: nextVersion,
          provider: ocrResult.provider,
          feature: ocrResult.feature,
          pipelineVersion: ocrResult.pipelineVersion,
          confidence: ocrResult.confidence,
          languageCode: ocrResult.languageCode,
          fullText: ocrResult.fullText,
          blocksJson: JSON.stringify(ocrResult.blocks),
          metadata: ocrResult.metadata ? JSON.stringify(ocrResult.metadata) : undefined,
        });

        // Determine page status based on confidence & quality
        let finalPageStatus: PageProcessingStatus = PageProcessingStatus.OCR_COMPLETE;
        if (ocrResult.confidence < 0.6 || pageArtifact.qualityScore < 0.4) {
          finalPageStatus = PageProcessingStatus.NEEDS_REVIEW;
          needsReviewCount++;
        } else {
          completedCount++;
        }

        confidenceSum += ocrResult.confidence;
        confidenceCount++;

        await this.repo.updatePageStatus(pageRecord.id, finalPageStatus);

        await AuditService.recordEvent({
          event: "PAGE_OCR_COMPLETED",
          userId: options.userContext?.userId,
          details: {
            pageId: pageRecord.id,
            pageNumber: pageNum,
            confidence: ocrResult.confidence,
            status: finalPageStatus,
            version: nextVersion,
          },
        });
      } catch (pageErr: any) {
        failedCount++;
        logger.error({ pageNum, error: pageErr.message }, "Unhandled error during page processing");
      }
    }

    // 4. Update overall document status
    const totalPages = inspection.pageCount;
    let finalDocumentStatus: DocumentProcessingStatus;

    if (failedCount === totalPages) {
      finalDocumentStatus = DocumentProcessingStatus.FAILED;
    } else if (failedCount > 0) {
      finalDocumentStatus = DocumentProcessingStatus.PARTIALLY_PROCESSED;
    } else if (needsReviewCount > 0) {
      finalDocumentStatus = DocumentProcessingStatus.NEEDS_REVIEW;
    } else {
      finalDocumentStatus = DocumentProcessingStatus.COMPLETED;
    }

    const avgConfidence =
      confidenceCount > 0 ? parseFloat((confidenceSum / confidenceCount).toFixed(4)) : 0;

    await this.repo.updateScriptDocumentStatus(
      script.id,
      finalDocumentStatus,
      completedCount + needsReviewCount,
      avgConfidence
    );

    const auditEvent =
      finalDocumentStatus === DocumentProcessingStatus.FAILED
        ? "DOCUMENT_PROCESSING_FAILED"
        : "DOCUMENT_PROCESSING_COMPLETED";

    await AuditService.recordEvent({
      event: auditEvent,
      userId: options.userContext?.userId,
      details: {
        scriptId: script.id,
        scriptCode: script.scriptCode,
        documentStatus: finalDocumentStatus,
        totalPages,
        completedPages: completedCount,
        needsReviewPages: needsReviewCount,
        failedPages: failedCount,
        averageConfidence: avgConfidence,
      },
    });

    const refreshed = await this.repo.findScriptWithPages(script.id);
    return this.formatSummary(refreshed || script);
  }

  /**
   * Reprocesses an answer script, creating versioned OCR artifacts (v2)
   */
  public async reprocessScript(
    scriptId: string,
    options: ProcessDocumentOptions = {}
  ): Promise<DocumentProcessingSummary> {
    await AuditService.recordEvent({
      event: "DOCUMENT_REPROCESS_REQUESTED",
      userId: options.userContext?.userId,
      details: { scriptId },
    });

    return this.processScriptDocument(scriptId, {
      ...options,
      forceReprocess: true,
    });
  }

  /**
   * Retrieves current document processing status for a script
   */
  public async getScriptProcessing(scriptId: string) {
    const script = await this.repo.findScriptWithPages(scriptId);
    if (!script) {
      throw new Error(`SCRIPT_NOT_FOUND: Answer sheet with ID ${scriptId} was not found`);
    }
    return this.formatSummary(script);
  }

  /**
   * Retrieves all pages with latest OCR results for a script
   */
  public async getScriptPages(scriptId: string) {
    const script = await this.repo.findScriptWithPages(scriptId);
    if (!script) {
      throw new Error(`SCRIPT_NOT_FOUND: Answer sheet with ID ${scriptId} was not found`);
    }
    return script.pages;
  }

  /**
   * Retrieves a single page with all historical OCR versions
   */
  public async getPageDetail(pageId: string) {
    const page = await this.repo.findPageById(pageId);
    if (!page) {
      throw new Error(`PAGE_NOT_FOUND: Sheet page with ID ${pageId} was not found`);
    }
    return page;
  }

  private formatSummary(script: any): DocumentProcessingSummary {
    const pages = (script.pages || []).map((p: any) => {
      const latestOcr = p.ocrResults?.[0];
      return {
        pageNumber: p.pageNumber,
        processingStatus: p.processingStatus,
        confidence: latestOcr?.confidence,
        qualityScore: p.qualityScore,
        error: p.errorMessage || undefined,
      };
    });

    const completedPages = pages.filter((p: any) => p.processingStatus === PageProcessingStatus.OCR_COMPLETE).length;
    const needsReviewPages = pages.filter((p: any) => p.processingStatus === PageProcessingStatus.NEEDS_REVIEW).length;
    const failedPages = pages.filter((p: any) => p.processingStatus === PageProcessingStatus.FAILED).length;

    return {
      scriptId: script.id,
      scriptCode: script.scriptCode,
      documentStatus: script.documentStatus,
      totalPages: pages.length,
      completedPages,
      needsReviewPages,
      failedPages,
      averageConfidence: script.averageOcrConfidence || 0,
      pages,
    };
  }
}

export const documentProcessingService = new DocumentProcessingService();
