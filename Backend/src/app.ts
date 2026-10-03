import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { apiRoutes } from "./routes";
import { notFoundHandler } from "./middleware/notFound.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { securityHeadersMiddleware } from "./middleware/security.middleware";

export function createApp(): Express {
  const app = express();

  // 0. Security Headers
  app.use(securityHeadersMiddleware);

  // 1. HTTP Request Logger (Pino-compatible)
  app.use(
    pinoHttp({
      logger,
      // In production, avoid noisy logging of repetitive health probes
      autoLogging: config.NODE_ENV === "production" ? { ignore: (req) => req.url?.includes("/health") } : true,
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    })
  );

  // 2. Security & CORS Configuration
  const allowedOrigins = config.CORS_ORIGIN.split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
          return callback(null, true);
        }
        return callback(new Error(`Origin '${origin}' not allowed by CORS policy`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
  );

  // 3. Body & Cookie Parsing Middleware
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());

  // 3.5 Direct Root & Health Check Endpoints for Cloud Ingress & Probes
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "ANKLYZE API",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  app.get("/", (_req, res) => {
    res.status(200).json({
      name: "ANKLYZE API",
      status: "ok",
      version: "1.0.0",
      docs: `${config.API_PREFIX}/docs`,
      health: `${config.API_PREFIX}/health`,
    });
  });

  // 4. API Routes Mounting (/api/v1)
  app.use(config.API_PREFIX, apiRoutes);

  // 5. 404 Route Not Found Middleware
  app.use(notFoundHandler);

  // 6. Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

export const app = createApp();
