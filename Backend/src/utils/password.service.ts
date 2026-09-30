import argon2 from "argon2";

/**
 * Service for secure password hashing and verification using Argon2id.
 * Follows OWASP recommendations for password storage.
 */
export class PasswordService {
  /**
   * Hashes a plaintext password using Argon2id.
   *
   * @param plainPassword - The plaintext password to hash
   * @returns Promise resolving to the Argon2id hash string
   */
  public static async hashPassword(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,       // 3 iterations
      parallelism: 1,    // 1 thread
    });
  }

  /**
   * Verifies a plaintext password against an Argon2id hash.
   *
   * @param hash - The stored Argon2id hash
   * @param plainPassword - The plaintext password provided by the user
   * @returns Promise resolving to true if valid, false otherwise
   */
  public static async verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainPassword);
    } catch {
      return false;
    }
  }
}
