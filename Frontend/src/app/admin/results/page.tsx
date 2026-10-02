"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { MOCK_RESULTS_LIST, ResultDetailData } from "@/data/resultMockData";
import TopNavigation from "@/components/examiner/TopNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AdminResultsPage() {
  const [results, setResults] = useState<ResultDetailData[]>(MOCK_RESULTS_LIST);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [validationFilter, setValidationFilter] = useState<string>("ALL");
  const [selectedResultForApproval, setSelectedResultForApproval] = useState<ResultDetailData | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);

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

  const handleApprove = (result: ResultDetailData) => {
    if (result.validationStatus === "BLOCKED") {
      alert("BLOCKING_VALIDATION_ERROR: This result has active validation issues and cannot be approved.");
      return;
    }
    setIsApproving(true);
    setTimeout(() => {
      setResults((prev) =>
        prev.map((item) =>
          item.id === result.id
            ? {
                ...item,
                status: "APPROVED",
                approvedAt: new Date().toISOString(),
                approvedByName: "Dr. Arvind Sharma (Head Examiner)",
              }
            : item
        )
      );
      setIsApproving(false);
      setSelectedResultForApproval(null);
      setApprovalSuccess(`Result for ${result.candidateReference} (v${result.version}) has been approved and locked.`);
      setTimeout(() => setApprovalSuccess(null), 4000);
    }, 600);
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
                Phase 14
              </span>
              <span className="font-semibold text-slate-900">Result Validation & Controlled Revaluation</span>
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
              onClick={() => setResults([...MOCK_RESULTS_LIST])}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-300 text-xs font-medium text-slate-700 bg-white hover:bg-stone-50 transition-colors shadow-2xs"
              title="Refresh from Authoritative Decisions"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
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
              <span className="text-xs text-slate-500">records in batch</span>
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
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Validated (Pending Approval)</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">{validatedCount}</span>
              <span className="text-xs text-slate-500">ready for Head Examiner</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Blocked Anomaly</span>
              <BadgeAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-700">{blockedCount}</span>
              <span className="text-xs text-slate-500">requires resolution</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by candidate ref, sheet ID, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">APPROVED</option>
                <option value="VALIDATED">VALIDATED</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="SUPERSEDED">SUPERSEDED</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Validation:</span>
              <select
                value={validationFilter}
                onChange={(e) => setValidationFilter(e.target.value)}
                className="text-xs rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">All Rule States</option>
                <option value="PASSED">PASSED</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="WARNING">WARNING</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Data Table */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Candidate Reference</th>
                  <th className="py-3 px-4">Subject & Exam</th>
                  <th className="py-3 px-4 text-center">Version</th>
                  <th className="py-3 px-4 text-right">Total Marks</th>
                  <th className="py-3 px-4 text-center">Outcome</th>
                  <th className="py-3 px-4 text-center">Validation</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-slate-800">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No examination results match the specified search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((result) => {
                    const isBlocked = result.status === "BLOCKED" || result.validationStatus === "BLOCKED";
                    const isApproved = result.status === "APPROVED";
                    const isValidated = result.status === "VALIDATED";

                    return (
                      <tr key={result.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{result.candidateReference}</span>
                            <span className="text-[10px] text-slate-500 font-sans px-1.5 py-0.5 rounded-sm bg-stone-100 border border-stone-200">
                              {result.scriptId}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900">{result.subjectName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono">{result.subjectCode}</span>
                            <span>•</span>
                            <span>{result.examCode}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-slate-800 border border-stone-200">
                            v{result.version}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold text-slate-900 text-sm">
                            {result.totalMarks.toFixed(1)}{" "}
                            <span className="text-slate-400 text-xs font-normal">/ {result.maximumMarks}</span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">{result.percentage.toFixed(1)}%</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider ${
                              result.resultCode === "DISTINCTION"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : result.resultCode === "FIRST_CLASS"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : result.resultCode === "PASS"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {result.resultCode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isBlocked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              <span>BLOCKED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>PASSED</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              isApproved
                                ? "bg-slate-900 text-white"
                                : isValidated
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : isBlocked
                                ? "bg-rose-100 text-rose-900 border border-rose-300"
                                : "bg-stone-100 text-slate-700"
                            }`}
                          >
                            {result.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/results/${result.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-stone-300 text-xs font-medium text-slate-700 hover:bg-stone-100 transition-colors shadow-2xs"
                              title="Inspect marks, provenance & validation"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Details</span>
                            </Link>

                            {isValidated && (
                              <button
                                onClick={() => setSelectedResultForApproval(result)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Approve</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Approval Confirmation Modal */}
      {selectedResultForApproval && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-stone-200">
                <ShieldCheck className="w-5 h-5 text-slate-900" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Authorize Result Package Approval</h3>
                <p className="text-xs text-slate-600 mt-1">
                  You are approving the aggregated examination result for candidate{" "}
                  <strong className="font-mono text-slate-900">{selectedResultForApproval.candidateReference}</strong>.
                </p>
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Subject:</span>
                <span className="font-medium text-slate-900">{selectedResultForApproval.subjectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Version:</span>
                <span className="font-mono font-bold text-slate-900">v{selectedResultForApproval.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Awarded Marks:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedResultForApproval.totalMarks} / {selectedResultForApproval.maximumMarks} (
                  {selectedResultForApproval.percentage}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Validation Status:</span>
                <span className="font-semibold text-emerald-700">PASSED (0 blocking issues)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 text-[11px]">
                <span className="text-slate-400 font-mono">Fingerprint:</span>
                <span className="text-slate-500 font-mono">{selectedResultForApproval.fingerprint.substring(0, 16)}...</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Once approved, this result version becomes <strong>immutable</strong>. Any future modifications will require
                an authorized Revaluation Request yielding a versioned Result v{selectedResultForApproval.version + 1}.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedResultForApproval(null)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-medium text-slate-700 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isApproving}
                onClick={() => handleApprove(selectedResultForApproval)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
              >
                {isApproving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isApproving ? "Locking & Approving..." : "Confirm & Approve Result"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}
