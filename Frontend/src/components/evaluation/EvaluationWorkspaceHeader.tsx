"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, Globe } from "lucide-react";

interface EvaluationWorkspaceHeaderProps {
  scriptId: string;
  examination: string;
  subject: string;
  subjectCode: string;
  currentQuestionId: string;
  totalQuestions: number;
  isSaved: boolean;
  onSave?: () => void;
}

export default function EvaluationWorkspaceHeader({
  scriptId,
  examination,
  subject,
  subjectCode,
  currentQuestionId,
  totalQuestions,
  isSaved,
}: EvaluationWorkspaceHeaderProps) {
  const currentNum = parseInt(currentQuestionId.replace("Q", ""), 10) || 4;

  return (
    <header className="workspace-review-header sticky top-0 z-30 bg-white text-slate-900 border-b border-slate-200/90 shadow-xs">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-15 gap-2">
          
          {/* LEFT: Navigation Back + Anonymized Script ID */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <Link
              href="/examiner/dashboard"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 border border-slate-200 transition-colors"
              title="Return to Examiner Dashboard queue"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Queue</span>
            </Link>

            <div className="h-4 w-px bg-slate-200" />

            {/* ANKLYZE Brand Token & Script ID */}
            <div className="flex items-center space-x-2.5">
              <Image src="/anklyze-logo.png" alt="ANKLYZE" width={92} height={30} className="hidden sm:block w-23 h-auto object-contain" priority />
              <span className="text-slate-300 hidden sm:inline-block">•</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-500 font-medium">Sheet ID:</span>
                <span className="font-mono font-bold text-sm text-slate-900 tracking-tight">
                  {scriptId.replace(/^(?:SCRIPT|SHEET)\s+/i, "")}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold uppercase tracking-wider hidden md:inline-flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-blue-600 mr-0.5" />
                <span>Anonymized Evaluation</span>
              </span>
            </div>
          </div>

          {/* CENTER: Examination Context */}
          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-600 truncate">
            <span className="font-semibold text-slate-900">{examination}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-800">{subject}</span>
            {subjectCode && (
              <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                {subjectCode}
              </span>
            )}
          </div>

          {/* RIGHT: Current Question, Save State & Return link */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Current Question Indicator */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <span className="font-medium text-slate-500 hidden sm:inline">Current:</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Question {currentNum < 10 ? `0${currentNum}` : currentNum} / {totalQuestions < 10 ? `0${totalQuestions}` : totalQuestions}
              </span>
            </div>

            {/* Save State Badge */}
            <div
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                isSaved
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-amber-800 bg-amber-50 border-amber-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSaved ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                }`}
              />
              <span className="text-[11px] font-bold">
                {isSaved ? "Saved" : "Unsaved Changes"}
              </span>
            </div>

            {/* Website Return Link */}
            <Link
              href="/"
              className="hidden xl:inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
              title="Return to ANKLYZE public site"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Site</span>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
