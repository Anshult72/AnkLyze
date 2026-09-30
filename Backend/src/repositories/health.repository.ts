import { prisma } from "../config/database";
import { logger } from "../utils/logger";

export interface DatabaseHealthResult {
  connected: boolean;
  latencyMs?: number;
  error?: string;
}

export class HealthRepository {
  async pingDatabase(): Promise<DatabaseHealthResult> {
    const startTime = Date.now();
    try {
      // Execute minimal safe connectivity query
      await prisma.$queryRawUnsafe("SELECT 1;");
      const latencyMs = Date.now() - startTime;
      return {
        connected: true,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown database error";
      logger.error({ err: error, latencyMs }, "Database health ping failed");
      return {
        connected: false,
        latencyMs,
        error: errorMessage,
      };
    }
  }
}

export const healthRepository = new HealthRepository();
