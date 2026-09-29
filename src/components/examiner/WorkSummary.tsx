"use client";

import React from "react";
import { WorkSummaryMetrics } from "@/data/examinerMockData";

interface WorkSummaryProps {
  metrics: WorkSummaryMetrics;
}

export default function WorkSummary({ metrics }: WorkSummaryProps) {
  const items = [
    {
      label: "Assigned Scripts",
      value: metrics.assignedScripts,
      detail: "Total allocated batch",
      valueColor: "text-slate-900",
      badge: null,
    },
    {
      label: "Completed",
      value: metrics.completed,
      detail: "Evaluated & signed",
      valueColor: "text-[#16A34A]",
      badge: `${Math.round((metrics.completed / metrics.assignedScripts) * 100)}%`,
      badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: "Pending",
      value: metrics.pending,
      detail: "Awaiting evaluation",
      valueColor: "text-blue-600",
      badge: "In Queue",
      badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Needs Review",
      value: metrics.needsReview,
      detail: "Exceptions / verification",
      valueColor: "text-amber-600",
      badge: "Action Required",
      badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
    },
  ];

  return (
    <section aria-labelledby="work-summary-heading" className="w-full">
      <h2 id="work-summary-heading" className="sr-only">Work Summary Metrics</h2>

      {/* Unified summary surface */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs divide-y md:divide-y-0 md:divide-x divide-slate-100 grid grid-cols-2 md:grid-cols-4 overflow-hidden">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
                {item.label}
              </span>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeStyle}`}
                >
                  {item.badge}
                </span>
              )}
            </div>

            <div className="mt-1">
              <span className={`text-3xl sm:text-4xl font-serif font-bold tracking-tight ${item.valueColor}`}>
                {item.value}
              </span>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
