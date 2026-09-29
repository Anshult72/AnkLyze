"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import EvaluationWorkspaceHeader from "@/components/evaluation/EvaluationWorkspaceHeader";
import AnswerSheetViewer from "@/components/evaluation/AnswerSheetViewer";
import EvaluationPanel from "@/components/evaluation/EvaluationPanel";
import WorkspaceBottomBar from "@/components/evaluation/WorkspaceBottomBar";
import {
  EVALUATION_DATASET_MOCK,
  AVAILABLE_QUESTIONS,
  EvaluationWorkspaceData,
} from "@/data/evaluationWorkspaceMockData";
import { Eye, SlidersHorizontal, CheckCircle, ArrowLeft } from "lucide-react";

export default function ExaminerEvaluationWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const scriptIdParam = (params?.scriptId as string) || "A-10492";

  // State: Current dataset for this script
  const [dataset, setDataset] = useState<EvaluationWorkspaceData>(EVALUATION_DATASET_MOCK);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("Q04");
  const [currentPage, setCurrentPage] = useState<number>(4);
  const [mobileMode, setMobileMode] = useState<"sheet" | "evaluation">("sheet");

  // State: Evaluated scores map (e.g. { "Q04": 6.5, "Q01": 5.0 })
  const [evaluatedScores, setEvaluatedScores] = useState<Record<string, number>>({
    Q01: 5.0,
    Q02: 5.0,
    Q03: 4.5,
    Q04: 6.5,
  });

  // State: Flagged questions map
  const [flaggedQuestions, setFlaggedQuestions] = useState<
    Record<string, { flagged: boolean; reason?: string }>
  >({});

  // State: Active highlighted evidence snippet
  const [activeEvidenceKey, setActiveEvidenceKey] = useState<string | null>(null);

  // State: Auto-save tracking & Toast message
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync dataset with param if changed
  useEffect(() => {
    if (scriptIdParam) {
      setDataset((prev) => ({
        ...prev,
        scriptId: scriptIdParam,
      }));
    }
  }, [scriptIdParam]);

  // Find active question object
  const currentQuestion =
    dataset.questions[currentQuestionId] ||
    dataset.questions["Q04"] ||
    Object.values(dataset.questions)[0];

  // Auto-switch document page when question changes
  const handleSelectQuestion = (qId: string) => {
    setCurrentQuestionId(qId);
    const qObj = dataset.questions[qId];
    if (qObj) {
      setCurrentPage(qObj.pageNumber);
    }
    setActiveEvidenceKey(null);
  };

  // Previous Question
  const handlePreviousQuestion = () => {
    const idx = AVAILABLE_QUESTIONS.findIndex((q) => q.id === currentQuestionId);
    if (idx > 0) {
      handleSelectQuestion(AVAILABLE_QUESTIONS[idx - 1].id);
    }
  };

  // Next Question
  const handleNextQuestion = () => {
    const idx = AVAILABLE_QUESTIONS.findIndex((q) => q.id === currentQuestionId);
    if (idx < AVAILABLE_QUESTIONS.length - 1) {
      handleSelectQuestion(AVAILABLE_QUESTIONS[idx + 1].id);
    }
  };

  // Handle Marks Adjustment
  const handleMarksChange = (marks: number) => {
    setEvaluatedScores((prev) => ({
      ...prev,
      [currentQuestionId]: marks,
    }));
    setIsSaved(false);
  };

  // Handle Accept AI Suggestion
  const handleAcceptSuggestion = () => {
    const suggested = currentQuestion.aiSuggestedMarks;
    setEvaluatedScores((prev) => ({
      ...prev,
      [currentQuestionId]: suggested,
    }));
    setIsSaved(false);
    showToast(`Accepted AI suggestion: ${suggested.toFixed(1)} / ${currentQuestion.maxMarks} marks`);
  };

  // Handle Toggle Flag
  const handleToggleFlag = (reason?: string) => {
    setFlaggedQuestions((prev) => {
      const isCurrentlyFlagged = !!prev[currentQuestionId]?.flagged;
      if (isCurrentlyFlagged) {
        const copy = { ...prev };
        delete copy[currentQuestionId];
        showToast(`Flag removed for ${currentQuestionId}`);
        return copy;
      } else {
        showToast(`Flagged ${currentQuestionId} for moderator audit`);
        return {
          ...prev,
          [currentQuestionId]: {
            flagged: true,
            reason: reason || "Score threshold verification",
          },
        };
      }
    });
    setIsSaved(false);
  };

  // Handle Save / Commit
  const handleSave = () => {
    setIsSaved(true);
    showToast(`Evaluation progress saved for script ${dataset.scriptId}`);
  };

  // Helper: Temporary Toast Banner
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const currentAwardedMarks =
    evaluatedScores[currentQuestionId] !== undefined
      ? evaluatedScores[currentQuestionId]
      : currentQuestion.aiSuggestedMarks;

  const isCurrentFlagged = !!flaggedQuestions[currentQuestionId]?.flagged;

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-slate-900 flex flex-col font-sans selection:bg-amber-200 selection:text-slate-900">
      
      {/* 1. TOP WORKSPACE HEADER */}
      <EvaluationWorkspaceHeader
        scriptId={dataset.scriptId}
        examination={`${dataset.examination} • ${dataset.semester}`}
        subject={dataset.subject}
        subjectCode={dataset.subjectCode}
        currentQuestionId={currentQuestionId}
        totalQuestions={dataset.totalQuestions}
        isSaved={isSaved}
        onSave={handleSave}
      />

      {/* MOBILE SEGMENTED MODE SWITCH */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 w-full text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMobileMode("sheet")}
            className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center space-x-1.5 ${
              mobileMode === "sheet"
                ? "bg-white text-blue-600 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Answer Sheet (Page {currentPage})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileMode("evaluation")}
            className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center space-x-1.5 ${
              mobileMode === "evaluation"
                ? "bg-white text-blue-600 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Evaluation ({currentQuestionId}: {currentAwardedMarks.toFixed(1)}/7)</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN SPLIT WORKSPACE BODY */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4 flex flex-col min-h-0">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch min-h-[calc(100vh-140px)]">
          
          {/* LEFT: ANSWER SHEET VIEWER (58% width on desktop) */}
          <div
            className={`lg:col-span-7 xl:col-span-7 h-full min-h-[580px] lg:min-h-0 ${
              mobileMode === "evaluation" ? "hidden lg:flex" : "flex"
            } flex-col`}
          >
            <AnswerSheetViewer
              question={currentQuestion}
              currentPage={currentPage}
              totalPages={dataset.totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              activeEvidenceKey={activeEvidenceKey}
              onSelectEvidence={(key) => setActiveEvidenceKey(key)}
            />
          </div>

          {/* RIGHT: EVALUATION PANEL (42% width on desktop) */}
          <div
            className={`lg:col-span-5 xl:col-span-5 h-full min-h-[580px] lg:min-h-0 ${
              mobileMode === "sheet" ? "hidden lg:flex" : "flex"
            } flex-col`}
          >
            <EvaluationPanel
              question={currentQuestion}
              examinerMarks={currentAwardedMarks}
              onMarksChange={handleMarksChange}
              isFlagged={isCurrentFlagged}
              onToggleFlag={handleToggleFlag}
              onAcceptSuggestion={handleAcceptSuggestion}
              activeEvidenceKey={activeEvidenceKey}
              onSelectEvidence={(key) => setActiveEvidenceKey(key)}
              onSave={handleSave}
            />
          </div>

        </div>
      </main>

      {/* 3. STICKY BOTTOM ACTION BAR */}
      <WorkspaceBottomBar
        currentQuestionId={currentQuestionId}
        totalQuestions={dataset.totalQuestions}
        onSelectQuestion={handleSelectQuestion}
        onPreviousQuestion={handlePreviousQuestion}
        onNextQuestion={handleNextQuestion}
        isSaved={isSaved}
        onSave={handleSave}
        awardedMarks={currentAwardedMarks}
        maxMarks={currentQuestion.maxMarks}
        isFlagged={isCurrentFlagged}
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-16 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
