"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import {
  MOCK_OPERATIONAL_COVERAGE,
  MOCK_EVALUATORS_CONSISTENCY,
  MOCK_DRIFT_OBSERVATIONS,
} from "@/data/analyticsMockData";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import TopNavigation from "@/components/examiner/TopNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "coverage" | "consistency" | "drift") || "coverage";
  const [activeTab, setActiveTab] = useState<"coverage" | "consistency" | "drift">(initialTab);
  const coverage = MOCK_OPERATIONAL_COVERAGE;
  const evaluators = MOCK_EVALUATORS_CONSISTENCY;
  const driftList = MOCK_DRIFT_OBSERVATIONS;

  const evalProgressPct = Math.round((coverage.evaluatedAttempts / coverage.totalAssignedAttempts) * 100);
  const doubleEvalProgressPct = Math.round((coverage.doubleEvaluationCompleted / coverage.doubleEvaluationRequired) * 100);
  const moderationResolvedPct = Math.round((coverage.moderationCasesResolved / (coverage.moderationCasesResolved + coverage.moderationCasesOpen)) * 100);
  const highRiskPct = Math.round((coverage.highRiskAttempts / coverage.totalAssignedAttempts) * 100);

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
                Quality & Consistency Analytics
              </span>
              <span className="text-xs text-slate-500 font-mono">Phase 13 Institutional Oversight</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/moderation"
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>Moderation Backlog ({coverage.moderationCasesOpen})</span>
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
            <span className="font-semibold text-slate-900">ANKLYZE Analytics Policy & Ethics Principle: </span>
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

            <button
              id="tab-drift"
              onClick={() => setActiveTab("drift")}
              className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 inline-flex items-center gap-2 ${
                activeTab === "drift"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Evaluator Drift Signals</span>
              {driftList.filter((d) => d.status === "DETECTED").length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-mono font-bold">
                  {driftList.filter((d) => d.status === "DETECTED").length}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium pb-3">
            Scope: <span className="font-semibold text-slate-800">{coverage.examTitle}</span> ({coverage.academicTerm})
          </div>
        </div>

        {/* Tab 1: Operational Coverage */}
        {activeTab === "coverage" && (
          <div className="space-y-6 animate-fadeIn">
            {/* 4 Metric Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Evaluation Progress</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-slate-900">{evalProgressPct}%</span>
                  <span className="text-xs text-slate-600 font-mono">{coverage.evaluatedAttempts} / {coverage.totalAssignedAttempts}</span>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-slate-900 h-full rounded-full" style={{ width: `${evalProgressPct}%` }} />
                </div>
                <div className="text-[11px] text-slate-500 mt-2">{coverage.pendingAttempts} attempts pending</div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Double Evaluation</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-slate-900">{doubleEvalProgressPct}%</span>
                  <span className="text-xs text-slate-600 font-mono">{coverage.doubleEvaluationCompleted} / {coverage.doubleEvaluationRequired}</span>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${doubleEvalProgressPct}%` }} />
                </div>
                <div className="text-[11px] text-slate-500 mt-2">Triggered for high-risk attempts</div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Moderation Backlog</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-slate-900">{coverage.moderationCasesOpen}</span>
                  <span className="text-xs text-slate-600 font-mono">{moderationResolvedPct}% resolved</span>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full" style={{ width: `${moderationResolvedPct}%` }} />
                </div>
                <div className="text-[11px] text-slate-500 mt-2">{coverage.moderationCasesResolved} cases resolved</div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">High-Risk Attempts</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-slate-900">{coverage.highRiskAttempts}</span>
                  <span className="text-xs text-slate-600 font-mono">{highRiskPct}% of total</span>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-rose-600 h-full rounded-full" style={{ width: `${highRiskPct}%` }} />
                </div>
                <div className="text-[11px] text-slate-500 mt-2">Deterministic triggers &amp; variance flags</div>
              </div>
            </div>

            {/* Detailed Operational Breakdown Table */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                <div className="font-semibold text-sm text-slate-900">Subject-Wise Operational Coverage</div>
                <span className="text-xs text-slate-500">Real-time status</span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Total Assigned</th>
                    <th className="py-3 px-4">Evaluated</th>
                    <th className="py-3 px-4">Pending</th>
                    <th className="py-3 px-4">High Risk</th>
                    <th className="py-3 px-4">Double Eval</th>
                    <th className="py-3 px-4">Moderation Cases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-slate-800">
                  <tr className="hover:bg-stone-50/60 transition-colors font-sans">
                    <td className="py-3 px-4 font-semibold text-slate-900">Engineering Mathematics III (CS-301)</td>
                    <td className="py-3 px-4 font-mono">260</td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">224 (86%)</td>
                    <td className="py-3 px-4 font-mono text-amber-700 font-semibold">36</td>
                    <td className="py-3 px-4 font-mono text-rose-700 font-semibold">28</td>
                    <td className="py-3 px-4 font-mono">32 / 36</td>
                    <td className="py-3 px-4 font-mono">5 Open / 12 Resolved</td>
                  </tr>
                  <tr className="hover:bg-stone-50/60 transition-colors font-sans">
                    <td className="py-3 px-4 font-semibold text-slate-900">Thermodynamics & Fluid Mechanics (ME-302)</td>
                    <td className="py-3 px-4 font-mono">190</td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">154 (81%)</td>
                    <td className="py-3 px-4 font-mono text-amber-700 font-semibold">36</td>
                    <td className="py-3 px-4 font-mono text-rose-700 font-semibold">18</td>
                    <td className="py-3 px-4 font-mono">16 / 18</td>
                    <td className="py-3 px-4 font-mono">3 Open / 8 Resolved</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Evaluator Consistency */}
        {activeTab === "consistency" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">Descriptive Marking & Consistency Overview</div>
                  <div className="text-xs text-slate-500">Observable marking tendencies & rubric alignment without ranking</div>
                </div>
                <div className="text-xs text-slate-500 font-mono">3 Active Evaluators</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Evaluator & Discipline</th>
                      <th className="py-3 px-4">Evaluations</th>
                      <th className="py-3 px-4">Mean Awarded</th>
                      <th className="py-3 px-4">AI Override Rate</th>
                      <th className="py-3 px-4">2nd Eval Disagreements</th>
                      <th className="py-3 px-4">Moderation Cases</th>
                      <th className="py-3 px-4">Consensus Deviation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-slate-800">
                    {evaluators.map((ev) => (
                      <tr key={ev.evaluatorId} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{ev.evaluatorName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{ev.subject}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">{ev.totalAttemptsEvaluated}</td>
                        <td className="py-3 px-4 font-mono">
                          <span className="font-semibold text-slate-900">{ev.meanAwardedMarks.toFixed(2)}</span>
                          <span className="text-slate-500"> / {ev.meanMaxMarks.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-400 block">Med: {ev.medianAwardedMarks.toFixed(1)}</span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="font-semibold">{ev.aiOverrideRate.toFixed(1)}%</span>
                          <span className="text-[10px] text-slate-500 block">{ev.criterionOverrideFrequency} criteria</span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className={ev.secondEvalDisagreementCount > 2 ? "text-amber-800 font-bold" : "text-slate-700"}>
                            {ev.secondEvalDisagreementCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="font-medium text-slate-800">{ev.moderationReferralCount}</span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="font-semibold text-emerald-800">±{ev.medianAbsoluteDeviationFromCalibration.toFixed(2)} marks</span>
                          <span className="text-[10px] text-slate-500 block">{ev.calibrationCriteriaAgreementRate.toFixed(0)}% consensus rate</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Evaluator Drift Signals */}
        {activeTab === "drift" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 gap-4">
              {driftList.map((drift) => (
                <div
                  key={drift.id}
                  className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                    drift.status === "INSUFFICIENT_DATA"
                      ? "border-stone-200 opacity-80"
                      : drift.severity === "SIGNIFICANT"
                      ? "border-amber-300"
                      : "border-stone-200"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-900">{drift.evaluatorName}</span>
                      <span className="text-xs text-slate-500 font-mono">{drift.subjectName}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          drift.status === "INSUFFICIENT_DATA"
                            ? "bg-stone-100 text-slate-600 border border-stone-200"
                            : drift.severity === "SIGNIFICANT"
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {drift.signalType.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">
                        Sample: <span className="font-bold text-slate-800">{drift.sampleSize}</span> (min: {drift.minSampleSize})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          drift.status === "DETECTED"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-stone-100 text-slate-600"
                        }`}
                      >
                        {drift.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                      <div className="text-[11px] text-slate-500 uppercase">Baseline Metric</div>
                      <div className="text-base font-bold font-mono text-slate-800">
                        {drift.baselineMetric.toFixed(1)}{drift.signalType.includes("RATE") ? "%" : " marks"}
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                      <div className="text-[11px] text-slate-500 uppercase">Current Window Metric</div>
                      <div className="text-base font-bold font-mono text-slate-900">
                        {drift.currentMetric.toFixed(1)}{drift.signalType.includes("RATE") ? "%" : " marks"}
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                      <div className="text-[11px] text-slate-500 uppercase">Observed Delta</div>
                      <div className={`text-base font-bold font-mono ${drift.delta > 0 ? "text-amber-800" : "text-slate-800"}`}>
                        {drift.delta > 0 ? `+${drift.delta.toFixed(1)}` : drift.delta.toFixed(1)}{drift.signalType.includes("RATE") ? "%" : " marks"}
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                      <div className="text-[11px] text-slate-500 uppercase">Evaluation Window</div>
                      <div className="text-xs font-mono text-slate-700 mt-0.5">
                        {drift.windowStart} to {drift.windowEnd}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-lg text-xs text-slate-700 leading-relaxed border border-stone-100">
                    <span className="font-semibold text-slate-900">Signal Observation: </span>
                    {drift.descriptiveExplanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function QualityAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "HEAD_EXAMINER"]}>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Quality Analytics...</div>}>
        <AnalyticsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
