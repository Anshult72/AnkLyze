import { Request, Response, NextFunction } from "express";
import { TokenService } from "../utils/token.service";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/app-error";
import { UserStatus } from "@prisma/client";
import "../types/auth"; // import type augmentations

/**
 * Authentication middleware that verifies JWT access token from Authorization header.
 * Attaches authenticated user profile to req.user.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized("Authentication required", "AUTHENTICATION_REQUIRED");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw AppError.unauthorized("Authentication required", "AUTHENTICATION_REQUIRED");
    }

    // Verify token claims and signature
    const payload = TokenService.verifyAccessToken(token);

    // Verify user exists and status is active
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw AppError.unauthorized("User account no longer exists", "AUTHENTICATION_REQUIRED");
    }

    if (user.status === UserStatus.INACTIVE) {
      throw AppError.unauthorized("Account is inactive. Please contact administrator.", "ACCOUNT_INACTIVE");
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw AppError.unauthorized("Account has been suspended. Please contact administrator.", "ACCOUNT_SUSPENDED");
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      status: user.status,
      department: user.department,
      institution: user.institution,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control (RBAC) middleware factory.
 * Requires user to have one of the specified roles.
 *
 * @param allowedRoles List of roles permitted to access the endpoint
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized("Authentication required", "AUTHENTICATION_REQUIRED"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access denied: requires one of [${allowedRoles.join(", ")}] permissions`,
          "FORBIDDEN"
        )
      );
    }

    next();
  };
}
