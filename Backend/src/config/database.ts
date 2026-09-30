import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

declare global {
  // eslint-disable-next-line no-var
  var __anklyzePrisma: PrismaClient | undefined;
}

export const prisma =
  global.__anklyzePrisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
          ]
        : [{ emit: "event", level: "error" }],
  });

if (process.env.NODE_ENV !== "production") {
  global.__anklyzePrisma = prisma;
}

// Log Prisma events safely
if (process.env.NODE_ENV === "development") {
  // @ts-expect-error Prisma event typing
  prisma.$on("error", (e: unknown) => {
    logger.error({ err: e }, "[Prisma] Database error");
  });
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("✓ [Prisma] Successfully connected to PostgreSQL database.");
  } catch (error) {
    logger.error({ err: error }, "❌ [Prisma] Failed to connect to PostgreSQL database.");
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("✓ [Prisma] Disconnected from PostgreSQL database.");
  } catch (error) {
    logger.error({ err: error }, "❌ [Prisma] Error disconnecting from PostgreSQL database.");
  }
}
