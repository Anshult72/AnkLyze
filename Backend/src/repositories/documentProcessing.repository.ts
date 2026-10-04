/**
 * ANKLYZE Phase 8 - Document Processing Repository
 * "Analyse the marks, not just the paper."
 */

import { prisma } from "../config/database";
import {
  DocumentProcessingStatus,
  PageProcessingStatus,
  StorageProviderType,
} from "@prisma/client";

export interface UpsertPageInput {
  scriptId: string;
  pageNumber: number;
  storageProvider: StorageProviderType;
  storageAssetId: string;
  imageReference: string;
  width?: number;
  height?: number;
  fileSize?: number;
  qualityScore?: number;
  processingStatus: PageProcessingStatus;
  errorMessage?: string;
}

export interface CreateOCRResultInput {
  pageId: string;
  version: number;
  provider: string;
  feature: string;
  pipelineVersion: string;
  confidence: number;
  languageCode?: string;
  fullText: string;
  blocksJson: string;
  metadata?: string;
}

export class DocumentProcessingRepository {
  /**
   * Retrieves an answer script with all pages and their OCR results
   */
  public async findScriptWithPages(scriptId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scriptId);
    return prisma.answerScript.findFirst({
      where: isUuid ? { id: scriptId } : { scriptCode: scriptId },
      include: {
        exam: {
          select: { id: true, code: true, title: true },
        },
        subject: {
          select: { id: true, code: true, name: true },
        },
        batch: {
          select: { id: true, batchCode: true },
        },
        pages: {
          orderBy: { pageNumber: "asc" },
          include: {
            ocrResults: {
              orderBy: { version: "desc" },
            },
          },
        },
      },
    });
  }

  /**
   * Upserts a ScriptPage record (creates if not exists, updates if re-extracting)
   */
  public async upsertScriptPage(data: UpsertPageInput) {
    return prisma.scriptPage.upsert({
      where: {
        scriptId_pageNumber: {
          scriptId: data.scriptId,
          pageNumber: data.pageNumber,
        },
      },
      create: {
        scriptId: data.scriptId,
        pageNumber: data.pageNumber,
        storageProvider: data.storageProvider,
        storageAssetId: data.storageAssetId,
        imageReference: data.imageReference,
        width: data.width,
        height: data.height,
        fileSize: data.fileSize,
        qualityScore: data.qualityScore,
        processingStatus: data.processingStatus,
        errorMessage: data.errorMessage,
      },
      update: {
        storageAssetId: data.storageAssetId,
        imageReference: data.imageReference,
        width: data.width,
        height: data.height,
        fileSize: data.fileSize,
        qualityScore: data.qualityScore,
        processingStatus: data.processingStatus,
        errorMessage: data.errorMessage,
      },
    });
  }

  /**
   * Updates page status and optional error message
   */
  public async updatePageStatus(
    pageId: string,
    status: PageProcessingStatus,
    errorMessage?: string
  ) {
    return prisma.scriptPage.update({
      where: { id: pageId },
      data: {
        processingStatus: status,
        errorMessage: errorMessage || null,
      },
    });
  }

  /**
   * Calculates the next OCR version number for a page (1, 2, ...)
   */
  public async getNextOcrVersion(pageId: string): Promise<number> {
    const latest = await prisma.pageOCRResult.findFirst({
      where: { pageId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return (latest?.version || 0) + 1;
  }

  /**
   * Stores a versioned PageOCRResult
   */
  public async createPageOcrResult(data: CreateOCRResultInput) {
    return prisma.pageOCRResult.create({
      data: {
        pageId: data.pageId,
        version: data.version,
        provider: data.provider,
        feature: data.feature,
        pipelineVersion: data.pipelineVersion,
        confidence: data.confidence,
        languageCode: data.languageCode || null,
        fullText: data.fullText,
        blocksJson: data.blocksJson,
        metadata: data.metadata || null,
      },
    });
  }

  /**
   * Updates document-level processing status, page count, and confidence on AnswerScript
   */
  public async updateScriptDocumentStatus(
    scriptId: string,
    documentStatus: DocumentProcessingStatus,
    processedPagesCount?: number,
    averageOcrConfidence?: number
  ) {
    const data: any = { documentStatus };
    if (processedPagesCount !== undefined) {
      data.processedPagesCount = processedPagesCount;
    }
    if (averageOcrConfidence !== undefined) {
      data.averageOcrConfidence = averageOcrConfidence;
    }

    return prisma.answerScript.update({
      where: { id: scriptId },
      data,
    });
  }

  /**
   * Finds a single page by ID
   */
  public async findPageById(pageId: string) {
    return prisma.scriptPage.findUnique({
      where: { id: pageId },
      include: {
        script: {
          include: {
            exam: { select: { id: true, code: true, title: true } },
            subject: { select: { id: true, code: true, name: true } },
            batch: { select: { id: true, batchCode: true } },
          },
        },
        ocrResults: {
          orderBy: { version: "desc" },
        },
      },
    });
  }
}

export const documentProcessingRepository = new DocumentProcessingRepository();
