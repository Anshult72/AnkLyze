/**
 * ANKLYZE Phase 7 - Storage Service Orchestrator
 * Central point of access for all storage operations.
 * Decouples controllers, services, and tests from Cloudinary SDK details.
 */

import { IStorageProvider, StorageDeleteResult, StorageMetadata, StorageUploadInput, StorageUploadResult } from "./storage.interface";
import { CloudinaryStorageProvider } from "./cloudinaryProvider";
import { MockStorageProvider } from "./mockStorageProvider";
import { config } from "../config/env";
import { logger } from "../utils/logger";

export class StorageService {
  private provider: IStorageProvider;
  private readonly defaultMockProvider: MockStorageProvider;
  private readonly cloudinaryProvider: CloudinaryStorageProvider;

  constructor(customProvider?: IStorageProvider) {
    this.defaultMockProvider = new MockStorageProvider();
    this.cloudinaryProvider = new CloudinaryStorageProvider();

    if (customProvider) {
      this.provider = customProvider;
    } else if (config.STORAGE_PROVIDER === "cloudinary") {
      this.provider = this.cloudinaryProvider;
      logger.info({ configured: this.cloudinaryProvider.getIsConfigured() }, "StorageService: Using CloudinaryStorageProvider as active storage engine");
    } else {
      if (config.NODE_ENV === "production") {
        throw new Error("Mock storage cannot be used in production");
      }
      this.provider = this.defaultMockProvider;
      logger.info(
        { requestedProvider: config.STORAGE_PROVIDER },
        "StorageService: Using MockStorageProvider (hermetic / credentials not configured)"
      );
    }
  }

  public getActiveProviderName(): "CLOUDINARY" | "MOCK" | "LOCAL" {
    return this.provider.name;
  }

  public setProvider(provider: IStorageProvider): void {
    logger.info({ provider: provider.name }, "StorageService: Swapped active storage provider");
    this.provider = provider;
  }

  public resetToDefault(): void {
    if (config.STORAGE_PROVIDER === "cloudinary") {
      this.provider = this.cloudinaryProvider;
    } else {
      if (config.NODE_ENV === "production") {
        throw new Error("Mock storage cannot be used in production");
      }
      this.provider = this.defaultMockProvider;
    }
  }

  public getMockProvider(): MockStorageProvider {
    return this.defaultMockProvider;
  }

  public async uploadScript(input: StorageUploadInput): Promise<StorageUploadResult> {
    return this.provider.upload(input);
  }

  public async uploadPage(input: any): Promise<StorageUploadResult> {
    return this.provider.uploadPage(input);
  }

  public async download(assetId: string, referenceUrl?: string): Promise<Buffer> {
    return this.provider.download(assetId, referenceUrl);
  }

  public async deleteAsset(assetId: string): Promise<StorageDeleteResult> {
    return this.provider.delete(assetId);
  }

  public async getMetadata(assetId: string): Promise<StorageMetadata | null> {
    return this.provider.getMetadata(assetId);
  }

  public async createAccessReference(assetId: string, expiresInSeconds?: number): Promise<string> {
    return this.provider.createAccessReference(assetId, expiresInSeconds);
  }
}

export const storageService = new StorageService();

