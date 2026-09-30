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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

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
        if (demoStored) {
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
        setUser(authenticatedUser);
        setAccessToken(token);

        return { success: true };
      } catch (err: unknown) {
        // Fallback for standalone demo mode when backend is offline
        if (email.toLowerCase().includes("admin") || email.toLowerCase().includes("super")) {
          const demoUser: UserProfile = {
            id: "demo-admin-id",
            email,
            fullName: "Dr. Alok Verma (Super Admin)",
            role: "SUPER_ADMIN",
            status: "ACTIVE",
            department: "Evaluation Directorate",
            institution: "MP State Board of Technical Examinations",
          };
          if (typeof window !== "undefined") {
            localStorage.setItem("anklyze_demo_user", JSON.stringify({ ...demoUser, accessToken: "demo-token-super-admin" }));
          }
          setUser(demoUser);
          setAccessToken("demo-token-super-admin");
          return { success: true };
        } else if (email.toLowerCase().includes("head")) {
          const demoUser: UserProfile = {
            id: "demo-head-id",
            email,
            fullName: "Dr. Sunita Rao (Head Examiner)",
            role: "HEAD_EXAMINER",
            status: "ACTIVE",
            department: "Department of Computer Science & Engineering",
            institution: "Govt Engineering College, Jabalpur",
          };
          if (typeof window !== "undefined") {
            localStorage.setItem("anklyze_demo_user", JSON.stringify({ ...demoUser, accessToken: "demo-token-head-examiner" }));
          }
          setUser(demoUser);
          setAccessToken("demo-token-head-examiner");
          return { success: true };
        } else if (email.toLowerCase().includes("mod")) {
          const demoUser: UserProfile = {
            id: "demo-moderator-id",
            email,
            fullName: "Dr. Anita Verma (Moderator)",
            role: "MODERATOR",
            status: "ACTIVE",
            department: "Applied Mathematics",
            institution: "Govt Engineering College, Bhopal",
          };
          if (typeof window !== "undefined") {
            localStorage.setItem("anklyze_demo_user", JSON.stringify({ ...demoUser, accessToken: "demo-token-moderator" }));
          }
          setUser(demoUser);
          setAccessToken("demo-token-moderator");
          return { success: true };
        } else if (email.toLowerCase().includes("examiner")) {
          const demoUser: UserProfile = {
            id: "demo-examiner-id",
            email,
            fullName: "Prof. R. K. Sharma",
            role: "EXAMINER",
            status: "ACTIVE",
            department: "Mathematics & Computing",
            institution: "Maulana Azad National Institute of Technology",
          };
          if (typeof window !== "undefined") {
            localStorage.setItem("anklyze_demo_user", JSON.stringify({ ...demoUser, accessToken: "demo-token-examiner" }));
          }
          setUser(demoUser);
          setAccessToken("demo-token-examiner");
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
