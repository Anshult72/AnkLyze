"use client";

import React from "react";
import { RecentActivityItem } from "@/data/examinerMockData";

interface RecentActivityProps {
  activities: RecentActivityItem[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getCategoryDot = (category: RecentActivityItem["category"]) => {
    switch (category) {
      case "submission":
      case "completion":
        return "bg-emerald-500";
      case "review":
      case "flag":
        return "bg-amber-500";
      case "session":
      default:
        return "bg-blue-600";
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 sm:p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Recent Activity
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail for current examiner session
          </p>
        </div>
        <span className="text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          Station 04
        </span>
      </div>

      {/* Activity Timeline List */}
      <div className="flow-root">
        <ul role="list" className="-mb-2">
          {activities.map((item, idx) => {
            const isLast = idx === activities.length - 1;

            return (
              <li key={item.id} className="relative pb-3.5">
                {/* Vertical connecting line */}
                {!isLast && (
                  <span
                    className="absolute top-2 left-1.5 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex items-start space-x-3">
                  {/* Status dot */}
                  <span
                    className={`h-3 w-3 rounded-full ${getCategoryDot(item.category)} ring-4 ring-white shrink-0 mt-0.5`}
                    aria-hidden="true"
                  />

                  {/* Activity Details */}
                  <div className="min-w-0 flex-1 flex justify-between space-x-2 text-xs">
                    <div>
                      <p className="text-slate-800 font-medium">
                        {item.description}
                      </p>
                      {item.scriptId && (
                        <span className="font-mono text-[10px] text-slate-400">
                          Target: {item.scriptId}
                        </span>
                      )}
                    </div>
                    <div className="text-right text-[11px] whitespace-nowrap text-slate-400 font-mono">
                      {item.timestamp}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

    </div>
  );
}
