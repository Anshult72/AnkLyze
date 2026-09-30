import { Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { logger } from "../utils/logger";

export class AnalyticsController {
  public static async getEvaluatorConsistency(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await AnalyticsService.getEvaluatorConsistency(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error({ err }, "Error retrieving evaluator consistency analytics");
      res.status(404).json({
        success: false,
        error: { message: err.message || "Failed to retrieve evaluator consistency" },
      });
    }
  }

  public static async getEvaluatorDrift(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await AnalyticsService.getEvaluatorDrift(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error({ err }, "Error retrieving evaluator drift analytics");
      res.status(500).json({
        success: false,
        error: { message: err.message || "Failed to retrieve evaluator drift" },
      });
    }
  }

  public static async getExamCoverage(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await AnalyticsService.getExamCoverage(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error({ err }, "Error retrieving exam coverage analytics");
      res.status(404).json({
        success: false,
        error: { message: err.message || "Failed to retrieve exam coverage" },
      });
    }
  }

  public static async getSubjectCoverage(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await AnalyticsService.getSubjectCoverage(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error({ err }, "Error retrieving subject coverage analytics");
      res.status(404).json({
        success: false,
        error: { message: err.message || "Failed to retrieve subject coverage" },
      });
    }
  }
}
