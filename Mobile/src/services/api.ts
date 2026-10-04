/**
 * ANKLYZE Phase 15 - Mobile API Client
 * "Analyse the marks, not just the paper."
 * 
 * Rules:
 * - Direct connection to backend REST API endpoints.
 * - Automatic Authorization header injection from secure store.
 * - Safe network error handling.
 */

import { SecureStorageService } from "./storage";
import { MobileUser, MobileScriptItem, MobileQuestionAttempt } from "../types";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  "https://anklyze-gitconnect-38002070587.asia-south1.run.app/api/v1";

export class MobileApiClient {
  private static async getHeaders(): Promise<Record<string, string>> {
    const token = await SecureStorageService.getItem("access_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  public static async login(email: string, password: string): Promise<{ user: MobileUser; token: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Login failed");
    }

    const { user, accessToken } = json.data;
    await SecureStorageService.setItem("access_token", accessToken);
    await SecureStorageService.setItem("user_profile", JSON.stringify(user));

    return { user, token: accessToken };
  }

  public static async getAssignedScripts(): Promise<MobileScriptItem[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/scripts`, { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to load assigned scripts");
    }
    return json.data.items || [];
  }

  public static async getQuestionAttempt(id: string): Promise<MobileQuestionAttempt> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/question-attempts/${id}/evaluation`, { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to fetch question attempt");
    }
    return json.data;
  }

  public static async saveDraftDecision(
    evaluationId: string,
    payload: {
      totalMarks: number;
      criteriaDecisions: { criterionId: string; awardedMarks: number; notes?: string }[];
      overrideReason?: string;
      notes?: string;
    }
  ): Promise<any> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/decisions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        decisionType: payload.overrideReason ? "OVERRIDE_AI" : "SAVE_DRAFT",
        status: "DRAFT",
        ...payload,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to save draft decision");
    }
    return json.data;
  }

  public static async finalizeDecision(evaluationId: string, notes?: string): Promise<any> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/finalize`, {
      method: "POST",
      headers,
      body: JSON.stringify({ notes }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to finalize decision");
    }
    return json.data;
  }
}
