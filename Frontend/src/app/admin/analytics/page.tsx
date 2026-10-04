"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Users,
  Layers,
  FileCheck2,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  Info,
  Activity,
  Award,
  RefreshCw,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import TopNavigation from "@/components/examiner/TopNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { fetchApi } from "@/utils/apiClient";

interface OperationalCoverage {
  exam: { id: string; title: string; code: string; academicTerm?: string };
  totalAssignedAttempts: number;
  evaluatedAttempts: number;
  highRiskAttempts: number;
  doubleEvaluationRequired: number;
  doubleEvaluationCompleted: number;
  moderationCasesOpen: number;
  moderationCasesResolved: number;
}

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "coverage" | "consistency" | "drift") || "coverage";
  const [activeTab, setActiveTab] = useState<"coverage" | "consistency" | "drift">(initialTab);

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [coverage, setCoverage] = useState<OperationalCoverage | null>(null);
  const [evaluators, setEvaluators] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadExamsAndCoverage = async () => {
    setLoading(true);
    setError(null);
    try {
      const examsRes = await fetchApi<any[]>("/exams");
      if (examsRes.success && Array.isArray(examsRes.data) && examsRes.data.length > 0) {
        setExams(examsRes.data);
        const examId = selectedExamId || examsRes.data[0].id;
        if (!selectedExamId) setSelectedExamId(examId);

        const [covRes, accountsRes] = await Promise.all([
          fetchApi<any>(`/analytics/exams/${examId}/coverage`).catch(() => null),
          fetchApi<any[]>("/examiner-accounts").catch(() => null),
        ]);

        if (covRes && covRes.success && covRes.data) {
          const d = covRes.data;
          const oc = d.operationalCoverage || {};
          setCoverage({
            exam: d.exam || { id: examId, title: "Active Exam", code: "EXAM" },
            totalAssignedAttempts: oc.totalAttempts || 0,
            evaluatedAttempts: oc.evaluatedAttempts || 0,
            highRiskAttempts: oc.highRiskAttempts || 0,
            doubleEvaluationRequired: oc.doubleEvaluationRequired || 0,
            doubleEvaluationCompleted: oc.doubleEvaluationCompleted || 0,
            moderationCasesOpen: oc.openModerationCases || 0,
            moderationCasesResolved: oc.resolvedModerationCases || 0,
          });
        } else {
          setCoverage(null);
        }

        if (accountsRes && accountsRes.success && Array.isArray(accountsRes.data)) {
          setEvaluators(accountsRes.data);
        }
      } else {
        setExams([]);
        setCoverage(null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load operational analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamsAndCoverage();
  }, [selectedExamId]);

  const totalAssigned = coverage?.totalAssignedAttempts || 0;
  const evalProgressPct = totalAssigned > 0 ? Math.round(((coverage?.evaluatedAttempts || 0) / totalAssigned) * 100) : 0;
  const doubleRequired = coverage?.doubleEvaluationRequired || 0;
  const doubleEvalProgressPct = doubleRequired > 0 ? Math.round(((coverage?.doubleEvaluationCompleted || 0) / doubleRequired) * 100) : 0;
  const totalModeration = (coverage?.moderationCasesResolved || 0) + (coverage?.moderationCasesOpen || 0);
  const moderationResolvedPct = totalModeration > 0 ? Math.round(((coverage?.moderationCasesResolved || 0) / totalModeration) * 100) : 100;
  const highRiskPct = totalAssigned > 0 ? Math.round(((coverage?.highRiskAttempts || 0) / totalAssigned) * 100) : 0;

  return (
    <div className="workspace-shell min-h-screen bg-[#FCFAF5] text-slate-900 flex flex-col font-sans">
      <TopNavigation activeTab="admin-analytics" />
      {/* Top Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/exams"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exams Overview</span>
            </Link>
            <div className="h-4 w-px bg-stone-300" />
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white">
                Quality &amp; Consistency Analytics
              </span>
              <span className="text-xs text-slate-500 font-mono">Institutional Oversight</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {exams.length > 0 && (
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-slate-800 bg-white"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={loadExamsAndCoverage}
              disabled={loading}
              className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-slate-600 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
            </button>

            <Link
              href="/moderation"
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>Moderation Backlog ({coverage?.moderationCasesOpen || 0})</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full space-y-6">
        {/* Institutional Governance Disclaimer Banner */}
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 flex items-start gap-3 shadow-xs">
          <Info className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-semibold text-slate-900">ANKLYZE Analytics Policy &amp; Ethics Principle: </span>
            All descriptive metrics, drift indicators, and consistency rates are strictly generated for operational oversight, rubric alignment, and moderation prioritization. They are never converted into personal rankings, public leaderboards, or automated punitive scores.
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-stone-200">
          <div className="flex items-center gap-2">
            <button
              id="tab-coverage"
              onClick={() => setActiveTab("coverage")}
              className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 inline-flex items-center gap-2 ${
                activeTab === "coverage"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Operational Coverage</span>
            </button>
            <button
              id="tab-consistency"
              onClick={() => setActiveTab("consistency")}
              className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 inline-flex items-center gap-2 ${
                activeTab === "consistency"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Evaluator Consistency</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500 space-y-3 bg-white border border-stone-200 rounded-xl">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
            <p className="font-semibold text-slate-700">Loading operational analytics from server...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-rose-600 space-y-3 bg-white border border-rose-200 rounded-xl">
            <AlertTriangle className="w-6 h-6 mx-auto text-rose-500" />
            <p className="font-semibold text-slate-800">{error}</p>
            <button
              onClick={loadExamsAndCoverage}
              className="px-3.5 py-1.5 bg-[#062834] text-white hover:bg-[#1a4452] rounded-lg font-medium text-xs"
            >
              Retry
            </button>
          </div>
        ) : activeTab === "coverage" ? (
          <div className="space-y-6">
            {/* High-level Coverage Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Attempt Evaluation
                  </span>
                  <FileCheck2 className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{evalProgressPct}%</span>
                  <span className="text-xs text-slate-500">
                    ({coverage?.evaluatedAttempts || 0}/{coverage?.totalAssignedAttempts || 0})
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                    Double Evaluation
                  </span>
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-teal-700">{doubleEvalProgressPct}%</span>
                  <span className="text-xs text-slate-500">
                    ({coverage?.doubleEvaluationCompleted || 0}/{coverage?.doubleEvaluationRequired || 0} completed)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                    Moderation Resolution
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-amber-700">{moderationResolvedPct}%</span>
                  <span className="text-xs text-slate-500">
                    ({coverage?.moderationCasesResolved || 0} resolved / {coverage?.moderationCasesOpen || 0} open)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                    High Risk Density
                  </span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-rose-700">{highRiskPct}%</span>
                  <span className="text-xs text-slate-500">({coverage?.highRiskAttempts || 0} attempts flagged)</span>
                </div>
              </div>
            </div>

            {totalAssigned === 0 && (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2 bg-white rounded-xl border border-stone-200">
                <BarChart3 className="w-8 h-8 mx-auto text-slate-300" />
                <h3 className="font-semibold text-slate-700 text-sm">No Evaluation Attempts Recorded Yet</h3>
                <p className="text-slate-400">
                  Operational coverage metrics populate automatically as answer sheets are ingested and evaluated by examiners.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Evaluators Tab */
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
            {evaluators.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">No examiner accounts configured</p>
                <p className="text-slate-400">Examiner consistency profiles generate with active evaluation sessions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="px-4 py-3">Examiner</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Institution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {evaluators.map((ev) => (
                      <tr key={ev.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{ev.fullName}</div>
                          <div className="text-[11px] text-slate-500">{ev.email}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">{ev.role?.name || ev.role}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              ev.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {ev.status || "ACTIVE"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{ev.institution || "State Board"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "HEAD_EXAMINER"]}>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading analytics...</div>}>
        <AnalyticsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
