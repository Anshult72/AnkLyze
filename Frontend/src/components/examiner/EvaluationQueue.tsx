"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { EvaluationQueueScript, ScriptStatus, RiskLevel } from "@/data/examinerMockData";
import styles from "@/app/examiner/ExaminerPages.module.css";

interface EvaluationQueueProps {
  scripts: EvaluationQueueScript[];
}

type SortOption = "priority" | "updated" | "confidence" | "risk" | "progress";

export default function EvaluationQueue({ scripts }: EvaluationQueueProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Reset to page 1 whenever filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, sortBy]);

  // Compute category counts for filter buttons
  const counts = useMemo(() => {
    return {
      all: scripts.length,
      aiReady: scripts.filter((s) => s.status === "AI Ready").length,
      independent: scripts.filter((s) => s.status === "Independent Evaluation").length,
      needsReview: scripts.filter((s) => s.status === "Needs Review").length,
      attention: scripts.filter((s) => s.status === "Attention").length,
      completed: scripts.filter((s) => s.status === "Completed").length,
    };
  }, [scripts]);

  // 1. Filtering
  const filteredScripts = useMemo(() => {
    return scripts.filter((script) => {
      const matchesFilter =
        filterStatus === "ALL" ||
        (filterStatus === "AI_READY" && script.status === "AI Ready") ||
        (filterStatus === "INDEPENDENT" && script.status === "Independent Evaluation") ||
        (filterStatus === "NEEDS_REVIEW" && script.status === "Needs Review") ||
        (filterStatus === "ATTENTION" && script.status === "Attention") ||
        (filterStatus === "COMPLETED" && script.status === "Completed");

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        script.scriptId.toLowerCase().includes(query) ||
        (script.priorityNote && script.priorityNote.toLowerCase().includes(query)) ||
        (script.lastQuestion && script.lastQuestion.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [scripts, filterStatus, searchQuery]);

  // 2. Sorting
  const sortedScripts = useMemo(() => {
    return [...filteredScripts].sort((a, b) => {
      switch (sortBy) {
        case "priority": {
          const priorityOrder: Record<ScriptStatus, number> = {
            "Independent Evaluation": 1,
            Attention: 2,
            "Needs Review": 3,
            "In Progress": 4,
            "AI Ready": 5,
            Completed: 6,
          };
          const diff = priorityOrder[a.status] - priorityOrder[b.status];
          if (diff !== 0) return diff;
          // Sub-sort by confidence ascending if same status
          return (a.confidenceScore ?? 0) - (b.confidenceScore ?? 0);
        }
        case "updated": {
          return b.updatedAt.localeCompare(a.updatedAt);
        }
        case "confidence": {
          return (a.confidenceScore ?? 0) - (b.confidenceScore ?? 0);
        }
        case "risk": {
          const riskOrder: Record<string, number> = {
            High: 1,
            "High Risk": 1,
            Medium: 2,
            "Medium Risk": 2,
            Low: 3,
            "Low Risk": 3,
          };
          return (riskOrder[a.riskLevel] ?? 3) - (riskOrder[b.riskLevel] ?? 3);
        }
        case "progress": {
          const aProg = (a.evaluatedAnswers ?? 0) / a.totalAnswers;
          const bProg = (b.evaluatedAnswers ?? 0) / b.totalAnswers;
          return bProg - aProg;
        }
        default:
          return 0;
      }
    });
  }, [filteredScripts, sortBy]);

  // 3. Pagination
  const totalPages = Math.ceil(sortedScripts.length / pageSize) || 1;
  const paginatedScripts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedScripts.slice(start, start + pageSize);
  }, [sortedScripts, currentPage]);

  const startIndex = sortedScripts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, sortedScripts.length);

  // Status Badge Helper
  const getStatusBadge = (status: ScriptStatus) => {
    switch (status) {
      case "AI Ready":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            AI Ready
          </span>
        );
      case "Independent Evaluation":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Independent Evaluation
          </span>
        );
      case "In Progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-[#20565e] border border-[#b9d7d0]">
            In Progress
          </span>
        );
      case "Needs Review":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Needs Review
          </span>
        );
      case "Attention":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Attention
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Risk Badge Helper (Readable text + colored signal)
  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case "High":
      case "High Risk":
        return (
          <span className="inline-flex items-center text-xs font-bold text-rose-600">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 shrink-0" aria-hidden="true" />
            HIGH
          </span>
        );
      case "Medium":
      case "Medium Risk":
        return (
          <span className="inline-flex items-center text-xs font-bold text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 shrink-0" aria-hidden="true" />
            MEDIUM
          </span>
        );
      case "Low":
      case "Low Risk":
      default:
        return (
          <span className="inline-flex items-center text-xs font-bold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0" aria-hidden="true" />
            LOW
          </span>
        );
    }
  };

  // Action Button Details
  const getActionDetails = (script: EvaluationQueueScript) => {
    const cleanId = script.scriptId.replace(/^(?:SCRIPT|SHEET)\s+/, "");
    switch (script.status) {
      case "Independent Evaluation":
        return {
          label: "Evaluate →",
          href: `/examiner/evaluate/${cleanId}?round=2&question=${script.resumeQuestion || script.lastQuestion || "Q04"}`,
          className: "bg-[#062834] hover:bg-[#1a4452] text-white",
        };
      case "Completed":
        return {
          label: "View →",
          href: `/examiner/evaluate/${cleanId}`,
          className: "bg-slate-700 hover:bg-slate-800 text-white",
        };
      case "In Progress":
        return {
          label: "Resume →",
          href: `/examiner/evaluate/${cleanId}`,
          className: "bg-[#326c74] hover:bg-[#20565e] text-white",
        };
      case "Needs Review":
        return {
          label: "Review →",
          href: `/examiner/evaluate/${cleanId}`,
          className: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      case "Attention":
        return {
          label: "Review →",
          href: `/examiner/evaluate/${cleanId}`,
          className: "bg-rose-600 hover:bg-rose-700 text-white",
        };
      case "AI Ready":
      default:
        return {
          label: "Evaluate →",
          href: `/examiner/evaluate/${cleanId}`,
          className: "bg-[#326c74] hover:bg-[#20565e] text-white",
        };
    }
  };

  // Empty state message resolver
  const getEmptyStateMessage = () => {
    if (searchQuery.trim() !== "") {
      return `No sheets match "${searchQuery}".`;
    }
    switch (filterStatus) {
      case "COMPLETED":
        return "No completed evaluations yet.";
      case "NEEDS_REVIEW":
        return "No evaluations need review right now.";
      case "ATTENTION":
        return "Nothing needs your attention.";
      case "AI_READY":
        return "No sheets ready to mark at this time.";
      case "ALL":
      default:
        return "No assigned evaluations in this queue.";
    }
  };

  return (
    <div className={`${styles.dataPanel} bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden`}>
      
      {/* Header and Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 id="evaluation-queue-heading" className="font-serif text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Assigned sheets
            </h2>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
              {filteredScripts.length} of {scripts.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Choose a sheet to continue marking or review flagged answers.
          </p>
        </div>

        {/* Filter, Sort, and Search Bar */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
          {/* Quick Filter Tabs including Completed */}
          <div 
            role="tablist" 
            aria-label="Filter evaluations by status"
            className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold overflow-x-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filterStatus === "ALL"}
              onClick={() => setFilterStatus("ALL")}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                filterStatus === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All <span className="text-[10px] text-slate-400 font-mono">({counts.all})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filterStatus === "AI_READY"}
              onClick={() => setFilterStatus("AI_READY")}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                filterStatus === "AI_READY"
                  ? "bg-white text-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              AI Ready <span className="text-[10px] text-blue-400 font-mono">({counts.aiReady})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filterStatus === "INDEPENDENT"}
              onClick={() => setFilterStatus("INDEPENDENT")}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                filterStatus === "INDEPENDENT"
                  ? "bg-white text-purple-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Independent Evaluation <span className="text-[10px] text-purple-500 font-mono">({counts.independent})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filterStatus === "NEEDS_REVIEW"}
              onClick={() => setFilterStatus("NEEDS_REVIEW")}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                filterStatus === "NEEDS_REVIEW"
                  ? "bg-white text-amber-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Needs Review <span className="text-[10px] text-amber-500 font-mono">({counts.needsReview})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filterStatus === "ATTENTION"}
              onClick={() => setFilterStatus("ATTENTION")}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                filterStatus === "ATTENTION"
                  ? "bg-white text-rose-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Attention <span className="text-[10px] text-rose-500 font-mono">({counts.attention})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filterStatus === "COMPLETED"}
              onClick={() => setFilterStatus("COMPLETED")}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                filterStatus === "COMPLETED"
                  ? "bg-white text-emerald-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Completed <span className="text-[10px] text-emerald-500 font-mono">({counts.completed})</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#326c74]/20 focus:border-[#326c74]"
              aria-label="Sort queue by"
            >
              <option value="priority">Sort: Priority</option>
              <option value="updated">Sort: Recently Updated</option>
              <option value="confidence">Sort: Lowest Confidence</option>
              <option value="risk">Sort: Highest Risk</option>
              <option value="progress">Sort: Evaluation Progress</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search Sheet ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#326c74]/20 focus:border-[#326c74] w-full sm:w-40"
              aria-label="Search Sheet ID"
            />
          </div>
        </div>
      </div>

      {/* Desktop / Tablet Tabular View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs" aria-labelledby="evaluation-queue-heading">
          <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200/80">
            <tr>
              <th scope="col" className="px-5 py-3.5 font-bold">Sheet ID</th>
              <th scope="col" className="px-4 py-3.5 font-bold">Status</th>
              <th scope="col" className="px-4 py-3.5 font-bold">Evaluation Progress</th>
              <th scope="col" className="px-4 py-3.5 font-bold">Confidence</th>
              <th scope="col" className="px-4 py-3.5 font-bold">Risk Level</th>
              <th scope="col" className="px-4 py-3.5 font-bold">Updated</th>
              <th scope="col" className="px-5 py-3.5 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedScripts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-500 italic">
                  {getEmptyStateMessage()}
                </td>
              </tr>
            ) : (
              paginatedScripts.map((script) => {
                const action = getActionDetails(script);
                const evaluated = script.evaluatedAnswers ?? (script.status === "Completed" ? script.totalAnswers : 0);
                const isCompleted = script.status === "Completed";
                const isInProgress = script.status === "In Progress";
                const isNeedsReview = script.status === "Needs Review";

                return (
                  <tr
                    key={script.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Sheet ID & Context */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 text-xs group-hover:text-[#326c74] transition-colors block">
                        {script.scriptId}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                        {script.priorityNote ? (
                          <span className={isInProgress ? "text-[#326c74] font-medium" : isNeedsReview ? "text-amber-700" : ""}>
                            {script.priorityNote}
                          </span>
                        ) : (
                          `${script.detectedAnswers} of ${script.totalAnswers} answers detected`
                        )}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(script.status)}
                    </td>

                    {/* Clarified Evaluation Progress */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {script.status === "Independent Evaluation" ? (
                        <div>
                          <span className="font-mono font-bold text-purple-700 text-xs block">
                            1 / 1 Question
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Ready to evaluate
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline space-x-1">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {evaluated}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">/ {script.totalAnswers}</span>
                          </div>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {isCompleted 
                              ? "Completed & signed" 
                              : isInProgress && script.resumeQuestion
                              ? `Resume ${script.resumeQuestion}`
                              : `${script.detectedAnswers} detected`}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Confidence Meter */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full ${
                              (script.confidenceScore ?? 85) >= 90
                                ? "bg-emerald-500"
                                : (script.confidenceScore ?? 85) >= 75
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${script.confidenceScore ?? 85}%` }}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="font-mono font-semibold text-slate-700 text-[11px]">
                          {script.confidenceScore ?? 85}%
                        </span>
                      </div>
                    </td>

                    {/* Risk Level */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getRiskBadge(script.riskLevel)}
                    </td>

                    {/* Last update */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {script.updatedAt}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Link
                        href={action.href}
                        className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${action.className}`}
                        id={`btn-evaluate-${script.scriptId.replace(/^(?:SCRIPT|SHEET)\s+/, "")}`}
                      >
                        <span>{action.label}</span>
                        <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile-Deliberate Stacked Row Cards (sm:hidden) */}
      <div className="sm:hidden divide-y divide-slate-100">
        {paginatedScripts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 italic">
            {getEmptyStateMessage()}
          </div>
        ) : (
          paginatedScripts.map((script) => {
            const action = getActionDetails(script);
            const evaluated = script.evaluatedAnswers ?? (script.status === "Completed" ? script.totalAnswers : 0);

            return (
              <div key={script.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {script.scriptId}
                    </span>
                    {script.priorityNote && (
                      <span className="block text-[11px] text-slate-500 font-mono">
                        {script.priorityNote}
                      </span>
                    )}
                  </div>
                  <div>{getStatusBadge(script.status)}</div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 font-mono pt-1">
                  <span>
                    {script.status === "Independent Evaluation" ? (
                      <strong className="text-purple-700">1 / 1 Question · Ready</strong>
                    ) : (
                      <>
                        Progress: <strong className="text-slate-900">{evaluated}/{script.totalAnswers}</strong>
                        {script.resumeQuestion && (
                          <span className="text-[#326c74] font-medium ml-1">· Resume {script.resumeQuestion}</span>
                        )}
                      </>
                    )}
                  </span>
                  <div>{getRiskBadge(script.riskLevel)}</div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                    <span>Conf:</span>
                    <strong className="text-slate-800">{script.confidenceScore}%</strong>
                    <span className="text-slate-300">•</span>
                    <span>{script.updatedAt}</span>
                  </div>

                  <Link
                    href={action.href}
                    className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${action.className}`}
                  >
                    <span>{action.label}</span>
                    <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="font-mono text-[11px]">
          Showing <strong className="text-slate-800">{startIndex}–{endIndex}</strong> of{" "}
          <strong className="text-slate-800">{sortedScripts.length}</strong> assigned sheets
        </div>

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Previous</span>
            </button>

            <span className="text-[11px] font-mono text-slate-600 px-1">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
