"use client";

import React from "react";
import { ArrowLeft, ArrowRight, Save, CheckCircle2, Flag, Check } from "lucide-react";
import { AVAILABLE_QUESTIONS } from "@/data/evaluationWorkspaceMockData";

interface WorkspaceBottomBarProps {
  currentQuestionId: string;
  totalQuestions: number;
  questions?: Array<{ id: string; status?: string }>;
  onSelectQuestion: (qId: string) => void;
  onPreviousQuestion: () => void;
  onNextQuestion: () => void;
  isSaved: boolean;
  onSave: () => void;
  awardedMarks: number;
  maxMarks: number;
  isFlagged: boolean;
  isRound2?: boolean;
}

export default function WorkspaceBottomBar({
  currentQuestionId,
  totalQuestions,
  questions,
  onSelectQuestion,
  onPreviousQuestion,
  onNextQuestion,
  isSaved,
  onSave,
  awardedMarks,
  maxMarks,
  isFlagged,
  isRound2 = false,
}: WorkspaceBottomBarProps) {
  if (isRound2) {
    return (
      <footer className="sticky bottom-0 z-30 bg-white border-t border-slate-200/90 shadow-sm py-2.5 px-3 sm:px-6">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-800">
              Independent Question Assignment:
            </span>
            <span className="font-mono font-bold text-[#062834] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {currentQuestionId}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">
              Maximum Marks: <strong className="font-mono">{maxMarks}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-500 hidden sm:inline">
              Single-attempt evaluation scope. All other questions remain under primary evaluation.
            </span>
          </div>
        </div>
      </footer>
    );
  }

  const effectiveQuestions = questions && questions.length > 0 ? questions : AVAILABLE_QUESTIONS;
  const currentIndex = effectiveQuestions.findIndex((q) => q.id === currentQuestionId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < effectiveQuestions.length - 1;

  const prevQuestion = hasPrevious ? effectiveQuestions[currentIndex - 1] : null;
  const nextQuestion = hasNext ? effectiveQuestions[currentIndex + 1] : null;

  return (
    <footer className="sticky bottom-0 z-30 bg-white border-t border-slate-200/90 shadow-sm py-2.5 px-3 sm:px-6">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* LEFT: Quick Question Nav Strip (Desktop & Tablet) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1 hidden lg:inline font-mono">
            Questions:
          </span>
          {effectiveQuestions.map((q) => {
            const isActive = q.id === currentQuestionId;
            return (
              <button
                type="button"
                key={q.id}
                onClick={() => onSelectQuestion(q.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 flex items-center space-x-1 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-2xs"
                    : q.status === "flagged"
                    ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                    : q.status === "evaluated"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60"
                }`}
                title={`Question ${q.id} - ${q.status}`}
              >
                <span>{q.id}</span>
                {q.status === "evaluated" && <Check className="w-3 h-3 text-emerald-600" />}
                {q.status === "flagged" && <Flag className="w-3 h-3 text-rose-600 fill-rose-600" />}
              </button>
            );
          })}
        </div>

        {/* CENTER / RIGHT: Question Navigation & Save Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 w-full md:w-auto justify-between md:justify-end">
          
          {/* Previous Question Button */}
          <button
            type="button"
            onClick={onPreviousQuestion}
            disabled={!hasPrevious}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs"
            title={prevQuestion ? `Go to ${prevQuestion.id}` : undefined}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Previous Question</span>
            <span className="sm:hidden">Prev</span>
          </button>

          {/* Question Indicator: Question 04 of 12 */}
          <div className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span>Question {currentIndex + 1 < 10 ? `0${currentIndex + 1}` : currentIndex + 1} of {totalQuestions < 10 ? `0${totalQuestions}` : totalQuestions}</span>
          </div>

          {/* Quick Save / Commit Evaluation */}
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Save evaluation state"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Next Question / Finalize Evaluation CTA */}
          {hasNext ? (
            <button
              type="button"
              onClick={onNextQuestion}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-all"
              id="btn-next-question"
            >
              <span>Next Question</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onSave();
                alert("All questions evaluated! Sheet ready for final batch sign-off.");
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
              id="btn-finalize-script"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete Sheet</span>
            </button>
          )}

        </div>

      </div>
    </footer>
  );
}
