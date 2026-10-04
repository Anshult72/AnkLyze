/**
 * ANKLYZE Phase 7 - Answer Script Intake Service
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Scanned PDF validation (extension, MIME, magic bytes, size, empty check, page count)
 * - Cryptographic SHA-256 duplicate detection per exam & subject
 * - ANKLYZE anonymized Script ID generation (e.g. A-10492)
 * - Independent storage abstraction (Cloudinary / Mock)
 * - Resilient failure isolation: one failed file does not break other files in the batch
 * - Controlled audit trail for every intake operation
 */

import { ScriptRepository, scriptRepository } from "../repositories/script.repository";
import { storageService, StorageService } from "../storage/storageService";
import { validateScriptFile, UploadedFileInput } from "../utils/fileValidation";
import { generateScriptCode } from "../utils/scriptCodeGenerator";
import { AuditService } from "./audit.service";
import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { ScriptBatchStatus, ScriptStatus, StorageProviderType } from "@prisma/client";

export interface ScriptUploadResultItem {
  originalFilename: string;
  status: "SUCCESS" | "FAILED" | "DUPLICATE" | "REJECTED";
  scriptId?: string;
  scriptCode?: string;
  checksum?: string;
  pageCount?: number;
  fileSize?: number;
  referenceUrl?: string;
  duplicateOf?: string;
  error?: string;
}

export interface BatchUploadSummary {
  batchId: string;
  batchCode: string;
  examId: string;
  subjectId: string;
  totalFiles: number;
  successful: number;
  failed: number;
  duplicates: number;
  rejected: number;
  batchStatus: ScriptBatchStatus;
  results: ScriptUploadResultItem[];
}

export class ScriptService {
  constructor(
    private readonly repo: ScriptRepository = scriptRepository,
    private readonly storage: StorageService = storageService
  ) {}

