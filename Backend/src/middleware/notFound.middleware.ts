import { Request, Response } from "express";
import { ApiResponse } from "../utils/api-response";

export function notFoundHandler(req: Request, res: Response): void {
  ApiResponse.error(
    res,
    {
      code: "NOT_FOUND",
      message: `Route '${req.method} ${req.originalUrl}' not found`,
    },
    404
  );
}
