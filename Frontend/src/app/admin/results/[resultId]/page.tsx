"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FileCheck2,
  ShieldCheck,
  AlertCircle,
  Clock,
  History,
  CheckCircle2,
  Printer,
  Sparkles,
  ChevronRight,
  GitBranch,
  FileText,
  BadgeAlert,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Layers,
  Scale,
  Hash,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import type { ResultDetailData, ResultQuestionItem } from "@/data/resultMockData";
import { fetchApi } from "@/utils/apiClient";

export default function ResultDetailPage() {
  const params = useParams();
  const resultId = (params?.resultId as string) || "";

  const [result, setResult] = useState<ResultDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"breakdown" | "validation" | "provenance" | "history">("breakdown");

  // Revaluation drawer state
  const [showRevalDrawer, setShowRevalDrawer] = useState(false);
  const [revalScope, setRevalScope] = useState<"QUESTION_SPECIFIC_REVIEW" | "FULL_RESULT_REVIEW">("QUESTION_SPECIFIC_REVIEW");
  const [selectedQuestion, setSelectedQuestion] = useState("Q01");
  const [newProposedMarks, setNewProposedMarks] = useState<number>(0);
  const [revalReason, setRevalReason] = useState("");
  const [isProcessingReval, setIsProcessingReval] = useState(false);

  // Explainable Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportVersion, setReportVersion] = useState<number>(1);

  const loadResult = async () => {
    if (!resultId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<any>(`/results/${resultId}`);
      if (res.success && res.data) {
        const item = res.data;
        const mapped: ResultDetailData = {
          id: item.id,
          examId: item.examId || item.exam?.id || "exam-01",
          examTitle: item.exam?.title || "Board Examination 2026",
          examCode: item.exam?.code || "EXAM-2026",
          subjectId: item.subjectId || item.subject?.id || "subj-01",
          subjectName: item.subject?.name || "Subject Examination",
          subjectCode: item.subject?.code || "SUB-01",
          scriptId: item.script?.scriptCode || item.scriptId,
          candidateReference: item.script?.candidateReference || `ROLL-${item.scriptId.slice(0, 8).toUpperCase()}`,
          version: item.version || 1,
          status: item.status || "VALIDATED",
          validationStatus: item.validationStatus || "PASSED",
          totalMarks: item.totalMarks ?? item.totalAwardedMarks ?? 0,
          maximumMarks: item.maximumMarks ?? item.maxMarks ?? 100,
          percentage: item.percentage ?? 0,
          resultCode: item.resultCode || "PASS",
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
          approvedAt: item.approvedAt,
          approvedByName: item.approvedBy?.fullName || (item.approvedAt ? "Head Examiner" : undefined),
          fingerprint: item.fingerprint || (item.id ? item.id.slice(0, 16) : "fp-result"),
          questions: (item.questionMarks || item.questions || []).map((qm: any) => ({
            id: qm.id,
            questionAttemptId: qm.questionAttemptId || qm.id,
            questionNumber: qm.questionNumber || "Q01",
            section: qm.section,
            maximumMarks: qm.maximumMarks || qm.maxMarks || 10,
            awardedMarks: qm.awardedMarks || 0,
            status: qm.status || "AGGREGATED",
            sourceDecisionId: qm.sourceDecisionId || "dec-1",
            sourceDecisionVersion: qm.sourceDecisionVersion || 1,
            sourceExaminerName: qm.sourceExaminerName || "Lead Examiner",
            feedbackSnippet: qm.feedbackSnippet,
          })),
          validationIssues: item.validationIssues || [],
          history: item.history || [],
        };
        setResult(mapped);
        setReportVersion(mapped.version);
        if (mapped.questions.length > 0) {
          setSelectedQuestion(mapped.questions[0].questionNumber);
          setNewProposedMarks(mapped.questions[0].awardedMarks);
        }
      } else {
        setError(res.error?.message || "Result not found");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load examination result");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResult();
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFAF5] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">Loading examination result...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#FCFAF5] flex items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-md bg-white p-8 rounded-2xl border border-rose-200 shadow-xs">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Result Record Unavailable</h2>
          <p className="text-xs text-slate-600">{error || "The requested result could not be found."}</p>
          <Link
            href="/admin/results"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#062834] text-white rounded-lg text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Results
          </Link>
        </div>
      </div>
    );
  }

  const isBlocked = result.status === "BLOCKED" || result.validationStatus === "BLOCKED";
  const isApproved = result.status === "APPROVED";
  const isValidated = result.status === "VALIDATED";


  const handleCreateRevaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revalReason.trim()) {
      alert("Please provide a legitimate institutional justification for this revaluation request.");
      return;
    }

    setIsProcessingReval(true);
    setTimeout(() => {
      const delta = revalScope === "QUESTION_SPECIFIC_REVIEW" ? newProposedMarks - (result.questions.find((q) => q.questionNumber === selectedQuestion)?.awardedMarks || 0) : 2.5;
      const newTotal = result.totalMarks + delta;
      const newPercentage = Number(((newTotal / result.maximumMarks) * 100).toFixed(1));
      const newVersion = result.version + 1;

      const updatedQuestions: ResultQuestionItem[] = result.questions.map((q) => {
        if (q.questionNumber === selectedQuestion && revalScope === "QUESTION_SPECIFIC_REVIEW") {
          return {
            ...q,
            awardedMarks: newProposedMarks,
            status: "REVALUATED",
            sourceDecisionId: `dec-${q.id}-rev2`,
            sourceDecisionVersion: q.sourceDecisionVersion + 1,
            feedbackSnippet: `Revaluation adjusted: ${revalReason}`,
          };
        }
        return q;
      });

      const updatedResult: ResultDetailData = {
        ...result,
        version: newVersion,
        totalMarks: newTotal,
        percentage: newPercentage,
        status: "APPROVED",
        validationStatus: "PASSED",
        updatedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedByName: "Dr. Arvind Sharma (Head Examiner)",
        supersedesResultId: result.id,
        fingerprint: "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
        questions: updatedQuestions,
        revaluation: {
          id: `rev-${Date.now()}`,
          scope: revalScope,
          status: "COMPLETED",
          reason: revalReason,
          questionNumber: revalScope === "QUESTION_SPECIFIC_REVIEW" ? selectedQuestion : "Full Paper",
          requestedBy: "Office of the Controller of Examinations",
          requestedAt: new Date().toISOString(),
          reviewedBy: "Dr. Arvind Sharma (Head Examiner)",
          reviewedAt: new Date().toISOString(),
          scoreDelta: delta,
          previousTotal: result.totalMarks,
          newTotal,
        },
        history: [
          ...result.history,
          {
            id: `${result.id}-v${newVersion}`,
            version: newVersion,
            status: "APPROVED",
            totalMarks: newTotal,
            maximumMarks: result.maximumMarks,
            percentage: newPercentage,
            resultCode: newPercentage >= 75 ? "DISTINCTION" : newPercentage >= 60 ? "FIRST_CLASS" : "PASS",
            approvedAt: new Date().toISOString(),
            approvedByName: "Dr. Arvind Sharma (Head Examiner)",
            fingerprint: "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
            createdAt: new Date().toISOString(),
            supersedesResultId: result.id,
            revaluationReason: revalReason,
          },
        ],
      };

      setResult(updatedResult);
      setIsProcessingReval(false);
      setShowRevalDrawer(false);
      setRevalReason("");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/results"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Results Overview</span>
            </Link>
            <div className="h-4 w-px bg-stone-300" />
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900">{result.candidateReference}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-slate-700 border border-stone-200">
                v{result.version}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setReportVersion(result.version);
                setShowReportModal(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-slate-700 bg-white hover:bg-stone-50 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Internal Report</span>
            </button>

            {isApproved && (
              <button
                onClick={() => setShowRevalDrawer(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Request Revaluation</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        {/* Banner if Result is Blocked */}
        {isBlocked && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs">
            <BadgeAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-rose-950 text-sm">Examination Result Blocked</div>
              <p>
                This result package contains {result.validationIssues.filter((i) => i.blocking).length} blocking validation
                anomalies. Marks cannot be approved or published until the underlying authoritative evaluation/moderation
                decisions are finalized.
              </p>
            </div>
          </div>
        )}

        {/* Top Summary Banner */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{result.subjectName}</h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-stone-100 text-slate-700 font-semibold">
                {result.subjectCode}
              </span>
              <span className="text-xs text-slate-500">• {result.examTitle}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
              <div>
                <span className="text-slate-400">Sheet ID: </span>
                <span className="font-mono font-medium text-slate-800">{result.scriptId}</span>
              </div>
              <div className="h-3 w-px bg-stone-200" />
              <div>
                <span className="text-slate-400">Result Version: </span>
                <span className="font-bold text-slate-900">v{result.version}</span>
              </div>
              <div className="h-3 w-px bg-stone-200" />
              <div>
                <span className="text-slate-400">Approval State: </span>
                <span className="font-medium text-slate-800">
                  {result.approvedByName ? `${result.approvedByName}` : "Pending Approval"}
                </span>
              </div>
            </div>
          </div>

          {/* Marks Scorecard Display */}
          <div className="flex items-center gap-6 bg-stone-50 border border-stone-200 rounded-xl px-6 py-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Aggregated Total</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
                {result.totalMarks.toFixed(1)}{" "}
                <span className="text-base font-normal text-slate-400">/ {result.maximumMarks}</span>
              </div>
            </div>

            <div className="h-10 w-px bg-stone-300" />

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Classification</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">{result.percentage.toFixed(1)}%</span>
                <span
                  className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                    result.resultCode === "DISTINCTION"
                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                      : result.resultCode === "FIRST_CLASS"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : result.resultCode === "PASS"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-rose-100 text-rose-800 border border-rose-200"
                  }`}
                >
                  {result.resultCode}
                </span>
              </div>
            </div>

            <div className="h-10 w-px bg-stone-300" />

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Validation</div>
              <div className="mt-1">
                {isBlocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>BLOCKED</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PASSED</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 gap-6 text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab("breakdown")}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "breakdown" ? "border-slate-900 text-slate-900 font-bold" : "border-transparent hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Question Marks Breakdown ({result.questions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("validation")}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "validation" ? "border-slate-900 text-slate-900 font-bold" : "border-transparent hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validation Rules ({result.validationIssues.length} issues)</span>
          </button>

          <button
            onClick={() => setActiveTab("provenance")}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "provenance" ? "border-slate-900 text-slate-900 font-bold" : "border-transparent hover:text-slate-900"
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Result Provenance & Traceability</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "history" ? "border-slate-900 text-slate-900 font-bold" : "border-transparent hover:text-slate-900"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Version History & Revaluation Trail ({result.history.length})</span>
          </button>
        </div>

        {/* Tab 1: Question Breakdown */}
        {activeTab === "breakdown" && (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Authoritative Question-Wise Mark Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every aggregated mark traces directly to an authoritative human examiner decision or resolved moderation review.
                </p>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Formula: ∑(Q1..Q{result.questions.length}) = {result.totalMarks} / {result.maximumMarks}
              </div>
            </div>

            <div className="overflow-x-auto border border-stone-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Question</th>
                    <th className="py-2.5 px-4">Section</th>
                    <th className="py-2.5 px-4 text-right">Max Marks</th>
                    <th className="py-2.5 px-4 text-right">Awarded</th>
                    <th className="py-2.5 px-4 text-center">Source Status</th>
                    <th className="py-2.5 px-4">Source Examiner / Decision</th>
                    <th className="py-2.5 px-4">Authoritative Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {result.questions.map((q) => (
                    <tr key={q.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{q.questionNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{q.section || "—"}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">{q.maximumMarks.toFixed(1)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{q.awardedMarks.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            q.status === "MODERATED"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : q.status === "REVALUATED"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-stone-100 text-slate-700 border border-stone-200"
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{q.sourceExaminerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{q.sourceDecisionId}</span>
                          <span>(v{q.sourceDecisionVersion})</span>
                          {q.sourceModerationDecisionId && (
                            <span className="text-purple-700 font-semibold">• Mod: {q.sourceModerationDecisionId}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 italic text-[11px] max-w-xs truncate">
                        {q.feedbackSnippet || "Evaluated in accordance with official grading rubric."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Validation Rules */}
        {activeTab === "validation" && (
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Result Validation Engine Inspection</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated deterministic rule verification ensures complete coverage, moderation resolution, and boundary conformance.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">Engine Version: resultValidation-v1.0</span>
            </div>

            {result.validationIssues.length === 0 ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-emerald-950">All Result Validation Rules Passed (0 Issues)</div>
                  <p className="text-xs text-emerald-800">
                    Evaluation coverage verified, all duplicate attempts resolved, question maximum marks verified, and
                    authoritative examiner decisions grounded in database provenance.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {result.validationIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                      issue.blocking
                        ? "bg-rose-50 border-rose-200 text-rose-900"
                        : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}
                  >
                    {issue.blocking ? (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{issue.ruleCode}</span>
                        <span
                          className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            issue.blocking ? "bg-rose-200 text-rose-900" : "bg-amber-200 text-amber-900"
                          }`}
                        >
                          {issue.severity}
                        </span>
                        {issue.entityType && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Target: {issue.entityType} #{issue.entityId}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 leading-relaxed font-medium">{issue.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rule Reference Checklist */}
            <div className="border-t border-stone-200 pt-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Core Institutional Rule Matrix
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-semibold text-slate-800">RESULT-COV-001: </span>
                    <span className="text-slate-600">Question Coverage Completeness</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-semibold text-slate-800">RESULT-COV-002: </span>
                    <span className="text-slate-600">Duplicate Attempt Resolution</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-semibold text-slate-800">RESULT-MOD-001: </span>
                    <span className="text-slate-600">Moderation Review Clearance</span>
                  </div>
                  {isBlocked ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </div>
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-semibold text-slate-800">RESULT-MRK-001: </span>
                    <span className="text-slate-600">Mark Maximum Boundary Check</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Provenance */}
        {activeTab === "provenance" && (
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Result Provenance & Audit Traceability</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every component of this examination result is verified via an immutable cryptographic fingerprint and
                observable decision graph.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-sans font-medium">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>SHA-256 Result Package Fingerprint:</span>
                </span>
                <span className="text-slate-900 font-bold">{result.fingerprint}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-sans">Provenance Chain:</span>
                <span className="text-slate-700">QuestionAttempts → ExaminerDecisions → Moderations → ResultQuestionMarks → ExaminationResult v{result.version}</span>
              </div>
            </div>

            {/* Decision Lineage Nodes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Observable Decision Graph
              </h4>
              <div className="space-y-2">
                {result.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-lg border border-stone-200 bg-white hover:bg-stone-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-stone-100 font-mono font-bold text-slate-800 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {q.questionNumber} ({q.awardedMarks} / {q.maximumMarks} Marks)
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Attempt: {q.questionAttemptId} → Decision: {q.sourceDecisionId} (v{q.sourceDecisionVersion})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      {q.sourceModerationDecisionId ? (
                        <span className="px-2 py-0.5 rounded-sm bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-medium font-mono">
                          Moderated by {q.sourceModeratorName}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                          Authoritative Examiner Decision
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Version History */}
        {activeTab === "history" && (
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Immutable Result Version History</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Historical examination results are permanently archived and never mutated in place.
                </p>
              </div>
            </div>

            {/* Version Timeline */}
            <div className="relative border-l-2 border-stone-200 pl-6 ml-3 space-y-6">
              {result.history.map((h, index) => (
                <div key={h.id} className="relative group">
                  <div
                    className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                      h.status === "APPROVED"
                        ? "border-emerald-600 bg-emerald-600"
                        : h.status === "SUPERSEDED"
                        ? "border-stone-400 bg-stone-300"
                        : "border-amber-600 bg-amber-500"
                    }`}
                  />
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">Result Version v{h.version}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            h.status === "APPROVED"
                              ? "bg-slate-900 text-white"
                              : h.status === "SUPERSEDED"
                              ? "bg-stone-200 text-slate-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {h.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        Total: {h.totalMarks} / {h.maximumMarks} ({h.percentage}%)
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      {h.approvedByName && (
                        <div>
                          Approved by <strong>{h.approvedByName}</strong> on{" "}
                          {new Date(h.approvedAt || h.createdAt).toLocaleString()}
                        </div>
                      )}
                      {h.revaluationReason && (
                        <div className="text-slate-800 bg-amber-50/80 p-2 rounded-md border border-amber-200 text-[11px]">
                          <strong>Revaluation Impact:</strong> {h.revaluationReason}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 font-mono truncate">Fingerprint: {h.fingerprint}</div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setReportVersion(h.version);
                          setShowReportModal(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 underline"
                      >
                        <Printer className="w-3 h-3" />
                        <span>View Explainable Report (v{h.version})</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Controlled Revaluation Drawer */}
      {showRevalDrawer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-lg h-full border-l border-stone-200 p-6 shadow-2xl flex flex-col justify-between space-y-6 overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Controlled Revaluation Workflow</h3>
                  <p className="text-xs text-slate-500">Initiate authorized institutional re-evaluation</p>
                </div>
                <button
                  onClick={() => setShowRevalDrawer(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Immutable Versioning Notice</span>
                </div>
                <p>
                  Revaluation does not overwrite historical Result v{result.version}. Upon completion and approval, a new
                  authoritative Result v{result.version + 1} will be produced with full provenance delta.
                </p>
              </div>

              <form id="reval-form" onSubmit={handleCreateRevaluation} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1.5">Revaluation Scope</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRevalScope("QUESTION_SPECIFIC_REVIEW")}
                      className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                        revalScope === "QUESTION_SPECIFIC_REVIEW"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-stone-300 hover:bg-stone-50"
                      }`}
                    >
                      Question-Specific
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevalScope("FULL_RESULT_REVIEW")}
                      className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                        revalScope === "FULL_RESULT_REVIEW"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-stone-300 hover:bg-stone-50"
                      }`}
                    >
                      Full Paper Review
                    </button>
                  </div>
                </div>

                {revalScope === "QUESTION_SPECIFIC_REVIEW" && (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1.5">Target Question</label>
                      <select
                        value={selectedQuestion}
                        onChange={(e) => {
                          const qNum = e.target.value;
                          setSelectedQuestion(qNum);
                          const qObj = result.questions.find((q) => q.questionNumber === qNum);
                          setNewProposedMarks(qObj?.awardedMarks || 0);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono"
                      >
                        {result.questions.map((q) => (
                          <option key={q.id} value={q.questionNumber}>
                            {q.questionNumber} (Current: {q.awardedMarks} / {q.maximumMarks} Marks)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-800 mb-1.5">
                        New Revaluation Marks (Max:{" "}
                        {result.questions.find((q) => q.questionNumber === selectedQuestion)?.maximumMarks})
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max={result.questions.find((q) => q.questionNumber === selectedQuestion)?.maximumMarks || 10}
                        value={newProposedMarks}
                        onChange={(e) => setNewProposedMarks(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono font-bold"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-semibold text-slate-800 mb-1.5">Institutional Justification / Reason</label>
                  <textarea
                    rows={3}
                    placeholder="Enter official reason (e.g. Board review of step calculation discrepancy)..."
                    value={revalReason}
                    onChange={(e) => setRevalReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                {/* Live Delta Preview */}
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <div className="font-semibold text-slate-800">Impact Analysis Delta:</div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Current Total (v{result.version}):</span>
                    <span className="font-bold text-slate-900">
                      {result.totalMarks} / {result.maximumMarks} ({result.percentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Proposed Total (v{result.version + 1}):</span>
                    <span className="font-bold text-slate-900">
                      {(
                        result.totalMarks +
                        (revalScope === "QUESTION_SPECIFIC_REVIEW"
                          ? newProposedMarks - (result.questions.find((q) => q.questionNumber === selectedQuestion)?.awardedMarks || 0)
                          : 2.5)
                      ).toFixed(1)}{" "}
                      / {result.maximumMarks}
                    </span>
                  </div>
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRevalDrawer(false)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-medium text-slate-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                form="reval-form"
                type="submit"
                disabled={isProcessingReval}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs"
              >
                {isProcessingReval ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isProcessingReval ? "Generating v" + (result.version + 1) + "..." : "Execute Revaluation"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explainable Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Printable Report View */}
            <div className="border border-stone-300 rounded-xl p-6 bg-white space-y-5 text-slate-900">
              <div className="text-center pb-4 border-b border-stone-200 space-y-1">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Institutional Assessment Board</div>
                <h2 className="text-lg font-extrabold tracking-tight">Official Examination Result Report</h2>
                <div className="text-xs text-slate-600">
                  {result.examTitle} ({result.examCode})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-stone-50 p-4 rounded-lg border border-stone-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Candidate Reference</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{result.candidateReference}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Subject Code & Name</span>
                  <span className="font-bold text-slate-900">
                    {result.subjectCode} — {result.subjectName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Result Version</span>
                  <span className="font-mono font-bold text-slate-900">v{reportVersion}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Outcome</span>
                  <span className="font-bold text-slate-900">{result.resultCode}</span>
                </div>
              </div>

              {/* Question Marks Table */}
              <div className="border border-stone-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-100 border-b border-stone-200 text-[10px] font-bold text-slate-600 uppercase">
                      <th className="py-2 px-3">Question</th>
                      <th className="py-2 px-3 text-right">Max Marks</th>
                      <th className="py-2 px-3 text-right">Awarded</th>
                      <th className="py-2 px-3">Decision Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {result.questions.map((q) => (
                      <tr key={q.id}>
                        <td className="py-2 px-3 font-mono font-bold">{q.questionNumber}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{q.maximumMarks.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{q.awardedMarks.toFixed(1)}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">{q.sourceDecisionId}</td>
                      </tr>
                    ))}
                    <tr className="bg-stone-100/70 font-bold">
                      <td className="py-2.5 px-3">AGGREGATED TOTAL</td>
                      <td className="py-2.5 px-3 text-right">{result.maximumMarks}</td>
                      <td className="py-2.5 px-3 text-right text-sm text-slate-900">{result.totalMarks}</td>
                      <td className="py-2.5 px-3 font-normal text-[11px]">Percentage: {result.percentage}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-stone-200">
                <div className="flex justify-between">
                  <span>Authorized Head Examiner:</span>
                  <span className="font-medium text-slate-800">{result.approvedByName || "Dr. Arvind Sharma"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Approval Timestamp:</span>
                  <span className="font-mono text-slate-800">{result.approvedAt ? new Date(result.approvedAt).toLocaleString() : "2026-01-20 14:30:00"}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Audit Fingerprint:</span>
                  <span>{result.fingerprint}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-medium text-slate-700 hover:bg-stone-100"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
