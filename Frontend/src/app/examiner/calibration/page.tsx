"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  Award,
  BookOpen,
  FileCheck2,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
} from "lucide-react";
import { MOCK_CALIBRATION_SETS, CalibrationSetItem } from "@/data/calibrationMockData";

export default function ExaminerCalibrationPage() {
  const calSet = MOCK_CALIBRATION_SETS[0];
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const currentItem: CalibrationSetItem = calSet.items[selectedItemIndex];

  // Per-criterion entered scores: { [criterionId]: number }
  const [criterionScores, setCriterionScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    currentItem.referenceCriteria.forEach((c) => {
      initial[c.criterionId] = 0;
    });
    return initial;
  });

  const [examinerNotes, setExaminerNotes] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionCompleted, setSubmissionCompleted] = useState(false);

  // Compute total submitted marks
  const totalEnteredMarks = Object.values(criterionScores).reduce((acc, v) => acc + (Number(v) || 0), 0);

  const handleScoreChange = (criterionId: string, value: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, value));
    setCriterionScores((prev) => ({
      ...prev,
      [criterionId]: clamped,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleNextItem = () => {
    if (selectedItemIndex < calSet.items.length - 1) {
      const nextIdx = selectedItemIndex + 1;
      setSelectedItemIndex(nextIdx);
      const nextItem = calSet.items[nextIdx];
      const initial: Record<string, number> = {};
      nextItem.referenceCriteria.forEach((c) => {
        initial[c.criterionId] = 0;
      });
      setCriterionScores(initial);
      setExaminerNotes("");
      setIsSubmitted(false);
    } else {
      setSubmissionCompleted(true);
    }
  };

  const delta = isSubmitted ? totalEnteredMarks - currentItem.referenceMarks : 0;
  const absDelta = Math.abs(delta);

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-slate-900 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/examiner/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-stone-300" />
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Phase 13 Calibration
              </span>
              <span className="text-xs text-slate-500 font-mono">{calSet.code}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">{calSet.subject} ({calSet.subjectCode})</div>
              <div className="text-xs font-semibold text-slate-800">
                Item {selectedItemIndex + 1} of {calSet.items.length}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full">
        {/* Security & Reference Protection Notice */}
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-6 flex items-start gap-3 shadow-xs">
          <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-semibold text-slate-900">Calibration Standard & Reference Protection: </span>
            In accordance with ANKLYZE institutional quality controls, authorized reference marks and detailed criteria rationales remain hidden until your evaluation is submitted. Metrics generated are purely descriptive for rubric synchronization and training.
          </div>
        </div>

        {submissionCompleted ? (
          <div className="bg-white border border-stone-200 rounded-xl p-8 max-w-2xl mx-auto text-center shadow-xs">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-700">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Calibration Session Completed</h2>
            <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
              All {calSet.items.length} benchmark items have been completed. Your rubric alignment feedback has been registered for quality control auditing.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/examiner/dashboard"
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Return to Evaluation Queue
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Benchmark Question & Candidate Answer */}
            <div className="lg:col-span-7 space-y-6">
              {/* Question Card */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-stone-100 px-2 py-0.5 rounded">
                      {currentItem.questionNumber}
                    </span>
                    <span className="text-xs font-medium text-slate-600">Calibration Benchmark Item</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700">
                    Max Marks: <span className="font-mono text-slate-900">{currentItem.maxMarks.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  {currentItem.sampleQuestionText}
                </p>
              </div>

              {/* Candidate Answer Card */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span>Candidate Sample Response</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Standard Digitized OCR</span>
                </div>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-sm text-slate-800 font-serif leading-relaxed whitespace-pre-line">
                  {currentItem.sampleAnswerText}
                </div>
              </div>

              {/* Post-Submission Comparative Analysis (Visible only after submission) */}
              {isSubmitted && (
                <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-xs space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                        Calibration Alignment Feedback
                      </span>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Reference Disclosed
                    </span>
                  </div>

                  {/* Summary Comparison */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-center">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wide">Awarded Marks</div>
                      <div className="text-lg font-bold font-mono text-slate-900">{totalEnteredMarks.toFixed(1)} / {currentItem.maxMarks.toFixed(1)}</div>
                    </div>
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-center">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wide">Reference Marks</div>
                      <div className="text-lg font-bold font-mono text-slate-900">{currentItem.referenceMarks.toFixed(1)} / {currentItem.maxMarks.toFixed(1)}</div>
                    </div>
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-center">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wide">Absolute Delta</div>
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Criterion-Level Disclosed Rationale */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-semibold text-slate-700">Criterion Benchmark Breakdown:</div>
                    {currentItem.referenceCriteria.map((rc) => {
                      const userScore = criterionScores[rc.criterionId] ?? 0;
                      const cDelta = userScore - rc.referenceMarks;
                      return (
                        <div key={rc.criterionId} className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1.5">
                          <div className="flex items-center justify-between font-medium">
                            <span className="text-slate-900 font-semibold">{rc.criterionName}</span>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-slate-600">Your: {userScore.toFixed(1)}</span>
                              <span className="text-slate-900 font-bold">Ref: {rc.referenceMarks.toFixed(1)}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                Math.abs(cDelta) === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {cDelta === 0 ? "Exact Match" : `${cDelta > 0 ? "+" : ""}${cDelta.toFixed(1)}`}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            <span className="font-semibold text-slate-700">Scheme Rationale: </span>
                            {rc.rationale}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Descriptive Guidance Text */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-900 leading-relaxed">
                    <span className="font-semibold">Descriptive Summary: </span>
                    {absDelta <= 0.5
                      ? `Close alignment with standard scheme (deviation within ±0.5 marks). Criteria application is consistent with institutional standards.`
                      : `Observed variance of ${absDelta.toFixed(1)} marks against benchmark reference. Note the emphasis in criteria rationale regarding partial credit allocation.`}
                  </div>

                  {/* Next Step Action */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextItem}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <span>{selectedItemIndex < calSet.items.length - 1 ? "Next Benchmark Item" : "Complete Calibration Session"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Scoring Form */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs sticky top-20">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Independent Marking Form
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <span>Protected Mode</span>
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3">
                    {currentItem.referenceCriteria.map((crit) => (
                      <div key={crit.criterionId} className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-slate-800">
                            {crit.criterionName}
                          </label>
                          <span className="text-xs text-slate-500 font-mono">Max: {crit.maxMarks.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={crit.maxMarks}
                            disabled={isSubmitted}
                            value={criterionScores[crit.criterionId] ?? ""}
                            onChange={(e) =>
                              handleScoreChange(crit.criterionId, parseFloat(e.target.value) || 0, crit.maxMarks)
                            }
                            className="w-full px-3 py-1.5 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-700 disabled:bg-stone-100 disabled:text-slate-600 font-mono"
                            placeholder="0.0"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Optional Evaluator Rationale */}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Examiner Evaluation Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      disabled={isSubmitted}
                      value={examinerNotes}
                      onChange={(e) => setExaminerNotes(e.target.value)}
                      placeholder="Enter specific rubric justification or method observations..."
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-700 disabled:bg-stone-100"
                    />
                  </div>

                  {/* Total Awarded Score */}
                  <div className="p-3 bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Total Awarded Score:</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {totalEnteredMarks.toFixed(1)} / {currentItem.maxMarks.toFixed(1)}
                    </span>
                  </div>

                  {!isSubmitted ? (
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                    >
                      Submit Calibration Marks
                    </button>
                  ) : (
                    <div className="text-center text-xs text-slate-500 font-medium py-1">
                      Marks registered. Review reference alignment on the left.
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
