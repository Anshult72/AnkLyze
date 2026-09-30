/**
 * ANKLYZE Phase 7 - Answer Script & Batch Repository
 * "Analyse the marks, not just the paper."
 */

import { prisma } from "../config/database";
import {
  ScriptBatchStatus,
  ScriptStatus,
  StorageProviderType,
} from "@prisma/client";

export interface CreateBatchInput {
  batchCode: string;
  examId: string;
  subjectId: string;
  source?: string;
  notes?: string;
  createdById?: string;
}

export interface CreateScriptInput {
  scriptCode: string;
  batchId: string;
  examId: string;
  subjectId: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  pageCount: number;
  storageProvider: StorageProviderType;
  storageAssetId: string;
  storageReference: string;
  barcodeValue?: string;
  status: ScriptStatus;
  errorMessage?: string;
  metadata?: string;
  createdById?: string;
}

export class ScriptRepository {
  /**
   * Creates a new ScriptBatch record
   */
  async createBatch(input: CreateBatchInput) {
    return prisma.scriptBatch.create({
      data: {
        batchCode: input.batchCode,
        examId: input.examId,
        subjectId: input.subjectId,
        source: input.source || "DIGITAL_SCANNER",
        notes: input.notes,
        createdById: input.createdById,
        status: ScriptBatchStatus.CREATED,
      },
      include: {
        exam: {
          select: { id: true, title: true, code: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  /**
   * Finds batch by ID with related exam, subject, creator, and script count
   */
  async findBatchById(batchId: string) {
    return prisma.scriptBatch.findUnique({
      where: { id: batchId },
      include: {
        exam: {
          select: { id: true, title: true, code: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { scripts: true },
        },
      },
    });
  }

  /**
   * Finds batch by unique batch code
   */
  async findBatchByCode(batchCode: string) {
    return prisma.scriptBatch.findUnique({
      where: { batchCode },
    });
  }

  /**
   * Lists batches with optional filtering by exam, subject, and status
   */
  async findBatches(filter: { examId?: string; subjectId?: string; status?: ScriptBatchStatus }) {
    const where: any = {};
    if (filter.examId) where.examId = filter.examId;
    if (filter.subjectId) where.subjectId = filter.subjectId;
    if (filter.status) where.status = filter.status;

    return prisma.scriptBatch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        exam: {
          select: { id: true, title: true, code: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, fullName: true },
        },
        _count: {
          select: { scripts: true },
        },
      },
    });
  }

  /**
   * Updates batch metrics (total, successful, failed, duplicates) and status
   */
  async updateBatchCounters(
    batchId: string,
    delta: { total?: number; successful?: number; failed?: number; duplicate?: number },
    status?: ScriptBatchStatus
  ) {
    const data: any = {};
    if (delta.total) data.totalScripts = { increment: delta.total };
    if (delta.successful) data.successfulScripts = { increment: delta.successful };
    if (delta.failed) data.failedScripts = { increment: delta.failed };
    if (delta.duplicate) data.duplicateScripts = { increment: delta.duplicate };
    if (status) data.status = status;

    return prisma.scriptBatch.update({
      where: { id: batchId },
      data,
    });
  }

  /**
   * Sets batch status
   */
  async updateBatchStatus(batchId: string, status: ScriptBatchStatus) {
    return prisma.scriptBatch.update({
      where: { id: batchId },
      data: { status },
    });
  }

  /**
   * Checks for duplicate checksum within the same Exam and Subject
   */
  async findDuplicateScript(examId: string, subjectId: string, checksum: string) {
    return prisma.answerScript.findFirst({
      where: {
        examId,
        subjectId,
        checksum,
      },
      include: {
        batch: {
          select: { id: true, batchCode: true },
        },
      },
    });
  }

  /**
   * Checks if scriptCode exists (for uniqueness guarantee)
   */
  async scriptCodeExists(scriptCode: string): Promise<boolean> {
    const count = await prisma.answerScript.count({
      where: { scriptCode },
    });
    return count > 0;
  }

  /**
   * Creates an AnswerScript record
   */
  async createScript(input: CreateScriptInput) {
    return prisma.answerScript.create({
      data: {
        scriptCode: input.scriptCode,
        batchId: input.batchId,
        examId: input.examId,
        subjectId: input.subjectId,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        checksum: input.checksum,
        pageCount: input.pageCount,
        storageProvider: input.storageProvider,
        storageAssetId: input.storageAssetId,
        storageReference: input.storageReference,
        barcodeValue: input.barcodeValue || null,
        status: input.status,
        errorMessage: input.errorMessage || null,
        metadata: input.metadata || null,
        createdById: input.createdById || null,
      },
      include: {
        exam: {
          select: { id: true, title: true, code: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
        batch: {
          select: { id: true, batchCode: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  /**
   * Finds script by ID with relations
   */
  async findScriptById(scriptId: string) {
    return prisma.answerScript.findUnique({
      where: { id: scriptId },
      include: {
        exam: {
          select: { id: true, title: true, code: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
        batch: {
          select: { id: true, batchCode: true, status: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  /**
   * Finds script by anonymized script code
   */
  async findScriptByCode(scriptCode: string) {
    return prisma.answerScript.findUnique({
      where: { scriptCode },
      include: {
        exam: {
          select: { id: true, title: true, code: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
        batch: {
          select: { id: true, batchCode: true },
        },
      },
    });
  }

  /**
   * Lists scripts with filters (batchId, examId, subjectId, status, search)
   */
  async findScripts(filter: {
    examId?: string;
    subjectId?: string;
    batchId?: string;
    status?: ScriptStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filter.examId) where.examId = filter.examId;
    if (filter.subjectId) where.subjectId = filter.subjectId;
    if (filter.batchId) where.batchId = filter.batchId;
    if (filter.status) where.status = filter.status;
    if (filter.search) {
      where.OR = [
        { scriptCode: { contains: filter.search, mode: "insensitive" } },
        { originalFilename: { contains: filter.search, mode: "insensitive" } },
        { barcodeValue: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 25));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.answerScript.count({ where }),
      prisma.answerScript.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          exam: {
            select: { id: true, title: true, code: true },
          },
          subject: {
            select: { id: true, name: true, code: true },
          },
          batch: {
            select: { id: true, batchCode: true },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Finds scripts by examId
   */
  async findScriptsByExam(examId: string) {
    return prisma.answerScript.findMany({
      where: { examId },
      orderBy: { createdAt: "desc" },
      include: {
        subject: {
          select: { id: true, name: true, code: true },
        },
        batch: {
          select: { id: true, batchCode: true },
        },
      },
    });
  }

  /**
   * Finds scripts by subjectId
   */
  async findScriptsBySubject(subjectId: string) {
    return prisma.answerScript.findMany({
      where: { subjectId },
      orderBy: { createdAt: "desc" },
      include: {
        exam: {
          select: { id: true, title: true, code: true },
        },
        batch: {
          select: { id: true, batchCode: true },
        },
      },
    });
  }

  /**
   * Updates script status and optional error message
   */
  async updateScriptStatus(scriptId: string, status: ScriptStatus, errorMessage?: string) {
    return prisma.answerScript.update({
      where: { id: scriptId },
      data: {
        status,
        errorMessage: errorMessage || null,
      },
    });
  }

  /**
   * Deletes a script record (used for cleanup on rollback)
   */
  async deleteScript(scriptId: string) {
    return prisma.answerScript.delete({
      where: { id: scriptId },
    });
  }
}

export const scriptRepository = new ScriptRepository();
