"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileCheck2,
  ShieldCheck,
  AlertCircle,
  Clock,
  History,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  RefreshCw,
  FileText,
  BadgeAlert,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import type { ResultDetailData } from "@/data/resultMockData";
import { fetchApi } from "@/utils/apiClient";
import TopNavigation from "@/components/examiner/TopNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AdminResultsPage() {
  const [results, setResults] = useState<ResultDetailData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [validationFilter, setValidationFilter] = useState<string>("ALL");
  const [selectedResultForApproval, setSelectedResultForApproval] = useState<ResultDetailData | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<any[]>("/results");
      if (res.success && Array.isArray(res.data)) {
        const mapped: ResultDetailData[] = res.data.map((item: any) => {
          return {
            id: item.id,
            scriptId: item.script?.scriptCode || item.scriptId,
            candidateReference: item.script?.candidateReference || `ROLL-${item.scriptId.slice(0, 8).toUpperCase()}`,
            examId: item.examId || "exam-01",
            examTitle: item.exam?.title || "Board Examination 2026",
            examCode: item.exam?.code || "EXAM-2026",
            subjectId: item.subjectId || "sub-01",
            subjectName: item.subject?.name || "Subject Examination",
            subjectCode: item.subject?.code || "SUB-01",
            totalMarks: item.totalMarks ?? 0,
            maximumMarks: item.maximumMarks ?? item.maxMarks ?? 100,
            percentage: item.percentage ?? 0,
            resultCode: (item.percentage ?? 0) >= 75 ? "DISTINCTION" : (item.percentage ?? 0) >= 60 ? "FIRST_CLASS" : "PASS",
            status: item.status || "VALIDATED",
            validationStatus: item.validationStatus || "PASSED",
            version: item.version || 1,
            fingerprint: item.id.slice(0, 16),
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            approvedAt: item.approvedAt,
            approvedByName: item.approvedBy?.fullName || (item.approvedAt ? "Head Examiner" : undefined),
            questions: item.questionMarks?.map((qm: any) => ({
              id: qm.id || "qm-01",
              questionAttemptId: qm.questionAttemptId || "qa-01",
              questionNumber: qm.questionNumber || "Q01",
              maximumMarks: qm.maxMarks || 10,
              awardedMarks: qm.awardedMarks || 0,
              status: qm.status || "AGGREGATED",
              sourceDecisionId: qm.sourceDecisionId || "dec-01",
              sourceDecisionVersion: qm.sourceDecisionVersion || 1,
              sourceExaminerName: "Lead Examiner",
              feedbackSnippet: qm.feedbackSnippet,
            })) || [],
            validationIssues: item.validationIssues || [],
            history: item.history || [],

          };
        });
        setResults(mapped);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load examination results from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.candidateReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.scriptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesValidation = validationFilter === "ALL" || r.validationStatus === validationFilter;
    return matchesSearch && matchesStatus && matchesValidation;
  });

  const totalCount = results.length;
  const approvedCount = results.filter((r) => r.status === "APPROVED").length;
  const validatedCount = results.filter((r) => r.status === "VALIDATED").length;
  const blockedCount = results.filter((r) => r.status === "BLOCKED" || r.validationStatus === "BLOCKED").length;

  const handleApprove = async (result: ResultDetailData) => {
    if (result.validationStatus === "BLOCKED") {
      alert("BLOCKING_VALIDATION_ERROR: This result has active validation issues and cannot be approved.");
      return;
    }
    setIsApproving(true);
    try {
      const res = await fetchApi<any>(`/results/${result.id}/approve`, {
        method: "POST",
      });
      if (res.success) {
        setApprovalSuccess(`Result for ${result.candidateReference} (v${result.version}) has been approved and locked.`);
        await loadResults();
        setSelectedResultForApproval(null);
        setTimeout(() => setApprovalSuccess(null), 4000);
      } else {
        alert(res.error?.message || "Failed to approve result");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to approve result");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "HEAD_EXAMINER"]}>
      <div className="workspace-shell min-h-screen bg-[#FCFAF5] text-slate-900 flex flex-col font-sans">
        <TopNavigation activeTab="admin-results" />
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/exams"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exams Hub</span>
              </Link>
              <div className="h-4 w-px bg-stone-300" />
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white">
                  Institutional
                </span>
                <span className="font-semibold text-slate-900">Result Validation & Controlled Governance</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/analytics"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-slate-700 bg-white hover:bg-stone-50 transition-colors shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Quality Analytics</span>
              </Link>
              <Link
                href="/examiner/dashboard"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-slate-700 bg-white hover:bg-stone-50 transition-colors shadow-2xs"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Examiner Workspace</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Container */}
        <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
          {/* Banner Notification */}
          {approvalSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium">{approvalSuccess}</span>
            </div>
          )}

          {/* Header Title Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Examination Results</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-stone-200 text-slate-700">
                  Authoritative Aggregation
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Deterministic question-mark aggregation, coverage rule validation, and immutable version governance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadResults}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-300 text-xs font-medium text-slate-700 bg-white hover:bg-stone-50 transition-colors shadow-2xs"
                title="Refresh from Authoritative Decisions"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : "text-slate-500"}`} />
                <span>Sync Decisions</span>
              </button>
            </div>
          </div>

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Sheets</span>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{totalCount}</span>
                <span className="text-xs text-slate-500">records in database</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Approved (Locked)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-700">{approvedCount}</span>
                <span className="text-xs text-slate-500">finalized & versioned</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Validated (Pending Approval)</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-700">{validatedCount}</span>
                <span className="text-xs text-slate-500">passed all rules</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Blocked (Flagged)</span>
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-700">{blockedCount}</span>
                <span className="text-xs text-slate-500">requires resolution</span>
              </div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidate roll no, sheet ID, or subject..."
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-stone-400"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VALIDATED">Validated</option>
                  <option value="APPROVED">Approved</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">Validation:</span>
                <select
                  value={validationFilter}
                  onChange={(e) => setValidationFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-stone-400"
                >
                  <option value="ALL">All Rules</option>
                  <option value="PASSED">Passed</option>
                  <option value="FLAGGED">Flagged</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
            {loading ? (
              <div className="p-16 text-center text-xs text-slate-500 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
                <p className="font-semibold text-slate-700">Loading results from database...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-xs text-rose-600 space-y-3">
                <AlertTriangle className="w-6 h-6 mx-auto text-rose-500" />
                <p className="font-semibold text-slate-800">{error}</p>
                <button
                  onClick={loadResults}
                  className="px-3.5 py-1.5 bg-[#062834] text-white hover:bg-[#1a4452] rounded-lg font-medium text-xs"
                >
                  Retry
                </button>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-400" />
                <p className="font-semibold text-slate-700 text-sm">No results match your criteria</p>
                <p className="text-slate-400">Institutional results appear once evaluated scripts are finalized.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="px-4 py-3">Candidate / Sheet</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3 text-right">Awarded / Max</th>
                      <th className="px-4 py-3 text-right">Percentage</th>
                      <th className="px-4 py-3">Validation Status</th>
                      <th className="px-4 py-3">Lifecycle Status</th>
                      <th className="px-4 py-3">Version</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {filteredResults.map((res) => (
                      <tr key={res.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div>
                            <span className="font-mono font-bold text-slate-900">{res.candidateReference}</span>
                            <div className="text-[11px] font-mono text-slate-500">{res.scriptId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{res.subjectName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{res.subjectCode}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {res.totalMarks} / {res.maximumMarks}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                          {res.percentage.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              res.validationStatus === "PASSED"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : res.validationStatus === "WARNING"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {res.validationStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              res.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : res.status === "VALIDATED"
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {res.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">v{res.version}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Link
                            href={`/admin/results/${res.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold text-[11px] transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </Link>

                          {res.status !== "APPROVED" && (
                            <button
                              onClick={() => setSelectedResultForApproval(res)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors shadow-2xs"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Approval Modal */}
        {selectedResultForApproval && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-base">Approve Institutional Result</h3>
                </div>
                <button
                  onClick={() => setSelectedResultForApproval(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  You are authoritatively signing off on examination result for candidate{" "}
                  <strong className="font-mono text-slate-900">{selectedResultForApproval.candidateReference}</strong>.
                </p>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1 font-mono text-[11px]">
                  <div>Sheet ID: {selectedResultForApproval.scriptId}</div>
                  <div>Subject: {selectedResultForApproval.subjectName} ({selectedResultForApproval.subjectCode})</div>
                  <div>
                    Awarded: {selectedResultForApproval.totalMarks} / {selectedResultForApproval.maximumMarks} (
                    {selectedResultForApproval.percentage.toFixed(1)}%)
                  </div>
                  <div>Version: v{selectedResultForApproval.version}</div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                  <strong>Institutional Locking Notice:</strong> Once approved, this record becomes immutable. Any subsequent mark alterations will require an explicit controlled revaluation audit trail.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  onClick={() => setSelectedResultForApproval(null)}
                  disabled={isApproving}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApprove(selectedResultForApproval)}
                  disabled={isApproving}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  {isApproving ? "Locking & Approving..." : "Confirm Institutional Approval"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
