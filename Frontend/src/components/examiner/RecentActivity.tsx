"use client";

import React from "react";
import { RecentActivityItem } from "@/data/examinerMockData";

interface RecentActivityProps {
  activities: RecentActivityItem[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 sm:p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Recent activity
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Updates from this evaluation session.
          </p>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="flow-root">
        <ul role="list" className="-mb-2">
          {activities.map((item) => (
              <li key={item.id} className="relative pb-3.5">
                <div className="relative flex items-start space-x-3">
                  <span
                    className="h-2 w-2 rounded-full bg-[#468189] shrink-0 mt-1"
                    aria-hidden="true"
                  />

                  {/* Activity Details */}
                  <div className="min-w-0 flex-1 flex justify-between space-x-2 text-xs">
                    <div>
                      <p className="text-slate-800 font-medium">
                        {item.title || item.description}
                      </p>
                      {item.detail && (
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {item.detail}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-[11px] whitespace-nowrap text-slate-400 font-mono">
                      {item.time || item.timestamp}
                    </div>
                  </div>
                </div>
              </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
