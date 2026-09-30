import { Request, Response } from "express";
import { CalibrationService } from "../services/calibration.service";
import {
  createCalibrationSetSchema,
  startCalibrationSessionSchema,
  submitCalibrationItemSchema,
} from "../schemas/calibration.schemas";
import { logger } from "../utils/logger";

export class CalibrationController {
  public static async createSet(req: Request, res: Response): Promise<void> {
    try {
      const validated = createCalibrationSetSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const set = await CalibrationService.createSet({
        ...validated,
        createdById: userId,
      });

      res.status(201).json({
        success: true,
        data: set,
      });
    } catch (err: any) {
      logger.error({ err }, "Error creating calibration set");
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to create calibration set" },
      });
    }
  }

  public static async listSets(req: Request, res: Response): Promise<void> {
    try {
      const { examId, subjectId } = req.query;

      const sets = await CalibrationService.listSets({
        examId: examId as string,
        subjectId: subjectId as string,
      });

      res.status(200).json({
        success: true,
        data: sets,
      });
    } catch (err: any) {
      logger.error({ err }, "Error listing calibration sets");
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to list calibration sets" },
      });
    }
  }

  public static async startSession(req: Request, res: Response): Promise<void> {
    try {
      const validated = startCalibrationSessionSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const session = await CalibrationService.startSession({
        calibrationSetId: validated.calibrationSetId,
        evaluatorUserId: userId,
      });

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (err: any) {
      logger.error({ err }, "Error starting calibration session");
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to start calibration session" },
      });
    }
  }

  public static async getSession(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = (req as any).user;

      const session = await CalibrationService.getSession({
        sessionId: id,
        requestingUserId: user?.id,
        userRole: user?.role,
      });

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (err: any) {
      logger.error({ err }, "Error retrieving calibration session");
      res.status(404).json({
        success: false,
        error: { message: err.message || "Calibration session not found" },
      });
    }
  }

  public static async submitItem(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const validated = submitCalibrationItemSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const result = await CalibrationService.submitItem({
        sessionId: id,
        itemId: validated.itemId,
        awardedMarks: validated.awardedMarks,
        criteriaScores: validated.criteriaScores,
        evaluatorUserId: userId,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error({ err }, "Error submitting calibration item");
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to submit calibration item" },
      });
    }
  }

  public static async completeSession(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.id;

      const session = await CalibrationService.completeSession({
        sessionId: id,
        evaluatorUserId: userId,
      });

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (err: any) {
      logger.error({ err }, "Error completing calibration session");
      res.status(400).json({
        success: false,
        error: { message: err.message || "Failed to complete calibration session" },
      });
    }
  }
}
