"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  Flag,
  Edit3,
  HelpCircle,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { QuestionData } from "@/data/evaluationWorkspaceMockData";

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
  const [flagReason, setFlagReason] = useState<string>("Requires Manual Review");
  const markInputRef = useRef<HTMLInputElement>(null);

  // Sync internal input value when examinerMarks prop updates
  useEffect(() => {
    setInputVal(examinerMarks.toString());
  }, [examinerMarks]);

  const handleInputChange = (val: string) => {
    setInputVal(val);
    if (val.trim() === "") {
      setErrorMsg("Marks cannot be empty");
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) {
      setErrorMsg("Please enter a valid numeric score");
      return;
    }
    if (num < 0) {
      setErrorMsg("Marks cannot be negative");
      return;
    }
    if (num > question.maxMarks) {
      setErrorMsg(`Marks cannot exceed maximum (${question.maxMarks})`);
      return;
    }
    setErrorMsg(null);
    onMarksChange(num);
  };

  const handleStepper = (delta: number) => {
    const current = parseFloat(inputVal) || 0;
    const nextVal = Math.min(
      question.maxMarks,
      Math.max(0, Math.round((current + delta) * 2) / 2)
    );
    setInputVal(nextVal.toString());
    setErrorMsg(null);
    onMarksChange(nextVal);
  };

  const handleEditMarksClick = () => {
    if (markInputRef.current) {
      markInputRef.current.focus();
      markInputRef.current.select();
    }
  };

  const totalRubricSuggested = question.rubricItems.reduce(
    (acc, curr) => acc + curr.suggestedMarks,
    0
  );

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden select-none">
      
      {/* SCROLLABLE INFORMATION HIERARCHY */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        
        {/* ========================================================================= */}
        {/* 1. CURRENT QUESTION */}
        {/* ========================================================================= */}
        <section className="p-4 sm:p-5 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-md">
                QUESTION {question.questionNumber.replace(/^Q/i, "")}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {question.section}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 uppercase font-mono">
                Maximum Marks: {question.maxMarks}
              </span>
            </div>
          </div>

          <p className="text-sm font-medium text-slate-900 leading-snug pt-0.5">
            &ldquo;{question.questionText}&rdquo;
          </p>
        </section>

        {/* ========================================================================= */}
        {/* 2. AI EVALUATION SUGGESTION (Advisory only) */}
        {/* ========================================================================= */}
        <section className="p-4 sm:p-5 bg-slate-50/70 space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  AI Suggested Marks
                </h3>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Advisory Only
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono">
                <span>Confidence: <strong className="text-slate-800 font-bold">{question.aiConfidence}%</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-emerald-700 font-bold">Suggestion Ready</strong></span>
              </div>
            </div>

            {/* AI Score Display */}
            <div className="flex items-baseline space-x-1 font-mono text-right shrink-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight font-serif">
                {question.aiSuggestedMarks}
              </span>
              <span className="text-sm font-semibold text-slate-500">
                / {question.maxMarks}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Calculated from rubric criteria match &amp; detected working. Examiner holds final marking decision.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* 3. RUBRIC / EVALUATION CRITERIA */}
        {/* ========================================================================= */}
        <section className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-slate-900 tracking-tight">
              Evaluation Criteria
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Total Suggested: <strong className="text-slate-900 font-bold">{totalRubricSuggested} / {question.maxMarks}</strong>
            </span>
          </div>

          {/* Clean Rubric Rows per prompt specification */}
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
            {question.rubricItems.map((item) => (
              <div
                key={item.id}
                className="p-3 flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5 shrink-0">
                    {item.suggestedMarks > 0 ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px] border border-emerald-200">
                        ✓
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] border border-slate-200">
                        ✕
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block leading-snug">
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
                  <span
                    className={`font-bold ${
                      item.suggestedMarks > 0 ? "text-slate-900" : "text-rose-600"
                    }`}
                  >
                    {item.suggestedMarks}
                  </span>
                  <span className="text-slate-400"> / {item.maxMarks}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. EVIDENCE (Concise examiner observations linked to sheet) */}
        {/* ========================================================================= */}
        <section className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-slate-900 tracking-tight">
              Evidence
            </h3>
            <span className="text-[11px] text-slate-500">
              Click observation to view region
            </span>
          </div>

          <div className="space-y-2">
            {question.evidenceItems.map((ev) => {
              const isSelected = activeEvidenceKey === ev.sectionKey;
              return (
                <button
                  type="button"
                  key={ev.id}
                  onClick={() =>
                    onSelectEvidence(isSelected ? null : ev.sectionKey)
                  }
                  className={`w-full text-left p-2.5 sm:p-3 rounded-xl border text-xs transition-all flex items-start space-x-2.5 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/80 ring-1 ring-blue-500"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                      ev.status === "positive"
                        ? "bg-emerald-500"
                        : ev.status === "warning"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-900 leading-snug font-medium">
                      {ev.text}
                    </p>
                    {ev.matchedLineRange && (
                      <span className="text-[10px] font-mono text-blue-600 font-semibold block">
                        Answer Region: {ev.matchedLineRange}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. AI CONFIDENCE (Practical risk indicator) */}
        {/* ========================================================================= */}
        <section className="p-4 sm:p-5 space-y-2.5 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
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

          {/* Practical confidence progress bar */}
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

          <p className="text-[11px] text-slate-600 pt-0.5 leading-relaxed">
            &ldquo;{question.aiConfidenceNote}&rdquo;
          </p>
        </section>

        {/* ========================================================================= */}
        {/* 6. EXAMINER DECISION (STRONGEST FUNCTIONAL EMPHASIS) */}
        {/* ========================================================================= */}
        <section className="p-4 sm:p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900 tracking-tight">
                Examiner Decision
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                AI suggests. Examiner decides.
              </p>
            </div>

            {/* Flagged Status Badge if active */}
            {isFlagged && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                <Flag className="w-3.5 h-3.5" />
                <span>Review Required</span>
              </span>
            )}
          </div>

          {/* Final Marks Interactive Control */}
          <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="examiner-marks-input"
                className="text-xs font-bold uppercase tracking-wider text-slate-800"
              >
                Final Marks
              </label>
              <span className="text-xs text-slate-500 font-mono">
                Range: 0.0 to {question.maxMarks}.0
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Stepper Down */}
              <button
                type="button"
                onClick={() => handleStepper(-0.5)}
                className="w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-bold text-lg text-slate-900 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                title="Decrease marks by 0.5"
                aria-label="Decrease marks by 0.5"
              >
                −
              </button>

              {/* Direct Mark Input Box */}
              <div className="flex-1 relative">
                <input
                  ref={markInputRef}
                  id="examiner-marks-input"
                  type="text"
                  value={inputVal}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-full text-center text-2xl font-extrabold font-mono py-1.5 px-3 rounded-lg border-2 border-blue-600 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  aria-label="Awarded final marks"
                />
              </div>

              {/* Stepper Up */}
              <button
                type="button"
                onClick={() => handleStepper(0.5)}
                className="w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-bold text-lg text-slate-900 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                title="Increase marks by 0.5"
                aria-label="Increase marks by 0.5"
              >
                +
              </button>

              <span className="font-mono font-bold text-base text-slate-600 px-1">
                / {question.maxMarks}
              </span>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-semibold pt-0.5">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Action Hierarchy: Accept Suggestion (Primary) / Edit Marks (Secondary) / Flag for Review (Attention) */}
          <div className="space-y-2 pt-1">
            
            {/* PRIMARY ACTION: Accept Suggestion */}
            <button
              type="button"
              onClick={onAcceptSuggestion}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all flex items-center justify-center space-x-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="btn-accept-suggestion"
            >
              <Check className="w-4 h-4" />
              <span>Accept Suggestion ({question.aiSuggestedMarks} / {question.maxMarks})</span>
            </button>

            {/* SECONDARY & ATTENTION ACTIONS */}
            <div className="grid grid-cols-2 gap-2">
              
              {/* SECONDARY ACTION: Edit Marks */}
              <button
                type="button"
                onClick={handleEditMarksClick}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                id="btn-edit-marks"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Marks</span>
              </button>

              {/* ATTENTION ACTION: Flag for Review */}
              <button
                type="button"
                onClick={() => onToggleFlag(flagReason)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center space-x-1.5 shadow-2xs ${
                  isFlagged
                    ? "border-rose-400 bg-rose-50 text-rose-800 font-bold"
                    : "border-slate-300 bg-white hover:bg-rose-50 text-rose-700"
                }`}
                id="btn-flag-review"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isFlagged ? "Flagged (Remove)" : "Flag for Review"}</span>
              </button>

            </div>

            {/* Prototype Flag Reason Selector if Flagged */}
            {isFlagged && (
              <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-xs space-y-1.5 animate-in fade-in duration-150">
                <span className="font-bold text-rose-900 block text-[11px] uppercase tracking-wide">
                  Review Required Reason:
                </span>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full bg-white border border-rose-200 text-slate-900 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  aria-label="Select flag review reason"
                >
                  <option value="Low Confidence">Low Confidence</option>
                  <option value="Requires Manual Review">Requires Manual Review</option>
                  <option value="Handwriting partially unclear">Handwriting partially unclear</option>
                  <option value="Formula derivation divergence">Formula derivation divergence</option>
                </select>
              </div>
            )}

          </div>

        </section>

      </div>

    </div>
  );
}
