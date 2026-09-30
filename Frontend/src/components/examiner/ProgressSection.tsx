"use client";

import React from "react";
import { ProgressMetrics } from "@/data/examinerMockData";

interface ProgressSectionProps {
  metrics: ProgressMetrics;
}

export default function ProgressSection({ metrics }: ProgressSectionProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 sm:p-6">
      
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 id="today-progress-heading" className="font-serif text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Batch progress
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Where the current batch stands.
          </p>
        </div>
      </div>

      {/* Main Progress Indicator */}
      <div className="space-y-2 mt-4">
        <div className="flex items-baseline justify-between text-xs sm:text-sm">
          <div>
            <span className="font-serif font-bold text-slate-900 text-lg sm:text-xl">
              {metrics.completedScripts} of {metrics.totalAssigned}
            </span>{" "}
            <span className="text-slate-500 font-medium">scripts completed</span>
          </div>
          <span className="font-bold font-mono text-base text-blue-600">
            {metrics.percentage}%
          </span>
        </div>

        {/* Clean, calibrated progress bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${metrics.percentage}%` }}
            role="progressbar"
            aria-valuenow={metrics.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${metrics.percentage}% of scripts completed`}
          />
        </div>
      </div>

      {/* Supporting Workload Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">
        
        {/* Speed / Pace Metric */}
        <div className="space-y-1">
          <div className="text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Average time / script</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="font-serif font-bold text-slate-900 text-xl">{metrics.averageTimePerScript}</span>
            <span className="text-xs text-slate-500 font-medium">avg</span>
          </div>
        </div>

        {/* Estimated Completion Time */}
        <div className="space-y-1">
          <div className="text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Estimated time remaining</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="font-serif font-bold text-slate-900 text-xl">{metrics.estimatedRemainingWorkload}</span>
            <span className="text-xs text-slate-500 font-medium">workload</span>
          </div>
        </div>

      </div>


    </div>
  );
}
