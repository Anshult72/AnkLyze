import { Response } from "express";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    meta?: Record<string, unknown>
  ): Response<ApiSuccessResponse<T>> {
    const payload: ApiSuccessResponse<T> = {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    };
    return res.status(statusCode).json(payload);
  }

  static error(
    res: Response,
    error: ApiErrorPayload,
    statusCode: number = 500
  ): Response<ApiErrorResponse> {
    const payload: ApiErrorResponse = {
      success: false,
      error,
    };
    return res.status(statusCode).json(payload);
  }
}
