"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AnswerSheetViewer from "@/components/evaluation/AnswerSheetViewer";
import { getScriptDataset } from "@/data/evaluationWorkspaceMockData";
import { MOCK_MODERATION_CASES } from "@/data/moderationMockData";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  ShieldAlert,
  Scale,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  FileCheck,
  History,
  Lock,
  X,
  Save,
} from "lucide-react";

export default function ModeratorCaseWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const caseIdParam = (params?.caseId as string) || "case-01";

  const moderationCase =
    MOCK_MODERATION_CASES.find((c) => c.id === caseIdParam) ||
    MOCK_MODERATION_CASES[0];

  const dataset = getScriptDataset(moderationCase.scriptId);
  const question = dataset.questions[moderationCase.questionNumber] || dataset.questions["Q04"];

  const [awardedMarks, setAwardedMarks] = useState<number>(moderationCase.round1Marks);
  const [resolutionType, setResolutionType] = useState<string>("MODIFY_MARKS");
  const [resolutionReason, setResolutionReason] = useState<string>(
    "Awarded partial credit for demonstrated Fourier law derivation steps in working according to rubric."
  );
  const [isResolved, setIsResolved] = useState<boolean>(moderationCase.status === "RESOLVED");
  const [showToast, setShowToast] = useState<string | null>(null);
  const [activeEvidenceKey, setActiveEvidenceKey] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(question.pageNumber);

  const handleResolve = () => {
    if (!resolutionReason || resolutionReason.trim().length < 5) {
      alert("Please provide a valid resolution rationale (minimum 5 characters).");
      return;
    }

    setIsResolved(true);
    setShowToast(`Case ${moderationCase.caseNumber} RESOLVED successfully with final score ${awardedMarks}/${question.maxMarks}`);
    setTimeout(() => setShowToast(null), 3500);
  };

  const handleEscalate = () => {
    setIsResolved(true);
    setShowToast(`Case ${moderationCase.caseNumber} ESCALATED to Head Examiner for committee review.`);
    setTimeout(() => setShowToast(null), 3500);
  };

  return (
    <ProtectedRoute allowedRoles={["MODERATOR", "HEAD_EXAMINER", "SUPER_ADMIN"]}>
      <div className="workspace-shell min-h-screen bg-[#FCFAF5] text-slate-900 flex flex-col font-sans selection:bg-[#c5ddd4]">
        
        {/* HEADER BAR */}
        <header className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <Link
              href="/moderation"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                {moderationCase.caseNumber}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                moderationCase.priority === "CRITICAL" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
                "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}>
                {moderationCase.priority} PRIORITY
              </span>
              <span className="text-xs text-slate-400">
                {dataset.subject} • {moderationCase.questionNumber} ({moderationCase.scriptId})
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Status:</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isResolved ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
            }`}>
              {isResolved ? "RESOLVED" : "IN REVIEW"}
            </span>
          </div>
        </header>

        {/* WORKSPACE GRID */}
        <main className="flex-1 max-w-[1720px] w-full mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4 flex flex-col min-h-0">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch min-h-[calc(100vh-140px)]">
            
            {/* LEFT: ANSWER SHEET VIEWER (58% desktop width) */}
            <div className="lg:col-span-7 h-full min-h-[580px] lg:min-h-0 flex flex-col">
              <AnswerSheetViewer
                question={question}
                currentPage={currentPage}
                totalPages={dataset.totalPages}
                onPageChange={(p) => setCurrentPage(p)}
                activeEvidenceKey={activeEvidenceKey}
                onSelectEvidence={(k) => setActiveEvidenceKey(k)}
              />
            </div>

            {/* RIGHT: MODERATION REVIEW PANEL (42% desktop width) */}
            <div className="lg:col-span-5 h-full min-h-[580px] lg:min-h-0 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              
              {/* PANEL HEADER */}
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <h2 className="font-serif text-sm font-bold">
                    Authoritative Moderation Review
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Max Marks: {question.maxMarks}
                </span>
              </div>

              {/* SCROLLABLE CONTEXT */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-4 sm:p-5 space-y-4">
                
                {/* 1. TRIGGER & DISCREPANCY SUMMARY */}
                <section className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Moderation Referral Trigger</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {moderationCase.triggerDetail}
                  </p>
                </section>

                {/* 2. MULTI-ROUND EVALUATION COMPARISON */}
                <section className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Evaluation Rounds Comparison
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">AI Suggestion</div>
                      <div className="font-mono text-lg font-bold text-blue-600">{moderationCase.aiSuggestedMarks} / {question.maxMarks}</div>
                      <div className="text-[10px] text-slate-400">Conf: 87%</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Round 1 Marks</div>
                      <div className="font-mono text-lg font-bold text-slate-900">{moderationCase.round1Marks} / {question.maxMarks}</div>
                      <div className="text-[10px] text-slate-400">Examiner 1</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Round 2 Marks</div>
                      <div className="font-mono text-lg font-bold text-slate-900">{moderationCase.round2Marks} / {question.maxMarks}</div>
                      <div className="text-[10px] text-slate-400">Independent 2</div>
                    </div>
                  </div>
                </section>

                {/* 3. APPROVED RUBRIC CRITERIA */}
                <section className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Approved Rubric Grounding
                    </h3>
                  </div>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                    {question.rubricItems.map((item) => (
                      <div key={item.id} className="p-2.5 flex items-center justify-between">
                        <span className="font-medium text-slate-800">{item.label}</span>
                        <span className="font-mono font-bold text-slate-700">Max: {item.maxMarks}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 4. MODERATOR DECISION FORM */}
                <section className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Authoritative Awarded Marks
                    </label>
                    <span className="font-mono text-xs text-slate-500">Range: 0 to {question.maxMarks}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={question.maxMarks}
                      disabled={isResolved}
                      value={awardedMarks}
                      onChange={(e) => setAwardedMarks(parseFloat(e.target.value) || 0)}
                      className="w-full text-center text-2xl font-extrabold font-mono py-1.5 px-3 rounded-lg border-2 border-emerald-600 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="font-mono font-bold text-base text-slate-600">/ {question.maxMarks}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                      Resolution Type
                    </label>
                    <select
                      disabled={isResolved}
                      value={resolutionType}
                      onChange={(e) => setResolutionType(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg p-2 font-medium"
                    >
                      <option value="MODIFY_MARKS">Modify Marks (Authoritative Moderation)</option>
                      <option value="ACCEPT_EXISTING_DECISION">Accept Round 1 Decision</option>
                      <option value="REQUEST_RE_EVALUATION">Request 3rd Re-evaluation</option>
                      <option value="RETURN_TO_EXAMINER">Return to Examiner for Clarification</option>
                      <option value="ESCALATE">Escalate to Head Examiner Committee</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                      Moderation Rationale (Required)
                    </label>
                    <textarea
                      rows={3}
                      disabled={isResolved}
                      value={resolutionReason}
                      onChange={(e) => setResolutionReason(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Detail the rationale for final marks awarded..."
                    />
                  </div>

                  {!isResolved ? (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleEscalate}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Escalate Case</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResolve}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm &amp; Resolve</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800">
                      Authoritative Moderation Decision Locked in Immutable Audit Trail.
                    </div>
                  )}
                </section>

              </div>
            </div>

          </div>
        </main>

        {/* TOAST BANNER */}
        {showToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center space-x-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{showToast}</span>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
