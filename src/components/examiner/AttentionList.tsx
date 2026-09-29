"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, HelpCircle, ChevronRight, FileText, CheckCircle } from "lucide-react";
import { AttentionItem } from "@/data/examinerMockData";

interface AttentionListProps {
  items: AttentionItem[];
}

export default function AttentionList({ items }: AttentionListProps) {
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  const handleQuickDismiss = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResolvedIds((prev) => [...prev, id]);
  };

  const activeItems = items.filter((item) => !resolvedIds.includes(item.id));

  const getSeverityIndicator = (severity: "High" | "Medium" | "Low") => {
    switch (severity) {
      case "High":
        return {
          bar: "bg-rose-500",
          text: "text-rose-700",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "Medium":
        return {
          bar: "bg-amber-500",
          text: "text-amber-700",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "Low":
      default:
        return {
          bar: "bg-emerald-500",
          text: "text-emerald-700",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Needs Your Attention
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
              {activeItems.length} Exceptions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Active evaluation flags requiring examiner discretion before grading finalization
          </p>
        </div>
      </div>

      {/* Item List */}
      <div className="divide-y divide-slate-100">
        {activeItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-900 text-sm">All attention items resolved</p>
            <p className="text-slate-400">All scripts in current batch meet confidence threshold standards.</p>
          </div>
        ) : (
          activeItems.map((item) => {
            const sev = getSeverityIndicator(item.severity);

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                {/* Left Severity Indicator Strip */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${sev.bar}`}
                  aria-hidden="true"
                />

                <div className="space-y-1.5 flex-1 pl-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                      {item.scriptId}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-700">
                      {item.questionNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sev.badge}`}
                    >
                      {item.severity} Priority
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-900">
                    {item.reason}
                  </div>

                  <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                    {item.recommendedAction}
                  </p>

                  <div className="text-xs font-mono font-medium text-blue-600 pt-0.5">
                    {item.delta}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 self-start sm:self-center shrink-0 pl-2 sm:pl-0">
                  <button
                    type="button"
                    onClick={(e) => handleQuickDismiss(item.id, e)}
                    className="text-xs text-slate-500 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                    title="Dismiss alert without modifying score"
                  >
                    Dismiss
                  </button>

                  <Link
                    href={`/examiner/evaluate/${item.scriptId}`}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:border-blue-600 hover:bg-blue-50/60 text-slate-800 transition-colors shadow-2xs"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                  </Link>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Footer Meta */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span>Batch: <strong className="font-mono text-slate-800">CS-301</strong></span>
        <span>Lead Examiner: <strong className="text-slate-800">Station 04</strong></span>
      </div>

    </div>
  );
}
