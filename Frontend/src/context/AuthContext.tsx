"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "HEAD_EXAMINER" | "EXAMINER" | "MODERATOR" | string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | string;
  department?: string | null;
  institution?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const rawBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");
const API_BASE_URL = rawBaseUrl.endsWith("/api/v1") ? rawBaseUrl : `${rawBaseUrl}/api/v1`;
const allowOfflineDemo = process.env.NODE_ENV !== "production";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Initialize session on mount using secure HTTP-only refresh cookie (with dev demo fallback)
  useEffect(() => {
    async function initializeSession() {
      if (typeof window !== "undefined") {
        const demoStored = localStorage.getItem("anklyze_demo_user");
        if (allowOfflineDemo && demoStored) {
          try {
            const parsed = JSON.parse(demoStored);
            setUser(parsed);
            setAccessToken(parsed.accessToken || "demo-token");
            setIsLoading(false);
            return;
          } catch {
            // fallback to network
          }
        }
      }

      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data) {
            setAccessToken(refreshData.data.accessToken);
            setUser(refreshData.data.user);
          }
        } else {
          setUser(null);
          setAccessToken(null);
        }
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    initializeSession();
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMessage =
            data?.error?.message ||
            (response.status === 401 ? "Invalid credentials" : "An error occurred during sign in");
          return { success: false, error: errorMessage };
        }

        const authenticatedUser: UserProfile = data.data.user;
        const token: string = data.data.accessToken;

        // Keep access token strictly in-memory (never in localStorage/sessionStorage)
        localStorage.removeItem("anklyze_demo_user");
        setUser(authenticatedUser);
        setAccessToken(token);

        return { success: true };
      } catch (err: unknown) {
        // Offline demo access is available only in development builds.
        const demoAccounts: Record<string, { id: string; fullName: string; role: UserProfile["role"] }> = {
          "superadmin@anklyze.demo": { id: "demo-admin-id", fullName: "ANKLYZE Platform Administrator", role: "SUPER_ADMIN" },
          "head.examiner@anklyze.demo": { id: "demo-head-id", fullName: "Head Examiner", role: "HEAD_EXAMINER" },
          "examiner@anklyze.demo": { id: "demo-examiner-id", fullName: "Examiner", role: "EXAMINER" },
        };
        const demoEmail = email.toLowerCase().trim();
        const demoAccount = demoAccounts[demoEmail];
        if (allowOfflineDemo && demoAccount && password === "AnklyzeDemo#2026") {
          const demoUser: UserProfile = {
            id: demoAccount.id,
            email: demoEmail,
            fullName: demoAccount.fullName,
            role: demoAccount.role,
            status: "ACTIVE",
          };
          const demoToken = `demo-token-${demoAccount.id}`;
          localStorage.setItem("anklyze_demo_user", JSON.stringify({ ...demoUser, accessToken: demoToken }));
          setUser(demoUser);
          setAccessToken(demoToken);
          return { success: true };
        }

        const networkError = err as Error;
        return {
          success: false,
          error: networkError.message?.includes("Failed to fetch")
            ? "Unable to connect to ANKLYZE Authentication server. Please verify backend is running."
            : "Network error during authentication.",
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("anklyze_demo_user");
      }
      if (accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });
      }
    } catch {
      // Best-effort logout notification to server
    } finally {
      setUser(null);
      setAccessToken(null);
      router.push("/login");
    }
  }, [accessToken, router]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setUser(data.data);
        }
      }
    } catch {
      // Silent error
    }
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
