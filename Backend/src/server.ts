import http from "http";
import { app } from "./app";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { disconnectDatabase } from "./config/database";
import { initSocketServer, closeSocketServer } from "./socket/socket.server";

const server = http.createServer(app);

// Initialize Realtime Socket.IO Gateway
initSocketServer(server);

function startServer(): void {
  try {
    server.on("error", (error: any) => {
      logger.fatal({ err: error }, "HTTP server error event detected");
      process.exit(1);
    });

    server.listen(config.PORT, "0.0.0.0", () => {
      logger.info(
        {
          port: config.PORT,
          host: "0.0.0.0",
          env: config.NODE_ENV,
          apiPrefix: config.API_PREFIX,
          docsUrl: `http://localhost:${config.PORT}${config.API_PREFIX}/docs`,
          healthUrl: `http://localhost:${config.PORT}${config.API_PREFIX}/health`,
        },
        `🚀 [ANKLYZE API] Server successfully started on 0.0.0.0:${config.PORT}`
      );
    });
  } catch (error) {
    logger.fatal({ err: error }, "Failed to start HTTP server");
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// Graceful Shutdown Handling
// -----------------------------------------------------------------------------

let isShuttingDown = false;

async function handleGracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Set timeout to force exit if closing takes too long
  const forceExitTimeout = setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing termination.");
    process.exit(1);
  }, 10000);

  // Close Realtime Socket Server
  try {
    await closeSocketServer();
  } catch (socketErr) {
    logger.error({ err: socketErr }, "Error closing Socket.IO server");
  }

  // Close HTTP Server
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, "Error closing HTTP server");
    } else {
      logger.info("✓ HTTP server stopped accepting connections.");
    }

    // Disconnect Prisma Client
    try {
      await disconnectDatabase();
    } catch (dbErr) {
      logger.error({ err: dbErr }, "Error during database disconnection");
    }

    clearTimeout(forceExitTimeout);
    logger.info("✓ [ANKLYZE API] Graceful shutdown completed cleanly.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught Exception detected!");
  handleGracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled Promise Rejection detected!");
  handleGracefulShutdown("unhandledRejection");
});

startServer();
