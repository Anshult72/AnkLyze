"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, CheckCircle2, AlertTriangle, ShieldAlert, Clock, RefreshCw } from "lucide-react";
import { fetchApi } from "@/utils/apiClient";
import styles from "@/app/examiner/ExaminerPages.module.css";

export type IndependentEvaluationStatus =
  | "ASSIGNED"
  | "IN PROGRESS"
  | "COMPARISON READY"
  | "AGREED"
  | "SENT TO MODERATION";

export interface IndependentEvaluationTask {
  id: string;
  scriptId: string;
  questionNumber: string;
  maxMarks: number;
  status: IndependentEvaluationStatus;
  priority: "High" | "Standard";
  assignedAt: string;
  reason: string;
  round1Marks?: number;
  round2Marks?: number;
  markDelta?: number;
  moderationCaseId?: string;
  disagreeReason?: string;
}

const getSheetCode = (reference: string) =>
  reference.replace(/^(?:SCRIPT|SHEET)\s+/i, "").trim();

interface AttentionListProps {
  initialTasks?: IndependentEvaluationTask[];
}

export default function AttentionList({ initialTasks }: AttentionListProps) {
  const [tasks, setTasks] = useState<IndependentEvaluationTask[]>(initialTasks || []);
  const [loading, setLoading] = useState<boolean>(!initialTasks);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<any[]>("/examiner/my-independent-evaluations");
      if (res.success && Array.isArray(res.data)) {
        const mapped: IndependentEvaluationTask[] = res.data.map((item: any) => {
          let status: IndependentEvaluationStatus = "ASSIGNED";
          if (item.doubleEvaluationState === "DOUBLE_EVALUATION_AGREEMENT") {
            status = "AGREED";
          } else if (item.doubleEvaluationState === "DOUBLE_EVALUATION_DISAGREEMENT") {
            status = "SENT TO MODERATION";
          } else if (item.status === "COMPLETED" || item.doubleEvaluationState === "SECOND_EVALUATION_COMPLETED") {
            status = "COMPARISON READY";
          } else if (item.status === "IN_PROGRESS") {
            status = "IN PROGRESS";
          } else {
            status = "ASSIGNED";
          }

          const dateStr = item.assignedAt
            ? new Date(item.assignedAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Recently";

          return {
            id: item.id,
            scriptId: item.scriptId || "UNKNOWN",
            questionNumber: item.questionNumber || "Q01",
            maxMarks: item.maxMarks || 10,
            status,
            priority: item.maxMarks >= 8 || item.reason?.includes("variance") ? "High" : "Standard",
            assignedAt: dateStr,
            reason: item.reason || "Second evaluation required under adaptive double-evaluation policy",
            round1Marks: item.comparison?.round1Marks,
            round2Marks: item.comparison?.round2Marks,
            markDelta: item.comparison?.difference,
          };
        });
        setTasks(mapped);
      } else {
        setTasks([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load review queue tasks from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialTasks) {
      loadTasks();
    }
  }, [initialTasks]);

  const openTasks = tasks.filter(
    (t) => t.status === "ASSIGNED" || t.status === "IN PROGRESS" || t.status === "COMPARISON READY"
  );
  const highPriorityCount = openTasks.filter((t) => t.priority === "High").length;
  const standardPriorityCount = openTasks.length - highPriorityCount;

  const getStatusBadge = (status: IndependentEvaluationStatus) => {
    switch (status) {
      case "ASSIGNED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Assigned
          </span>
        );
      case "IN PROGRESS":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-[#1f565e] border border-[#b9d7d0]">
            In Progress
          </span>
        );
      case "COMPARISON READY":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Comparison Ready
          </span>
        );
      case "AGREED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Agreed · Resolved
          </span>
        );
      case "SENT TO MODERATION":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            Sent to Moderation
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getActionLink = (task: IndependentEvaluationTask) => {
    const cleanId = getSheetCode(task.scriptId);
    const href = `/examiner/evaluate/${cleanId}?round=2&question=${task.questionNumber}`;

    switch (task.status) {
      case "ASSIGNED":
        return (
          <Link
            href={href}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#062834] text-white hover:bg-[#1a4452] transition-colors shadow-2xs"
            aria-label={`Open & Evaluate ${task.questionNumber} for ${task.scriptId}`}
          >
            <span>Open &amp; Evaluate</span>
            <ChevronRight className="w-3.5 h-3.5 text-teal-300" />
          </Link>
        );
      case "IN PROGRESS":
        return (
          <Link
            href={href}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#326c74] text-[#062834] hover:bg-teal-50 transition-colors shadow-2xs"
            aria-label={`Resume Evaluation of ${task.questionNumber} for ${task.scriptId}`}
          >
            <span>Resume Evaluation</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#326c74]" />
          </Link>
        );
      case "COMPARISON READY":
        return (
          <Link
            href={href}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-2xs"
            aria-label={`Review Comparison for ${task.questionNumber} on ${task.scriptId}`}
          >
            <span>Review Comparison</span>
            <ChevronRight className="w-3.5 h-3.5 text-white" />
          </Link>
        );
      case "AGREED":
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Case Confirmed</span>
          </span>
        );
      case "SENT TO MODERATION":
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            <span>In Moderation</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.dataPanel} bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden`}>
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 id="review-queue-heading" className="font-serif text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Independent evaluations
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
              {openTasks.length} open
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate the assigned questions independently. Prior marks and examiner identities remain blind until submission.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
            {highPriorityCount} high priority
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {standardPriorityCount} standard
          </span>
          <button
            onClick={() => loadTasks()}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh review queue"
            aria-label="Refresh review queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>
      </div>

      <div className={styles.reviewOverview} aria-label="Review priority summary">
        <div>
          <strong>{highPriorityCount}</strong>
          <span>High priority · inspect first</span>
        </div>
        <div>
          <strong>{standardPriorityCount}</strong>
          <span>Standard priority assignments</span>
        </div>
      </div>

      {/* Task List */}
      <div className={styles.reviewGrid}>
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
            <p className="font-semibold text-slate-700">Loading independent evaluations...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 space-y-2">
            <AlertTriangle className="w-6 h-6 mx-auto text-rose-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={() => loadTasks()}
              className="mt-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium text-xs"
            >
              Retry
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-900 text-sm">No independent evaluations waiting</p>
            <p className="text-slate-400">All assigned second evaluations are completed.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const isHigh = task.priority === "High";

            return (
              <article
                key={task.id}
                className={styles.reviewItem}
                aria-label={`Independent evaluation task for ${task.scriptId} ${task.questionNumber}`}
              >
                {/* Left Severity Indicator Strip */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isHigh ? "bg-rose-500" : "bg-[#326c74]"
                  }`}
                  aria-hidden="true"
                />

                <div className={`${styles.reviewItemBody} space-y-1.5`}>
                  {/* Identifiers & Badges */}
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-xs font-mono font-bold bg-[#062834] text-white px-2 py-0.5 rounded-md">
                      {task.scriptId}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-800">
                      {task.questionNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                      Independent Evaluation
                    </span>
                    {getStatusBadge(task.status)}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isHigh
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {task.priority} priority
                    </span>
                  </div>

                  {/* Title / Status Reason */}
                  <div className="text-sm font-semibold text-slate-900 pt-0.5">
                    Second evaluation required
                  </div>

                  {/* Context note (Never leaks Round 1 values) */}
                  <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                    {task.reason}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
                    <span className="font-semibold text-slate-700">
                      {task.maxMarks} maximum marks
                    </span>
                    <span className="inline-flex items-center space-x-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Assigned {task.assignedAt}</span>
                    </span>
                  </div>
                </div>

                {/* Action Buttons: ZERO HIDE BUTTON */}
                <div className={styles.reviewActions}>
                  {getActionLink(task)}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Footer Meta */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span>Assignment Scope: <strong className="font-mono text-slate-800">Single QuestionAttempt (Blind)</strong></span>
        <span>{openTasks.length} active second evaluations</span>
      </div>
    </div>
  );
}
