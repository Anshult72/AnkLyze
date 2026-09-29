"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import TopNavigation from "@/components/examiner/TopNavigation";
import ExaminerHeader from "@/components/examiner/ExaminerHeader";
import WorkSummary from "@/components/examiner/WorkSummary";
import EvaluationQueue from "@/components/examiner/EvaluationQueue";
import AttentionList from "@/components/examiner/AttentionList";
import ProgressSection from "@/components/examiner/ProgressSection";
import RecentActivity from "@/components/examiner/RecentActivity";
import {
  EXAMINER_CONTEXT,
  WORK_SUMMARY_DATA,
  EVALUATION_QUEUE_DATA,
  ATTENTION_ITEMS_DATA,
  PROGRESS_METRICS_DATA,
  RECENT_ACTIVITY_DATA,
} from "@/data/examinerMockData";

export default function ExaminerDashboardPage() {
  return (
    <div className="min-h-screen bg-[#FCFAF5] text-slate-900 flex flex-col font-sans selection:bg-amber-200 selection:text-slate-900">
      
      {/* 1. TOP NAVIGATION WITH WEBSITE LINK */}
      <TopNavigation activeTab="dashboard" />

      {/* 2. EXAMINER CONTEXT HEADER */}
      <ExaminerHeader context={EXAMINER_CONTEXT} />

      {/* MAIN COCKPIT WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 3. WORK SUMMARY (Assigned, Completed, Pending, Needs Review) */}
        <WorkSummary metrics={WORK_SUMMARY_DATA} />

        {/* WORKSPACE COCKPIT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PRIMARY WORKSPACE COLUMN (Evaluation Queue & Attention Items) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 4. MY EVALUATION QUEUE */}
            <section aria-labelledby="evaluation-queue-heading">
              <EvaluationQueue scripts={EVALUATION_QUEUE_DATA} />
            </section>

            {/* 5. NEEDS YOUR ATTENTION */}
            <section aria-labelledby="attention-items-heading">
              <AttentionList items={ATTENTION_ITEMS_DATA} />
            </section>
          </div>

          {/* SUPPORTING CONTEXT COLUMN (Progress & Audit Activity) */}
          <div className="lg:col-span-4 space-y-8">
            {/* 6. TODAY'S PROGRESS */}
            <section aria-labelledby="today-progress-heading">
              <ProgressSection metrics={PROGRESS_METRICS_DATA} />
            </section>

            {/* 7. RECENT ACTIVITY */}
            <section aria-labelledby="recent-activity-heading">
              <RecentActivity activities={RECENT_ACTIVITY_DATA} />
            </section>

            {/* INSTITUTIONAL INTEGRITY BADGE */}
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-600 space-y-2 shadow-xs">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Station Compliance Active</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Authorized under MPOnline Examination Board Bylaws 2026. All marks and rubric step adjustments are audited in real time.
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200/90 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900">PaperEval</span>
            <span>•</span>
            <span>MPOnline Digital Examination Evaluation System</span>
            <span>•</span>
            <Link href="/" className="text-blue-600 hover:underline font-semibold">
              Public Website ↗
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>Station: BPL-CTR04-ST08</span>
            <span>TLS 1.3 AES-256</span>
            <span>Examiner: {EXAMINER_CONTEXT.examinerId}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
