/**
 * ANKLYZE Phase 7 - File Validation & Integrity Utilities
 * "Analyse the marks, not just the paper."
 * 
 * Strict verification:
 * - MIME type validation
 * - Extension validation (.pdf)
 * - Magic bytes verification (%PDF-)
 * - Non-empty check (> 0 bytes)
 * - Max size limit check
 * - Cryptographic SHA-256 checksum calculation
 * - Safe PDF page count extraction
 */

import crypto from "crypto";
import { config } from "../config/env";

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  checksum: string;
  pageCount: number;
  fileSize: number;
}

export interface UploadedFileInput {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size?: number;
}

/**
 * Calculates SHA-256 cryptographic hash of buffer
 */
export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Verifies standard PDF magic bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
 */
export function verifyPdfMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) {
    return false;
  }
  return (
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 && // F
    buffer[4] === 0x2d    // -
  );
}

/**
 * Safely extracts page count from PDF buffer without native dependencies
 */
export function extractPdfPageCount(buffer: Buffer): number {
  try {
    const content = buffer.toString("latin1");
    
    // Count occurrences of /Type /Page (and not /Pages)
    const pageMatches = content.match(/\/Type\s*\/Page\b(?!\s*s)/g);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }

    // Secondary fallback: find /Count N from catalog /Pages object
    const countMatches = content.match(/\/Count\s+(\d+)/);
    if (countMatches && countMatches[1]) {
      const parsed = parseInt(countMatches[1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return 1;
  } catch {
    return 1;
  }
}

/**
 * Validates an uploaded answer script PDF
 */
export function validateScriptFile(
  file: UploadedFileInput,
  maxSizeBytes: number = config.MAX_SCRIPT_FILE_SIZE_BYTES
): FileValidationResult {
  const buffer = file.buffer;
  const size = Math.max(buffer ? buffer.length : 0, file.size || 0);
  const checksum = buffer && buffer.length > 0 ? calculateChecksum(buffer) : "";

  // 1. Non-empty check
  if (!buffer || size === 0) {
    return {
      isValid: false,
      error: "Uploaded file is empty (0 bytes). Scanned answer book must contain valid data.",
      checksum,
      pageCount: 0,
      fileSize: 0,
    };
  }

  // 2. Max file size check
  if (size > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    const actualMb = (size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${actualMb} MB) exceeds maximum allowed limit (${maxMb} MB).`,
      checksum,
      pageCount: 0,
      fileSize: size,
    };
  }

  // 3. Extension check
  const filename = (file.originalname || "").trim().toLowerCase();
  if (!filename.endsWith(".pdf")) {
    return {
      isValid: false,
      error: "Invalid file extension. Only digitally scanned PDF answer books (.pdf) are accepted.",
      checksum,
      pageCount: 0,
      fileSize: size,
    };
  }

  // 4. MIME type check
  const mime = (file.mimetype || "").toLowerCase();
  if (mime !== "application/pdf" && mime !== "application/x-pdf") {
    return {
      isValid: false,
      error: `Invalid MIME type '${file.mimetype}'. Expected 'application/pdf'.`,
      checksum,
      pageCount: 0,
      fileSize: size,
    };
  }

  // 5. PDF Magic Bytes / Signature Check
  if (!verifyPdfMagicBytes(buffer)) {
    return {
      isValid: false,
      error: "File signature validation failed. The file is corrupt or is not a valid PDF document.",
      checksum,
      pageCount: 0,
      fileSize: size,
    };
  }

  // 6. Safe Page Count Extraction
  const pageCount = extractPdfPageCount(buffer);

  return {
    isValid: true,
    checksum,
    pageCount,
    fileSize: size,
  };
}
