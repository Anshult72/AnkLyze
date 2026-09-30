import { Request, Response } from "express";
import { ModerationService } from "../services/moderation.service";
import {
  createModerationCaseSchema,
  assignModeratorSchema,
  resolveModerationCaseSchema,
  escalateModerationCaseSchema,
} from "../schemas/moderation.schemas";
import { logger } from "../utils/logger";
import { ModerationStatus, ModerationPriority } from "@prisma/client";
import { realtimeService } from "../services/realtime.service";

export class ModerationController {
  public static async createCase(req: Request, res: Response): Promise<void> {
    try {
      const validated = createModerationCaseSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const moderationCase = await ModerationService.evaluateAndCreateCase({
        ...validated,
        createdById: userId,
      });

      realtimeService.emitModerationCaseCreated(moderationCase.id, "", {
        caseId: moderationCase.id,
        status: moderationCase.status,
        priority: moderationCase.priority,
        reason: (moderationCase as any).reason || (moderationCase as any).triggerReason || "MODERATION_REQUIRED",
      });

      res.status(201).json({
        success: true,
        data: moderationCase,
      });
    } catch (err: any) {
      logger.error({ err }, "Error creating moderation case");
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to create moderation case" },
      });
    }
  }

  public static async listCases(req: Request, res: Response): Promise<void> {
    try {
      const { status, priority, assignedModeratorId, questionAttemptId, page, limit } = req.query;

      const result = await ModerationService.listCases({
        status: status as ModerationStatus,
        priority: priority as ModerationPriority,
        assignedModeratorId: assignedModeratorId as string,
        questionAttemptId: questionAttemptId as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error({ err }, "Error listing moderation cases");
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to list moderation cases" },
      });
    }
  }

  public static async getCase(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const moderationCase = await ModerationService.getCaseById(id);

      res.status(200).json({
        success: true,
        data: moderationCase,
      });
    } catch (err: any) {
      logger.error({ err }, "Error retrieving moderation case");
      res.status(404).json({
        success: false,
        error: { message: err.message || "Moderation case not found" },
      });
    }
  }

  public static async assignModerator(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const validated = assignModeratorSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const updatedCase = await ModerationService.assignModerator({
        caseId: id,
        moderatorId: validated.moderatorId,
        assignedByUserId: userId,
      });

      realtimeService.emitModerationCaseUpdated(id, {
        status: updatedCase.status,
        assignedModeratorId: updatedCase.assignedModeratorId,
      });

      res.status(200).json({
        success: true,
        data: updatedCase,
      });
    } catch (err: any) {
      logger.error({ err }, "Error assigning moderator");
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to assign moderator" },
      });
    }
  }

  public static async startReview(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.id;

      const updatedCase = await ModerationService.startReview({
        caseId: id,
        moderatorUserId: userId,
      });

      realtimeService.emitModerationCaseUpdated(id, {
        status: updatedCase.status,
      });

      res.status(200).json({
        success: true,
        data: updatedCase,
      });
    } catch (err: any) {
      logger.error({ err }, "Error starting moderation review");
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to start review" },
      });
    }
  }

  public static async resolveCase(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const validated = resolveModerationCaseSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const result = await ModerationService.resolveCase({
        caseId: id,
        ...validated,
        moderatorUserId: userId,
      });

      realtimeService.emitModerationCaseUpdated(id, {
        status: "RESOLVED",
        resolutionType: validated.resolutionType,
        finalMarks: validated.marksAfter,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error({ err }, "Error resolving moderation case");
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to resolve moderation case" },
      });
    }
  }

  public static async escalateCase(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const validated = escalateModerationCaseSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const updatedCase = await ModerationService.escalateCase({
        caseId: id,
        reason: validated.reason,
        moderatorUserId: userId,
      });

      res.status(200).json({
        success: true,
        data: updatedCase,
      });
    } catch (err: any) {
      logger.error({ err }, "Error escalating moderation case");
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to escalate moderation case" },
      });
    }
  }

  public static async getSummary(_req: Request, res: Response): Promise<void> {
    try {
      const summary = await ModerationService.getSummary();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err: any) {
      logger.error({ err }, "Error getting moderation summary");
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to get moderation summary" },
      });
    }
  }
}
