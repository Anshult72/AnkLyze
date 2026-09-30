import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { ApiResponse } from "../utils/api-response";
import { config } from "../config/env";

const REFRESH_COOKIE_NAME = "anklyze_refresh_token";

export class AuthController {
  /**
   * Handles user login with email and password.
   */
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.login({
        email,
        password,
        userAgent,
        ipAddress,
      });

      // Set secure HTTP-only refresh cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: config.COOKIE_SECURE,
        sameSite: config.COOKIE_SAME_SITE,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      ApiResponse.success(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refreshes the access token using the stored refresh token.
   */
  public async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.refreshToken({
        refreshToken,
        userAgent,
        ipAddress,
      });

      // Rotate secure HTTP-only refresh cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: config.COOKIE_SECURE,
        sameSite: config.COOKIE_SAME_SITE,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      ApiResponse.success(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs out the user and revokes their active refresh session.
   */
  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip || req.socket.remoteAddress;

      await authService.logout({
        refreshToken,
        userId: req.user?.id,
        userAgent,
        ipAddress,
      });

      // Clear cookie
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: config.COOKIE_SECURE,
        sameSite: config.COOKIE_SAME_SITE,
        path: "/",
      });

      ApiResponse.success(res, {
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Returns safe profile details for the currently authenticated user.
   */
  public async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        ApiResponse.error(
          res,
          {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
          },
          401
        );
        return;
      }

      ApiResponse.success(res, req.user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
