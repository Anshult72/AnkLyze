/**
 * ANKLYZE Phase 7 - Mock Storage Provider
 * Hermetic, in-memory implementation for deterministic testing and local development.
 */

import {
  IStorageProvider,
  StorageDeleteResult,
  StorageMetadata,
  StoragePaperUploadInput,
  StoragePageUploadInput,
  StorageUploadInput,
  StorageUploadResult,
} from "./storage.interface";
import { logger } from "../utils/logger";
import { randomUUID } from "node:crypto";

interface StoredMockAsset {
  assetId: string;
  buffer: Buffer;
  mimeType: string;
  originalFilename: string;
  fileSize: number;
  format: string;
  createdAt: Date;
  referenceUrl: string;
}

export class MockStorageProvider implements IStorageProvider {
  public readonly name = "MOCK";
  private storage = new Map<string, StoredMockAsset>();
  private simulateFailure = false;
  private failureMessage = "Simulated storage failure";

  public setSimulateFailure(fail: boolean, message?: string): void {
    this.simulateFailure = fail;
    if (message) this.failureMessage = message;
  }

  public clear(): void {
    this.storage.clear();
    this.simulateFailure = false;
  }

  public async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    if (this.simulateFailure) {
      logger.warn({ scriptCode: input.scriptCode }, "MockStorageProvider: Simulated upload failure triggered");
      throw new Error(`[MockStorageProvider] ${this.failureMessage}`);
    }

    const cleanExam = (input.examCode || "EXAM_DEF").replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanSubject = (input.subjectCode || "SUB_DEF").replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanBatch = (input.batchCode || "BATCH_DEF").replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanScript = (input.scriptCode || input.originalFilename || "SCRIPT_DEF").replace(/[^a-zA-Z0-9_-]/g, "_");

    const assetId = (input as any).publicId || `ANKLYZE/answer-scripts/${cleanExam}/${cleanSubject}/${cleanBatch}/${cleanScript}`;
    const referenceUrl = `https://mock-storage.anklyze.internal/${assetId}.pdf`;

    const stored: StoredMockAsset = {
      assetId,
      buffer: input.buffer,
      mimeType: input.mimeType,
      originalFilename: input.originalFilename,
      fileSize: input.buffer.length,
      format: "pdf",
      createdAt: new Date(),
      referenceUrl,
    };

    this.storage.set(assetId, stored);

    logger.debug({ assetId, fileSize: stored.fileSize }, "MockStorageProvider: Uploaded script successfully");

    return {
      provider: "MOCK",
      assetId,
      referenceUrl,
      fileSize: stored.fileSize,
      format: "pdf",
      createdAt: stored.createdAt,
      version: "mock-v1",
    };
  }

  public async uploadPaper(input: StoragePaperUploadInput): Promise<StorageUploadResult> {
    if (this.simulateFailure) throw new Error(`[MockStorageProvider] ${this.failureMessage}`);
    const assetId = `ANKLYZE/question-papers/${input.examCode}/${input.subjectCode}/${input.sha256}-${randomUUID()}`;
    const createdAt = new Date();
    const referenceUrl = `https://mock-storage.anklyze.internal/${assetId}.pdf`;
    this.storage.set(assetId, {
      assetId, buffer: input.buffer, mimeType: "application/pdf",
      originalFilename: input.originalFilename, fileSize: input.buffer.length,
      format: "pdf", createdAt, referenceUrl,
    });
    return { provider: "MOCK", assetId, referenceUrl, fileSize: input.buffer.length, format: "pdf", createdAt };
  }

  public async delete(assetId: string): Promise<StorageDeleteResult> {
    const exists = this.storage.has(assetId);
    if (exists) {
      this.storage.delete(assetId);
      logger.debug({ assetId }, "MockStorageProvider: Asset deleted");
      return { success: true, assetId, message: "Asset deleted successfully" };
    }
    return { success: true, assetId, message: "Asset did not exist or already deleted" };
  }

  public async getMetadata(assetId: string): Promise<StorageMetadata | null> {
    const item = this.storage.get(assetId);
    if (!item) return null;
    return {
      assetId: item.assetId,
      bytes: item.fileSize,
      format: item.format,
      createdAt: item.createdAt,
      url: item.referenceUrl,
    };
  }

  public async createAccessReference(assetId: string): Promise<string> {
    const item = this.storage.get(assetId);
    if (!item) {
      return `https://mock-storage.anklyze.internal/${assetId}.pdf`;
    }
    return item.referenceUrl;
  }

  public async uploadPage(input: StoragePageUploadInput): Promise<StorageUploadResult> {
    if (this.simulateFailure) {
      throw new Error(`[MockStorageProvider] ${this.failureMessage}`);
    }

    const cleanExam = input.examCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanSubject = input.subjectCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanBatch = input.batchCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanScript = input.scriptCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const pageStr = String(input.pageNumber).padStart(3, "0");

    const assetId = `ANKLYZE/answer-scripts/${cleanExam}/${cleanSubject}/${cleanBatch}/${cleanScript}/pages/page-${pageStr}`;
    const mime = input.mimeType || "image/png";
    const ext = mime.includes("png") ? "png" : mime.includes("jpeg") ? "jpg" : "pdf";
    const referenceUrl = `https://mock-storage.anklyze.internal/${assetId}.${ext}`;

    const stored: StoredMockAsset = {
      assetId,
      buffer: input.buffer,
      mimeType: mime,
      originalFilename: `page-${pageStr}.${ext}`,
      fileSize: input.buffer.length,
      format: ext,
      createdAt: new Date(),
      referenceUrl,
    };

    this.storage.set(assetId, stored);

    return {
      provider: "MOCK",
      assetId,
      referenceUrl,
      fileSize: stored.fileSize,
      format: ext,
      createdAt: stored.createdAt,
      version: "mock-page-v1",
    };
  }

  public async download(assetId: string): Promise<Buffer> {
    if (this.simulateFailure) {
      throw new Error(`[MockStorageProvider] ${this.failureMessage}`);
    }
    const item = this.storage.get(assetId);
    if (!item) {
      throw new Error(`[MockStorageProvider] Asset '${assetId}' not found`);
    }
    return item.buffer;
  }

  public getStoredCount(): number {
    return this.storage.size;
  }

  public getAsset(assetId: string): StoredMockAsset | undefined {
    return this.storage.get(assetId);
  }
}

