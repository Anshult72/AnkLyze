/**
 * ANKLYZE Phase 9 - Answer Reconstruction Controller
 * "Analyse the marks, not just the paper."
 * 
 * Endpoints:
 * - POST  /api/v1/scripts/:scriptId/reconstruct
 * - POST  /api/v1/scripts/:scriptId/reconstruct/retry
 * - GET   /api/v1/scripts/:scriptId/reconstruction
 * - GET   /api/v1/scripts/:scriptId/attempts
 * - GET   /api/v1/scripts/:scriptId/attempts/:attemptId
 * - PATCH /api/v1/question-attempts/:attemptId
 * - POST  /api/v1/question-attempts/:attemptId/resolve
 * - POST  /api/v1/scripts/:scriptId/supplementary/link
 * - GET   /api/v1/scripts/:scriptId/supplementary
 */

import { Request, Response, NextFunction } from 'express';
import { reconstructionService } from '../services/reconstruction.service';
import { reconstructionRepository } from '../repositories/reconstruction.repository';
import {
  reconstructScriptBodySchema,
  resolveAttemptBodySchema,
  patchAttemptBodySchema,
  linkSupplementaryBodySchema,
} from '../schemas/reconstruction.schemas';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../utils/logger';

function getParam(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : (val as string);
}

export class ReconstructionController {
  /**
   * POST /api/v1/scripts/:scriptId/reconstruct
   * Triggers answer reconstruction and question mapping
   */
  public async reconstruct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scriptId = getParam(req, 'scriptId');
      const user = (req as any).user;
      const parseResult = reconstructScriptBodySchema.safeParse(req.body || {});

      if (!parseResult.success) {
        ApiResponse.error(
          res,
          { code: 'VALIDATION_ERROR', message: 'Invalid reconstruction request body' },
          400
        );
        return;
      }

