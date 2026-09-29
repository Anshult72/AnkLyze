"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers } from "lucide-react";
import { ExaminerContext } from "@/data/examinerMockData";

interface ExaminerHeaderProps {
  context: ExaminerContext;
}

export default function ExaminerHeader({ context }: ExaminerHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Contextual Information */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <span>✦ Active Evaluation Session</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-normal">{context.session}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              {context.greeting}
            </h1>

            <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-slate-500 pt-0.5">
              <span className="font-semibold text-slate-800">{context.examination}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700 font-medium">{context.subject}</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                {context.subjectCode}
              </span>
            </div>
          </div>

          {/* Primary Call to Action (Continue Evaluation) */}
          <div className="flex items-center sm:self-center">
            <Link
              href={`/examiner/evaluate/${context.nextPendingScriptId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              id="btn-continue-evaluation"
            >
              <span>Continue Evaluation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