  /**
   * Creates an intake batch linked to an Exam and Subject
   */
  async createBatch(params: {
    examId: string;
    subjectId: string;
    batchCode?: string;
    source?: string;
    notes?: string;
    userId?: string;
  }) {
    // 1. Verify exam existence
    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
    });
    if (!exam) {
      throw new Error(`EXAM_NOT_FOUND: Examination with ID ${params.examId} does not exist`);
    }

    // 2. Verify subject existence and ensure it belongs to the exam
    const subject = await prisma.subject.findUnique({
      where: { id: params.subjectId },
    });
    if (!subject) {
      throw new Error(`SUBJECT_NOT_FOUND: Subject with ID ${params.subjectId} does not exist`);
    }

    if (subject.examId !== params.examId) {
      throw new Error("EXAM_SUBJECT_MISMATCH: The selected subject does not belong to the specified examination");
    }

    // 3. Determine or generate batchCode
    let batchCode = params.batchCode?.trim();
    if (!batchCode) {
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      batchCode = `BATCH-${year}-${subject.code.replace(/[^A-Za-z0-9]/g, "")}-${randomSuffix}`;
    }

    // Check duplicate batchCode
    const existing = await this.repo.findBatchByCode(batchCode);
    if (existing) {
      throw new Error(`DUPLICATE_BATCH_CODE: Batch with code '${batchCode}' already exists`);
    }

    // 4. Create batch
    const batch = await this.repo.createBatch({
      batchCode,
      examId: params.examId,
      subjectId: params.subjectId,
      source: params.source || "DIGITAL_SCANNER",
      notes: params.notes,
      createdById: params.userId,
    });

    // 5. Audit log
    await AuditService.recordEvent({
      event: "SCRIPT_BATCH_CREATED",
      userId: params.userId,
      details: {
        batchId: batch.id,
        batchCode: batch.batchCode,
        examCode: exam.code,
        subjectCode: subject.code,
      },
    });

    logger.info({ batchId: batch.id, batchCode: batch.batchCode }, "Script batch created successfully");
    return batch;
  }

  /**
   * Uploads and validates one or multiple PDF answer scripts into a batch
   */
  async processBatchUpload(
    batchId: string,
    files: UploadedFileInput[],
    userContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<BatchUploadSummary> {
    const batch = await this.repo.findBatchById(batchId);
    if (!batch) {
      throw new Error(`BATCH_NOT_FOUND: Sheet batch with ID ${batchId} was not found`);
    }

    if (!files || files.length === 0) {
      throw new Error("NO_FILES_PROVIDED: At least one PDF answer sheet is required for intake");
    }

    // Set batch status to UPLOADING
    await this.repo.updateBatchStatus(batchId, ScriptBatchStatus.UPLOADING);

    const results: ScriptUploadResultItem[] = [];
    let successfulCount = 0;
    let failedCount = 0;
    let duplicateCount = 0;
    let rejectedCount = 0;

    for (const file of files) {
      const filename = file.originalname || "unnamed.pdf";

      try {
        await AuditService.recordEvent({
          event: "SCRIPT_UPLOAD_STARTED",
          userId: userContext?.userId,
          ipAddress: userContext?.ipAddress,
          userAgent: userContext?.userAgent,
          details: { batchId, originalFilename: filename },
        });

        // Step 1: File Validation
        const validation = validateScriptFile(file);
        if (!validation.isValid) {
          rejectedCount++;
          await AuditService.recordEvent({
            event: "SCRIPT_VALIDATION_FAILED",
            userId: userContext?.userId,
            ipAddress: userContext?.ipAddress,
            userAgent: userContext?.userAgent,
            details: { batchId, originalFilename: filename, error: validation.error },
          });

          results.push({
            originalFilename: filename,
            status: "REJECTED",
            error: validation.error,
          });
          continue;
        }

        // Step 2: Checksum Duplicate Detection
        const duplicate = await this.repo.findDuplicateScript(
          batch.exam.id,
          batch.subject.id,
          validation.checksum
        );

        if (duplicate) {
          duplicateCount++;
          await AuditService.recordEvent({
            event: "SCRIPT_DUPLICATE_DETECTED",
            userId: userContext?.userId,
            ipAddress: userContext?.ipAddress,
            userAgent: userContext?.userAgent,
            details: {
              batchId,
              originalFilename: filename,
              checksum: validation.checksum,
              existingScriptCode: duplicate.scriptCode,
            },
          });

          results.push({
            originalFilename: filename,
            status: "DUPLICATE",
            checksum: validation.checksum,
            duplicateOf: duplicate.scriptCode,
            error: `Identical sheet already exists in this subject with Sheet ID ${duplicate.scriptCode}`,
          });
          continue;
        }

        // Step 3: Generate Anonymized Script Code
        let scriptCode = generateScriptCode();
        let attempts = 0;
        while (await this.repo.scriptCodeExists(scriptCode) && attempts < 10) {
          scriptCode = generateScriptCode();
          attempts++;
        }

        // Step 4: Storage Upload (Storage abstraction: Cloudinary or Mock)
        let storageResult;
        try {
          storageResult = await this.storage.uploadScript({
            buffer: file.buffer,
            originalFilename: filename,
            mimeType: "application/pdf",
            examCode: batch.exam.code,
            subjectCode: batch.subject.code,
            batchCode: batch.batchCode,
            scriptCode,
          });
        } catch (storageErr: any) {
          failedCount++;
          logger.error(
            { err: storageErr.message, filename, batchCode: batch.batchCode },
            "Storage provider upload failed"
          );

          await AuditService.recordEvent({
            event: "SCRIPT_UPLOAD_FAILED",
            userId: userContext?.userId,
            ipAddress: userContext?.ipAddress,
            userAgent: userContext?.userAgent,
            details: { batchId, originalFilename: filename, error: storageErr.message },
          });

          results.push({
            originalFilename: filename,
            status: "FAILED",
            error: `Storage upload failed: ${storageErr.message}`,
          });
          continue;
        }

        // Step 5: Database Persistence
        let scriptRecord;
        try {
          const providerType =
            storageResult.provider === "CLOUDINARY"
              ? StorageProviderType.CLOUDINARY
              : storageResult.provider === "LOCAL"
              ? StorageProviderType.LOCAL
              : StorageProviderType.MOCK;

          scriptRecord = await this.repo.createScript({
            scriptCode,
            batchId: batch.id,
            examId: batch.exam.id,
            subjectId: batch.subject.id,
            originalFilename: filename,
            mimeType: "application/pdf",
            fileSize: validation.fileSize,
            checksum: validation.checksum,
            pageCount: validation.pageCount,
            storageProvider: providerType,
            storageAssetId: storageResult.assetId,
            storageReference: storageResult.referenceUrl,
            status: ScriptStatus.READY_FOR_PROCESSING,
            createdById: userContext?.userId,
          });
        } catch (dbErr: any) {
          failedCount++;
          logger.error(
            { err: dbErr.message, scriptCode, assetId: storageResult.assetId },
            "Database script persistence failed - initiating orphan storage cleanup"
          );

          // Clean up orphaned asset from storage
          try {
            await this.storage.deleteAsset(storageResult.assetId);
          } catch (cleanupErr: any) {
            logger.warn({ assetId: storageResult.assetId, err: cleanupErr.message }, "Orphan cleanup failed");
          }

          await AuditService.recordEvent({
            event: "SCRIPT_UPLOAD_FAILED",
            userId: userContext?.userId,
            details: { batchId, scriptCode, error: "Database persistence failed" },
          });

          results.push({
            originalFilename: filename,
            status: "FAILED",
            error: "Failed to save sheet record in database",
          });
          continue;
        }

        // Step 6: File Success
        successfulCount++;
        await AuditService.recordEvent({
          event: "SCRIPT_UPLOADED",
          userId: userContext?.userId,
          details: {
            scriptId: scriptRecord.id,
            scriptCode: scriptRecord.scriptCode,
            batchCode: batch.batchCode,
            pageCount: scriptRecord.pageCount,
          },
        });

        await AuditService.recordEvent({
          event: "SCRIPT_READY_FOR_PROCESSING",
          userId: userContext?.userId,
          details: { scriptId: scriptRecord.id, scriptCode: scriptRecord.scriptCode },
        });

        results.push({
          originalFilename: filename,
          status: "SUCCESS",
          scriptId: scriptRecord.id,
          scriptCode: scriptRecord.scriptCode,
          checksum: scriptRecord.checksum,
          pageCount: scriptRecord.pageCount,
          fileSize: scriptRecord.fileSize,
          referenceUrl: scriptRecord.storageReference,
        });
      } catch (unhandledErr: any) {
        failedCount++;
        results.push({
          originalFilename: filename,
          status: "FAILED",
          error: unhandledErr.message || "Unknown error during sheet intake",
        });
      }
    }

    // Step 7: Update Batch Metrics and Status
    const totalFiles = files.length;
    let finalBatchStatus: ScriptBatchStatus;
    if (successfulCount === totalFiles) {
      finalBatchStatus = ScriptBatchStatus.READY_FOR_PROCESSING;
    } else if (successfulCount > 0) {
      finalBatchStatus = ScriptBatchStatus.PARTIAL_FAILURE;
    } else {
      finalBatchStatus = ScriptBatchStatus.FAILED;
    }

    await this.repo.updateBatchCounters(
      batchId,
      {
        total: totalFiles,
        successful: successfulCount,
        failed: failedCount + rejectedCount,
        duplicate: duplicateCount,
      },
      finalBatchStatus
    );

    return {
      batchId: batch.id,
      batchCode: batch.batchCode,
      examId: batch.exam.id,
      subjectId: batch.subject.id,
      totalFiles,
      successful: successfulCount,
      failed: failedCount,
      duplicates: duplicateCount,
      rejected: rejectedCount,
      batchStatus: finalBatchStatus,
      results,
    };
  }

  /**
   * Retrieves batch details with counters and scripts
   */
  async getBatchDetails(batchId: string) {
    const batch = await this.repo.findBatchById(batchId);
    if (!batch) {
      throw new Error(`BATCH_NOT_FOUND: Batch with ID ${batchId} does not exist`);
    }
    return batch;
  }

  /**
   * Lists batches with filtering
   */
  async listBatches(filter: { examId?: string; subjectId?: string; status?: ScriptBatchStatus }) {
    return this.repo.findBatches(filter);
  }

  /**
   * Retrieves single script details (safe examiner-anonymized metadata)
   */
  async getScriptDetails(scriptId: string) {
    let script = await this.repo.findScriptById(scriptId);
    if (!script) {
      script = await this.repo.findScriptByCode(scriptId);
    }
    if (!script) {
      throw new Error(`SCRIPT_NOT_FOUND: Sheet with ID ${scriptId} does not exist`);
    }
    return script;
  }

  /**
   * Lists scripts with filters and pagination
   */
  async listScripts(filter: {
    examId?: string;
    subjectId?: string;
    batchId?: string;
    status?: ScriptStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return this.repo.findScripts(filter);
  }

  /**
   * Lists scripts for an exam
   */
  async getScriptsByExam(examId: string) {
    return this.repo.findScriptsByExam(examId);
  }

  /**
   * Lists scripts for a subject
   */
  async getScriptsBySubject(subjectId: string) {
    return this.repo.findScriptsBySubject(subjectId);
  }
}

export const scriptService = new ScriptService();
