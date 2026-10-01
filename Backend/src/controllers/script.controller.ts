/**
 * ANKLYZE Phase 7 - Answer Script Intake Controller
 * "Analyse the marks, not just the paper."
 */

import { Request, Response, NextFunction } from "express";
import { scriptService } from "../services/script.service";
import {
  createScriptBatchSchema,
  scriptBatchQuerySchema,
  scriptListQuerySchema,
} from "../schemas/script.schemas";
import { ApiResponse } from "../utils/api-response";
import { UploadedFileInput } from "../utils/fileValidation";

function getParam(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : (val as string);
}

export class ScriptController {
  /**
   * POST /api/v1/script-batches
   * Creates a new intake batch
   */
  public async createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createScriptBatchSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const batch = await scriptService.createBatch({
        examId: validated.examId,
        subjectId: validated.subjectId,
        batchCode: validated.batchCode,
        source: validated.source,
        notes: validated.notes,
        userId,
      });

      ApiResponse.success(res, batch, 201);
    } catch (error: any) {
      if (error?.message?.startsWith("DUPLICATE_BATCH_CODE")) {
        ApiResponse.error(res, { code: "DUPLICATE_BATCH_CODE", message: error.message }, 409);
        return;
      }
      if (error?.message?.startsWith("EXAM_NOT_FOUND") || error?.message?.startsWith("SUBJECT_NOT_FOUND")) {
        ApiResponse.error(res, { code: "NOT_FOUND", message: error.message }, 404);
        return;
      }
      if (error?.message?.startsWith("EXAM_SUBJECT_MISMATCH")) {
        ApiResponse.error(res, { code: "EXAM_SUBJECT_MISMATCH", message: error.message }, 400);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/script-batches
   * Lists intake batches
   */
  public async getBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = scriptBatchQuerySchema.parse(req.query);
      const batches = await scriptService.listBatches(query as any);
      ApiResponse.success(res, batches);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/script-batches/:batchId
   * Retrieves single batch details
   */
  public async getBatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batchId = getParam(req, "batchId");
      const batch = await scriptService.getBatchDetails(batchId);
      ApiResponse.success(res, batch);
    } catch (error: any) {
      if (error?.message?.startsWith("BATCH_NOT_FOUND")) {
        ApiResponse.error(res, { code: "BATCH_NOT_FOUND", message: error.message }, 404);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/script-batches/:batchId/scripts
   * Ingests answer scripts (single or multi-file) into batch
   */
  public async uploadScriptsToBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batchId = getParam(req, "batchId");
      const rawFiles = (req.files as Express.Multer.File[]) || [];

      if (!rawFiles || rawFiles.length === 0) {
        ApiResponse.error(
          res,
          {
            code: "NO_FILES_PROVIDED",
            message: "No files uploaded. Provide at least one PDF answer sheet via multipart 'files' or 'file'.",
          },
          400
        );
        return;
      }

      const files: UploadedFileInput[] = rawFiles.map((f) => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        buffer: f.buffer,
        size: f.size,
      }));

      const userContext = {
        userId: (req as any).user?.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      };

      const result = await scriptService.processBatchUpload(batchId, files, userContext);
      ApiResponse.success(res, result, 200);
    } catch (error: any) {
      if (error?.message?.startsWith("BATCH_NOT_FOUND")) {
        ApiResponse.error(res, { code: "BATCH_NOT_FOUND", message: error.message }, 404);
        return;
      }
      if (error?.message?.startsWith("NO_FILES_PROVIDED")) {
        ApiResponse.error(res, { code: "NO_FILES_PROVIDED", message: error.message }, 400);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/scripts
   * Lists scripts with filters and pagination
   */
  public async getScripts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = scriptListQuerySchema.parse(req.query);
      const scripts = await scriptService.listScripts(query as any);
      ApiResponse.success(res, scripts.items, 200, scripts.pagination as any);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/scripts/:scriptId
   * Retrieves single script details
   */
  public async getScriptById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scriptId = getParam(req, "scriptId");
      const script = await scriptService.getScriptDetails(scriptId);
      ApiResponse.success(res, script);
    } catch (error: any) {
      if (error?.message?.startsWith("SCRIPT_NOT_FOUND")) {
        ApiResponse.error(res, { code: "SCRIPT_NOT_FOUND", message: error.message }, 404);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/exams/:examId/scripts
   * Lists all scripts under an examination
   */
  public async getScriptsByExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = getParam(req, "examId");
      const scripts = await scriptService.getScriptsByExam(examId);
      ApiResponse.success(res, scripts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/subjects/:subjectId/scripts
   * Lists all scripts under a subject
   */
  public async getScriptsBySubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjectId = getParam(req, "subjectId");
      const scripts = await scriptService.getScriptsBySubject(subjectId);
      ApiResponse.success(res, scripts);
    } catch (error) {
      next(error);
    }
  }
}

export const scriptController = new ScriptController();
