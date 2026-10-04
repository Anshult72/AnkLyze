import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { StorageProviderType } from "@prisma/client";
import { prisma } from "../config/database";
import { storageService } from "../storage/storageService";
import { AppError } from "../utils/app-error";
import { AuditService } from "./audit.service";
import { extractPaperPages, parsePaperQuestions } from "./questionPaperExtraction.service";

export class QuestionPaperService {
  async upload(subjectId: string, file: Express.Multer.File, userId: string) {
    if (!file.originalname.toLowerCase().endsWith(".pdf") || !["application/pdf", "application/x-pdf"].includes(file.mimetype))
      throw AppError.badRequest("A PDF file is required", "INVALID_PAPER_TYPE");
    if (!file.buffer || file.buffer.length < 100 || file.buffer.subarray(0, 5).toString() !== "%PDF-")
      throw AppError.badRequest("Invalid PDF file", "INVALID_PAPER_CONTENT");
    if (file.buffer.length > 25 * 1024 * 1024) throw AppError.badRequest("PDF exceeds 25 MB", "PAPER_TOO_LARGE");
    const subject = await prisma.subject.findUnique({ where: { id: subjectId }, include: { exam: true } });
    if (!subject || subject.isArchived || subject.exam.isArchived) throw AppError.notFound("Subject not found");
    if (subject.exam.status !== "DRAFT") throw AppError.conflict("Question papers can only be uploaded while the exam is in draft");
    let pageCount: number;
    try {
      const pdf = await PDFDocument.load(file.buffer, { ignoreEncryption: false });
      pageCount = pdf.getPageCount();
    } catch {
      throw AppError.badRequest("PDF is corrupt or encrypted", "INVALID_PAPER_PDF");
    }
    if (pageCount < 1 || pageCount > 200) throw AppError.badRequest("Question paper must have 1–200 pages", "INVALID_PAPER_PAGES");
    const sha256 = createHash("sha256").update(file.buffer).digest("hex");
    const existing = await prisma.questionPaper.findUnique({ where: { subjectId_sha256: { subjectId, sha256 } } });
    if (existing) throw AppError.conflict("This question paper was already uploaded for this subject", "DUPLICATE_PAPER");
    const upload = await storageService.uploadPaper({ buffer: file.buffer, originalFilename: file.originalname,
      examCode: subject.exam.code, subjectCode: subject.code, sha256 });
    try {
      const paper = await prisma.questionPaper.create({ data: {
        examId: subject.examId, subjectId, originalFilename: file.originalname,
        sha256, storageProvider: upload.provider as StorageProviderType,
        storageAssetId: upload.assetId, storageReference: upload.referenceUrl,
        fileSize: file.buffer.length, pageCount, uploadedById: userId,
      } });
      await AuditService.recordEvent({ event: "QUESTION_PAPER_UPLOADED" as any, userId,
        details: { paperId: paper.id, subjectId, pageCount, sha256 } });
      return paper;
    } catch (error) {
      await storageService.deleteAsset(upload.assetId);
      throw error;
    }
  }

  async list(subjectId: string) {
    return prisma.questionPaper.findMany({ where: { subjectId },
      select: { id: true, originalFilename: true, pageCount: true, fileSize: true,
        processingStatus: true, reviewStatus: true, createdAt: true, approvedAt: true,
        _count: { select: { items: true } } }, orderBy: { createdAt: "desc" } });
  }

  async get(paperId: string) {
    const paper = await prisma.questionPaper.findUnique({ where: { id: paperId },
      include: { items: { orderBy: { orderIndex: "asc" } }, subject: { select: { name: true, code: true } } } });
    if (!paper) throw AppError.notFound("Question paper not found");
    return paper;
  }

  async process(paperId: string, userId: string) {
    const paper = await this.get(paperId);
    if (paper.reviewStatus === "APPROVED") throw AppError.conflict("Approved paper cannot be reprocessed");
    const lock = await prisma.questionPaper.updateMany({ where: { id: paperId,
      processingStatus: { in: ["UPLOADED", "FAILED"] } },
      data: { processingStatus: "PROCESSING", extractionError: null } });
    if (lock.count !== 1) throw AppError.conflict("Paper is already processed or processing");
    try {
      const buffer = await storageService.download(paper.storageAssetId, paper.storageReference);
      if (createHash("sha256").update(buffer).digest("hex") !== paper.sha256)
        throw new Error("Stored question paper checksum mismatch");
      const pages = await extractPaperPages(buffer);
      const candidates = parsePaperQuestions(pages);
      await prisma.$transaction(async (tx) => {
        await tx.questionPaperItem.deleteMany({ where: { paperId } });
        if (candidates.length) await tx.questionPaperItem.createMany({ data: candidates.map((item) => ({
          paperId, ...item, reviewStatus: "NEEDS_REVIEW",
        })) });
        await tx.questionPaper.update({ where: { id: paperId }, data: {
          processingStatus: "COMPLETED", reviewStatus: "PENDING", pageCount: pages.length,
        } });
      });
      await AuditService.recordEvent({ event: "QUESTION_PAPER_EXTRACTED" as any, userId,
        details: { paperId, pages: pages.length, candidates: candidates.length } });
      return this.get(paperId);
    } catch (error) {
      await prisma.questionPaper.update({ where: { id: paperId }, data: {
        processingStatus: "FAILED", extractionError: error instanceof Error ? error.message.slice(0, 500) : "Extraction failed",
      } });
      throw error;
    }
  }

