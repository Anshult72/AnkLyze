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
  History,
  Lock,
  Unlock,
  RotateCcw,
  Save,
  ArrowRight,
  X,
  ChevronRight,
  ShieldAlert,
  Scale,
  Layers,
  Info,
} from "lucide-react";
import { QuestionData } from "@/data/evaluationWorkspaceMockData";

export interface DecisionVersionItem {
  id: string;
  version: number;
  decisionType: string;
  status: "DRAFT" | "FINAL";
  totalMarks: number;
  maxMarks: number;
  examinerName: string;
  timestamp: string;
  overrideReason?: string;
  reopenReason?: string;
  notes?: string;
  diff?: {
    totalMarks: { before: number; after: number };
    criteriaChanged: Array<{
      criterionId: string;
      criterionName: string;
      before: number;
      after: number;
    }>;
  };
}

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
  decisionStatus?: "DRAFT" | "FINAL";
  onFinalize?: () => void;
  onReopen?: (reason: string) => void;
  decisionHistory?: DecisionVersionItem[];
  onTriggerEvaluation?: () => Promise<void>;
  isEvaluating?: boolean;
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
  decisionStatus = "DRAFT",
  onFinalize,
  onReopen,
  decisionHistory = [],
  onTriggerEvaluation,
  isEvaluating = false,
}: EvaluationPanelProps) {
  const [inputVal, setInputVal] = useState<string>(examinerMarks.toString());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState<string>("Requires Manual Review");
  const [overrideReason, setOverrideReason] = useState<string>("Partial credit applied according to rubric");
  const [overrideNotes, setOverrideNotes] = useState<string>("");
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [showRiskModal, setShowRiskModal] = useState<boolean>(false);
  const [reopenReasonInput, setReopenReasonInput] = useState<string>("");
  const [reopenError, setReopenError] = useState<string | null>(null);

  // Criterion-level marks local state
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    question.rubricItems.forEach((item) => {
      map[item.id] = item.suggestedMarks;
    });
    return map;
  });

  const markInputRef = useRef<HTMLInputElement>(null);

  // Sync internal input value when examinerMarks prop updates
  useEffect(() => {
    const timer = window.setTimeout(() => setInputVal(examinerMarks.toString()), 0);
    return () => window.clearTimeout(timer);
  }, [examinerMarks]);

  // Update criterion marks and recalculate total
  const handleCriterionMarkChange = (critId: string, val: number, maxMarks: number) => {
    if (decisionStatus === "FINAL") return;
    const clamped = Math.min(maxMarks, Math.max(0, val));
    const nextScores = { ...criteriaScores, [critId]: clamped };
    setCriteriaScores(nextScores);

    const sum = Object.values(nextScores).reduce((acc, curr) => acc + curr, 0);
    const totalClamped = Math.min(question.maxMarks, Math.max(0, sum));
    setInputVal(totalClamped.toString());
    onMarksChange(totalClamped);
  };

  const handleInputChange = (val: string) => {
    if (decisionStatus === "FINAL") return;
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
    if (decisionStatus === "FINAL") return;
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
    if (decisionStatus === "FINAL") return;
    if (markInputRef.current) {
      markInputRef.current.focus();
      markInputRef.current.select();
    }
  };

  const handleReopenSubmit = () => {
    if (!reopenReasonInput || reopenReasonInput.trim().length < 3) {
      setReopenError("Please enter a valid reason (minimum 3 characters)");
      return;
    }
    setReopenError(null);
    if (onReopen) {
      onReopen(reopenReasonInput.trim());
    }
    setShowReopenModal(false);
    setReopenReasonInput("");
  };

  const totalRubricSuggested = question.rubricItems.reduce(
    (acc, curr) => acc + curr.suggestedMarks,
    0
  );

  const marksDelta = examinerMarks - question.aiSuggestedMarks;
  const isOverridden = Math.abs(marksDelta) > 0.001;

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden select-none">

      {/* HEADER BAR: Decision Status & History Trigger */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          {decisionStatus === "FINAL" ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
              <Lock className="w-3 h-3" />
              <span>FINAL DECISION</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
              <Unlock className="w-3 h-3" />
              <span>DRAFT DECISION</span>
            </span>
          )}
          <span className="text-xs text-slate-400">
            {decisionHistory.length > 0 ? `v${decisionHistory.length}` : "v1"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          id="btn-view-history"
        >
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>View History ({decisionHistory.length})</span>
        </button>
      </div>

      {/* RISK & ADAPTIVE EVALUATION STATUS STRIP */}
      {question.riskAssessment && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className={`w-4 h-4 ${
              question.riskAssessment.riskBand === "CRITICAL" ? "text-rose-600" :
              question.riskAssessment.riskBand === "HIGH" ? "text-amber-600" :
              question.riskAssessment.riskBand === "MEDIUM" ? "text-yellow-600" : "text-emerald-600"
            }`} />
            <span className="text-xs font-semibold text-slate-700">Risk Engine:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
              question.riskAssessment.riskBand === "CRITICAL" ? "bg-rose-100 text-rose-800 border border-rose-200" :
              question.riskAssessment.riskBand === "HIGH" ? "bg-amber-100 text-amber-800 border border-amber-200" :
              question.riskAssessment.riskBand === "MEDIUM" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
              "bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}>
              {question.riskAssessment.overallRiskScore}/100 • {question.riskAssessment.riskBand} RISK
            </span>
            {question.riskAssessment.requiresSecondEvaluation && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                2nd Evaluation Required
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowRiskModal(true)}
            id="btn-view-risk-factors"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-200 transition-colors cursor-pointer"
          >
            <span>View Risk Breakdown ({question.riskAssessment.factors.length})</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* SCROLLABLE INFORMATION HIERARCHY */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">

        {/* DOUBLE EVALUATION COMPARISON CARD (When independent 2nd evaluation is completed) */}
        {question.doubleEvaluationResult && (
          <section className="p-4 sm:p-5 bg-amber-50/70 border-b border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-amber-700" />
                <h3 className="font-serif text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Double Evaluation Comparison
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                question.doubleEvaluationResult.requiresSeniorReview
                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
              }`}>
                {question.doubleEvaluationResult.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-1">
                <div className="text-[11px] font-semibold text-slate-500">Round 1 Marks</div>
                <div className="font-mono text-lg font-bold text-slate-900">
                  {question.doubleEvaluationResult.round1Marks.toFixed(1)} <span className="text-xs font-normal text-slate-500">/ {question.maxMarks}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{question.doubleEvaluationResult.round1ExaminerName || "Examiner 1"}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-1">
                <div className="text-[11px] font-semibold text-slate-500">Round 2 Marks (Independent)</div>
                <div className="font-mono text-lg font-bold text-slate-900">
                  {question.doubleEvaluationResult.round2Marks.toFixed(1)} <span className="text-xs font-normal text-slate-500">/ {question.maxMarks}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{question.doubleEvaluationResult.round2ExaminerName || "Examiner 2"}</div>
              </div>
            </div>

            <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span>Mark Delta: <strong>{question.doubleEvaluationResult.markDelta.toFixed(1)} marks ({(question.doubleEvaluationResult.normalizedDelta * 100).toFixed(1)}%)</strong></span>
                <span>Criteria Diff: <strong>{question.doubleEvaluationResult.criteriaDifferencesCount}</strong></span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                {question.doubleEvaluationResult.requiresSeniorReview
                  ? "Significant mark divergence (≥20%) detected between independent evaluators. Requires Senior Examiner / Head Examiner moderation review. No automatic winner selected."
                  : "Independent evaluators agreed within permissible delta tolerance."}
              </p>
            </div>
          </section>
        )}

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
                {question.aiProvider && (
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                    Evaluated via {question.aiProvider.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-mono">
                <span>Confidence: <strong className="text-slate-800 font-bold">{question.aiConfidence}%</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-emerald-700 font-bold">Suggestion Ready</strong></span>
                {question.aiModel && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400 font-sans text-[11px] truncate max-w-[200px]" title={question.aiModel}>
                      Model: {question.aiModel}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* AI Score Display & Trigger Button */}
            <div className="flex items-center space-x-3 shrink-0">
              {onTriggerEvaluation && (
                <button
                  type="button"
                  onClick={onTriggerEvaluation}
                  disabled={isEvaluating || decisionStatus === "FINAL"}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                  title="Run or refresh live AI evaluation for this question"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin text-blue-600" : ""}`} />
                  <span className="hidden sm:inline">{isEvaluating ? "Evaluating..." : "Evaluate with AI"}</span>
                </button>
              )}
              <div className="flex items-baseline space-x-1 font-mono text-right shrink-0">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight font-serif">
                  {question.aiSuggestedMarks}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  / {question.maxMarks}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Calculated from rubric criteria match &amp; detected working. Examiner holds authoritative marking decision.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* 3. RUBRIC / EVALUATION CRITERIA (WITH CRITERION OVERRIDE CONTROLS) */}
        {/* ========================================================================= */}
        <section className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-slate-900 tracking-tight">
              Evaluation Criteria &amp; Criterion Marks
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Total Suggested: <strong className="text-slate-900 font-bold">{totalRubricSuggested} / {question.maxMarks}</strong>
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
            {question.rubricItems.map((item) => {
              const currentCritMarks = criteriaScores[item.id] !== undefined ? criteriaScores[item.id] : item.suggestedMarks;
              const isCritOverridden = Math.abs(currentCritMarks - item.suggestedMarks) > 0.001;

              return (
                <div
                  key={item.id}
                  className="p-3 flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start space-x-2.5 flex-1">
                    <div className="mt-0.5 shrink-0">
                      {currentCritMarks > 0 ? (
                        <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px] border border-emerald-200">
                          ✓
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] border border-slate-200">
                          ✕
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-900 block leading-snug">
                        {item.label}
                      </span>
                      {item.note && (
                        <span className="text-[11px] text-slate-500 block">
                          {item.note}
                        </span>
                      )}
                      <div className="flex items-center space-x-2 pt-0.5 text-[10px] text-slate-400 font-mono">
                        <span>AI Suggestion: {item.suggestedMarks}/{item.maxMarks}</span>
                        {isCritOverridden && (
                          <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded">
                            Modified ({currentCritMarks}/{item.maxMarks})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Criterion Marks Selector */}
                  <div className="flex items-center space-x-1 font-mono shrink-0">
                    {decisionStatus !== "FINAL" ? (
                      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleCriterionMarkChange(item.id, currentCritMarks - 0.5, item.maxMarks)}
                          className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center shadow-2xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-1.5 font-bold text-slate-900 text-xs">
                          {currentCritMarks}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCriterionMarkChange(item.id, currentCritMarks + 0.5, item.maxMarks)}
                          className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center shadow-2xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="font-bold text-slate-900 text-xs px-2 py-1 bg-slate-50 rounded border border-slate-200">
                        {currentCritMarks}
                      </span>
                    )}
                    <span className="text-slate-400 text-xs">/ {item.maxMarks}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. EVIDENCE (Observation Links) */}
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
        {/* 5. AI VS HUMAN COMPARISON (COMPACT PROVENANCE) */}
        {/* ========================================================================= */}
        <section className="p-4 sm:p-5 bg-slate-50/80 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            AI vs. Examiner Comparison
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">AI Suggestion</span>
              <strong className="text-sm font-bold text-blue-600">{question.aiSuggestedMarks}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Your Award</span>
              <strong className="text-sm font-bold text-slate-900">{examinerMarks}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Delta</span>
              <strong
                className={`text-sm font-bold ${
                  marksDelta > 0
                    ? "text-emerald-600"
                    : marksDelta < 0
                    ? "text-rose-600"
                    : "text-slate-600"
                }`}
              >
                {marksDelta > 0 ? `+${marksDelta}` : marksDelta}
              </strong>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. YOUR DECISION (AUTHORITATIVE EXAMINER SECTION) */}
        {/* ========================================================================= */}
        <section className="p-4 sm:p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900 tracking-tight">
                Your Decision
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {decisionStatus === "FINAL"
                  ? "Final authoritative decision recorded. Editing locked."
                  : "AI suggests. Examiner decides authoritatively."}
              </p>
            </div>

            {isFlagged && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                <Flag className="w-3.5 h-3.5" />
                <span>Review Required</span>
              </span>
            )}
          </div>

          {/* LOCKED STATE BANNER WHEN FINAL */}
          {decisionStatus === "FINAL" ? (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      Final Examiner Decision Recorded
                    </h4>
                    <p className="text-[11px] text-emerald-700 font-mono">
                      Awarded: <strong>{examinerMarks} / {question.maxMarks} marks</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(true)}
                  className="px-3 py-1.5 text-xs font-bold bg-white text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                  id="btn-reopen-decision"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reopen Decision</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* DRAFT STATE: INTERACTIVE MARK CONTROL */}
              <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="examiner-marks-input"
                    className="text-xs font-bold uppercase tracking-wider text-slate-800"
                  >
                    Awarded Total Marks
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    Range: 0.0 to {question.maxMarks}.0
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleStepper(-0.5)}
                    className="w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-bold text-lg text-slate-900 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                    title="Decrease marks by 0.5"
                    aria-label="Decrease marks by 0.5"
                  >
                    −
                  </button>

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

                  <button
                    type="button"
                    onClick={() => handleStepper(0.5)}
                    className="w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-bold text-lg text-slate-900 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
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

              {/* OVERRIDE REASON SELECTOR (Mandatory when marks differ) */}
              {isOverridden && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-amber-900 uppercase tracking-wide text-[11px]">
                      Override Reason (Required):
                    </span>
                  </div>
                  <select
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full bg-white border border-amber-300 text-slate-900 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    aria-label="Select override reason"
                  >
                    <option value="Partial credit applied according to rubric">Partial credit applied according to rubric</option>
                    <option value="AI missed valid answer evidence">AI missed valid answer evidence</option>
                    <option value="Calculation error identified in working">Calculation error identified in working</option>
                    <option value="Alternate method accepted">Alternate method accepted</option>
                    <option value="Rubric interpretation requires correction">Rubric interpretation requires correction</option>
                    <option value="Handwritten notation interpreted incorrectly">Handwritten notation interpreted incorrectly</option>
                    <option value="Other">Other reason</option>
                  </select>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="space-y-2 pt-1">
                {/* Accept Suggestion (Primary Shortcut) */}
                <button
                  type="button"
                  onClick={onAcceptSuggestion}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all flex items-center justify-center space-x-2 border border-slate-300 shadow-2xs cursor-pointer"
                  id="btn-accept-suggestion"
                >
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Accept AI Suggestion ({question.aiSuggestedMarks} / {question.maxMarks})</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  {/* Save Draft */}
                  <button
                    type="button"
                    onClick={onSave}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
                    id="btn-save-draft"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-500" />
                    <span>Save Draft</span>
                  </button>

                  {/* Finalize Decision */}
                  <button
                    type="button"
                    onClick={onFinalize || onSave}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-colors flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                    id="btn-finalize-decision"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Finalize Decision</span>
                  </button>
                </div>

                {/* Flag for Review */}
                <button
                  type="button"
                  onClick={() => onToggleFlag(flagReason)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer ${
                    isFlagged
                      ? "border-rose-400 bg-rose-50 text-rose-800 font-bold"
                      : "border-slate-200 bg-white hover:bg-rose-50 text-rose-700"
                  }`}
                  id="btn-flag-review"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{isFlagged ? "Flagged for Moderation (Remove)" : "Flag for Moderation Review"}</span>
                </button>
              </div>
            </>
          )}

        </section>

      </div>

      {/* ========================================================================= */}
      {/* 7. IMMUTABLE DECISION HISTORY MODAL */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-blue-400" />
                <h3 className="font-serif text-base font-bold">
                  Immutable Decision Version History
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Timeline List */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 divide-y divide-slate-100">
              {decisionHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No historical human decisions recorded yet. Current decision is in initial draft.
                </div>
              ) : (
                decisionHistory.map((item, idx) => (
                  <div key={item.id || idx} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          v{item.version}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            item.status === "FINAL"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.decisionType} ({item.status})
                        </span>
                      </div>
                      <span className="font-mono text-sm font-extrabold text-slate-900">
                        {item.totalMarks} / {item.maxMarks} marks
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <span>Examiner: <strong>{item.examinerName}</strong></span>
                        <span>•</span>
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                      {item.overrideReason && (
                        <p className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                          <strong>Override Reason:</strong> {item.overrideReason}
                        </p>
                      )}
                      {item.reopenReason && (
                        <p className="p-2 bg-blue-50 rounded-lg border border-blue-200 text-blue-900 text-[11px]">
                          <strong>Reopen Reason:</strong> {item.reopenReason}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. REOPEN FINAL DECISION MODAL */}
      {/* ========================================================================= */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">

            <div className="flex items-center space-x-2 text-slate-900">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              <h3 className="font-serif text-base font-bold">
                Reopen Final Decision
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Reopening creates a new editable <strong>DRAFT</strong> version while preserving the previous finalized version in the immutable audit trail.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="reopen-reason-input" className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Reason for Reopening (Required):
              </label>
              <textarea
                id="reopen-reason-input"
                rows={3}
                value={reopenReasonInput}
                onChange={(e) => setReopenReasonInput(e.target.value)}
                placeholder="e.g. Re-evaluating derivation steps after grievance review..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
              />
              {reopenError && (
                <p className="text-xs text-rose-600 font-semibold">{reopenError}</p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowReopenModal(false);
                  setReopenError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReopenSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
              >
                Confirm Reopen
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. EXPLAINABLE RISK ASSESSMENT MODAL */}
      {/* ========================================================================= */}
      {showRiskModal && question.riskAssessment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-serif text-base font-bold">
                    Evaluation Risk Assessment Breakdown
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Formula: {question.riskAssessment.formulaVersion} • Deterministic bounded scoring (0–100)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRiskModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Summary Card */}
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Overall Risk Score</div>
                <div className="flex items-baseline space-x-2 pt-0.5">
                  <span className="text-3xl font-black font-mono text-slate-900">
                    {question.riskAssessment.overallRiskScore}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/ 100</span>
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                    question.riskAssessment.riskBand === "CRITICAL" ? "bg-rose-100 text-rose-800 border border-rose-300" :
                    question.riskAssessment.riskBand === "HIGH" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                    question.riskAssessment.riskBand === "MEDIUM" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" :
                    "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}>
                    {question.riskAssessment.riskBand} RISK
                  </span>
                </div>
              </div>
              <div className="text-right space-y-1">
                {question.riskAssessment.requiresSecondEvaluation && (
                  <div className="text-xs font-bold text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-300">
                    Second Evaluation Triggered
                  </div>
                )}
                {question.riskAssessment.requiresSeniorReview && (
                  <div className="text-xs font-bold text-rose-900 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-300">
                    Senior Review Required
                  </div>
                )}
              </div>
            </div>

            {/* Contributing Factors List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 pb-1">
                Contributing Observable Risk Factors ({question.riskAssessment.factors.length})
              </div>
              {question.riskAssessment.factors.map((factor, idx) => (
                <div key={idx} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {factor.factorType.replace(/_/g, " ")}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        factor.severity === "CRITICAL" || factor.severity === "HIGH" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                        factor.severity === "MEDIUM" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                        "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {factor.severity}
                      </span>
                      {factor.sourceEntityType && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          src: {factor.sourceEntityType}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-blue-700">
                      +{factor.scoreContribution} pts
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {factor.explanation}
                  </p>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Risk attaches strictly to evaluation decisions, never to examiners.</span>
              <button
                type="button"
                onClick={() => setShowRiskModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
