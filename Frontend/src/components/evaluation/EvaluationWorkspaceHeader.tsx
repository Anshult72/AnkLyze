"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, Clock, Globe, ExternalLink } from "lucide-react";

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
  onSave,
}: EvaluationWorkspaceHeaderProps) {
  const currentNum = parseInt(currentQuestionId.replace("Q", ""), 10) || 4;

  return (
    <header className="sticky top-0 z-30 bg-white text-slate-900 border-b border-slate-200/90 shadow-xs">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-15 gap-2">
          
          {/* LEFT: Navigation Back + Anonymized Script ID */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <Link
              href="/examiner/dashboard"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 border border-slate-200 transition-colors"
              title="Return to Examiner Dashboard queue"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Evaluation Queue</span>
              <span className="sm:hidden">Queue</span>
            </Link>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                {scriptId}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider font-bold hidden md:inline-block">
                Double-Blind
              </span>
            </div>
          </div>

          {/* CENTER: Examination Context */}
          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-500 truncate">
            <span className="font-semibold text-slate-900">{examination}</span>
            <span>•</span>
            <span className="text-slate-700">{subject}</span>
            <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
              {subjectCode}
            </span>
          </div>

          {/* RIGHT: Progress, Save Indicator & Website link */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Question Progress Indicator */}
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <span className="hidden sm:inline font-medium">Question:</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {currentQuestionId} / Q{totalQuestions}
              </span>
              <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden md:block">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(currentNum / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Auto-save Status Badge */}
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold">
                {isSaved ? "Saved" : "Unsaved Changes"}
              </span>
            </div>

            {/* Website Return Link */}
            <Link
              href="/"
              className="hidden xl:inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
              title="Return to public marketing website"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Website</span>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