  async addItem(paperId: string, input: { questionNumber: string; questionText: string; maximumMarks: number; section?: string; pageNumber: number }, userId: string) {
    const paper = await this.get(paperId);
    if (paper.processingStatus !== "COMPLETED" || paper.reviewStatus === "APPROVED") throw AppError.conflict("Paper is not open for review");
    if (input.pageNumber > paper.pageCount) throw AppError.badRequest("Page number exceeds paper page count");
    const item = await prisma.questionPaperItem.create({ data: { paperId,
      questionNumber: input.questionNumber, questionText: input.questionText,
      maximumMarks: input.maximumMarks, section: input.section,
      pageNumber: input.pageNumber, orderIndex: paper.items.length + 1,
      reviewStatus: "VERIFIED", confidence: null,
    } });
    await AuditService.recordEvent({ event: "QUESTION_PAPER_ITEM_REVIEWED" as any, userId,
      details: { paperId, itemId: item.id, action: "ADD" } });
    return item;
  }

  async reviewItem(paperId: string, itemId: string, input: { questionNumber?: string; questionText?: string; maximumMarks?: number; section?: string | null; pageNumber?: number; reviewStatus: "VERIFIED" | "REJECTED" }, userId: string) {
    const paper = await this.get(paperId);
    if (paper.processingStatus !== "COMPLETED" || paper.reviewStatus === "APPROVED") throw AppError.conflict("Paper is not open for review");
    const item = paper.items.find((candidate) => candidate.id === itemId);
    if (!item) throw AppError.notFound("Paper item not found");
    if (input.pageNumber && input.pageNumber > paper.pageCount) throw AppError.badRequest("Page number exceeds paper page count");
    if (input.reviewStatus === "VERIFIED" && !(input.maximumMarks ?? item.maximumMarks))
      throw AppError.badRequest("Verified question requires maximum marks");
    const updated = await prisma.questionPaperItem.update({ where: { id: itemId }, data: input });
    await prisma.questionPaper.update({ where: { id: paperId }, data: { reviewedById: userId, reviewedAt: new Date() } });
    await AuditService.recordEvent({ event: "QUESTION_PAPER_ITEM_REVIEWED" as any, userId,
      details: { paperId, itemId, status: input.reviewStatus } });
    return updated;
  }

  async approve(paperId: string, userId: string) {
    const paper = await this.get(paperId);
    if (paper.processingStatus !== "COMPLETED" || paper.reviewStatus === "APPROVED") throw AppError.conflict("Paper is not ready for approval");
    const verified = paper.items.filter((item) => item.reviewStatus === "VERIFIED");
    if (!verified.length || paper.items.some((item) => item.reviewStatus === "NEEDS_REVIEW"))
      throw AppError.badRequest("Review every extracted question and verify at least one");
    if (verified.some((item) => !item.maximumMarks || item.maximumMarks <= 0))
      throw AppError.badRequest("Verified questions require positive maximum marks");
    const exam = await prisma.exam.findUnique({ where: { id: paper.examId } });
    if (exam?.status !== "DRAFT") throw AppError.conflict("Only draft exams can accept question papers");
    await prisma.$transaction(async (tx) => {
      const existing = await tx.question.findMany({ where: { subjectId: paper.subjectId,
        questionNumber: { in: verified.map((item) => item.questionNumber) }, isArchived: false } });
      if (existing.length) throw AppError.conflict("Question numbers already exist in this subject; resolve before approval");
      for (const item of verified) {
        const question = await tx.question.create({ data: { subjectId: paper.subjectId,
          questionNumber: item.questionNumber, questionText: item.questionText,
          maximumMarks: item.maximumMarks!, orderIndex: item.orderIndex, section: item.section } });
        await tx.questionPaperItem.update({ where: { id: item.id }, data: { questionId: question.id } });
      }
      await tx.questionPaper.update({ where: { id: paperId }, data: { reviewStatus: "APPROVED",
        reviewedById: userId, reviewedAt: new Date(), approvedAt: new Date() } });
    });
    await AuditService.recordEvent({ event: "QUESTION_PAPER_APPROVED" as any, userId,
      details: { paperId, verifiedQuestions: verified.length } });
    return this.get(paperId);
  }
}

export const questionPaperService = new QuestionPaperService();
