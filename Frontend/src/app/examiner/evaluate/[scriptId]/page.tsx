"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  ScriptEvaluationDataset,
  QuestionData,
} from "@/data/evaluationWorkspaceMockData";
import { fetchApi } from "@/utils/apiClient";
import { Eye, SlidersHorizontal, CheckCircle, ArrowLeft } from "lucide-react";


function EvaluationWorkspaceContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scriptIdParam = (params?.scriptId as string) || "A-10492";

  const isRound2 = searchParams.get("round") === "2";
  const questionParam = searchParams.get("question");

  // State: Live dataset and page images fetched from backend API
  const [liveDataset, setLiveDataset] = useState<ScriptEvaluationDataset | null>(null);
  const [pageImages, setPageImages] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fallback initial dataset
  const fallbackDataset = getScriptDataset(scriptIdParam);
  const dataset = liveDataset || fallbackDataset;

  const initialQId = questionParam && dataset.questions[questionParam]
    ? questionParam
    : isRound2
    ? "Q07"
    : Object.keys(dataset.questions)[0] || "Q01";

  const [currentQuestionId, setCurrentQuestionId] = useState<string>(initialQId);
  const initialPage = dataset.questions[initialQId]?.pageNumber || 1;
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [mobileMode, setMobileMode] = useState<"sheet" | "evaluation">("sheet");

  // State: Evaluated scores map
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
  const [decisionHistories, setDecisionHistories] = useState<Record<string, DecisionVersionItem[]>>({});

  // State: Flagged questions map
  const [flaggedQuestions, setFlaggedQuestions] = useState<
    Record<string, { flagged: boolean; reason?: string }>
  >({});

  // State: Active highlighted evidence snippet
  const [activeEvidenceKey, setActiveEvidenceKey] = useState<string | null>(null);

  // State: Auto-save tracking & Toast message
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic fetch of live script, questions, and pages from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadLiveData() {
      setIsLoading(true);
      try {
        // Fetch script by ID or scriptCode
        const scriptRes = await fetchApi<any>(`/scripts/${scriptIdParam}`);
        const script = scriptRes?.data || scriptRes;
        if (!script || !script.id) {
          setIsLoading(false);
          return;
        }

        // Fetch subject questions
        const subId = script.subjectId || script.subject?.id;
        const qRes = subId ? await fetchApi<any>(`/subjects/${subId}/questions`) : null;
        const rawQuestions = qRes?.data?.questions || qRes?.data || qRes || [];

        // Fetch script pages
        const pagesRes = await fetchApi<any>(`/scripts/${script.id}/pages`);
        const pagesList = pagesRes?.data || pagesRes || [];
        const imgMap: Record<number, string> = {};
        if (Array.isArray(pagesList)) {
          for (const p of pagesList) {
            if (p.pageNumber && p.imageReference) {
              imgMap[p.pageNumber] = p.imageReference;
            }
          }
        }
        if (isMounted) {
          setPageImages(imgMap);
        }

        // Fetch any existing attempts
        const attemptsRes = await fetchApi<any>(`/scripts/${script.id}/attempts`).catch(() => null);
        const attempts = attemptsRes?.data?.attempts || [];

        // Build dynamic questions map
        const qMap: Record<string, QuestionData> = {};
        const qList = Array.isArray(rawQuestions) ? rawQuestions : [];
        const initialScores: Record<string, number> = {};
        const initialStatuses: Record<string, "DRAFT" | "FINAL"> = {};
        const initialHistories: Record<string, DecisionVersionItem[]> = {};

        qList.forEach((q: any, idx: number) => {
          const qNumStr = String(q.questionNumber || idx + 1);
          const qKey = qNumStr.startsWith("Q") ? qNumStr : `Q${qNumStr.padStart(2, "0")}`;
          const matchingAttempt = attempts.find((a: any) =>
            a.detectedQuestionLabel === qNumStr ||
            a.question?.questionNumber === qNumStr ||
            a.question?.questionNumber === String(idx + 1)
          );

          const latestEval = matchingAttempt?.evaluations?.[0];
          const aiMarks = latestEval?.suggestedMarks ?? matchingAttempt?.aiSuggestedMarks ?? (q.maximumMarks >= 5 ? 4.0 : q.maximumMarks >= 3 ? 2.5 : 1.5);
          const aiConf = latestEval?.confidenceScore != null
            ? Math.round(latestEval.confidenceScore * 100)
            : matchingAttempt?.confidence != null
            ? Math.round(matchingAttempt.confidence * 100)
            : 90;
          const examinerDecision = latestEval?.examinerDecision;
          const examinerAwarded = latestEval?.examinerMarks;
          const assignedScore = examinerAwarded ?? aiMarks;
          const isFinal = examinerDecision === "ACCEPTED" || examinerDecision === "OVERRIDDEN";

          initialScores[qKey] = assignedScore;
          initialStatuses[qKey] = isFinal ? "FINAL" : "DRAFT";

          // If criteria results exist in latestEval, map them
          const criterionResults = latestEval?.criterionResults || [];
          const rubricItems = (q.criteria && q.criteria.length > 0 ? q.criteria : []).map((c: any) => {
            const matchedResult = criterionResults.find((cr: any) => cr.criterionId === c.id);
            return {
              id: c.id,
              label: c.description || c.title || "Evaluation Criterion",
              maxMarks: c.maxMarks || 1,
              suggestedMarks: matchedResult?.suggestedMarks ?? matchedResult?.marksAwarded ?? c.maxMarks ?? 1,
              matched: matchedResult ? matchedResult.status !== "NOT_MET" : true,
              note: matchedResult?.evidenceNote || matchedResult?.reasoning || undefined,
            };
          });

          if (latestEval?.decisionHistory?.length) {
            initialHistories[qKey] = latestEval.decisionHistory.map((dh: any, dhIdx: number) => ({
              id: dh.id || `dec-${dhIdx}`,
              version: dh.version || dhIdx + 1,
              decisionType: dh.decisionType,
              status: dh.status === "FINAL" ? "FINAL" : "DRAFT",
              totalMarks: dh.totalMarksAwarded ?? dh.totalMarks ?? assignedScore,
              maxMarks: q.maximumMarks || 5,
              examinerName: dh.examinerUser?.fullName || "Examiner",
              timestamp: dh.createdAt || new Date().toISOString(),
              notes: dh.examinerNotes || dh.notes,
            }));
          }

          qMap[qKey] = {
            questionNumber: qKey,
            section: q.section || `Question ${qNumStr} (${q.maximumMarks} Marks)`,
            questionText: q.questionText || `Question ${qNumStr}`,
            maxMarks: q.maximumMarks || 5,
            pageNumber: matchingAttempt?.startPageNumber || Math.min(idx + 1, script.pageCount || 22),
            aiSuggestedMarks: aiMarks,
            aiConfidence: aiConf,
            aiConfidenceRating: aiConf >= 85 ? "High confidence" : aiConf >= 60 ? "Medium confidence" : "Low confidence",
            aiConfidenceNote: "Evaluation criteria grounded in question rubric",
            aiProvider: latestEval?.provider,
            aiModel: latestEval?.model,
            attemptId: matchingAttempt?.id,
            evaluationId: latestEval?.id,
            rubricItems,
            evidenceItems: [
              {
                id: `ev-${qKey}-1`,
                text: latestEval?.assessmentSummary || `Student response detected for Question ${qNumStr} on page ${matchingAttempt?.startPageNumber || Math.min(idx + 1, script.pageCount || 22)}`,
                status: "positive",
                sectionKey: "answer",
              },
            ],
            detectedRegionNote: `Detected on page ${matchingAttempt?.startPageNumber || Math.min(idx + 1, script.pageCount || 22)}`,
          };
        });

        if (Object.keys(qMap).length > 0) {
          const constructedDataset: ScriptEvaluationDataset = {
            scriptId: `SHEET ${script.scriptCode}`,
            anonymizedCode: `ANON-${script.scriptCode}`,
            examination: script.exam?.title || "High School Examination (Regular) 2019",
            semester: "Class 10",
            subject: script.subject?.name || "Social Science",
            subjectCode: script.subject?.code || "300",
            totalPages: script.pageCount || 22,
            totalQuestions: Object.keys(qMap).length,
            status: "AI Ready",
            center: "Exam Valuation Center",
            session: "2019 Regular",
            questions: qMap,
          };

          if (isMounted) {
            setLiveDataset(constructedDataset);
            setEvaluatedScores(initialScores);
            setDecisionStatuses(initialStatuses);
            setDecisionHistories(initialHistories);

            const firstKey = Object.keys(qMap)[0];
            setCurrentQuestionId(firstKey);
            setCurrentPage(qMap[firstKey].pageNumber || 1);
          }
        }
      } catch (err) {
        console.warn("Could not load live evaluation dataset, using fallback", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, [scriptIdParam]);

  // Find active question object
  const currentQuestion =
    dataset.questions[currentQuestionId] ||
    Object.values(dataset.questions)[0];

  // Dynamic available questions list
  const availableQuestionsList = Object.values(dataset.questions).map((q) => ({
    id: q.questionNumber,
    label: q.questionNumber,
    maxMarks: q.maxMarks,
    page: q.pageNumber,
    status: decisionStatuses[q.questionNumber] === "FINAL" ? "evaluated" : "active",
    marks: evaluatedScores[q.questionNumber] ?? null,
  }));

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
    const idx = availableQuestionsList.findIndex((q) => q.id === currentQuestionId);
    if (idx > 0) {
      handleSelectQuestion(availableQuestionsList[idx - 1].id);
    }
  };

  // Next Question
  const handleNextQuestion = () => {
    const idx = availableQuestionsList.findIndex((q) => q.id === currentQuestionId);
    if (idx < availableQuestionsList.length - 1) {
      handleSelectQuestion(availableQuestionsList[idx + 1].id);
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

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const handleTriggerAiEvaluation = async () => {
    if (!currentQuestion?.attemptId) {
      showToast("No reconstructed attempt found for this question yet.");
      return;
    }
    setIsEvaluating(true);
    try {
      const evalRes = await fetchApi<any>(`/question-attempts/${currentQuestion.attemptId}/evaluate`, {
        method: "POST",
        body: { forceRefresh: true },
      });
      if (evalRes?.success && evalRes.data) {
        const evalData = evalRes.data;
        const newSuggested = evalData.suggestedMarks ?? currentQuestion.maxMarks;
        const newConfidence = evalData.confidenceScore != null ? Math.round(evalData.confidenceScore * 100) : 90;

        setLiveDataset((prev) => {
          if (!prev) return prev;
          const q = prev.questions[currentQuestionId];
          if (!q) return prev;
          return {
            ...prev,
            questions: {
              ...prev.questions,
              [currentQuestionId]: {
                ...q,
                aiSuggestedMarks: newSuggested,
                aiConfidence: newConfidence,
                aiProvider: evalData.provider,
                aiModel: evalData.model,
                evaluationId: evalData.id,
                rubricItems: (evalData.criterionResults && evalData.criterionResults.length > 0 ? evalData.criterionResults : q.rubricItems).map((c: any) => ({
                  id: c.criterionId || c.id,
                  label: c.criterion?.description || c.label || "Evaluation Criterion",
                  maxMarks: c.maxMarks || 1,
                  suggestedMarks: c.suggestedMarks ?? (c.maxMarks || 1),
                  matched: c.status !== "NOT_MET",
                  note: c.evidenceNote || c.reasoning || undefined,
                })),
                evidenceItems: [
                  {
                    id: `ev-${currentQuestionId}-live`,
                    text: evalData.assessmentSummary || `Evaluated by ${evalData.provider}: score ${newSuggested}/${q.maxMarks}`,
                    status: "positive",
                    sectionKey: "answer",
                  },
                ],
              },
            },
          };
        });

        setEvaluatedScores((prev) => ({
          ...prev,
          [currentQuestionId]: newSuggested,
        }));
        showToast(`AI Evaluation complete via ${evalData.provider || "AI"}: ${newSuggested}/${currentQuestion.maxMarks}`);
      } else {
        showToast(`Evaluation message: ${evalRes?.error?.message || "Completed"}`);
      }
    } catch (e: any) {
      showToast(`Error evaluating question: ${e?.message || "Failed"}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Handle Save / Commit Draft
  const handleSave = async () => {
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
      examinerName: "Prof. R. K. Sharma (Examiner)",
      timestamp: new Date().toISOString(),
      notes: "Draft updated by examiner",
    };

    // Ensure evaluation record exists on backend
    let evalId = currentQuestion.evaluationId;
    if (!evalId && currentQuestion.attemptId) {
      try {
        const evalRes = await fetchApi<any>(`/question-attempts/${currentQuestion.attemptId}/evaluate`, {
          method: "POST",
          body: { forceRefresh: false },
        });
        if (evalRes?.success && evalRes.data?.id) {
          evalId = evalRes.data.id;
          currentQuestion.evaluationId = evalId;
          currentQuestion.aiProvider = evalRes.data.provider;
          currentQuestion.aiModel = evalRes.data.model;
        }
      } catch (err) {
        console.warn("Could not auto-create evaluation record", err);
      }
    }

    if (evalId) {
      try {
        await fetchApi<any>(`/evaluations/${evalId}/decisions`, {
          method: "POST",
          body: {
            decisionType: "SAVE_DRAFT",
            status: "DRAFT",
            totalMarks: currentScore,
            notes: "Draft updated by examiner",
          },
        });
      } catch (e) {
        console.warn("Could not sync draft to remote API", e);
      }
    }

    setDecisionHistories((prev) => ({
      ...prev,
      [currentQuestionId]: [...(prev[currentQuestionId] || []), newRecord],
    }));

    setIsSaved(true);
    showToast(`Saved draft version v${newVersionNum} for ${currentQuestionId}`);
  };

  // Handle Explicit Finalization
  const handleFinalize = async () => {
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
      examinerName: "Prof. R. K. Sharma (Examiner)",
      timestamp: new Date().toISOString(),
      notes: "Authoritative examiner decision confirmed and finalized.",
    };

    // Ensure evaluation record exists on backend
    let evalId = currentQuestion.evaluationId;
    if (!evalId && currentQuestion.attemptId) {
      try {
        const evalRes = await fetchApi<any>(`/question-attempts/${currentQuestion.attemptId}/evaluate`, {
          method: "POST",
          body: { forceRefresh: false },
        });
        if (evalRes?.success && evalRes.data?.id) {
          evalId = evalRes.data.id;
          currentQuestion.evaluationId = evalId;
          currentQuestion.aiProvider = evalRes.data.provider;
          currentQuestion.aiModel = evalRes.data.model;
        }
      } catch (err) {
        console.warn("Could not auto-create evaluation record", err);
      }
    }

    if (evalId) {
      try {
        const isDiff = Math.abs(currentScore - currentQuestion.aiSuggestedMarks) > 0.001;
        await fetchApi<any>(`/evaluations/${evalId}/decision`, {
          method: "PATCH",
          body: {
            decisionType: isDiff ? "OVERRIDDEN" : "ACCEPTED",
            totalMarksAwarded: currentScore,
            examinerNotes: "Authoritative examiner decision confirmed and finalized.",
          },
        });

        await fetchApi<any>(`/evaluations/${evalId}/finalize`, {
          method: "POST",
          body: {
            notes: "Authoritative examiner decision confirmed and finalized.",
          },
        });
      } catch (e) {
        console.warn("Could not sync finalization to remote API", e);
      }
    }

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
      examinerName: "Prof. R. K. Sharma (Examiner)",
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
              <span>{isRound2 ? "Independent Evaluation" : `Evaluation (${currentQuestionId}: ${currentAwardedMarks.toFixed(1)}/${currentQuestion.maxMarks})`}</span>
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
                pageImageUrl={pageImages[currentPage]}
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
                  onTriggerEvaluation={handleTriggerAiEvaluation}
                  isEvaluating={isEvaluating}
                />
              )}
            </div>

          </div>
        </main>

        {/* 3. STICKY BOTTOM ACTION BAR */}
        <WorkspaceBottomBar
          currentQuestionId={currentQuestionId}
          totalQuestions={dataset.totalQuestions}
          questions={availableQuestionsList.map((q) => ({ id: q.id, status: q.status }))}
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
