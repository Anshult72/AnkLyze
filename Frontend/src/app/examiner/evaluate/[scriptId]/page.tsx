"use client";

import React, { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import EvaluationWorkspaceHeader from "@/components/evaluation/EvaluationWorkspaceHeader";
import AnswerSheetViewer from "@/components/evaluation/AnswerSheetViewer";
import EvaluationPanel, { DecisionVersionItem } from "@/components/evaluation/EvaluationPanel";
import Round2EvaluationPanel from "@/components/evaluation/Round2EvaluationPanel";
import WorkspaceBottomBar from "@/components/evaluation/WorkspaceBottomBar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  EVALUATION_DATASET_MOCK,
  AVAILABLE_QUESTIONS,
  getScriptDataset,
} from "@/data/evaluationWorkspaceMockData";
import { Eye, SlidersHorizontal, CheckCircle, ArrowLeft } from "lucide-react";

function EvaluationWorkspaceContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scriptIdParam = (params?.scriptId as string) || "A-10492";

  const isRound2 = searchParams.get("round") === "2";
  const questionParam = searchParams.get("question");

  // State: Current dataset for this script
  const dataset = getScriptDataset(scriptIdParam);
  const initialQId = questionParam && dataset.questions[questionParam]
    ? questionParam
    : isRound2
    ? "Q07"
    : "Q04";

  const [currentQuestionId, setCurrentQuestionId] = useState<string>(initialQId);
  const initialPage = dataset.questions[initialQId]?.pageNumber || 4;
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [mobileMode, setMobileMode] = useState<"sheet" | "evaluation">("sheet");

  // State: Evaluated scores map (Q04 default 5.0 per specification)
  const [evaluatedScores, setEvaluatedScores] = useState<Record<string, number>>({
    Q01: 3.5,
    Q02: 4.0,
    Q03: 4.5,
    Q04: 5.0,
  });

  // State: Decision status per question (DRAFT vs FINAL)
  const [decisionStatuses, setDecisionStatuses] = useState<Record<string, "DRAFT" | "FINAL">>({
    Q01: "FINAL",
    Q02: "FINAL",
    Q03: "FINAL",
    Q04: "DRAFT",
  });

  // State: Versioned history records
  const [decisionHistories, setDecisionHistories] = useState<Record<string, DecisionVersionItem[]>>({
    Q04: [
      {
        id: "dec-v1-init",
        version: 1,
        decisionType: "ACCEPT_AI_SUGGESTION",
        status: "DRAFT",
        totalMarks: 4.0,
        maxMarks: 7.0,
        examinerName: "Prof. Anshul Tripathi",
        timestamp: "2026-01-15T08:42:00.000Z",
        notes: "Initial AI suggestion accepted",
      },
      {
        id: "dec-v2-override",
        version: 2,
        decisionType: "OVERRIDE_AI",
        status: "DRAFT",
        totalMarks: 5.0,
        maxMarks: 7.0,
        examinerName: "Prof. Anshul Tripathi",
        timestamp: "2026-01-15T09:12:00.000Z",
        overrideReason: "Partial credit applied according to rubric for phasor diagram steps",
        diff: {
          totalMarks: { before: 4.0, after: 5.0 },
          criteriaChanged: [
            {
              criterionId: "crit-2",
              criterionName: "EMF Derivation Steps",
              before: 1.0,
              after: 2.0,
            },
          ],
        },
      },
    ],
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

  // Handle Save / Commit Draft
  const handleSave = () => {
    const historyList = decisionHistories[currentQuestionId] || [];
    const newVersionNum = historyList.length + 1;
    const currentScore = evaluatedScores[currentQuestionId] ?? currentQuestion.aiSuggestedMarks;

    const newRecord: DecisionVersionItem = {
      id: `dec-${scriptIdParam}-${currentQuestionId}-v${newVersionNum}`,
      version: newVersionNum,
      decisionType: "SAVE_DRAFT",
      status: "DRAFT",
      totalMarks: currentScore,
      maxMarks: currentQuestion.maxMarks,
      examinerName: "Prof. Anshul Tripathi",
      timestamp: new Date().toISOString(),
      notes: "Draft updated by examiner",
    };

    setDecisionHistories((prev) => ({
      ...prev,
      [currentQuestionId]: [...(prev[currentQuestionId] || []), newRecord],
    }));

    setIsSaved(true);
    showToast(`Saved draft version v${newVersionNum} for ${currentQuestionId}`);
  };

  // Handle Explicit Finalization
  const handleFinalize = () => {
    const historyList = decisionHistories[currentQuestionId] || [];
    const newVersionNum = historyList.length + 1;
    const currentScore = evaluatedScores[currentQuestionId] ?? currentQuestion.aiSuggestedMarks;

    const finalizeRecord: DecisionVersionItem = {
      id: `dec-v${newVersionNum}-final`,
      version: newVersionNum,
      decisionType: "FINALIZE",
      status: "FINAL",
      totalMarks: currentScore,
      maxMarks: currentQuestion.maxMarks,
      examinerName: "Prof. Anshul Tripathi",
      timestamp: new Date().toISOString(),
      notes: "Authoritative examiner decision confirmed and finalized.",
    };

    setDecisionHistories((prev) => ({
      ...prev,
      [currentQuestionId]: [...(prev[currentQuestionId] || []), finalizeRecord],
    }));

    setDecisionStatuses((prev) => ({
      ...prev,
      [currentQuestionId]: "FINAL",
    }));

    setIsSaved(true);
    showToast(`Authoritative decision FINALIZED for ${currentQuestionId} (${currentScore} / ${currentQuestion.maxMarks} marks)`);
  };

  // Handle Reopening Finalized Decision
  const handleReopen = (reason: string) => {
    const historyList = decisionHistories[currentQuestionId] || [];
    const newVersionNum = historyList.length + 1;
    const currentScore = evaluatedScores[currentQuestionId] ?? currentQuestion.aiSuggestedMarks;

    const reopenRecord: DecisionVersionItem = {
      id: `dec-v${newVersionNum}-reopen`,
      version: newVersionNum,
      decisionType: "REOPEN",
      status: "DRAFT",
      totalMarks: currentScore,
      maxMarks: currentQuestion.maxMarks,
      examinerName: "Prof. Anshul Tripathi",
      timestamp: new Date().toISOString(),
      reopenReason: reason,
      notes: `Reopened for revision: ${reason}`,
    };

    setDecisionHistories((prev) => ({
      ...prev,
      [currentQuestionId]: [...(prev[currentQuestionId] || []), reopenRecord],
    }));

    setDecisionStatuses((prev) => ({
      ...prev,
      [currentQuestionId]: "DRAFT",
    }));

    setIsSaved(false);
    showToast(`Decision REOPENED for ${currentQuestionId} under draft version v${newVersionNum}`);
  };

  // Helper: Temporary Toast Banner
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const getRound1MarksForQuestion = (scriptId: string, qId: string): number => {
    if (scriptId.includes("10493") || qId === "Q07") return 6.0;
    if (scriptId.includes("10501") || qId === "Q04") return 4.0;
    if (scriptId.includes("10497") || qId === "Q09") return 5.5;
    return 6.0;
  };

  const currentAwardedMarks =
    evaluatedScores[currentQuestionId] !== undefined
      ? evaluatedScores[currentQuestionId]
      : currentQuestion.aiSuggestedMarks;

  const isCurrentFlagged = !!flaggedQuestions[currentQuestionId]?.flagged;
  const currentDecisionStatus = decisionStatuses[currentQuestionId] || "DRAFT";
  const currentDecisionHistory = decisionHistories[currentQuestionId] || [];

  return (
    <ProtectedRoute allowedRoles={["EXAMINER", "HEAD_EXAMINER", "SUPER_ADMIN"]}>
      <div className="workspace-shell min-h-screen bg-[#FCFAF5] text-slate-900 flex flex-col font-sans selection:bg-[#c5ddd4] selection:text-slate-900">

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
          isRound2={isRound2}
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
              <span>{isRound2 ? "Independent Evaluation" : `Evaluation (${currentQuestionId}: ${currentAwardedMarks.toFixed(1)}/7)`}</span>
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
              {isRound2 ? (
                <Round2EvaluationPanel
                  question={currentQuestion}
                  scriptId={scriptIdParam}
                  round1Marks={getRound1MarksForQuestion(scriptIdParam, currentQuestionId)}
                  activeEvidenceKey={activeEvidenceKey}
                  onSelectEvidence={(key) => setActiveEvidenceKey(key)}
                  onComplete={(status, marks, reason) => {
                    showToast(
                      status === "AGREED"
                        ? "Original Round 1 decision confirmed as authoritative."
                        : "Case submitted to Head Examiner for moderation review."
                    );
                  }}
                />
              ) : (
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
                  decisionStatus={currentDecisionStatus}
                  onFinalize={handleFinalize}
                  onReopen={handleReopen}
                  decisionHistory={currentDecisionHistory}
                />
              )}
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
          isRound2={isRound2}
        />

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed bottom-16 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}

export default function ExaminerEvaluationWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FCFAF5] flex items-center justify-center text-slate-500 font-mono text-xs">
          Loading evaluation workspace...
        </div>
      }
    >
      <EvaluationWorkspaceContent />
    </Suspense>
  );
}
