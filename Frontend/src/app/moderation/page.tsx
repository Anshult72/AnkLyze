"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MOCK_MODERATION_CASES,
  MODERATION_SUMMARY_METRICS,
  ModerationCaseSummary,
} from "@/data/moderationMockData";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  ShieldAlert,
  Scale,
  Clock,
  Filter,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Inbox,
  UserCheck,
} from "lucide-react";

export default function ModerationQueuePage() {
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [cases, setCases] = useState<ModerationCaseSummary[]>(MOCK_MODERATION_CASES);

  const filteredCases = cases.filter((c) => {
    if (selectedPriority !== "ALL" && c.priority !== selectedPriority) return false;
    if (selectedStatus !== "ALL" && c.status !== selectedStatus) return false;
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={["MODERATOR", "HEAD_EXAMINER", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-[#FCFAF5] text-slate-900 flex flex-col font-sans selection:bg-[#c5ddd4]">
        
        {/* TOP HEADER */}
        <header className="bg-slate-900 text-white border-b border-slate-800 py-6 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Quality Control &amp; Senior Review</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                Institutional Moderation Queue
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Review evaluations flagged by deterministic risk triggers, double-evaluation disagreements, and examiner escalation requests.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/admin/analytics"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              >
                Quality Analytics
              </Link>
              <Link
                href="/examiner/dashboard"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Examiner Desk
              </Link>
            </div>
          </div>
        </header>

        {/* MAIN BODY */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
          
          {/* 1. SUMMARY METRICS STRIP */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Backlog</div>
              <div className="text-2xl font-black font-mono text-slate-900">{MODERATION_SUMMARY_METRICS.activeBacklog}</div>
              <div className="text-[11px] text-slate-400">Cases requiring action</div>
            </div>

            <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200/80 shadow-2xs space-y-1">
              <div className="text-xs font-semibold text-rose-800 uppercase tracking-wide">Critical Priority</div>
              <div className="text-2xl font-black font-mono text-rose-900">{MODERATION_SUMMARY_METRICS.criticalCount}</div>
              <div className="text-[11px] text-rose-700 font-medium">Double-eval divergence &gt; 20%</div>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 shadow-2xs space-y-1">
              <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide">High Priority</div>
              <div className="text-2xl font-black font-mono text-amber-900">{MODERATION_SUMMARY_METRICS.highCount}</div>
              <div className="text-[11px] text-amber-700 font-medium">Risk score &gt; 50 or flagged</div>
            </div>

            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 shadow-2xs space-y-1">
              <div className="text-xs font-semibold text-blue-800 uppercase tracking-wide">In Review</div>
              <div className="text-2xl font-black font-mono text-blue-900">{MODERATION_SUMMARY_METRICS.inReviewCount}</div>
              <div className="text-[11px] text-blue-700 font-medium">Moderators assigned</div>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Resolved</div>
              <div className="text-2xl font-black font-mono text-emerald-900">{MODERATION_SUMMARY_METRICS.resolvedCount}</div>
              <div className="text-[11px] text-emerald-700 font-medium">Authoritative decision logged</div>
            </div>
          </div>

          {/* 2. FILTER STRIP */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filter Queue:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-slate-500 font-medium">Priority:</span>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="flex items-center space-x-1 text-xs">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="ESCALATED">Escalated</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. CASE LIST TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Inbox className="w-4 h-4 text-slate-600" />
                <h3 className="font-serif text-sm font-bold text-slate-900">
                  Moderation Cases ({filteredCases.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Ordered by Priority &amp; Age
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredCases.map((c) => (
                <div key={c.id} className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {c.caseNumber}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        c.priority === "CRITICAL" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                        c.priority === "HIGH" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                        c.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
                        "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {c.priority} PRIORITY
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" :
                        c.status === "IN_REVIEW" ? "bg-blue-100 text-blue-800" :
                        c.status === "ASSIGNED" ? "bg-purple-100 text-purple-800" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {c.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {c.subject} ({c.subjectCode}) • Script <strong>{c.scriptId}</strong> • <strong>{c.questionNumber}</strong>
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      {c.triggerDetail}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono">
                      <span>Round 1: <strong className="text-slate-900">{c.round1Marks}/{c.maxMarks}</strong></span>
                      <span>Round 2: <strong className="text-slate-900">{c.round2Marks}/{c.maxMarks}</strong></span>
                      <span>AI: <strong className="text-slate-900">{c.aiSuggestedMarks}/{c.maxMarks}</strong></span>
                      <span>Risk: <strong className="text-amber-800">{c.overallRiskScore}/100 ({c.riskBand})</strong></span>
                      {c.assignedModerator && (
                        <span>Moderator: <strong className="text-slate-800">{c.assignedModerator}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center space-x-3">
                    <Link
                      href={`/moderation/${c.id}`}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-2xs"
                    >
                      <span>Open Case</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}
