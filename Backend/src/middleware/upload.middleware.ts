/**
 * ANKLYZE Phase 7 - Answer Script Upload Middleware
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Uses in-memory buffers so validation and checksumming occur before storage.
 * - Configurable maximum file size limit (default 25 MB per file).
 * - Safe file intake handling.
 */

import multer from "multer";
import { config } from "../config/env";
import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/api-response";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: config.MAX_SCRIPT_FILE_SIZE_BYTES,
    files: 100, // Maximum 100 files in a single bulk batch request
  },
  fileFilter: (_req, file, cb) => {
    // Basic filter on MIME or extension at upload stage
    const ext = file.originalname.toLowerCase();
    if (!ext.endsWith(".pdf") && file.mimetype !== "application/pdf" && file.mimetype !== "application/x-pdf") {
      return cb(new Error("INVALID_FILE_TYPE: Only PDF documents (.pdf) are accepted for answer book intake"));
    }
    cb(null, true);
  },
});

export const scriptUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Use upload.any() to handle both single 'file' / 'script' and multi-file 'files'
  upload.any()(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          const maxMb = (config.MAX_SCRIPT_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(1);
          ApiResponse.error(
            res,
            {
              code: "FILE_TOO_LARGE",
              message: `Uploaded file exceeds maximum permitted size of ${maxMb} MB`,
            },
            400
          );
          return;
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          ApiResponse.error(
            res,
            {
              code: "TOO_MANY_FILES",
              message: "Maximum batch upload limit of 100 files exceeded",
            },
            400
          );
          return;
        }
        ApiResponse.error(
          res,
          {
            code: "UPLOAD_ERROR",
            message: `Multer upload error: ${err.message}`,
          },
          400
        );
        return;
      }
      ApiResponse.error(
        res,
        {
          code: "INVALID_FILE",
          message: err.message || "Failed to process upload",
        },
        400
      );
      return;
    }
    next();
  });
};
