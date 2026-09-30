/**
 * ANKLYZE Phase 15 - Security Hardening & Rate Limiting Middleware
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Injects security headers (X-Frame-Options, X-Content-Type-Options, HSTS, etc.).
 * - Provides bounded in-memory sliding window rate limiting for authentication and AI-triggering endpoints.
 * - Protects against brute force and resource exhaustion.
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";
import { config } from "../config/env";

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  if (config.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  next();
}

/**
 * Lightweight in-memory Rate Limiter
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  message?: string;
  errorCode?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyPrefix = "rl",
    message = "Too many requests. Please try again later.",
    errorCode = "TOO_MANY_REQUESTS",
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, allow high throughput unless explicitly testing rate limits
    if (process.env.NODE_ENV === "test" && !req.headers["x-test-ratelimit"]) {
      return next();
    }

    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "unknown-ip";

    const key = `${keyPrefix}:${clientIp}:${req.user?.id || "anon"}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || record.resetTime <= now) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      return next(
        new AppError(
          message,
          429,
          errorCode,
          { retryAfterSeconds: retryAfterSec }
        )
      );
    }

    record.count += 1;
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));
    next();
  };
}

// Pre-configured rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
  keyPrefix: "auth",
  message: "Too many authentication attempts. Please wait 1 minute before retrying.",
  errorCode: "AUTH_RATE_LIMIT_EXCEEDED",
});

export const aiEvaluationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 40,
  keyPrefix: "ai",
  message: "Too many AI evaluation requests. Please wait a moment before sending more.",
  errorCode: "AI_RATE_LIMIT_EXCEEDED",
});
