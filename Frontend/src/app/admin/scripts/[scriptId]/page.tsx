"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Shield,
  CheckCircle2,
  Calendar,
  Layers,
  Database,
  Hash,
  ChevronRight,
  ArrowLeft,
  Lock,
  Copy,
  FolderArchive,
  Info,
  Check,
  AlertTriangle,
  XCircle,
  RotateCw,
  Eye,
  Maximize2,
  Scan,
  Sparkles,
  HelpCircle,
  X,
  FileCheck,
  Cpu,
  Network,
  GitMerge,
  ArrowRight,
  Split,
  FileQuestion,
  BookmarkCheck,
  Search,
} from "lucide-react";
import TopNavigation from "@/components/examiner/TopNavigation";
import { useAuth } from "@/context/AuthContext";
import {
  MOCK_ANSWER_SCRIPTS,
  MockScriptPageData,
  MockOCRBlock,
  MockQuestionAttempt,
  MockReconstructionReviewCase,
  MockQuestionAttemptState,
} from "@/data/examManagementMockData";

export default function ScriptDetailPage({
  params,
}: {
  params: Promise<{ scriptId: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();

  // Navigation tab: Default to Phase 9 "reconstruction" tab
  const [activeTab, setActiveTab] = useState<"reconstruction" | "processing" | "intake">("reconstruction");

  // Phase 8 OCR filter & selection state
  const [pageFilter, setPageFilter] = useState<"ALL" | "OCR_COMPLETE" | "NEEDS_REVIEW" | "FAILED">("ALL");
  const [selectedPage, setSelectedPage] = useState<MockScriptPageData | null>(null);
  const [inspectorView, setInspectorView] = useState<"text" | "boxes" | "raw">("text");
  const [copiedChecksum, setCopiedChecksum] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);

  // Phase 9 Reconstruction state
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [reconstructionMessage, setReconstructionMessage] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<MockQuestionAttempt | null>(null);

  // Phase 9 Ambiguity Resolution Modal state
  const [resolvingCase, setResolvingCase] = useState<MockReconstructionReviewCase | null>(null);
  const [resolutionCandidate, setResolutionCandidate] = useState<string>("");
  const [resolutionState, setResolutionState] = useState<MockQuestionAttemptState>("ACTIVE");
  const [resolutionReason, setResolutionReason] = useState<string>("");
  const [resolutionToast, setResolutionToast] = useState<string | null>(null);

  // Retrieve matching script or fallback
  const initialScript =
    MOCK_ANSWER_SCRIPTS.find(
      (s) => s.id === resolvedParams.scriptId || s.scriptCode === resolvedParams.scriptId
    ) || MOCK_ANSWER_SCRIPTS[0];

  const [scriptData, setScriptData] = useState(initialScript);

  const isAdminOrHead =
    user?.role === "SUPER_ADMIN" || user?.role === "HEAD_EXAMINER";

  const handleCopyChecksum = () => {
    if (scriptData?.checksum) {
      navigator.clipboard.writeText(scriptData.checksum);
      setCopiedChecksum(true);
      setTimeout(() => setCopiedChecksum(false), 2000);
    }
  };

  // Phase 8 Document Processing Action
  const handleProcessAction = (isReprocess: boolean = false) => {
    if (!isAdminOrHead) return;
    setIsProcessing(true);
    setProcessingMessage(
      isReprocess ? "Reprocessing document & OCR extraction..." : "Processing document pages..."
    );

    setTimeout(() => {
      setIsProcessing(false);
      setProcessingMessage(null);
      if (isReprocess && scriptData.pages) {
        const updatedPages = scriptData.pages.map((p) => {
          if (p.processingStatus === "FAILED") {
            return {
              ...p,
              processingStatus: "OCR_COMPLETE" as const,
              errorMessage: undefined,
              ocrResults: [
                {
                  id: `ocr-${p.id}-v2`,
                  version: 2,
                  provider: "google-vision",
                  feature: "DOCUMENT_TEXT_DETECTION",
                  pipelineVersion: "ocr-v2",
                  confidence: 0.895,
                  languageCode: "en",
                  fullText:
                    "Reprocessed Page: Additional handwritten equations and calculations recognized successfully on second pass.",
                  blocks: [
                    {
                      blockType: "TEXT",
                      text:
                        "Reprocessed Page: Additional handwritten equations and calculations recognized successfully on second pass.",
                      confidence: 0.9,
                      boundingBox: { x: 80, y: 120, width: 900, height: 180 },
                    },
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }
          return p;
        });

        setScriptData({
          ...scriptData,
          documentStatus: "COMPLETED",
          averageOcrConfidence: 0.885,
          pages: updatedPages,
        });
      }
    }, 1400);
  };

  // Phase 9 Reconstruction Action (Run or Retry)
  const handleReconstructAction = (isRerun: boolean = false) => {
    if (!isAdminOrHead) return;
    setIsReconstructing(true);
    setReconstructionMessage(
      isRerun
        ? "Reprocessing Stage 1 layout & Stage 2 multimodal resolution (v2)..."
        : "Executing hybrid deterministic candidate detection & multimodal AI resolution..."
    );

    setTimeout(() => {
      setIsReconstructing(false);
      setReconstructionMessage(null);

      if (scriptData.reconstruction) {
        const currentVersion = scriptData.reconstruction.version;
        const newVersion = isRerun ? currentVersion + 1 : currentVersion;

        setScriptData({
          ...scriptData,
          reconstructionStatus: "NEEDS_REVIEW",
          reconstruction: {
            ...scriptData.reconstruction,
            version: newVersion,
            pipelineVersion: "reconstruct-pipeline-v1",
            confidence: 0.88,
          },
        });
      }
    }, 1300);
  };

  // Open Ambiguity Resolution Modal
  const handleOpenResolveModal = (reviewCase: MockReconstructionReviewCase) => {
    setResolvingCase(reviewCase);
    setResolutionCandidate(reviewCase.candidateQuestions?.[0] || "Q05 (Heat Conduction PDE)");
    setResolutionState("ACTIVE");
    setResolutionReason(
      "Confirmed as Question 5 based on one-dimensional heat conduction PDE formulation and boundary condition notation."
    );
  };

  // Submit Ambiguity Resolution
  const handleConfirmResolution = () => {
    if (!resolvingCase || !scriptData.reconstruction) return;

    const updatedAttempts = scriptData.reconstruction.attempts.map((att) => {
      if (att.questionNumber === resolvingCase.questionNumber || att.pages.some((p) => resolvingCase.affectedPages.includes(p))) {
        return {
          ...att,
          questionNumber: resolutionCandidate.startsWith("5(a)") ? "5(a)" : "Q5",
          detectedLabel: resolutionCandidate,
          state: resolutionState,
          confidence: 0.94,
          reason: `Resolved by examiner: ${resolutionReason}`,
          isAmbiguous: false,
        };
      }
      return att;
    });

    const updatedPageMap = scriptData.reconstruction.pageToQuestionMap.map((pm) => {
      if (resolvingCase.affectedPages.includes(pm.pageNumber)) {
        return {
          ...pm,
          questionNumbers: [resolutionCandidate.startsWith("5(a)") ? "5(a)" : "Q5"],
          state: resolutionState,
        };
      }
      return pm;
    });

    const updatedReviewCases = scriptData.reconstruction.reviewCases.map((rc) => {
      if (rc.id === resolvingCase.id) {
        return {
          ...rc,
          isResolved: true,
          resolvedQuestion: resolutionCandidate,
          resolvedState: resolutionState,
          resolvedBy: user?.fullName || "Head Examiner",
          resolvedAt: new Date().toISOString(),
        };
      }
      return rc;
    });

    const remainingUnresolved = updatedReviewCases.filter((rc) => !rc.isResolved).length;

    setScriptData({
      ...scriptData,
      reconstructionStatus: remainingUnresolved === 0 ? "COMPLETED" : "NEEDS_REVIEW",
      reconstruction: {
        ...scriptData.reconstruction,
        status: remainingUnresolved === 0 ? "COMPLETED" : "NEEDS_REVIEW",
        reviewCasesCount: remainingUnresolved,
        confidence: 0.92,
        attempts: updatedAttempts,
        reviewCases: updatedReviewCases,
        pageToQuestionMap: updatedPageMap,
      },
    });

    setResolvingCase(null);
    setResolutionToast("Ambiguity resolved successfully. System decision and human provenance recorded.");
    setTimeout(() => setResolutionToast(null), 4000);
  };

  const pages = scriptData.pages || [];
  const completedCount = pages.filter((p) => p.processingStatus === "OCR_COMPLETE").length;
  const reviewCount = pages.filter((p) => p.processingStatus === "NEEDS_REVIEW").length;
  const failedCount = pages.filter((p) => p.processingStatus === "FAILED").length;

  const filteredPages = pages.filter((p) => {
    if (pageFilter === "ALL") return true;
    return p.processingStatus === pageFilter;
  });

  const recon = scriptData.reconstruction;
  const attempts = recon?.attempts || [];
  const reviewCases = recon?.reviewCases || [];
  const unresolvedReviewCases = reviewCases.filter((rc) => !rc.isResolved);

  // State styling helper for attempt badges
  const getStateBadgeStyle = (state: MockQuestionAttemptState) => {
    switch (state) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CONTINUATION":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "BLANK":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "DUPLICATE_ATTEMPT":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "UNREADABLE":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "REQUIRES_REVIEW":
        return "bg-amber-100 text-amber-900 border-amber-300 font-bold";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="workspace-shell min-h-screen bg-slate-50 flex flex-col font-sans">
      <TopNavigation activeTab="admin-scripts" />

      {/* Breadcrumb & Action Header */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Link href="/admin/exams" className="hover:text-slate-800 transition-colors">
                  Examinations
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href="/admin/scripts" className="hover:text-slate-800 transition-colors">
                  Answer Sheets
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-mono text-slate-800 font-semibold">{scriptData.scriptCode}</span>
              </nav>

              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Sheet {scriptData.scriptCode}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Shield className="w-3 h-3 text-blue-600" />
                  Anonymized Assessment
                </span>
                {scriptData.reconstructionStatus === "NEEDS_REVIEW" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Review Required
                  </span>
                )}
                {scriptData.reconstructionStatus === "COMPLETED" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Reconstructed (100%)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/admin/scripts"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sheets
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 mt-5 border-b border-slate-200 -mb-5">
            <button
              type="button"
              onClick={() => setActiveTab("reconstruction")}
              className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "reconstruction"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Network className="w-4 h-4" />
              Document Reconstruction
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === "reconstruction"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Phase 9
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("processing")}
              className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "processing"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Scan className="w-4 h-4" />
              Document Processing & OCR
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === "processing"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {pages.length} Pages
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("intake")}
              className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "intake"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileCheck className="w-4 h-4" />
              Sheet Intake & Cloud Storage
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 w-full flex-1">
        {/* Toast Notification */}
        {resolutionToast && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{resolutionToast}</span>
          </div>
        )}

        {/* -------------------------------------------------------------------------- */}
        {/* TAB 1: PHASE 9 DOCUMENT RECONSTRUCTION                                     */}
        {/* -------------------------------------------------------------------------- */}
        {activeTab === "reconstruction" && (
          <div className="space-y-6">
            {/* Header Banner & Operational Controls */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Phase 9 Document Reconstruction & Mapping
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      Version: v{recon?.version || 1}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      Pipeline: {recon?.pipelineVersion || "reconstruct-pipeline-v1"}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      Model: {recon?.model || "gemini-1.5-flash"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Converts page-level OCR into a structured question-wise representation. Establishes answer boundaries, continuations, blanks, and cancellations. Strictly non-marking.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {isAdminOrHead ? (
                    <>
                      <button
                        type="button"
                        disabled={isReconstructing}
                        onClick={() => handleReconstructAction(false)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-60"
                      >
                        <Network className="w-3.5 h-3.5 text-slate-500" />
                        Reconstruct Document
                      </button>

                      <button
                        type="button"
                        disabled={isReconstructing}
                        onClick={() => handleReconstructAction(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-60"
                      >
                        <RotateCw
                          className={`w-3.5 h-3.5 ${isReconstructing ? "animate-spin" : ""}`}
                        />
                        Rerun / Retry (v2)
                      </button>
                    </>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Examiner Mode: Read-Only
                    </div>
                  )}
                </div>
              </div>

              {/* In-Flight Reconstruction Feedback Banner */}
              {isReconstructing && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-blue-800 animate-pulse">
                  <RotateCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>{reconstructionMessage}</span>
                </div>
              )}

              {/* KPI Summary Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Document Pages
                  </span>
                  <span className="text-xl font-bold text-slate-900 mt-0.5 block font-mono">
                    {scriptData.pageCount} Pages
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    All pages indexed in sequence
                  </span>
                </div>

                <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Questions Mapped
                  </span>
                  <span className="text-xl font-bold text-slate-900 mt-0.5 block font-mono">
                    {recon?.mappedQuestionsCount || attempts.length} Mapped
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Active questions identified
                  </span>
                </div>

                <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Review Required
                  </span>
                  <span
                    className={`text-xl font-bold mt-0.5 block font-mono ${
                      unresolvedReviewCases.length > 0 ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    {unresolvedReviewCases.length > 0
                      ? `${unresolvedReviewCases.length} Review Required`
                      : "0 (All Resolved)"}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {unresolvedReviewCases.length > 0
                      ? "Ambiguous label / mapping flagged"
                      : "Verified & complete mapping"}
                  </span>
                </div>

                <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Reconstruction Confidence
                  </span>
                  <span className="text-xl font-bold text-emerald-700 mt-0.5 block font-mono">
                    {((recon?.confidence || 0.85) * 100).toFixed(0)}%
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Weighted across all attempts
                  </span>
                </div>
              </div>
            </div>

            {/* Split Screen Layout: Question-Wise Map (Left) + Page Map UI (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 cols): Question-Wise Answer Map */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileQuestion className="w-4 h-4 text-blue-600" />
                    Question-Wise Answer Map
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {attempts.length} attempts identified
                  </span>
                </div>

                <div className="space-y-3">
                  {attempts.map((attempt) => {
                    const isSelected = selectedAttempt?.id === attempt.id;
                    const isReview = attempt.state === "REQUIRES_REVIEW";

                    return (
                      <div
                        key={attempt.id}
                        onClick={() => setSelectedAttempt(attempt)}
                        className={`bg-white rounded-xl border p-4.5 cursor-pointer transition-all shadow-xs ${
                          isSelected
                            ? "border-blue-600 ring-2 ring-blue-100"
                            : isReview
                            ? "border-amber-300 hover:border-amber-400 bg-amber-50/20"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-sm text-slate-900 font-mono">
                              {attempt.questionNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getStateBadgeStyle(
                                attempt.state
                              )}`}
                            >
                              {attempt.state.replace("_", " ")}
                            </span>
                            <span className="text-xs font-mono text-slate-500 font-medium">
                              Pages {attempt.startPageNumber}
                              {attempt.endPageNumber > attempt.startPageNumber
                                ? `–${attempt.endPageNumber}`
                                : ""}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-700">
                              {(attempt.confidence * 100).toFixed(0)}%
                            </span>
                            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  attempt.confidence >= 0.9
                                    ? "bg-emerald-500"
                                    : attempt.confidence >= 0.8
                                    ? "bg-blue-500"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${attempt.confidence * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                          {attempt.questionText}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate pr-2">
                            <strong className="text-slate-700">Evidence:</strong> {attempt.reason}
                          </span>
                          {attempt.detectedLabel && (
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700 flex-shrink-0">
                              Marker: {attempt.detectedLabel}
                            </span>
                          )}
                        </div>

                        {/* Interactive Ambiguity Callout if in review */}
                        {isReview && isAdminOrHead && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                              <span>Ambiguity flagged: Question number ambiguous</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const matchingCase = reviewCases.find(
                                  (rc) => rc.questionNumber === attempt.questionNumber || !rc.isResolved
                                );
                                if (matchingCase) handleOpenResolveModal(matchingCase);
                              }}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold transition-colors flex-shrink-0 shadow-xs"
                            >
                              Resolve Ambiguity
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column (5 cols): Lightweight Page Map UI & Provenance */}
              <div className="lg:col-span-5 space-y-5">
                {/* Clean Row-Based Page Map UI */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <GitMerge className="w-4 h-4 text-blue-600" />
                      Page-to-Question Sequence
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      {scriptData.pageCount} Pages Total
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 mb-4 leading-relaxed">
                    Visual row-based page mapping associating each document leaf with detected questions and continuation flow.
                  </p>

                  <div className="space-y-2">
                    {(recon?.pageToQuestionMap || []).map((pm) => {
                      const isReview = pm.state === "REQUIRES_REVIEW";
                      const isContinuation = pm.isContinuation;
                      const qLabel = pm.questionNumbers.join(", ") || "Unmapped";

                      return (
                        <div
                          key={pm.pageNumber}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                            isReview
                              ? "bg-amber-50/40 border-amber-200 text-amber-900"
                              : "bg-slate-50/70 border-slate-200 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold w-16 text-slate-700">
                              Page {pm.pageNumber}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {qLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isContinuation && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Continuation
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStateBadgeStyle(
                                pm.state
                              )}`}
                            >
                              {pm.state}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reconstruction Provenance & Engine Health */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                    Reconstruction Provenance
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block font-medium">Engine Mode</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        Hybrid Two-Stage
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block font-medium">Recon Version</span>
                      <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                        v{recon?.version || 1}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block font-medium">Primary AI</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        Gemini 1.5 Flash
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block font-medium">Fallback AI</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        Groq Vision (Healthy)
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block font-medium">Fallback Activated</span>
                      <span className="font-mono text-emerald-700 font-semibold mt-0.5 block">
                        {recon?.fallbackUsed ? "Yes (Transient 503)" : "No (Primary Active)"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block font-medium">Examiner Feed</span>
                      <span className="font-semibold text-blue-700 mt-0.5 block">
                        Compatible (Phase 10)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ambiguity Review Cases Section */}
            {reviewCases.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Ambiguity Review Queue ({reviewCases.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Human-in-the-loop audit verification
                  </span>
                </div>

                <div className="space-y-3">
                  {reviewCases.map((rc) => (
                    <div
                      key={rc.id}
                      className={`p-4 rounded-xl border text-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        rc.isResolved
                          ? "bg-slate-50 border-slate-200 opacity-75"
                          : "bg-amber-50/40 border-amber-200"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{rc.issue}</span>
                          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[11px]">
                            Pages: {rc.affectedPages.join(", ")}
                          </span>
                          {rc.isResolved ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                              Resolved by {rc.resolvedBy}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-[10px]">
                              Awaiting Resolution
                            </span>
                          )}
                        </div>

                        <p className="text-slate-600 leading-relaxed">{rc.reason}</p>

                        {rc.candidateQuestions && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">Candidates:</span>
                            {rc.candidateQuestions.map((cand, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-mono"
                              >
                                {cand}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {rc.isResolved ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-xs">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Resolved ({rc.resolvedQuestion})
                          </span>
                        ) : isAdminOrHead ? (
                          <button
                            type="button"
                            onClick={() => handleOpenResolveModal(rc)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-xs text-xs"
                          >
                            Resolve Ambiguity
                          </button>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">
                            Review requires Head Examiner
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------------- */}
        {/* TAB 2: PHASE 8 DOCUMENT PROCESSING & OCR                                   */}
        {/* -------------------------------------------------------------------------- */}
        {activeTab === "processing" && (
          <div className="space-y-6">
            {/* Processing Overview Banner / Controls */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Phase 8 Document Processing Status
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      Pipeline: ocr-v1
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      Provider: Google Cloud Vision API
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Canonical PDF preserved intact. Pages rendered and hierarchical OCR text, layout, and bounding boxes extracted.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {isAdminOrHead ? (
                    <>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleProcessAction(false)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-60"
                      >
                        <RotateCw
                          className={`w-3.5 h-3.5 text-slate-500 ${
                            isProcessing ? "animate-spin" : ""
                          }`}
                        />
                        Process Document
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleProcessAction(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-60"
                      >
                        <RotateCw
                          className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`}
                        />
                        Reprocess / Retry Document
                      </button>
                    </>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Examiner Mode: Read-Only Status
                    </div>
                  )}
                </div>
              </div>

              {/* In-Flight Processing Feedback Banner */}
              {isProcessing && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-blue-800 animate-pulse">
                  <RotateCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>{processingMessage}</span>
                </div>
              )}

              {/* Status KPI Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Document Processing
                  </span>
                  <span className="text-xl font-bold text-slate-900 mt-0.5 block font-mono">
                    {scriptData.documentStatus || "COMPLETED"}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {pages.length} Pages Extracted
                  </span>
                </div>

                <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    OCR Extracted
                  </span>
                  <span className="text-xl font-bold text-emerald-700 mt-0.5 block font-mono">
                    {completedCount} Pages
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    High Confidence Pass
                  </span>
                </div>

                <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Needs Review
                  </span>
                  <span className="text-xl font-bold text-amber-700 mt-0.5 block font-mono">
                    {reviewCount} Pages
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Confidence &lt; 0.70
                  </span>
                </div>

                <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Avg OCR Confidence
                  </span>
                  <span className="text-xl font-bold text-slate-900 mt-0.5 block font-mono">
                    {scriptData.averageOcrConfidence
                      ? `${(scriptData.averageOcrConfidence * 100).toFixed(1)}%`
                      : "83.5%"}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Google Cloud Vision
                  </span>
                </div>
              </div>
            </div>

            {/* Pages Gallery Header & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Extracted Pages Gallery ({pages.length})
                </h3>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                {(["ALL", "OCR_COMPLETE", "NEEDS_REVIEW", "FAILED"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setPageFilter(filter)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      pageFilter === filter
                        ? "bg-white text-slate-900 shadow-xs font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {filter === "ALL"
                      ? "All Pages"
                      : filter === "OCR_COMPLETE"
                      ? "Extracted"
                      : filter === "NEEDS_REVIEW"
                      ? "Review"
                      : "Failed"}
                  </button>
                ))}
              </div>
            </div>

            {/* Pages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {filteredPages.map((page) => {
                const latestOcr = page.ocrResults?.[0];
                return (
                  <div
                    key={page.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col"
                  >
                    {/* Page Thumbnail Header */}
                    <div className="h-44 bg-slate-100 relative group overflow-hidden flex items-center justify-center border-b border-slate-100">
                      <div className="w-28 h-36 bg-white shadow-md border border-slate-200 rounded p-2 flex flex-col justify-between select-none">
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                          <span>p.{page.pageNumber}</span>
                          <span>ANKLYZE</span>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 bg-slate-200 rounded w-full"></div>
                          <div className="h-1 bg-slate-200 rounded w-4/5"></div>
                          <div className="h-1 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-1 bg-blue-200 rounded w-2/3"></div>
                        </div>
                        <div className="text-[8px] text-slate-400 font-mono text-center">
                          {page.width}x{page.height}
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPage(page);
                            setInspectorView("text");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-semibold hover:bg-slate-50 transition-colors shadow flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          Inspect OCR
                        </button>
                      </div>

                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                          Page {page.pageNumber}
                        </span>
                      </div>

                      <div className="absolute top-2 right-2">
                        {page.processingStatus === "OCR_COMPLETE" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            OCR Done
                          </span>
                        )}
                        {page.processingStatus === "NEEDS_REVIEW" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Low Conf
                          </span>
                        )}
                        {page.processingStatus === "FAILED" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            Failed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata & OCR Preview */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-500">Quality Signal:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {(page.qualityScore * 100).toFixed(0)}%
                          </span>
                        </div>

                        {latestOcr ? (
                          <p className="text-[11px] font-mono text-slate-600 line-clamp-3 bg-slate-50 p-2 rounded border border-slate-100">
                            {latestOcr.fullText}
                          </p>
                        ) : (
                          <p className="text-[11px] text-rose-600 italic bg-rose-50 p-2 rounded border border-rose-100">
                            {page.errorMessage || "OCR extraction pending"}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-mono text-[11px] text-slate-500">
                          {latestOcr?.confidence
                            ? `Conf: ${(latestOcr.confidence * 100).toFixed(1)}%`
                            : "No OCR data"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPage(page);
                            setInspectorView("boxes");
                          }}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1"
                        >
                          Blocks ({latestOcr?.blocks?.length || 0})
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------- */}
        {/* TAB 3: PHASE 7 INTAKE & STORAGE                                           */}
        {/* -------------------------------------------------------------------------- */}
        {activeTab === "intake" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <p className="font-bold">Anonymized Sheet Identity</p>
                  <p className="mt-0.5 text-blue-800 leading-relaxed">
                    Student personally identifiable information (PII) is isolated from this record. Examiners
                    interact strictly via the system-generated identifier{" "}
                    <span className="font-mono font-bold">{scriptData.scriptCode}</span> to ensure
                    uncompromised evaluation integrity.
                  </p>
                </div>
              </div>

              {/* Attributes Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                  Sheet Attributes & Verification
                </h2>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block font-medium">Anonymized Sheet ID</span>
                    <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                      {scriptData.scriptCode}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block font-medium">Intake Batch Code</span>
                    <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                      {scriptData.batchCode}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block font-medium">Verified Page Count</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {scriptData.pageCount} Pages
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block font-medium">File Size</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {(scriptData.fileSize / 1024).toFixed(1)} KB (
                      {scriptData.fileSize.toLocaleString()} bytes)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block font-medium">MIME Type</span>
                    <span className="font-mono text-slate-900 mt-0.5 block">
                      {scriptData.mimeType}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block font-medium">Barcode / QR Identifier</span>
                    <span className="font-mono text-slate-900 mt-0.5 block">
                      {scriptData.barcodeValue || "BC-8839210-01"}
                    </span>
                  </div>
                </div>

                {/* Checksum */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      SHA-256 Document Integrity Checksum
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyChecksum}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      {copiedChecksum ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 break-all select-all">
                    {scriptData.checksum}
                  </div>
                </div>
              </div>
            </div>

            {/* Cloudinary Storage Details */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  Cloud Storage Architecture
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 block font-medium">Storage Engine</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      Cloudinary Document Vault
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block font-medium">Asset Identifier</span>
                    <div className="font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-200 text-slate-700 break-all mt-0.5 select-all">
                      {scriptData.storageAssetId}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block font-medium">Access Control</span>
                    <span className="text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Authenticated & Encrypted
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* -------------------------------------------------------------------------- */}
      {/* PHASE 9 AMBIGUITY RESOLUTION MODAL                                         */}
      {/* -------------------------------------------------------------------------- */}
      {resolvingCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold tracking-tight">
                  Resolve Question Reconstruction Ambiguity
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingCase(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <span className="font-bold block">{resolvingCase.issue}</span>
                <p className="text-[11px] text-amber-800">{resolvingCase.reason}</p>
                <div className="pt-1 flex items-center gap-2 text-[11px]">
                  <span>Affected Pages: <strong>{resolvingCase.affectedPages.join(", ")}</strong></span>
                  <span>•</span>
                  <span>Confidence: <strong>{(resolvingCase.confidence * 100).toFixed(0)}%</strong></span>
                </div>
              </div>

              {/* Candidate Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Select Target Exam Question
                </label>
                <select
                  value={resolutionCandidate}
                  onChange={(e) => setResolutionCandidate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Q05 - One-Dimensional Heat Conduction PDE">
                    Q05 — One-Dimensional Heat Conduction PDE (10 Marks)
                  </option>
                  <option value="5(a) - Complex Analytic Functions & Harmonic Conjugate">
                    5(a) — Complex Analytic Functions & Harmonic Conjugate (5 Marks)
                  </option>
                  <option value="Q04 - Fourier Transform Properties">
                    Q04 — Fourier Transform Properties (10 Marks)
                  </option>
                </select>
              </div>

              {/* State Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Designated Attempt State
                </label>
                <select
                  value={resolutionState}
                  onChange={(e) => setResolutionState(e.target.value as MockQuestionAttemptState)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ACTIVE">ACTIVE (Valid non-cancelled attempt)</option>
                  <option value="CONTINUATION">CONTINUATION (Follows previous response)</option>
                  <option value="CANCELLED">CANCELLED (Explicitly struck through)</option>
                  <option value="BLANK">BLANK (Skipped question)</option>
                  <option value="DUPLICATE_ATTEMPT">DUPLICATE_ATTEMPT (Secondary attempt)</option>
                  <option value="UNREADABLE">UNREADABLE (Visual degradation)</option>
                </select>
              </div>

              {/* Human Rationale Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Examiner Resolution Notes & Provenance
                </label>
                <textarea
                  rows={3}
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  placeholder="State the visual or mathematical rationale for confirming this mapping..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Action will be audited as <strong className="text-slate-700">RECONSTRUCTION_RESOLVED</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingCase(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolution}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-xs"
                >
                  Confirm & Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* PHASE 8 OCR INSPECTOR MODAL                                                */}
      {/* -------------------------------------------------------------------------- */}
      {selectedPage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {selectedPage.pageNumber}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Page {selectedPage.pageNumber} OCR Inspector
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Quality Signal: {(selectedPage.qualityScore * 100).toFixed(0)}% • Dims:{" "}
                    {selectedPage.width}x{selectedPage.height}px
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-slate-200/80 p-1 rounded-lg flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setInspectorView("text")}
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      inspectorView === "text"
                        ? "bg-white text-slate-900 font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Extracted Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorView("boxes")}
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      inspectorView === "boxes"
                        ? "bg-white text-slate-900 font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Blocks & Coordinates
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorView("raw")}
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      inspectorView === "raw"
                        ? "bg-white text-slate-900 font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    JSON Raw
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {inspectorView === "text" && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedPage.ocrResults?.[0]?.fullText || "No OCR text extracted"}
                </div>
              )}

              {inspectorView === "boxes" && (
                <div className="space-y-3">
                  {(selectedPage.ocrResults?.[0]?.blocks || []).map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 font-mono">
                          Block #{idx + 1} ({b.blockType})
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-500">
                            Confidence:{" "}
                            <strong className="text-emerald-700">
                              {(b.confidence * 100).toFixed(1)}%
                            </strong>
                          </span>
                          {b.boundingBox && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] border border-blue-200">
                              x:{b.boundingBox.x} y:{b.boundingBox.y} w:{b.boundingBox.width} h:
                              {b.boundingBox.height}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-mono text-slate-700 text-xs bg-white p-2.5 rounded border border-slate-200">
                        {b.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {inspectorView === "raw" && (
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px]">
                  {JSON.stringify(selectedPage.ocrResults?.[0] || {}, null, 2)}
                </pre>
              )}
            </div>

            {/* Modal Footer Provenance */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  Provider: <strong className="text-slate-800">Google Cloud Vision</strong>
                </span>
                <span>•</span>
                <span>
                  Feature: <strong className="text-slate-800">DOCUMENT_TEXT_DETECTION</strong>
                </span>
                <span>•</span>
                <span>
                  Confidence:{" "}
                  <strong className="text-emerald-700">
                    {selectedPage.ocrResults?.[0]?.confidence
                      ? `${(selectedPage.ocrResults[0].confidence * 100).toFixed(1)}%`
                      : "N/A"}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPage(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
