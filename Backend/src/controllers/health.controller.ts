import { Request, Response, NextFunction } from "express";
import { healthService } from "../services/health.service";
import { ApiResponse } from "../utils/api-response";

export class HealthController {
  getHealth = (_req: Request, res: Response): void => {
    const health = healthService.getServiceHealth();
    ApiResponse.success(res, health, 200);
  };

  getReadiness = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const readiness = await healthService.getServiceReadiness();
      ApiResponse.success(res, readiness, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const healthController = new HealthController();
