/**
 * ANKLYZE Phase 15 - Mobile Secure Storage Service
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Uses expo-secure-store on native iOS/Android.
 * - In-memory fallback for testing/browser runtime.
 * - Never stores plain auth secrets in insecure local storage.
 */

let memoryStore: Record<string, string> = {};

export class SecureStorageService {
  private static isSecureStoreAvailable(): boolean {
    try {
      const SecureStore = require("expo-secure-store");
      return Boolean(SecureStore && SecureStore.setItemAsync);
    } catch {
      return false;
    }
  }

  public static async setItem(key: string, value: string): Promise<void> {
    if (this.isSecureStoreAvailable()) {
      const SecureStore = require("expo-secure-store");
      await SecureStore.setItemAsync(key, value);
    } else {
      memoryStore[key] = value;
    }
  }

  public static async getItem(key: string): Promise<string | null> {
    if (this.isSecureStoreAvailable()) {
      const SecureStore = require("expo-secure-store");
      return await SecureStore.getItemAsync(key);
    }
    return memoryStore[key] || null;
  }

  public static async removeItem(key: string): Promise<void> {
    if (this.isSecureStoreAvailable()) {
      const SecureStore = require("expo-secure-store");
      await SecureStore.deleteItemAsync(key);
    } else {
      delete memoryStore[key];
    }
  }
}
