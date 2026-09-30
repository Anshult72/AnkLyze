import { userRepository } from "../repositories/user.repository";
import { sessionRepository } from "../repositories/session.repository";
import { PasswordService } from "../utils/password.service";
import { TokenService } from "../utils/token.service";
import { AuditService } from "./audit.service";
import { AppError } from "../utils/app-error";
import { UserStatus } from "@prisma/client";

export interface SafeUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: UserStatus;
  department: string | null;
  institution: string | null;
}

export interface AuthResult {
  user: SafeUserProfile;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Authenticates a user with email and password.
   * Validates Argon2id hash and account status, issuing JWT access token and refresh token session.
   */
  public async login(params: {
    email: string;
    password: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthResult> {
    const normalizedEmail = params.email.toLowerCase().trim();

    // 1. Find user by email
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      // Record failure without exposing user existence
      await AuditService.recordEvent({
        event: "LOGIN_FAILURE",
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: { reason: "USER_NOT_FOUND" },
      });
      throw AppError.unauthorized("Invalid credentials", "INVALID_CREDENTIALS");
    }

    // 2. Verify password with Argon2id
    const isPasswordValid = await PasswordService.verifyPassword(user.passwordHash, params.password);
    if (!isPasswordValid) {
      await AuditService.recordEvent({
        event: "LOGIN_FAILURE",
        userId: user.id,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: { reason: "INVALID_PASSWORD" },
      });
      throw AppError.unauthorized("Invalid credentials", "INVALID_CREDENTIALS");
    }

    // 3. Verify user status
    if (user.status === UserStatus.INACTIVE) {
      await AuditService.recordEvent({
        event: "LOGIN_FAILURE",
        userId: user.id,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: { reason: "ACCOUNT_INACTIVE" },
      });
      throw AppError.unauthorized("Account is inactive. Please contact administrator.", "ACCOUNT_INACTIVE");
    }

    if (user.status === UserStatus.SUSPENDED) {
      await AuditService.recordEvent({
        event: "LOGIN_FAILURE",
        userId: user.id,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: { reason: "ACCOUNT_SUSPENDED" },
      });
      throw AppError.unauthorized("Account has been suspended. Please contact administrator.", "ACCOUNT_SUSPENDED");
    }

    // 4. Generate Tokens
    const accessToken = TokenService.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
    });

    const refresh = TokenService.generateRefreshToken();
    const expiresAt = TokenService.getRefreshTokenExpiryDate();

    // 5. Store session in database (hashed refresh token only)
    await sessionRepository.createSession({
      userId: user.id,
      tokenHash: refresh.hash,
      expiresAt,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
    });

    // 6. Record success audit
    await AuditService.recordEvent({
      event: "LOGIN_SUCCESS",
      userId: user.id,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      details: { role: user.role.name },
    });

    const safeProfile: SafeUserProfile = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      status: user.status,
      department: user.department,
      institution: user.institution,
    };

    return {
      user: safeProfile,
      accessToken,
      refreshToken: refresh.token,
    };
  }

  /**
   * Refreshes an authenticated session using a valid refresh token.
   * Enforces refresh token rotation and revocation.
   */
  public async refreshToken(params: {
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthResult> {
    if (!params.refreshToken) {
      throw AppError.unauthorized("Authentication required", "AUTHENTICATION_REQUIRED");
    }

    const tokenHash = TokenService.hashToken(params.refreshToken);
    const session = await sessionRepository.findByTokenHash(tokenHash);

    if (!session) {
      throw AppError.unauthorized("Invalid or expired refresh token", "REFRESH_TOKEN_INVALID");
    }

    // Replay detection: If token was already revoked, revoke all sessions for this user!
    if (session.revokedAt !== null) {
      await sessionRepository.revokeAllUserSessions(session.userId);
      await AuditService.recordEvent({
        event: "SESSION_REVOKED",
        userId: session.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: { reason: "REVOKED_TOKEN_REUSE_DETECTED" },
      });
      throw AppError.unauthorized("Session has been revoked", "SESSION_REVOKED");
    }

    // Expiration check
    if (new Date() > session.expiresAt) {
      throw AppError.unauthorized("Refresh session has expired", "REFRESH_TOKEN_INVALID");
    }

    const user = session.user;

    // Status check
    if (user.status === UserStatus.INACTIVE) {
      throw AppError.unauthorized("Account is inactive. Please contact administrator.", "ACCOUNT_INACTIVE");
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw AppError.unauthorized("Account has been suspended. Please contact administrator.", "ACCOUNT_SUSPENDED");
    }

    // Rotate refresh token: Revoke previous session
    await sessionRepository.revokeSession(session.id);

    // Issue new tokens
    const newRefresh = TokenService.generateRefreshToken();
    const newExpiresAt = TokenService.getRefreshTokenExpiryDate();

    await sessionRepository.createSession({
      userId: user.id,
      tokenHash: newRefresh.hash,
      expiresAt: newExpiresAt,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
    });

    const accessToken = TokenService.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
    });

    await AuditService.recordEvent({
      event: "TOKEN_REFRESH",
      userId: user.id,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    const safeProfile: SafeUserProfile = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      status: user.status,
      department: user.department,
      institution: user.institution,
    };

    return {
      user: safeProfile,
      accessToken,
      refreshToken: newRefresh.token,
    };
  }

  /**
   * Logs out a session by revoking the refresh token session in the database.
   */
  public async logout(params: {
    refreshToken?: string;
    userId?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<void> {
    if (params.refreshToken) {
      const tokenHash = TokenService.hashToken(params.refreshToken);
      const session = await sessionRepository.findByTokenHash(tokenHash);
      if (session && !session.revokedAt) {
        await sessionRepository.revokeSession(session.id);
      }
    }

    if (params.userId) {
      await AuditService.recordEvent({
        event: "LOGOUT",
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    }
  }

  /**
   * Retrieves the authenticated user's profile.
   */
  public async getCurrentUser(userId: string): Promise<SafeUserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.unauthorized("User account not found", "AUTHENTICATION_REQUIRED");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw AppError.unauthorized("Account is not active", "AUTHENTICATION_REQUIRED");
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      status: user.status,
      department: user.department,
      institution: user.institution,
    };
  }
}

export const authService = new AuthService();
