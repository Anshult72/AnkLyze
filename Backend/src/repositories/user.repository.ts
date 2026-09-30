import { prisma } from "../config/database";
import { User, Role } from "@prisma/client";

export type UserWithRole = User & { role: Role };

export class UserRepository {
  /**
   * Finds a user by normalized email, including their role details.
   */
  public async findByEmail(email: string): Promise<UserWithRole | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true },
    });
  }

  /**
   * Finds a user by their unique ID, including their role details.
   */
  public async findById(id: string): Promise<UserWithRole | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }
}

export const userRepository = new UserRepository();
