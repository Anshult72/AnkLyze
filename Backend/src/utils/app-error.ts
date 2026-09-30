export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_SERVER_ERROR",
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code: string = "BAD_REQUEST", details?: unknown): AppError {
    return new AppError(message, 400, code, details);
  }

  static notFound(message: string = "Resource not found", code: string = "NOT_FOUND"): AppError {
    return new AppError(message, 404, code);
  }

  static unauthorized(message: string = "Unauthorized", code: string = "UNAUTHORIZED"): AppError {
    return new AppError(message, 401, code);
  }

  static forbidden(message: string = "Forbidden", code: string = "FORBIDDEN"): AppError {
    return new AppError(message, 403, code);
  }

  static conflict(message: string, code: string = "CONFLICT"): AppError {
    return new AppError(message, 409, code);
  }

  static serviceUnavailable(message: string, code: string = "SERVICE_UNAVAILABLE", details?: unknown): AppError {
    return new AppError(message, 503, code, details);
  }

  static internal(message: string = "Internal server error", details?: unknown): AppError {
    return new AppError(message, 500, "INTERNAL_SERVER_ERROR", details);
  }
}