      const result = await reconstructionService.reconstructScript(scriptId, {
        forceRerun: parseResult.data.forceRerun,
        userContext: {
          userId: user?.id,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });

      ApiResponse.success(res, result, 200, {
        message: 'Answer reconstruction generated successfully',
      });
    } catch (error: any) {
      if (error?.message?.startsWith('SCRIPT_NOT_FOUND')) {
        ApiResponse.error(res, { code: 'NOT_FOUND', message: error.message }, 404);
        return;
      }
      if (error?.message?.startsWith('OCR_DATA_NOT_FOUND')) {
        ApiResponse.error(res, { code: 'PRECONDITION_FAILED', message: error.message }, 412);
        return;
      }
      if (error?.message?.startsWith('EXAM_STRUCTURE_NOT_FOUND')) {
        ApiResponse.error(res, { code: 'PRECONDITION_FAILED', message: error.message }, 412);
        return;
      }
      logger.error({ error: error.message }, 'Error during answer reconstruction');
      next(error);
    }
  }

  /**
   * POST /api/v1/scripts/:scriptId/reconstruct/retry
   * Explicitly forces a rerun of reconstruction creating version N+1
   */
  public async retry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scriptId = getParam(req, 'scriptId');
      const user = (req as any).user;

      const result = await reconstructionService.reconstructScript(scriptId, {
        forceRerun: true,
        userContext: {
          userId: user?.id,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });

      ApiResponse.success(res, result, 200, {
        message: 'Reconstruction re-run successfully created new version',
      });
    } catch (error: any) {
      if (error?.message?.startsWith('SCRIPT_NOT_FOUND')) {
        ApiResponse.error(res, { code: 'NOT_FOUND', message: error.message }, 404);
        return;
      }
      logger.error({ error: error.message }, 'Error retrying reconstruction');
      next(error);
    }
  }

  /**
   * GET /api/v1/scripts/:scriptId/reconstruction
   * Retrieves structured answer map and reconstruction provenance
   */
  public async getReconstruction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scriptId = getParam(req, 'scriptId');
      const versionQuery = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

      const result = await reconstructionService.getReconstruction(scriptId, versionQuery);

      if (!result) {
        ApiResponse.error(
          res,
          {
            code: 'NOT_FOUND',
            message: `No reconstruction found for answer script ${scriptId}`,
          },
          404
        );
        return;
      }

      ApiResponse.success(res, result);
    } catch (error: any) {
      if (error?.message?.startsWith('SCRIPT_NOT_FOUND')) {
        ApiResponse.error(res, { code: 'NOT_FOUND', message: error.message }, 404);
        return;
      }
      logger.error({ error: error.message }, 'Error fetching reconstruction');
      next(error);
    }
  }

  /**
   * GET /api/v1/scripts/:scriptId/attempts
   * Retrieves all question attempts for a script
   */
  public async getAttempts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scriptId = getParam(req, 'scriptId');
      const attempts = await reconstructionService.getAttempts(scriptId);

      ApiResponse.success(res, { scriptId, count: attempts.length, attempts });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error fetching question attempts');
      next(error);
    }
  }

  /**
   * GET /api/v1/scripts/:scriptId/attempts/:attemptId
   * Retrieves a single attempt with pages and regions
   */
  public async getAttemptById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attemptId = getParam(req, 'attemptId');
      const attempt = await reconstructionService.getAttemptById(attemptId);

      ApiResponse.success(res, attempt);
    } catch (error: any) {
      if (error?.message?.startsWith('ATTEMPT_NOT_FOUND')) {
        ApiResponse.error(res, { code: 'NOT_FOUND', message: error.message }, 404);
        return;
      }
      logger.error({ error: error.message }, 'Error fetching question attempt');
      next(error);
    }
  }

  /**
   * PATCH /api/v1/question-attempts/:attemptId
   * Updates question attempt metadata
   */
  public async patchAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attemptId = getParam(req, 'attemptId');
      const user = (req as any).user;
      const parseResult = patchAttemptBodySchema.safeParse(req.body);

      if (!parseResult.success) {
        ApiResponse.error(
          res,
          { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message },
          400
        );
        return;
      }

      const updated = await reconstructionService.resolveAttempt({
        attemptId,
        state: parseResult.data.state,
        questionId: parseResult.data.questionId,
        userId: user?.id || 'system-admin',
        reason: parseResult.data.reason || 'Manual modification by examiner',
        userContext: {
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });

      ApiResponse.success(res, updated, 200, {
        message: 'Question attempt updated successfully',
      });
    } catch (error: any) {
      if (error?.message?.startsWith('ATTEMPT_NOT_FOUND')) {
        ApiResponse.error(res, { code: 'NOT_FOUND', message: error.message }, 404);
        return;
      }
      logger.error({ error: error.message }, 'Error patching question attempt');
      next(error);
    }
  }

  /**
   * POST /api/v1/question-attempts/:attemptId/resolve
   * Resolves a review case with full audit trail and human reason
   */
  public async resolveAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attemptId = getParam(req, 'attemptId');
      const user = (req as any).user;
      const parseResult = resolveAttemptBodySchema.safeParse(req.body);

      if (!parseResult.success) {
        ApiResponse.error(
          res,
          { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message },
          400
        );
        return;
      }

      const updated = await reconstructionService.resolveAttempt({
        attemptId,
        state: parseResult.data.state,
        questionId: parseResult.data.questionId,
        userId: user?.id || 'system-admin',
        reason: parseResult.data.reason,
        userContext: {
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });

      ApiResponse.success(res, updated, 200, {
        message: 'Question attempt ambiguity resolved successfully',
      });
    } catch (error: any) {
      if (error?.message?.startsWith('ATTEMPT_NOT_FOUND')) {
        ApiResponse.error(res, { code: 'NOT_FOUND', message: error.message }, 404);
        return;
      }
      logger.error({ error: error.message }, 'Error resolving question attempt');
      next(error);
    }
  }

  /**
   * POST /api/v1/scripts/:scriptId/supplementary/link
   * Links a supplementary answer script to a main script
   */
  public async linkSupplementary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mainScriptId = getParam(req, 'scriptId');
      const user = (req as any).user;
      const parseResult = linkSupplementaryBodySchema.safeParse(req.body);

      if (!parseResult.success) {
        ApiResponse.error(
          res,
          { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message },
          400
        );
        return;
      }

      const link = await reconstructionRepository.linkSupplementaryScript({
        mainScriptId,
        supplementaryScriptId: parseResult.data.supplementaryScriptId,
        barcodeValue: parseResult.data.barcodeValue,
        notes: parseResult.data.notes,
        linkedByUserId: user?.id,
      });

      ApiResponse.success(res, link, 200, {
        message: 'Supplementary script linked successfully',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error linking supplementary script');
      next(error);
    }
  }

  /**
   * GET /api/v1/scripts/:scriptId/supplementary
   * Retrieves linked supplementary scripts
   */
  public async getSupplementaryLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mainScriptId = getParam(req, 'scriptId');
      const links = await reconstructionRepository.findSupplementaryLinks(mainScriptId);

      ApiResponse.success(res, { mainScriptId, links });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error fetching supplementary scripts');
      next(error);
    }
  }
}

export const reconstructionController = new ReconstructionController();
