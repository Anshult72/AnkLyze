import pino from "pino";
import { config } from "../config/env";

export const logger = pino({
  level: config.LOG_LEVEL,
  base: {
    service: "ANKLYZE-API",
    env: config.NODE_ENV,
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "secret",
      "DATABASE_URL",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport:
    config.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});
