"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Download, 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  ChevronDown, 
  ArrowUpRight, 
  CheckCircle2, 
  Info,
  Clock
} from "lucide-react";
import WorkSummary from "./WorkSummary";
import ProgressSection from "./ProgressSection";
import RecentActivity from "./RecentActivity";
import { 
  EXAMINER_REPORTS_DATA, 
  ExaminerReportsDataset
} from "@/data/examinerMockData";
import { 
  exportQuestionWiseReportCSV, 
  exportAttentionRiskReportCSV, 
  exportActivityLogCSV 
} from "@/utils/reportExport";

interface ExaminerReportsViewProps {
  data?: ExaminerReportsDataset;
}

export default function ExaminerReportsView({ data = EXAMINER_REPORTS_DATA }: ExaminerReportsViewProps) {
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setReportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrintReport = () => {
    setReportMenuOpen(false);
    window.print();
  };

  const handleExportQuestions = () => {
    setReportMenuOpen(false);
    exportQuestionWiseReportCSV(data);
    showNotice("Question-wise marking report CSV downloaded.");
  };

  const handleExportAttention = () => {
    setReportMenuOpen(false);
    exportAttentionRiskReportCSV(data);
    showNotice("Attention & risk report CSV downloaded.");
  };

  const handleExportActivity = () => {
    setReportMenuOpen(false);
    exportActivityLogCSV(data);
    showNotice("Evaluation activity log CSV downloaded.");
  };

  const showNotice = (msg: string) => {
    setDownloadNotice(msg);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  const { markingOverview, questions, attentionRisk, workflow, summary, progress, recentActivity } = data;
  const maxBucketCount = Math.max(...markingOverview.markDistribution.map((b) => b.count), 1);

  return (
    <div className="space-y-7">
      
      {/* SECTION 8: Header Action Bar with Restrained Generate Report Menu */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#e4ede8]">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase font-mono text-[#5b7778]">
            Evaluation Intelligence & Batch Summary
          </h2>
          <p className="text-xs text-[#617579] mt-0.5">
            Operational marking records for Winter Session 2025-26 • Batch B-03
          </p>
        </div>

        {/* Restrained Report Action */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            id="generate-report-btn"
            onClick={() => setReportMenuOpen(!reportMenuOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#326c74] text-white hover:bg-[#20565e] focus:outline-none focus:ring-2 focus:ring-[#77aca2] focus:ring-offset-1 transition-colors shadow-xs"
            aria-expanded={reportMenuOpen}
            aria-haspopup="true"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Generate Report</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${reportMenuOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>

          {/* Report Selection Dropdown Menu */}
          {reportMenuOpen && (
            <div 
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="generate-report-btn"
              className="absolute right-0 mt-1.5 w-72 rounded-xl bg-[#fffefa] border border-[#d5e1db] shadow-lg z-20 py-1.5 text-xs text-[#062834] divide-y divide-[#edf4ef]"
            >
              <div className="p-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5b7778] px-2 block mb-1">
                  Export Dataset (CSV)
                </span>
                <button
                  type="button"
                  onClick={handleExportQuestions}
                  className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#f1f6f2] transition-colors"
                  role="menuitem"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#326c74] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[#062834]">Question-wise Marking Report</span>
                    <span className="text-[11px] text-[#617579] block">Item-level marks, attempts & review flags</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportAttention}
                  className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#f1f6f2] transition-colors mt-0.5"
                  role="menuitem"
                >
                  <FileText className="w-4 h-4 text-[#326c74] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[#062834]">Attention & Risk Summary</span>
                    <span className="text-[11px] text-[#617579] block">High risk metrics & root attention reasons</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportActivity}
                  className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#f1f6f2] transition-colors mt-0.5"
                  role="menuitem"
                >
                  <Clock className="w-4 h-4 text-[#326c74] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[#062834]">Evaluation Activity Log</span>
                    <span className="text-[11px] text-[#617579] block">Chronological timestamped session actions</span>
                  </div>
                </button>
              </div>

              <div className="p-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5b7778] px-2 block mb-1">
                  Document View
                </span>
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#f1f6f2] transition-colors"
                  role="menuitem"
                >
                  <Printer className="w-4 h-4 text-[#326c74] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[#062834]">Print Batch Evaluation Report</span>
                    <span className="text-[11px] text-[#617579] block">Print-optimized summary for signed record</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ephemeral Download Confirmation Banner */}
      {downloadNotice && (
        <div 
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 p-3 bg-[#eef4f0] border border-[#d5e1db] rounded-lg text-xs text-[#20565e] font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-[#326c74] shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* SECTION 1: Current Summary */}
      <WorkSummary metrics={summary} />

      {/* SECTION 2: Marking Overview & Mark Distribution */}
      <section 
        aria-labelledby="marking-overview-heading"
        className="bg-[#fffefa] border border-[#d5e1db] rounded-2xl p-6 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 pb-5 border-b border-[#e0e9e4]">
          <div>
            <h2 id="marking-overview-heading" className="text-xl sm:text-2xl font-serif text-[#062834] font-normal tracking-tight">
              Marking overview
            </h2>
            <p className="text-xs text-[#5c7275] mt-0.5">
              Score distribution and descriptive statistical indices across completed evaluations.
            </p>
          </div>
          <div className="text-xs text-[#5b7778] font-mono">
            <span>Evaluated: </span>
            <strong className="text-[#062834] font-semibold">{markingOverview.totalEvaluatedScripts}</strong> / {markingOverview.totalAssignedScripts} sheets
            <span className="mx-1.5">•</span>
            <span>{markingOverview.totalQuestionsEvaluated} question attempts</span>
          </div>
        </div>

        {/* 4 Key Statistics Cards */}
        {markingOverview.totalEvaluatedScripts === 0 ? (
          <div className="py-8 text-center text-xs text-[#617579] italic">
            No completed evaluations yet. Statistical marking patterns will appear once scripts are evaluated.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-b border-[#edf4ef]">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#5b7778]">Average</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-serif text-[#062834] font-medium">
                    {markingOverview.averageMarks.toFixed(1)}
                  </span>
                  <span className="text-xs text-[#7d9291] font-serif">/ {markingOverview.maxMarks}</span>
                </div>
                <p className="text-[11px] text-[#617579]">Sample mean score</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#5b7778]">Median</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-serif text-[#062834] font-medium">
                    {markingOverview.medianMarks.toFixed(0)}
                  </span>
                  <span className="text-xs text-[#7d9291] font-serif">/ {markingOverview.maxMarks}</span>
                </div>
                <p className="text-[11px] text-[#617579]">50th percentile mark</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#5b7778]">Highest</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-serif text-[#062834] font-medium">
                    {markingOverview.highestMarks.toFixed(0)}
                  </span>
                  <span className="text-xs text-[#7d9291] font-serif">/ {markingOverview.maxMarks}</span>
                </div>
                <p className="text-[11px] text-[#617579]">Top candidate score</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#5b7778]">Lowest</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-serif text-[#062834] font-medium">
                    {markingOverview.lowestMarks.toFixed(0)}
                  </span>
                  <span className="text-xs text-[#7d9291] font-serif">/ {markingOverview.maxMarks}</span>
                </div>
                <p className="text-[11px] text-[#617579]">Minimum awarded score</p>
              </div>
            </div>

            {/* Mark Distribution Visual */}
            <div className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#5b7778]">
                  Mark distribution across completed sheets (Total {markingOverview.totalEvaluatedScripts})
                </h3>
                <span className="text-[11px] text-[#617579] font-mono">
                  Scale: 0 to {markingOverview.maxMarks} marks
                </span>
              </div>

              {/* Clean Editorial Distribution Histogram */}
              <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end pt-4 pb-2 border-b border-[#edf4ef]">
                {markingOverview.markDistribution.map((bucket) => {
                  const barHeightPct = Math.round((bucket.count / maxBucketCount) * 100);
                  const isMedian = bucket.isMedianBucket;

                  return (
                    <div key={bucket.range} className="flex flex-col items-center gap-1.5 group">
                      {/* Count & Percentage label */}
                      <div className="text-center">
                        <span className={`text-xs font-mono font-semibold block ${isMedian ? "text-[#20565e]" : "text-[#062834]"}`}>
                          {bucket.count}
                        </span>
                        <span className="text-[10px] text-[#7d9291] font-mono block">
                          {bucket.percentage}%
                        </span>
                      </div>

                      {/* Bar Container */}
                      <div className="w-full bg-[#f1f6f2] h-28 rounded-md flex flex-col justify-end p-1 relative overflow-hidden">
                        {bucket.count > 0 && (
                          <div 
                            className={`w-full rounded transition-all duration-300 ${
                              isMedian ? "bg-[#326c74]" : "bg-[#65a28f]"
                            }`}
                            style={{ height: `${Math.max(barHeightPct, 6)}%` }}
                            role="img"
                            aria-label={`Range ${bucket.range}: ${bucket.count} sheets (${bucket.percentage}%)`}
                          />
                        )}
                        {isMedian && (
                          <div className="absolute top-1.5 inset-x-0 text-center">
                            <span className="inline-block text-[9px] font-mono bg-[#fffefa] text-[#326c74] px-1 py-0.5 rounded border border-[#d5e1db] shadow-2xs font-semibold">
                              Median
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Mark range label */}
                      <span className="text-[11px] font-mono text-[#5b7778] tracking-tight">
                        {bucket.range}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#617579]">
                <span>Clusters reflect distribution across 6 standardized mark bands.</span>
                <span className="text-[#326c74] font-medium">Highest density: 51–60 marks (51.4%)</span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* SECTION 3: Question-wise Marking Table */}
      <section 
        aria-labelledby="question-marking-heading"
        className="bg-[#fffefa] border border-[#d5e1db] rounded-2xl p-6 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 pb-4 border-b border-[#e0e9e4]">
          <div>
            <h2 id="question-marking-heading" className="text-xl sm:text-2xl font-serif text-[#062834] font-normal tracking-tight">
              Question-wise marking
            </h2>
            <p className="text-xs text-[#5c7275] mt-0.5">
              Item-level performance and review concentration across all 12 examination questions.
            </p>
          </div>
          <div className="text-xs text-[#5b7778]">
            <span className="font-medium text-[#9b564d]">• High attention items:</span> Q04, Q07, Q09
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#617579] italic">
            No question data recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#e0e9e4] text-[#5b7778] font-mono text-[11px] uppercase tracking-wider">
                  <th scope="col" className="py-3 px-3 font-semibold">Question</th>
                  <th scope="col" className="py-3 px-3 font-semibold">Topic / Concept</th>
                  <th scope="col" className="py-3 px-3 font-semibold text-center">Attempts</th>
                  <th scope="col" className="py-3 px-3 font-semibold">Avg / Max</th>
                  <th scope="col" className="py-3 px-3 font-semibold text-center">Needs Review</th>
                  <th scope="col" className="py-3 px-3 font-semibold">Attention Factor</th>
                  <th scope="col" className="py-3 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf4ef]">
                {questions.map((q) => {
                  const scorePct = Math.round((q.averageMarks / q.maxMarks) * 100);
                  const isHighReview = q.needsReview >= 6;
                  const isModerateReview = q.needsReview >= 3 && q.needsReview < 6;

                  return (
                    <tr 
                      key={q.questionNumber} 
                      className={`hover:bg-[#f1f6f2] transition-colors ${
                        isHighReview ? "bg-[#fff9f8]" : ""
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[#062834]">
                        {q.questionNumber}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[#062834] font-medium block">{q.topic}</span>
                        <span className="text-[10px] text-[#7d9291] font-mono">{q.section}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[#062834]">
                        {q.attempts}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-[#062834]">
                            {q.averageMarks.toFixed(1)} <span className="text-[#7d9291]">/ {q.maxMarks}</span>
                          </span>
                          <div className="w-16 bg-[#e4ede8] h-1.5 rounded-full overflow-hidden shrink-0 hidden sm:block">
                            <div 
                              className="bg-[#326c74] h-full rounded-full" 
                              style={{ width: `${scorePct}%` }}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span 
                          className={`inline-flex items-center justify-center font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                            isHighReview 
                              ? "bg-[#fbeae7] text-[#9b564d] border border-[#f5c7c2]" 
                              : isModerateReview 
                              ? "bg-[#fdf4e8] text-[#906f46] border border-[#fae2c1]" 
                              : "bg-[#edf4ef] text-[#5b7778]"
                          }`}
                        >
                          {q.needsReview}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#5c7275] text-[11px]">
                        {q.primaryAttentionReason ? (
                          <span className={isHighReview ? "text-[#9b564d] font-medium" : ""}>
                            {q.primaryAttentionReason}
                          </span>
                        ) : (
                          <span className="text-[#a0b2ac]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={q.reviewUrl}
                          className="inline-flex items-center gap-1 text-[#326c74] hover:text-[#20565e] font-semibold text-[11px] hover:underline underline-offset-2"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECTIONS 4 & 5: Operational Intelligence (Attention & Risk + AI vs Examiner Workflow) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* SECTION 4: Attention & Risk */}
        <section 
          aria-labelledby="attention-risk-heading"
          className="bg-[#fffefa] border border-[#d5e1db] rounded-2xl p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#e0e9e4]">
            <div>
              <h2 id="attention-risk-heading" className="text-xl font-serif text-[#062834] font-normal tracking-tight">
                Attention & risk
              </h2>
              <p className="text-xs text-[#5c7275] mt-0.5">
                Active risk signals and items flagged for second check across batch.
              </p>
            </div>
            <Link
              href="/examiner/review"
              className="text-xs font-semibold text-[#326c74] hover:text-[#20565e] hover:underline underline-offset-2"
            >
              Open review queue →
            </Link>
          </div>

          {/* Grouped Operational Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-3 bg-[#fff9f8] border border-[#f5c7c2] rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9b564d] font-semibold block">
                High Risk
              </span>
              <span className="text-2xl font-serif text-[#9b564d] font-medium block mt-0.5">
                {attentionRisk.highRiskCount}
              </span>
              <span className="text-[10px] text-[#617579] block">Mark delta &gt; 15%</span>
            </div>

            <div className="p-3 bg-[#fff9f8] border border-[#f5c7c2] rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9b564d] font-semibold block">
                Critical
              </span>
              <span className="text-2xl font-serif text-[#9b564d] font-medium block mt-0.5">
                {attentionRisk.criticalRiskCount}
              </span>
              <span className="text-[10px] text-[#617579] block">Dual attempt / scan</span>
            </div>

            <div className="p-3 bg-[#eef4f0] border border-[#d5e1db] rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#20565e] font-semibold block">
                Second Eval
              </span>
              <span className="text-2xl font-serif text-[#062834] font-medium block mt-0.5">
                {attentionRisk.secondEvaluationCount}
              </span>
              <span className="text-[10px] text-[#617579] block">Independent round</span>
            </div>

            <div className="p-3 bg-[#eef4f0] border border-[#d5e1db] rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#20565e] font-semibold block">
                Moderation
              </span>
              <span className="text-2xl font-serif text-[#062834] font-medium block mt-0.5">
                {attentionRisk.moderationCount}
              </span>
              <span className="text-[10px] text-[#617579] block">Head examiner desk</span>
            </div>
          </div>

          {/* Most Common Attention Reasons */}
          <div className="pt-2">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#5b7778] mb-2.5">
              Most common attention reasons
            </h3>

            {attentionRisk.commonReasons.length === 0 ? (
              <p className="text-xs text-[#617579] italic py-2">No attention items in the current batch.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {attentionRisk.commonReasons.map((item) => (
                  <li key={item.reason} className="flex items-center justify-between p-2 rounded-lg bg-[#f8faf9] border border-[#edf4ef]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#326c74] shrink-0" aria-hidden="true" />
                      <span className="text-[#062834] font-medium truncate">{item.reason}</span>
                      <span className="text-[10px] font-mono text-[#7d9291] uppercase px-1.5 py-0.5 rounded bg-[#edf4ef] hidden sm:inline-block">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                      <span className="text-[#062834] font-semibold">{item.count} cases</span>
                      <span className="text-[#7d9291]">({item.percentage}%)</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* SECTION 5: AI vs Examiner Decisions */}
        <section 
          aria-labelledby="ai-vs-examiner-heading"
          className="bg-[#fffefa] border border-[#d5e1db] rounded-2xl p-6 shadow-xs space-y-4"
        >
          <div className="pb-3 border-b border-[#e0e9e4]">
            <h2 id="ai-vs-examiner-heading" className="text-xl font-serif text-[#062834] font-normal tracking-tight">
              AI vs examiner decisions
            </h2>
            <p className="text-xs text-[#5c7275] mt-0.5">
              Descriptive evaluation workflow assistance signals for completed sheets.
            </p>
          </div>

          {/* 4 Workflow Assistance Counts */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-[#f1f6f2] border border-[#d5e1db] rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#20565e] font-semibold block">
                AI accepted
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-serif text-[#062834] font-medium">
                  {workflow.aiAcceptedCount}
                </span>
                <span className="text-xs text-[#5b7778] font-mono">({workflow.aiAcceptanceRate}%)</span>
              </div>
              <p className="text-[11px] text-[#617579] mt-0.5">Suggested marks confirmed as accurate</p>
            </div>

            <div className="p-3.5 bg-[#fbfbf9] border border-[#d5e1db] rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5b7778] font-semibold block">
                AI overridden
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-serif text-[#062834] font-medium">
                  {workflow.aiOverriddenCount}
                </span>
                <span className="text-xs text-[#5b7778] font-mono">
                  ({(100 - workflow.aiAcceptanceRate).toFixed(1)}%)
                </span>
              </div>
              <p className="text-[11px] text-[#617579] mt-0.5">Examiner adjusted final marks</p>
            </div>

            <div className="p-3.5 bg-[#fbfbf9] border border-[#d5e1db] rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5b7778] font-semibold block">
                Criteria changed
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-serif text-[#062834] font-medium">
                  {workflow.criteriaChangedCount}
                </span>
              </div>
              <p className="text-[11px] text-[#617579] mt-0.5">Rubric step weights customized</p>
            </div>

            <div className="p-3.5 bg-[#fbfbf9] border border-[#d5e1db] rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5b7778] font-semibold block">
                Sent for review
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-serif text-[#062834] font-medium">
                  {workflow.sentForReviewCount}
                </span>
              </div>
              <p className="text-[11px] text-[#617579] mt-0.5">Escalated to attention queue</p>
            </div>
          </div>

          {/* Principle Disclaimer (Mandatory Requirement) */}
          <div className="p-3 bg-[#edf4ef] border border-[#d5e1db] rounded-xl flex items-start gap-2 text-xs text-[#20565e]">
            <Info className="w-4 h-4 text-[#326c74] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <strong className="font-semibold block text-[#062834]">
                Core principle: &ldquo;AI suggests, examiner decides.&rdquo;
              </strong>
              <p className="text-[11px] text-[#617579] leading-relaxed">
                These workflow metrics describe interactive assistance across your allocated batch. They reflect human editorial oversight and are never presented as examiner accuracy, competence scores, or performance rankings.
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* SECTIONS 6 & 7: Workload (Batch Progress) & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ProgressSection metrics={progress} />
        <RecentActivity activities={recentActivity} />
      </div>

    </div>
  );
}
