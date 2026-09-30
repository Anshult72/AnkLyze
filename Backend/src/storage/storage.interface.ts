/**
 * ANKLYZE Phase 7 - Storage Abstraction Layer
 * "Analyse the marks, not just the paper."
 * 
 * Strict boundary: Storage provider is completely decoupled from
 * intake business logic, AI evaluation, and database models.
 */

export interface StorageUploadInput {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  examCode: string;
  subjectCode: string;
  batchCode: string;
  scriptCode: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface StorageUploadResult {
  provider: "CLOUDINARY" | "MOCK" | "LOCAL";
  assetId: string;
  referenceUrl: string;
  fileSize: number;
  format?: string;
  createdAt: Date;
  version?: string;
}

export interface StorageDeleteResult {
  success: boolean;
  assetId: string;
  message?: string;
}

export interface StorageMetadata {
  assetId: string;
  bytes: number;
  format: string;
  createdAt: Date;
  url: string;
}

export interface StoragePageUploadInput {
  buffer: Buffer;
  mimeType: string;
  examCode: string;
  subjectCode: string;
  batchCode: string;
  scriptCode: string;
  pageNumber: number;
}

export interface IStorageProvider {
  readonly name: "CLOUDINARY" | "MOCK" | "LOCAL";
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  uploadPage(input: StoragePageUploadInput): Promise<StorageUploadResult>;
  download(assetId: string, referenceUrl?: string): Promise<Buffer>;
  delete(assetId: string): Promise<StorageDeleteResult>;
  getMetadata(assetId: string): Promise<StorageMetadata | null>;
  createAccessReference(assetId: string, expiresInSeconds?: number): Promise<string>;
}

