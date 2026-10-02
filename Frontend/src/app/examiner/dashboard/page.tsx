"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TopNavigation from "@/components/examiner/TopNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import ExaminerDashboardView from "@/components/dashboard/ExaminerDashboardView";
import HeadExaminerDashboardView from "@/components/dashboard/HeadExaminerDashboardView";
import SuperAdminDashboardView from "@/components/dashboard/SuperAdminDashboardView";
import styles from "../ExaminerPages.module.css";
import { ShieldCheck, UserCheck, Settings } from "lucide-react";

function DashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Role resolution: searchParam overrides for testing/demo, falling back to authenticated user role
  const urlRole = searchParams.get("role");
  const authRole = user?.role || "EXAMINER";
  const activeRole = urlRole || authRole;

  const handleRoleChange = (newRole: string) => {
    if (typeof window !== "undefined") {
      try {
        const demoStored = localStorage.getItem("anklyze_demo_user");
        const base = demoStored ? JSON.parse(demoStored) : { id: "demo-user", status: "ACTIVE" };
        base.role = newRole;
        if (newRole === "SUPER_ADMIN") {
          base.fullName = "ANKLYZE Platform Administrator";
          base.email = "superadmin@anklyze.demo";
        } else if (newRole === "HEAD_EXAMINER") {
          base.fullName = "Head Examiner";
          base.email = "head.examiner@anklyze.demo";
        } else {
          base.fullName = "Examiner";
          base.email = "examiner@anklyze.demo";
        }
        localStorage.setItem("anklyze_demo_user", JSON.stringify(base));
      } catch {
        // LocalStorage fallback
      }
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("role", newRole);
    router.push(`/examiner/dashboard?${params.toString()}`);
  };

  return (
    <div className={`workspace-shell ${styles.page}`}>
      <TopNavigation activeTab="dashboard" />
      <main className={styles.main}>
        {/* ROLE CONTEXT SWITCHER BAR (SUBTLE & RESTRAINED) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 mb-8 border-b border-[#dce7e0] text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-700">Responsibility Scope:</span>
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#eef4f0] text-[#062834] border border-[#d5e1db]">
              {activeRole === "SUPER_ADMIN"
                ? "SUPER ADMIN · Platform Administration"
                : activeRole === "HEAD_EXAMINER"
                ? "HEAD EXAMINER · Institutional Oversight"
                : "EXAMINER · Evaluation Desk"}
            </span>
          </div>

          <div
            className="inline-flex rounded-lg border border-[#d5e1db] p-0.5 bg-[#f6f9f7] text-[11px] font-semibold self-stretch sm:self-auto justify-between sm:justify-start"
            role="tablist"
            aria-label="Dashboard role views"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeRole === "EXAMINER"}
              onClick={() => handleRoleChange("EXAMINER")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeRole === "EXAMINER"
                  ? "bg-white text-[#062834] shadow-2xs font-bold border border-[#cdded8]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck size={13} aria-hidden="true" />
              <span>Examiner</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeRole === "HEAD_EXAMINER"}
              onClick={() => handleRoleChange("HEAD_EXAMINER")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeRole === "HEAD_EXAMINER"
                  ? "bg-white text-[#062834] shadow-2xs font-bold border border-[#cdded8]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck size={13} aria-hidden="true" />
              <span>Head Examiner</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeRole === "SUPER_ADMIN"}
              onClick={() => handleRoleChange("SUPER_ADMIN")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeRole === "SUPER_ADMIN"
                  ? "bg-white text-[#062834] shadow-2xs font-bold border border-[#cdded8]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Settings size={13} aria-hidden="true" />
              <span>Super Admin</span>
            </button>
          </div>
        </div>

        {/* ROLE-SPECIFIC DASHBOARD CONTENT */}
        {activeRole === "SUPER_ADMIN" ? (
          <SuperAdminDashboardView />
        ) : activeRole === "HEAD_EXAMINER" ? (
          <HeadExaminerDashboardView />
        ) : (
          <ExaminerDashboardView />
        )}
      </main>
    </div>
  );
}

export default function ExaminerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["EXAMINER", "HEAD_EXAMINER", "SUPER_ADMIN"]}>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#FCFAF5] flex items-center justify-center text-slate-500 font-mono text-xs">
            Loading dashboard...
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
