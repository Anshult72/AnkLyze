import { prisma } from "../config/database";
import { AuthSession, User, Role } from "@prisma/client";

export type AuthSessionWithUser = AuthSession & {
  user: User & { role: Role };
};

export class SessionRepository {
  /**
   * Creates a new authentication session with a hashed refresh token.
   */
  public async createSession(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthSession> {
    return prisma.authSession.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      },
    });
  }

  /**
   * Finds an active or revoked session by its token hash, including associated user and role.
   */
  public async findByTokenHash(tokenHash: string): Promise<AuthSessionWithUser | null> {
    return prisma.authSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { role: true },
        },
      },
    });
  }

  /**
   * Revokes a specific session by setting revokedAt to current timestamp.
   */
  public async revokeSession(id: string): Promise<AuthSession> {
    return prisma.authSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revokes all active sessions for a user (e.g. on security breach or password change).
   */
  public async revokeAllUserSessions(userId: string): Promise<{ count: number }> {
    return prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }
}

export const sessionRepository = new SessionRepository();
