/**
 * ANKLYZE Phase 8 - Document Processing Controller
 * "Analyse the marks, not just the paper."
 * 
 * Endpoints:
 * - POST /api/v1/scripts/:scriptId/process
 * - POST /api/v1/scripts/:scriptId/reprocess
 * - GET  /api/v1/scripts/:scriptId/processing
 * - GET  /api/v1/scripts/:scriptId/pages
 * - GET  /api/v1/scripts/:scriptId/pages/:pageId
 */

import { Request, Response, NextFunction } from "express";
import { documentProcessingService } from "../services/documentProcessing.service";
import { ApiResponse } from "../utils/api-response";
import { logger } from "../utils/logger";

function getParam(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : (val as string);
}

export class DocumentProcessingController {
  /**
   * POST /api/v1/scripts/:scriptId/process
   * Starts document extraction, rendering, and OCR processing
   */
  public async processScript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scriptId = getParam(req, "scriptId");
      const user = (req as any).user;
      const { languageHints, forceReprocess } = req.body || {};

      const summary = await documentProcessingService.processScriptDocument(scriptId, {
        languageHints: Array.isArray(languageHints) ? languageHints : undefined,
        forceReprocess: !!forceReprocess,
        userContext: {
          userId: user?.id,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
        },
      });

      ApiResponse.success(res, summary, 200, { message: "Document processing completed successfully" });
    } catch (error: any) {
      if (error?.message?.startsWith("SCRIPT_NOT_FOUND")) {
        ApiResponse.error(res, { code: "NOT_FOUND", message: error.message }, 404);
        return;
      }
      if (error?.message?.startsWith("STORAGE_RETRIEVAL_FAILED")) {
        ApiResponse.error(res, { code: "STORAGE_RETRIEVAL_FAILED", message: error.message }, 502);
        return;
      }
      if (error?.message?.startsWith("PDF_PROCESSING_FAILED")) {
        ApiResponse.error(res, { code: "PDF_PROCESSING_FAILED", message: error.message }, 422);
        return;
      }
      logger.error({ error: error.message }, "Error during document processing");
      next(error);
    }
  }

  /**
   * POST /api/v1/scripts/:scriptId/reprocess
   * Forces reprocessing of document and OCR, creating a new versioned OCR artifact
   */
  public async reprocessScript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scriptId = getParam(req, "scriptId");
      const user = (req as any).user;
      const { languageHints } = req.body || {};

      const summary = await documentProcessingService.reprocessScript(scriptId, {
        languageHints: Array.isArray(languageHints) ? languageHints : undefined,
        forceReprocess: true,
        userContext: {
          userId: user?.id,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
        },
      });

      ApiResponse.success(res, summary, 200, { message: "Document reprocessed successfully" });
    } catch (error: any) {
      if (error?.message?.startsWith("SCRIPT_NOT_FOUND")) {
        ApiResponse.error(res, { code: "NOT_FOUND", message: error.message }, 404);
        return;
      }
      if (error?.message?.startsWith("STORAGE_RETRIEVAL_FAILED")) {
        ApiResponse.error(res, { code: "STORAGE_RETRIEVAL_FAILED", message: error.message }, 502);
        return;
      }
      logger.error({ error: error.message }, "Error during document reprocessing");
      next(error);
    }
  }

  /**
   * GET /api/v1/scripts/:scriptId/processing
   * Retrieves overall document processing status, page summary, and OCR metrics
   */
  public async getProcessingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scriptId = getParam(req, "scriptId");
      const summary = await documentProcessingService.getScriptProcessing(scriptId);
      ApiResponse.success(res, summary, 200);
    } catch (error: any) {
      if (error?.message?.startsWith("SCRIPT_NOT_FOUND")) {
        ApiResponse.error(res, { code: "NOT_FOUND", message: error.message }, 404);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/scripts/:scriptId/pages
   * Retrieves all derived pages and their latest OCR results for a script
   */
  public async getScriptPages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scriptId = getParam(req, "scriptId");
      const pages = await documentProcessingService.getScriptPages(scriptId);
      ApiResponse.success(res, pages, 200);
    } catch (error: any) {
      if (error?.message?.startsWith("SCRIPT_NOT_FOUND")) {
        ApiResponse.error(res, { code: "NOT_FOUND", message: error.message }, 404);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/scripts/:scriptId/pages/:pageId
   * Retrieves page detail including historical OCR result versions
   */
  public async getPageDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pageId = getParam(req, "pageId");
      const page = await documentProcessingService.getPageDetail(pageId);
      ApiResponse.success(res, page, 200);
    } catch (error: any) {
      if (error?.message?.startsWith("PAGE_NOT_FOUND")) {
        ApiResponse.error(res, { code: "NOT_FOUND", message: error.message }, 404);
        return;
      }
      next(error);
    }
  }
}

export const documentProcessingController = new DocumentProcessingController();
