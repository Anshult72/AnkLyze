/**
 * ANKLYZE Phase 7 & 8 - Answer Script Intake and Document Processing Routes
 * "Analyse the marks, not just the paper."
 * 
 * Strict RBAC:
 * - Script Intake & Batch Creation: SUPER_ADMIN and HEAD_EXAMINER only.
 * - Document Processing & Reprocessing: SUPER_ADMIN and HEAD_EXAMINER only.
 * - Processing Status & Pages inspection: SUPER_ADMIN, HEAD_EXAMINER, EXAMINER, MODERATOR.
 */

import { Router } from "express";
import { scriptController } from "../controllers/script.controller";
import { documentProcessingController } from "../controllers/documentProcessing.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { scriptUploadMiddleware } from "../middleware/upload.middleware";

// Routes for script batches: /api/v1/script-batches
export const scriptBatchRoutes = Router();

scriptBatchRoutes.use(requireAuth);
scriptBatchRoutes.use(requireRole("SUPER_ADMIN", "HEAD_EXAMINER"));

scriptBatchRoutes.post("/", scriptController.createBatch);
scriptBatchRoutes.get("/", scriptController.getBatches);
scriptBatchRoutes.get("/:batchId", scriptController.getBatchById);
scriptBatchRoutes.post(
  "/:batchId/scripts",
  scriptUploadMiddleware,
  scriptController.uploadScriptsToBatch
);

// Routes for scripts: /api/v1/scripts
export const scriptRoutes = Router();

scriptRoutes.use(requireAuth);

// Document Processing Read Endpoints (Examiner and Moderator can read processing & pages)
scriptRoutes.get(
  "/:scriptId/processing",
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER", "EXAMINER", "MODERATOR"),
  documentProcessingController.getProcessingStatus
);

scriptRoutes.get(
  "/:scriptId/pages",
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER", "EXAMINER", "MODERATOR"),
  documentProcessingController.getScriptPages
);

scriptRoutes.get(
  "/:scriptId/pages/:pageId",
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER", "EXAMINER", "MODERATOR"),
  documentProcessingController.getPageDetail
);

// Document Processing Action Endpoints (SUPER_ADMIN and HEAD_EXAMINER only)
scriptRoutes.post(
  "/:scriptId/process",
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  documentProcessingController.processScript
);

scriptRoutes.post(
  "/:scriptId/reprocess",
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER"),
  documentProcessingController.reprocessScript
);

// Script Intake Endpoints
scriptRoutes.get(
  "/",
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER", "EXAMINER", "MODERATOR"),
  scriptController.getScripts
);

scriptRoutes.get(
  "/:scriptId",
  requireRole("SUPER_ADMIN", "HEAD_EXAMINER", "EXAMINER", "MODERATOR"),
  scriptController.getScriptById
);

