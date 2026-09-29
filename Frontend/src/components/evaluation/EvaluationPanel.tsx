"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Flag,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  FileCheck,
  Edit3,
} from "lucide-react";
import { QuestionData, RubricCriterion, EvidenceObservation } from "@/data/evaluationWorkspaceMockData";

interface EvaluationPanelProps {
  question: QuestionData;
  examinerMarks: number;
  onMarksChange: (marks: number) => void;
  isFlagged: boolean;
  onToggleFlag: (reason?: string) => void;
  onAcceptSuggestion: () => void;
  activeEvidenceKey: string | null;
  onSelectEvidence: (key: string | null) => void;
  onSave: () => void;
}

export default function EvaluationPanel({
  question,
  examinerMarks,
  onMarksChange,
  isFlagged,
  onToggleFlag,
  onAcceptSuggestion,
  activeEvidenceKey,
  onSelectEvidence,
  onSave,
}: EvaluationPanelProps) {
  const [inputVal, setInputVal] = useState<string>(examinerMarks.toString());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState<string>("Requires manual moderation");
  const [showFlagSelector, setShowFlagSelector] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    setInputVal(examinerMarks.toString());
  }, [examinerMarks]);

  const handleInputChange = (val: string) => {
    setInputVal(val);
    const num = parseFloat(val);
    if (isNaN(num)) {
      setErrorMsg("Please enter a numeric mark");
      return;
    }
    if (num < 0) {
      setErrorMsg("Marks cannot be negative");
      return;
    }
    if (num > question.maxMarks) {
      setErrorMsg(`Marks cannot exceed ${question.maxMarks}`);
      return;
    }
    setErrorMsg(null);
    onMarksChange(num);
  };

  const handleStepper = (delta: number) => {
    const current = parseFloat(inputVal) || 0;
    const nextVal = Math.min(question.maxMarks, Math.max(0, Math.round((current + delta) * 2) / 2));
    setInputVal(nextVal.toString());
    setErrorMsg(null);
    onMarksChange(nextVal);
  };

  const totalRubricSuggested = question.rubricItems.reduce((acc, curr) => acc + curr.suggestedMarks, 0);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      
      {/* SCROLLABLE CONTENT BODY */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        
        {/* 1. CURRENT QUESTION HEADER */}
        <section className="p-4 sm:p-5 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-md">
                {question.questionNumber}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {question.section}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 uppercase font-mono">
                Max Marks: {question.maxMarks}
              </span>
            </div>
          </div>

          <p className="text-sm font-medium text-slate-900 leading-snug pt-0.5">
            &ldquo;{question.questionText}&rdquo;
          </p>
        </section>

        {/* 2. AI EVALUATION SUGGESTION (ADVISORY ONLY) */}
        <section className="p-4 sm:p-5 bg-slate-50/70 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  AI Suggested Marks
                </span>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Advisory Recommendation
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Calculated from rubric criteria match &amp; detected working
              </p>
            </div>

            {/* Score Display */}
            <div className="flex items-baseline space-x-1 font-mono text-right shrink-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight font-serif">
                {question.aiSuggestedMarks.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-slate-500">
                / {question.maxMarks}
              </span>
            </div>
          </div>

          {/* Quick Accept CTA in suggestion header */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              Status: <span className="font-medium text-slate-900">Suggestion ready</span>
            </span>
            <button
              type="button"
              onClick={onAcceptSuggestion}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center space-x-1"
            >
              <span>Accept AI Suggestion ({question.aiSuggestedMarks.toFixed(1)})</span>
            </button>
          </div>
        </section>

        {/* 3. RUBRIC MATCH (EVALUATION CRITERIA) */}
        <section className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-slate-900 tracking-tight">
              Evaluation Criteria Breakdown
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Rubric Total: {totalRubricSuggested} / {question.maxMarks}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
            {question.rubricItems.map((item) => (
              <div
                key={item.id}
                className="p-3 flex items-start justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5 shrink-0">
                    {item.matched ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[11px] border border-emerald-200">
                        ✓
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-[11px] border border-rose-200">
                        ✕
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900 block leading-snug">
                      {item.label}
                    </span>
                    {item.note && (
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {item.note}
                      </span>
                    )}
                  </div>
                </div>

                <div className="font-mono text-right shrink-0">
                  <span className={`font-semibold ${item.suggestedMarks > 0 ? "text-slate-900" : "text-rose-600"}`}>
                    {item.suggestedMarks}
                  </span>
                  <span className="text-slate-400"> / {item.maxMarks}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. EVIDENCE & OBSERVATIONS (CONNECTED TO ANSWER SHEET) */}
        <section className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-slate-900 tracking-tight">
              Evidence &amp; Observations
            </h3>
            <span className="text-[11px] text-slate-500">
              Click observation to locate on sheet
            </span>
          </div>

          <div className="space-y-2">
            {question.evidenceItems.map((ev) => {
              const isSelected = activeEvidenceKey === ev.sectionKey;
              return (
                <button
                  type="button"
                  key={ev.id}
                  onClick={() => onSelectEvidence(isSelected ? null : ev.sectionKey)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start space-x-2.5 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/70 ring-1 ring-blue-500"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      ev.status === "positive"
                        ? "bg-emerald-500"
                        : ev.status === "warning"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-900 leading-snug">
                      {ev.text}
                    </p>
                    {ev.matchedLineRange && (
                      <span className="text-[10px] font-mono text-blue-600 font-medium block">
                        Located: {ev.matchedLineRange}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. AI CONFIDENCE (PRACTICAL RISK SIGNAL) */}
        <section className="p-4 sm:p-5 space-y-2.5 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                AI Confidence
              </span>
              <span className="text-xs font-bold font-mono text-slate-900">
                {question.aiConfidence}%
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {question.aiConfidenceRating}
            </span>
          </div>

          {/* Calibrated Confidence Bar */}
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${question.aiConfidence}%` }}
              role="progressbar"
              aria-valuenow={question.aiConfidence}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <p className="text-[11px] text-slate-500 pt-0.5">
            {question.aiConfidenceNote}
          </p>
        </section>

        {/* 6. HUMAN-IN-THE-LOOP EXAMINER DECISION */}
        <section className="p-4 sm:p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-sm font-bold text-slate-900 tracking-tight">
                Examiner Decision
              </h3>
              <p className="text-[11px] text-slate-500">
                AI suggests. Examiner decides. Enter final score below.
              </p>
            </div>
            {isFlagged && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                <Flag className="w-3 h-3" />
                <span>Flagged for Review</span>
              </span>
            )}
          </div>

          {/* Mark Input & Steppers */}
          <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="examiner-marks-input" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Final Awarded Marks
              </label>
              <span className="text-xs text-slate-500 font-mono">
                Scale: 0.0 to {question.maxMarks}.0
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Stepper Down */}
              <button
                type="button"
                onClick={() => handleStepper(-0.5)}
                className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-base text-slate-900 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Decrease 0.5 marks"
              >
                −
              </button>

              {/* Direct Mark Input */}
              <div className="flex-1 relative">
                <input
                  id="examiner-marks-input"
                  type="text"
                  value={inputVal}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => setIsEditing(true)}
                  className="w-full text-center text-xl font-bold font-mono py-1.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Awarded final marks"
                />
              </div>

              {/* Stepper Up */}
              <button
                type="button"
                onClick={() => handleStepper(0.5)}
                className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-base text-slate-900 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Increase 0.5 marks"
              >
                +
              </button>

              <span className="font-mono font-bold text-sm text-slate-500 px-1">
                / {question.maxMarks}
              </span>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium pt-0.5">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Action Buttons: Accept Suggestion / Edit / Flag */}
          <div className="space-y-2 pt-1">
            
            {/* Primary Action: Accept Suggestion */}
            <button
              type="button"
              onClick={onAcceptSuggestion}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors flex items-center justify-center space-x-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Check className="w-4 h-4" />
              <span>Accept AI Suggestion ({question.aiSuggestedMarks.toFixed(1)} / {question.maxMarks})</span>
            </button>

            {/* Secondary Actions: Edit and Flag */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("examiner-marks-input");
                  if (el) el.focus();
                }}
                className="py-2 px-3 rounded-xl text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-colors flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Custom Score</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleFlag(flagReason)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center space-x-1.5 ${
                  isFlagged
                    ? "border-rose-300 bg-rose-50 text-rose-700 font-semibold"
                    : "border-slate-200 bg-white hover:bg-rose-50 text-rose-600"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isFlagged ? "Remove Flag" : "Flag for Review"}</span>
              </button>
            </div>

            {/* Flag Reason selector if flagged */}
            {isFlagged && (
              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 text-xs space-y-1.5">
                <span className="font-semibold text-rose-800 block text-[11px] uppercase tracking-wide">
                  Flag Reason:
                </span>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full bg-white border border-rose-200 text-slate-900 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Requires manual moderation">Requires manual moderation</option>
                  <option value="Handwriting partially unclear">Handwriting partially unclear</option>
                  <option value="Formula derivation ambiguity">Formula derivation ambiguity</option>
                  <option value="Dual option attempt">Candidate attempted optional questions</option>
                  <option value="Senior evaluator second opinion">Senior evaluator second opinion</option>
                </select>
              </div>
            )}

          </div>

        </section>

      </div>

    </div>
  );
}
