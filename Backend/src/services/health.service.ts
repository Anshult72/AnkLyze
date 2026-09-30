import { healthRepository, DatabaseHealthResult } from "../repositories/health.repository";
import { config } from "../config/env";
import { AppError } from "../utils/app-error";

export interface ServiceHealth {
  status: "ok";
  service: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
}

export interface ServiceReadiness {
  status: "ready" | "not_ready";
  database: "connected" | "disconnected";
  service: string;
  timestamp: string;
  latencyMs?: number;
}

export class HealthService {
  getServiceHealth(): ServiceHealth {
    return {
      status: "ok",
      service: "ANKLYZE API",
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async getServiceReadiness(): Promise<ServiceReadiness> {
    const dbResult: DatabaseHealthResult = await healthRepository.pingDatabase();

    if (!dbResult.connected) {
      throw AppError.serviceUnavailable(
        "Database service is unreachable or initializing",
        "DATABASE_UNAVAILABLE",
        {
          database: "disconnected",
          status: "not_ready",
          service: "ANKLYZE API",
          timestamp: new Date().toISOString(),
        }
      );
    }

    return {
      status: "ready",
      database: "connected",
      service: "ANKLYZE API",
      timestamp: new Date().toISOString(),
      latencyMs: dbResult.latencyMs,
    };
  }
}

export const healthService = new HealthService();
