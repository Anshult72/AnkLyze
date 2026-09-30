/**
 * ANKLYZE Phase 7 - Cloudinary Storage Provider
 * Implements IStorageProvider for Cloudinary asset storage.
 * 
 * Rules:
 * - Credentials from environment variables only.
 * - Deterministic resource hierarchy:
 *     ANKLYZE/answer-scripts/{examCode}/{subjectCode}/{batchCode}/{scriptCode}
 * - Never expose Cloudinary API secrets in logs, responses, or client payloads.
 * - Handles upload failures cleanly and supports safe deletion for rollback.
 */

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import {
  IStorageProvider,
  StorageDeleteResult,
  StorageMetadata,
  StoragePageUploadInput,
  StorageUploadInput,
  StorageUploadResult,
} from "./storage.interface";
import { logger } from "../utils/logger";
import { config } from "../config/env";

export class CloudinaryStorageProvider implements IStorageProvider {
  public readonly name = "CLOUDINARY";
  private isConfigured = false;

  constructor() {
    if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: config.CLOUDINARY_CLOUD_NAME,
        api_key: config.CLOUDINARY_API_KEY,
        api_secret: config.CLOUDINARY_API_SECRET,
        secure: true,
      });
      this.isConfigured = true;
      logger.info({ cloudName: config.CLOUDINARY_CLOUD_NAME }, "CloudinaryStorageProvider initialized successfully");
    } else {
      logger.warn("CloudinaryStorageProvider: Cloudinary credentials missing in environment. Real cloud uploads will fail.");
    }
  }

  public getIsConfigured(): boolean {
    return this.isConfigured;
  }

  public async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    if (!this.isConfigured) {
      throw new Error("Cloudinary storage provider is not configured. Missing CLOUDINARY credentials.");
    }

    const cleanExam = input.examCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanSubject = input.subjectCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanBatch = input.batchCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanScript = input.scriptCode.replace(/[^a-zA-Z0-9_-]/g, "_");

    const folderPath = `ANKLYZE/answer-scripts/${cleanExam}/${cleanSubject}/${cleanBatch}`;
    const publicId = `${folderPath}/${cleanScript}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: cleanScript,
          folder: folderPath,
          resource_type: "auto",
          tags: ["anklyze", "answer-script", cleanExam, cleanSubject, cleanBatch],
          context: {
            examCode: input.examCode,
            subjectCode: input.subjectCode,
            batchCode: input.batchCode,
            scriptCode: input.scriptCode,
            originalFilename: input.originalFilename,
          },
        },
        (error: any, result?: UploadApiResponse) => {
          if (error || !result) {
            logger.error(
              { error: error?.message || "Unknown error", publicId },
              "CloudinaryStorageProvider: Upload failed"
            );
            return reject(new Error(`Cloudinary upload failed: ${error?.message || "No result returned"}`));
          }

          logger.info(
            { publicId: result.public_id, bytes: result.bytes, secureUrl: result.secure_url },
            "CloudinaryStorageProvider: Script uploaded successfully"
          );

          resolve({
            provider: "CLOUDINARY",
            assetId: result.public_id,
            referenceUrl: result.secure_url,
            fileSize: result.bytes,
            format: result.format || "pdf",
            createdAt: new Date(result.created_at || Date.now()),
            version: String(result.version),
          });
        }
      );

      uploadStream.end(input.buffer);
    });
  }

  public async uploadPage(input: StoragePageUploadInput): Promise<StorageUploadResult> {
    if (!this.isConfigured) {
      throw new Error("Cloudinary storage provider is not configured. Missing CLOUDINARY credentials.");
    }

    const cleanExam = input.examCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanSubject = input.subjectCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanBatch = input.batchCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanScript = input.scriptCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const pageStr = String(input.pageNumber).padStart(3, "0");

    const folderPath = `ANKLYZE/answer-scripts/${cleanExam}/${cleanSubject}/${cleanBatch}/${cleanScript}/pages`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: `page-${pageStr}`,
          folder: folderPath,
          resource_type: "auto",
          tags: ["anklyze", "answer-script-page", cleanExam, cleanSubject, cleanBatch, cleanScript],
        },
        (error: any, result?: UploadApiResponse) => {
          if (error || !result) {
            return reject(new Error(`Cloudinary page upload failed: ${error?.message || "No result"}`));
          }
          resolve({
            provider: "CLOUDINARY",
            assetId: result.public_id,
            referenceUrl: result.secure_url,
            fileSize: result.bytes,
            format: result.format || "png",
            createdAt: new Date(result.created_at || Date.now()),
            version: String(result.version),
          });
        }
      );
      uploadStream.end(input.buffer);
    });
  }

  public async download(assetId: string, referenceUrl?: string): Promise<Buffer> {
    const url = referenceUrl || cloudinary.url(assetId, { secure: true, resource_type: "auto" });
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download asset from Cloudinary: HTTP ${res.status}`);
    }
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  public async delete(assetId: string): Promise<StorageDeleteResult> {
    if (!this.isConfigured) {
      throw new Error("Cloudinary storage provider is not configured.");
    }

    try {
      // Cloudinary destroy defaults to image, for raw/pdf auto try raw then image if needed
      const rawResult = await cloudinary.uploader.destroy(assetId, { resource_type: "raw", invalidate: true });
      if (rawResult.result === "ok") {
        return { success: true, assetId, message: "Asset destroyed (raw)" };
      }

      const imgResult = await cloudinary.uploader.destroy(assetId, { resource_type: "image", invalidate: true });
      return {
        success: imgResult.result === "ok",
        assetId,
        message: imgResult.result,
      };
    } catch (err: any) {
      logger.error({ error: err.message, assetId }, "CloudinaryStorageProvider: Delete failed");
      return { success: false, assetId, message: err.message };
    }
  }

  public async getMetadata(assetId: string): Promise<StorageMetadata | null> {
    if (!this.isConfigured) return null;

    try {
      const resource = await cloudinary.api.resource(assetId, { resource_type: "auto" });
      return {
        assetId: resource.public_id,
        bytes: resource.bytes,
        format: resource.format,
        createdAt: new Date(resource.created_at),
        url: resource.secure_url,
      };
    } catch (err: any) {
      logger.warn({ assetId, error: err.message }, "CloudinaryStorageProvider: getMetadata not found or failed");
      return null;
    }
  }

  public async createAccessReference(assetId: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error("Cloudinary storage provider is not configured.");
    }

    // Generate secure URL without exposing credentials
    return cloudinary.url(assetId, { secure: true, resource_type: "auto" });
  }
}
