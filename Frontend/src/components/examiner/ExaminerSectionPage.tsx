"use client";

import React, { useState, useEffect } from "react";
import TopNavigation from "./TopNavigation";
import EvaluationQueue from "./EvaluationQueue";
import AttentionList from "./AttentionList";
import ExaminerReportsView from "./ExaminerReportsView";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { fetchApi } from "@/utils/apiClient";
import type { EvaluationQueueScript, ScriptStatus, RiskLevel } from "@/data/examinerMockData";
import styles from "@/app/examiner/ExaminerPages.module.css";
import { RefreshCw, AlertTriangle } from "lucide-react";

const sections = {
  evaluations: { title: "My evaluations", description: "The sheets assigned to you. Pick up where you left off, or filter the queue to find one." },
  review: { title: "Review queue", description: "Independent evaluations assigned to you." },
  reports: { title: "Reports", description: "Batch evaluation records, marking distribution, question review density, and operational workload." },
};

export default function ExaminerSectionPage({ section }: { section: keyof typeof sections }) {
  const { title, description } = sections[section];

  const [scripts, setScripts] = useState<EvaluationQueueScript[]>([]);
  const [independentCount, setIndependentCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(section === "evaluations");
  const [error, setError] = useState<string | null>(null);
  const [subjectCode, setSubjectCode] = useState<string>("Active Session");

  const loadData = async () => {
    if (section !== "evaluations") return;
    setLoading(true);
    setError(null);
    try {
      const [scriptsRes, indepRes] = await Promise.all([
        fetchApi<any[]>("/scripts"),
        fetchApi<any[]>("/examiner/my-independent-evaluations").catch(() => ({ success: true, data: [] })),
      ]);

      if (scriptsRes.success && Array.isArray(scriptsRes.data)) {
        if (scriptsRes.data.length > 0 && scriptsRes.data[0]?.subject?.code) {
          setSubjectCode(scriptsRes.data[0].subject.code);
        }

        const mapped: EvaluationQueueScript[] = scriptsRes.data.map((item: any) => {
          let status: ScriptStatus = "AI Ready";
          if (item.status === "VALIDATED") {
            status = "AI Ready";
          } else if (item.status === "PROCESSING") {
            status = "In Progress";
          } else if (item.status === "REJECTED") {
            status = "Attention";
          } else if (item.reconstructionStatus === "FAILED") {
            status = "Needs Review";
          }

          const totalAns = item.totalQuestionsDetected || item.pageCount || 10;
          const evaluatedAns = item.status === "VALIDATED" ? 0 : 0;

          return {
            id: item.id,
            scriptId: item.scriptCode || `SCRIPT-${item.id.slice(0, 6)}`,
            totalAnswers: totalAns,
            detectedAnswers: totalAns,
            evaluatedAnswers: evaluatedAns,
            status,
            riskLevel: (item.status === "REJECTED" ? "High Risk" : "Low Risk") as RiskLevel,
            actionLabel: "Evaluate →",
            confidenceScore: 92,
            updatedAt: item.updatedAt
              ? new Date(item.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
              : "Recent",
            priorityNote: item.originalFilename ? `File: ${item.originalFilename}` : undefined,
          };
        });
        setScripts(mapped);
      } else {
        setScripts([]);
      }

      if (indepRes.success && Array.isArray(indepRes.data)) {
        setIndependentCount(indepRes.data.length);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load assigned sheets from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [section]);

  const readyToMarkCount = scripts.filter((s) => s.status === "AI Ready").length;
  const needsReviewCount = scripts.filter((s) => s.status === "Needs Review").length;
  const attentionCount = scripts.filter((s) => s.status === "Attention").length;
  const completedCount = scripts.filter((s) => s.status === "Completed").length;

  return (
    <ProtectedRoute allowedRoles={["EXAMINER", "HEAD_EXAMINER", "SUPER_ADMIN"]}>
      <div className={`workspace-shell ${styles.page}`}>
        <TopNavigation activeTab={section} />
        <main className={styles.main}>
          <header className={styles.sectionIntro}>
            <div>
              <p className={styles.eyebrow}>Examiner desk <span aria-hidden="true">/</span> {subjectCode}</p>
              <h1>{title}</h1>
              <p className={styles.introText}>{description}</p>
            </div>
            <span className={styles.sectionMeta}>Operational Evaluation Session</span>
          </header>
          <div className={styles.sectionContent}>
            {section === "evaluations" && (
              <>
                <div className={styles.queueOverview} aria-label="Assigned sheet status">
                  <div>
                    <span className={styles.overline}>Ready to mark</span>
                    <strong>{readyToMarkCount}</strong>
                    <p>AI suggestions ready for your decision</p>
                  </div>
                  <div>
                    <span className={styles.overline}>Independent</span>
                    <strong>{independentCount}</strong>
                    <p>Assigned Round 2 evaluation</p>
                  </div>
                  <div>
                    <span className={styles.overline}>Needs review</span>
                    <strong>{needsReviewCount}</strong>
                    <p>Check the question before finalizing</p>
                  </div>
                  <div>
                    <span className={styles.overline}>Attention</span>
                    <strong>{attentionCount}</strong>
                    <p>Resolve scan or confidence concerns</p>
                  </div>
                  <div>
                    <span className={styles.overline}>Completed</span>
                    <strong>{completedCount}</strong>
                    <p>Evaluated and signed in batch</p>
                  </div>
                </div>

                {loading ? (
                  <div className="p-16 text-center text-xs text-slate-500 space-y-3 bg-white border border-slate-200/90 rounded-2xl">
                    <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
                    <p className="font-semibold text-slate-700">Loading evaluation queue from server...</p>
                  </div>
                ) : error ? (
                  <div className="p-12 text-center text-xs text-rose-600 space-y-3 bg-white border border-rose-200 rounded-2xl">
                    <AlertTriangle className="w-6 h-6 mx-auto text-rose-500" />
                    <p className="font-semibold text-slate-800">{error}</p>
                    <button
                      onClick={loadData}
                      className="px-3.5 py-1.5 bg-[#062834] text-white hover:bg-[#1a4452] rounded-lg font-medium text-xs shadow-xs"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <EvaluationQueue scripts={scripts} />
                )}
              </>
            )}
            {section === "review" && <AttentionList />}
            {section === "reports" && <ExaminerReportsView />}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
