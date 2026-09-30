import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/app-error";
import { ApiResponse } from "../utils/api-response";
import { logger } from "../utils/logger";
import { config } from "../config/env";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Operational AppError
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path, method: req.method }, err.message);
    } else {
      logger.warn({ err, path: req.path, method: req.method }, err.message);
    }

    ApiResponse.error(
      res,
      {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      err.statusCode
    );
    return;
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    }));

    logger.warn({ err: formattedErrors, path: req.path }, "Request validation error");

    ApiResponse.error(
      res,
      {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload or parameters",
        details: formattedErrors,
      },
      400
    );
    return;
  }

  // 3. Prisma Known Database Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error({ code: err.code, meta: err.meta, path: req.path }, "Prisma database error");

    switch (err.code) {
      case "P2002":
        ApiResponse.error(
          res,
          {
            code: "CONFLICT",
            message: "A record with this unique identifier already exists",
            details: { target: err.meta?.target },
          },
          409
        );
        return;
      case "P2025":
        ApiResponse.error(
          res,
          {
            code: "NOT_FOUND",
            message: "The requested record was not found in database",
          },
          404
        );
        return;
      case "P2003":
        ApiResponse.error(
          res,
          {
            code: "FOREIGN_KEY_VIOLATION",
            message: "Referenced relation record does not exist",
          },
          400
        );
        return;
      default:
        ApiResponse.error(
          res,
          {
            code: "DATABASE_ERROR",
            message: "Database operation failed",
          },
          500
        );
        return;
    }
  }

  // 4. Prisma Connection / Initialization Error
  if (err instanceof Prisma.PrismaClientInitializationError) {
    logger.error({ err }, "Prisma initialization / connection failure");
    ApiResponse.error(
      res,
      {
        code: "DATABASE_UNAVAILABLE",
        message: "Unable to establish connection to database service",
      },
      503
    );
    return;
  }

  // 5. Unhandled / Internal Server Error
  logger.error(
    {
      err,
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
    "Unhandled internal server error"
  );

  ApiResponse.error(
    res,
    {
      code: "INTERNAL_SERVER_ERROR",
      message:
        config.NODE_ENV === "production"
          ? "An unexpected internal server error occurred"
          : err.message,
    },
    500
  );
}
