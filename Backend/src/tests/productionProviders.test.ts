import assert from "node:assert/strict";
import { config } from "../config/env";
import { StorageService } from "../storage/storageService";
import { OCRService } from "../ocr/ocrService";

async function run() {
  const original = {
    nodeEnv: config.NODE_ENV,
    storage: config.STORAGE_PROVIDER,
    ocr: config.OCR_PRIMARY_PROVIDER,
    cloudName: config.CLOUDINARY_CLOUD_NAME,
    cloudKey: config.CLOUDINARY_API_KEY,
    cloudSecret: config.CLOUDINARY_API_SECRET,
    visionKey: config.GOOGLE_VISION_API_KEY,
    googleCredentials: config.GOOGLE_APPLICATION_CREDENTIALS,
  };

  try {
    config.NODE_ENV = "production";
    config.CLOUDINARY_CLOUD_NAME = "";
    config.CLOUDINARY_API_KEY = "";
    config.CLOUDINARY_API_SECRET = "";
    config.GOOGLE_VISION_API_KEY = "";
    config.GOOGLE_APPLICATION_CREDENTIALS = "";

    config.STORAGE_PROVIDER = "mock";
    assert.throws(() => new StorageService(), /Mock storage cannot be used in production/);

    config.STORAGE_PROVIDER = "cloudinary";
    const storage = new StorageService();
    assert.equal(storage.getActiveProviderName(), "CLOUDINARY");
    await assert.rejects(() => storage.uploadScript({
      buffer: Buffer.from("%PDF-1.4"),
      originalFilename: "sheet.pdf",
      mimeType: "application/pdf",
      examCode: "TEST",
      subjectCode: "TEST",
      batchCode: "TEST",
      scriptCode: "TEST",
    }), /not configured|credentials/i);

    config.OCR_PRIMARY_PROVIDER = "mock";
    assert.throws(() => new OCRService(), /Mock OCR cannot be used in production/);

    config.OCR_PRIMARY_PROVIDER = "google-vision";
    const ocr = new OCRService();
    assert.equal(ocr.getActiveProviderName(), "google-vision");
    await assert.rejects(
      () => ocr.processPageWithRetry({ pageNumber: 1, buffer: Buffer.from("image"), mimeType: "image/png", width: 1, height: 1 }, 0),
      /not configured/i
    );
    console.log("Production provider fail-closed checks passed");
  } finally {
    config.NODE_ENV = original.nodeEnv;
    config.STORAGE_PROVIDER = original.storage;
    config.OCR_PRIMARY_PROVIDER = original.ocr;
    config.CLOUDINARY_CLOUD_NAME = original.cloudName;
    config.CLOUDINARY_API_KEY = original.cloudKey;
    config.CLOUDINARY_API_SECRET = original.cloudSecret;
    config.GOOGLE_VISION_API_KEY = original.visionKey;
    config.GOOGLE_APPLICATION_CREDENTIALS = original.googleCredentials;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
