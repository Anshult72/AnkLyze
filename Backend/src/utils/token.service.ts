import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config/env";
import { AppError } from "./app-error";

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenType: "ACCESS";
}

export class TokenService {
  /**
   * Generates a short-lived JWT Access Token.
   */
  public static generateAccessToken(user: { id: string; email: string; role: string }): string {
    const payload: Omit<AccessTokenPayload, "iat" | "exp"> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenType: "ACCESS",
    };

    return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }

  /**
   * Verifies and decodes a JWT Access Token.
   */
  public static verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
      if (decoded.tokenType !== "ACCESS") {
        throw AppError.unauthorized("Invalid token type", "INVALID_TOKEN");
      }
      return decoded;
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      if (err instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized("Access token has expired", "TOKEN_EXPIRED");
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw AppError.unauthorized("Invalid access token", "INVALID_TOKEN");
      }
      throw AppError.unauthorized("Authentication failed", "INVALID_TOKEN");
    }
  }

  /**
   * Generates a cryptographically strong random Refresh Token and its SHA-256 hash.
   * The raw token is sent to the client (via HTTP-Only cookie), and only the hash is stored in the database.
   */
  public static generateRefreshToken(): { token: string; hash: string } {
    const rawToken = crypto.randomBytes(48).toString("base64url");
    const hash = TokenService.hashToken(rawToken);
    return { token: rawToken, hash };
  }

  /**
   * Hashes a raw refresh token using SHA-256 for safe lookup in the database.
   */
  public static hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  /**
   * Calculates expiration date from duration string (e.g. "7d", "15m").
   */
  public static getRefreshTokenExpiryDate(): Date {
    const match = config.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
    let milliseconds = 7 * 24 * 60 * 60 * 1000; // 7 days default
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      switch (unit) {
        case "s": milliseconds = value * 1000; break;
        case "m": milliseconds = value * 60 * 1000; break;
        case "h": milliseconds = value * 60 * 60 * 1000; break;
        case "d": milliseconds = value * 24 * 60 * 60 * 1000; break;
      }
    }
    return new Date(Date.now() + milliseconds);
  }
}
