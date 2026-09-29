"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, ArrowUpRight, CheckCircle2, AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { EvaluationQueueScript, ScriptStatus, RiskLevel } from "@/data/examinerMockData";

interface EvaluationQueueProps {
  scripts: EvaluationQueueScript[];
}

export default function EvaluationQueue({ scripts }: EvaluationQueueProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredScripts = useMemo(() => {
    return scripts.filter((script) => {
      const matchesFilter =
        filterStatus === "ALL" ||
        (filterStatus === "AI_READY" && script.status === "AI Ready") ||
        (filterStatus === "NEEDS_REVIEW" && script.status === "Needs Review") ||
        (filterStatus === "ATTENTION" && script.status === "Attention");

      const matchesSearch =
        searchQuery.trim() === "" ||
        script.scriptId.toLowerCase().includes(searchQuery.toLowerCase().trim());

      return matchesFilter && matchesSearch;
    });
  }, [scripts, filterStatus, searchQuery]);

  const getStatusBadge = (status: ScriptStatus) => {
    switch (status) {
      case "AI Ready":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            AI Ready
          </span>
        );
      case "Needs Review":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Needs Review
          </span>
        );
      case "Attention":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Attention
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case "High":
      case "High Risk":
        return (
          <span className="inline-flex items-center text-xs font-bold text-rose-600">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
            High
          </span>
        );
      case "Medium":
      case "Medium Risk":
        return (
          <span className="inline-flex items-center text-xs font-bold text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
            Medium
          </span>
        );
      case "Low":
      case "Low Risk":
      default:
        return (
          <span className="inline-flex items-center text-xs font-bold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Low
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      
      {/* Header and Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              My Evaluation Queue
            </h2>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
              {filteredScripts.length} of {scripts.length} Scripts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prioritized evaluation stream with preliminary AI step-marks &amp; confidence ratings
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Quick Filter Tabs */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1 rounded-md transition-all ${
                filterStatus === "ALL"
                  ? "bg-white text-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("AI_READY")}
              className={`px-3 py-1 rounded-md transition-all ${
                filterStatus === "AI_READY"
                  ? "bg-white text-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              AI Ready
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("NEEDS_REVIEW")}
              className={`px-3 py-1 rounded-md transition-all ${
                filterStatus === "NEEDS_REVIEW"
                  ? "bg-white text-amber-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Needs Review
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("ATTENTION")}
              className={`px-3 py-1 rounded-md transition-all ${
                filterStatus === "ATTENTION"
                  ? "bg-white text-rose-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Attention
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Script ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200/80">
            <tr>
              <th scope="col" className="px-5 py-3.5 font-bold">Script ID</th>
              <th scope="col" className="px-4 py-3.5 font-bold">Status</th>
              <th scope="col" className="px-4 py-3.5 font-bold">AI Preliminary</th>
              <th scope="col" className="px-4 py-3.5 font-bold">Confidence</th>
              <th scope="col" className="px-4 py-3.5 font-bold">Risk Level</th>
              <th scope="col" className="px-4 py-3.5 font-bold">Estimated Time</th>
              <th scope="col" className="px-5 py-3.5 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredScripts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                  No scripts found matching the active filter.
                </td>
              </tr>
            ) : (
              filteredScripts.map((script) => (
                <tr
                  key={script.id}
                  className="hover:bg-blue-50/25 transition-colors group"
                >
                  {/* Script ID */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-mono font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                      {script.scriptId}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      Q1 - Q10 Complete
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {getStatusBadge(script.status)}
                  </td>

                  {/* AI Score */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {script.status === "AI Ready" ? "71.5" : script.status === "Needs Review" ? "58.0" : "46.5"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-0.5">/ 100</span>
                  </td>

                  {/* Confidence Meter */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (script.confidenceScore ?? 85) >= 90
                              ? "bg-emerald-500"
                              : (script.confidenceScore ?? 85) >= 75
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${script.confidenceScore ?? 85}%` }}
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

                  {/* Estimated Time */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 flex items-center space-x-1 pt-4">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{script.riskLevel === "High Risk" ? "~7 mins" : script.riskLevel === "Medium Risk" ? "~5 mins" : "~3 mins"}</span>
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Link
                      href={`/examiner/evaluate/${script.scriptId}`}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
                      id={`btn-evaluate-${script.scriptId}`}
                    >
                      <span>Evaluate</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span>Batch: <strong className="font-mono text-slate-800">CS-301</strong> (Semester End Assessment)</span>
        <span>Auto-sorted by priority &amp; risk score</span>
      </div>

    </div>
  );
}
