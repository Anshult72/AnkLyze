"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ArrowRight,
  ArrowLeft,
  FileText,
  HelpCircle,
  Layers,
  Send,
  Info,
  Check,
  X,
} from "lucide-react";
import { QuestionData } from "@/data/evaluationWorkspaceMockData";

interface Round2EvaluationPanelProps {
  question: QuestionData;
  scriptId: string;
  round1Marks?: number; // Pre-configured Round 1 marks for comparison after submission
  onComplete?: (status: "AGREED" | "SENT_TO_MODERATION", round2Marks: number, reason?: string) => void;
  activeEvidenceKey: string | null;
  onSelectEvidence: (key: string | null) => void;
}

export default function Round2EvaluationPanel({
  question,
  scriptId,
  round1Marks = 6.0,
  onComplete,
  activeEvidenceKey,
  onSelectEvidence,
}: Round2EvaluationPanelProps) {
  // Evaluation state: starts BLIND
  const [round2Marks, setRound2Marks] = useState<number>(7.0);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    question.rubricItems.forEach((item) => {
      // Default independent evaluation allocation
      map[item.id] = Math.min(item.maxMarks, Math.round((item.maxMarks * 0.75) * 10) / 10);
    });
    return map;
  });
  const [examinerNotes, setExaminerNotes] = useState<string>("");

  // Workflow phases: "EVALUATING" -> "SUBMITTED" -> "AGREED" | "SENT_TO_MODERATION"
  const [phase, setPhase] = useState<"EVALUATING" | "SUBMITTED" | "AGREED" | "SENT_TO_MODERATION">("EVALUATING");
  const [disagreeReason, setDisagreeReason] = useState<string>("");
  const [showDisagreeModal, setShowDisagreeModal] = useState<boolean>(false);
  const [disagreeError, setDisagreeError] = useState<string | null>(null);

  // Recalculate total marks from criteria
  const handleCriterionChange = (criterionId: string, value: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, value));
    const nextMap = { ...criteriaScores, [criterionId]: clamped };
    setCriteriaScores(nextMap);
    const sum = Object.values(nextMap).reduce((acc, curr) => acc + curr, 0);
    setRound2Marks(Math.round(sum * 10) / 10);
  };

  const handleTotalChange = (valStr: string) => {
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= question.maxMarks) {
      setRound2Marks(parsed);
    }
  };

  // Submit independent evaluation: triggers unblinding
  const handleSubmitEvaluation = () => {
    setPhase("SUBMITTED");
  };

  // Agree with Round 1
  const handleAgree = () => {
    setPhase("AGREED");
    if (onComplete) {
      onComplete("AGREED", round2Marks);
    }
  };

  // Confirm Disagree
  const handleConfirmDisagree = () => {
    if (!disagreeReason.trim()) {
      setDisagreeError("A concise reason is required when disagreeing with the original evaluation.");
      return;
    }
    setDisagreeError(null);
    setShowDisagreeModal(false);
    setPhase("SENT_TO_MODERATION");
    if (onComplete) {
      onComplete("SENT_TO_MODERATION", round2Marks, disagreeReason.trim());
    }
  };

  const delta = Math.round((round2Marks - round1Marks) * 10) / 10;
  const absDelta = Math.abs(delta);

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* 1. ROUND 2 INDEPENDENT EVALUATION BANNER */}
      <div className="px-4 py-3 bg-[#062834] text-white flex items-center justify-between border-b border-[#062834]/20 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Independent Evaluation (Round 2)
          </span>
          <span className="text-slate-400 text-xs">•</span>
          <span className="text-xs text-slate-300 font-medium">Question-Level Scope</span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-[#326c74]/60 px-2 py-0.5 rounded text-white font-mono font-medium">
            {question.questionNumber}
          </span>
          <span className="text-slate-300">Max: {question.maxMarks} marks</span>
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        
        {/* QUESTION TEXT & SECTION CONTEXT */}
        <section className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{question.section}</span>
            <span className="font-mono text-slate-600">Question {question.questionNumber}</span>
          </div>
          <p className="text-sm font-medium text-slate-900 leading-relaxed">
            {question.questionText}
          </p>
          <div className="pt-1 text-xs text-slate-500 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Assigned booklet page: {question.pageNumber} • {question.detectedRegionNote}</span>
          </div>
        </section>

        {/* PHASE 1: BLIND EVALUATION (NO ROUND 1 INFORMATION) */}
        {phase === "EVALUATING" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            
            {/* BLIND INTEGRITY NOTICE */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-950">Blind Evaluation Mode Active</p>
                <p className="text-emerald-800 mt-0.5 leading-relaxed">
                  Round 1 markings and evaluator identities are protected and withheld server-side.
                  Please mark this answer independently based on the approved rubric and student evidence.
                </p>
              </div>
            </div>

            {/* APPROVED RUBRIC CRITERIA */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#326c74]" />
                  <span>Approved Marking Rubric</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {question.rubricItems.length} criteria
                </span>
              </div>

              <div className="space-y-2.5">
                {question.rubricItems.map((criterion, idx) => {
                  const currentScore = criteriaScores[criterion.id] ?? criterion.suggestedMarks;
                  return (
                    <div
                      key={criterion.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-600 font-mono">
                              C{idx + 1}
                            </span>
                            <span className="text-xs font-medium text-slate-900">
                              {criterion.label}
                            </span>
                          </div>
                          {criterion.note && (
                            <p className="text-[11px] text-slate-500 italic pl-5">
                              {criterion.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={criterion.maxMarks}
                            value={currentScore}
                            onChange={(e) =>
                              handleCriterionChange(
                                criterion.id,
                                parseFloat(e.target.value) || 0,
                                criterion.maxMarks
                              )
                            }
                            className="w-14 text-center text-xs font-mono font-bold py-1 px-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white focus:border-[#326c74] focus:ring-1 focus:ring-[#326c74] focus:outline-hidden"
                          />
                          <span className="text-xs text-slate-400 font-mono">/ {criterion.maxMarks}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* EXTRACTED EVIDENCE OBSERVATIONS */}
            {question.evidenceItems && question.evidenceItems.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#326c74]" />
                  <span>Key Answer Evidence</span>
                </h3>
                <div className="space-y-1.5">
                  {question.evidenceItems.map((evidence) => {
                    const isSelected = activeEvidenceKey === evidence.sectionKey;
                    return (
                      <button
                        type="button"
                        key={evidence.id}
                        onClick={() =>
                          onSelectEvidence(isSelected ? null : evidence.sectionKey)
                        }
                        className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-start space-x-2 ${
                          isSelected
                            ? "bg-amber-50/90 border-amber-300 text-amber-950 font-medium shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <span className="flex-1 leading-relaxed">{evidence.text}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* TOTAL MARKS ENTRY */}
            <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Your Independent Marks
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Calculated from rubric criteria or override directly
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={question.maxMarks}
                    value={round2Marks}
                    onChange={(e) => handleTotalChange(e.target.value)}
                    className="w-20 text-center text-lg font-mono font-bold py-1.5 px-2 border-2 border-[#326c74] rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#326c74]/20"
                  />
                  <span className="text-sm font-mono font-bold text-slate-500">
                    / {question.maxMarks}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evaluation Notes (Optional)
                </label>
                <textarea
                  value={examinerNotes}
                  onChange={(e) => setExaminerNotes(e.target.value)}
                  placeholder="Record factual observations or rubric step alignment..."
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#326c74] focus:outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitEvaluation}
                className="w-full py-2.5 px-4 rounded-lg bg-[#062834] text-white hover:bg-[#326c74] font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Submit Independent Evaluation</span>
              </button>
            </section>

          </div>
        )}

        {/* PHASE 2: COMPARISON REVEALED (AFTER ROUND 2 SUBMISSION) */}
        {phase === "SUBMITTED" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* SUCCESS BANNER */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">
                Independent evaluation submitted. Comparison is now unblinded.
              </span>
            </div>

            {/* UNBLINDED COMPARISON CARD */}
            <section className="bg-white border-2 border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Evaluation Comparison
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {question.questionNumber} • Max {question.maxMarks} marks
                </span>
              </div>

              {/* THREE COLUMN METRIC DISPLAY */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    Round 1
                  </span>
                  <span className="block text-xl font-mono font-bold text-slate-800 mt-1">
                    {round1Marks.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">/ {question.maxMarks}</span>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200">
                  <span className="block text-[11px] font-bold uppercase text-blue-700 tracking-wider">
                    Round 2 (You)
                  </span>
                  <span className="block text-xl font-mono font-bold text-blue-900 mt-1">
                    {round2Marks.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-blue-500 font-mono">/ {question.maxMarks}</span>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200">
                  <span className="block text-[11px] font-bold uppercase text-amber-800 tracking-wider">
                    Difference
                  </span>
                  <span className="block text-xl font-mono font-bold text-amber-900 mt-1">
                    {delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-amber-600 font-medium">
                    {absDelta === 0 ? "Exact match" : `${absDelta.toFixed(1)} mark delta`}
                  </span>
                </div>
              </div>

              {/* PROMPT: DO YOU AGREE WITH THE ORIGINAL EVALUATION? */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Do you agree with the original evaluation?
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    If you agree, the original Round 1 decision remains authoritative and confirmed.
                    If you disagree, this case will be routed to the Head Examiner for moderation review.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAgree}
                    className="py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Agree (Confirm Round 1)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDisagreeModal(true)}
                    className="py-2.5 px-4 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                  >
                    <X className="w-4 h-4 text-amber-200" />
                    <span>Disagree (Send to Moderation)</span>
                  </button>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* PHASE 3: AGREED STATE */}
        {phase === "AGREED" && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-950">
                  Evaluation Confirmed & Resolved
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  You agreed with the original evaluation. Per ANKLYZE workflow rules, the original
                  Round 1 human decision of <strong className="font-mono">{round1Marks.toFixed(1)} / {question.maxMarks}</strong> marks
                  remains authoritative. Your independent score of <strong className="font-mono">{round2Marks.toFixed(1)}</strong> marks
                  has been permanently recorded as independent corroboration.
                </p>
              </div>
            </div>

            <div className="bg-white/80 border border-emerald-200 rounded-lg p-3 text-xs text-slate-700 flex items-center justify-between">
              <span>Authoritative Final Marks:</span>
              <span className="font-mono font-bold text-emerald-900 text-sm">
                {round1Marks.toFixed(1)} / {question.maxMarks}
              </span>
            </div>

            <div className="pt-2">
              <Link
                href="/examiner/review"
                className="w-full py-2.5 px-4 rounded-lg bg-[#062834] hover:bg-[#326c74] text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Review Queue</span>
              </Link>
            </div>
          </div>
        )}

        {/* PHASE 4: SENT TO MODERATION STATE */}
        {phase === "SENT_TO_MODERATION" && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start space-x-3">
              <Scale className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-950">
                  Case Routed to Head Examiner Moderation
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Disagreement recorded: Round 1 gave <strong className="font-mono">{round1Marks.toFixed(1)}</strong>,
                  Round 2 gave <strong className="font-mono">{round2Marks.toFixed(1)}</strong>.
                  Neither round has been selected as an automatic winner nor averaged.
                  All evidence, rubrics, and both evaluations have been handed off to Head Examiner moderation.
                </p>
              </div>
            </div>

            <div className="bg-white/80 border border-amber-200 rounded-lg p-3 text-xs text-slate-700 space-y-1">
              <span className="font-semibold text-amber-900 block">Disagreement Reason:</span>
              <p className="italic text-slate-800">{disagreeReason}</p>
            </div>

            <div className="pt-2">
              <Link
                href="/examiner/review"
                className="w-full py-2.5 px-4 rounded-lg bg-[#062834] hover:bg-[#326c74] text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Review Queue</span>
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* DISAGREE REASON MODAL */}
      {showDisagreeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Reason for Evaluation Disagreement
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explain the variance with the original evaluation for Head Examiner moderation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDisagreeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <textarea
                value={disagreeReason}
                onChange={(e) => {
                  setDisagreeReason(e.target.value);
                  if (disagreeError) setDisagreeError(null);
                }}
                rows={3}
                placeholder="E.g., Derivation step 2 lacks boundary condition application required under Rubric C2; partial credit reduced."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-hidden"
              />
              {disagreeError && (
                <p className="text-xs text-red-600 font-medium">{disagreeError}</p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDisagreeModal(false)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisagree}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Confirm & Route to Moderation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
