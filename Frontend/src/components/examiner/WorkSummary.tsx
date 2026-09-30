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
    },
    {
      label: "Completed",
      value: metrics.completed,
      detail: "Evaluated & signed",
    },
    {
      label: "Pending",
      value: metrics.pending,
      detail: "Awaiting evaluation",
    },
    {
      label: "Flagged in batch",
      value: metrics.needsReview,
      detail: "Across all assigned scripts",
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
            className="p-5 sm:p-6 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
                {item.label}
              </span>
            </div>

            <div className="mt-1">
              <span className="text-3xl sm:text-4xl font-serif font-medium tracking-tight text-slate-900">
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
