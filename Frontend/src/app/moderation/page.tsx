"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Filter, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TopNavigation from "@/components/examiner/TopNavigation";
import { fetchApi } from "@/utils/apiClient";
import styles from "./ModerationQueue.module.css";

interface ModerationCaseItem {
  id: string;
  caseNumber: string;
  status: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  subject: string;
  subjectCode: string;
  scriptId: string;
  questionNumber: string;
  triggerDetail: string;
  round1Marks: number;
  round2Marks: number;
  aiSuggestedMarks: number;
  maxMarks: number;
  overallRiskScore: number;
  riskBand: string;
  assignedModerator?: string;
  createdAt: string;
}

interface ModerationSummary {
  totalCases: number;
  openCases: number;
  inReviewCases: number;
  resolvedCases: number;
  escalatedCases: number;
  criticalBacklog: number;
  highBacklog: number;
  activeBacklog: number;
}

const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function ModerationQueuePage() {
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [cases, setCases] = useState<ModerationCaseItem[]>([]);
  const [summary, setSummary] = useState<ModerationSummary>({
    totalCases: 0,
    openCases: 0,
    inReviewCases: 0,
    resolvedCases: 0,
    escalatedCases: 0,
    criticalBacklog: 0,
    highBacklog: 0,
    activeBacklog: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, summaryRes] = await Promise.all([
        fetchApi<any>("/moderation/cases?limit=50"),
        fetchApi<ModerationSummary>("/moderation/summary"),
      ]);

      if (casesRes.success && casesRes.data) {
        const rawCases = Array.isArray(casesRes.data)
          ? casesRes.data
          : Array.isArray(casesRes.data.cases)
          ? casesRes.data.cases
          : [];

        const mapped: ModerationCaseItem[] = rawCases.map((item: any) => {
          const maxMarks = item.questionAttempt?.question?.maximumMarks || 10;
          const r1 = item.doubleEvaluationResult?.round1Marks ?? item.questionAttempt?.evaluations?.[0]?.examinerMarks ?? 0;
          const r2 = item.doubleEvaluationResult?.round2Marks ?? 0;
          const aiMarks = item.questionAttempt?.evaluations?.[0]?.suggestedMarks ?? 0;
          const riskScore = item.overallRiskScore ?? item.riskAssessment?.overallRiskScore ?? 0;

          return {
            id: item.id,
            caseNumber: item.caseNumber || `MOD-${item.id.slice(0, 6).toUpperCase()}`,
            status: item.status || "OPEN",
            priority: (item.priority as any) || "MEDIUM",
            subject: item.questionAttempt?.question?.subject?.name || "Examination Subject",
            subjectCode: item.questionAttempt?.question?.subject?.code || "SUB-01",
            scriptId: item.questionAttempt?.script?.scriptCode || item.questionAttempt?.scriptId || "UNKNOWN",
            questionNumber: item.questionAttempt?.question?.questionNumber || "Q01",
            triggerDetail: item.triggerReason ? item.triggerReason.replaceAll("_", " ") : "Double evaluation variance detected",
            round1Marks: r1,
            round2Marks: r2,
            aiSuggestedMarks: aiMarks,
            maxMarks,
            overallRiskScore: riskScore,
            riskBand: riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW",
            assignedModerator: item.assignedModerator?.fullName,
            createdAt: item.createdAt,
          };
        });

        setCases(mapped);
      } else {
        setCases([]);
      }

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load moderation cases from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = [
    { label: "Active backlog", value: summary.activeBacklog, note: "Awaiting action", tone: "neutral" },
    { label: "Critical", value: summary.criticalBacklog, note: "Review first", tone: "critical" },
    { label: "High priority", value: summary.highBacklog, note: "Needs closer review", tone: "high" },
    { label: "In review", value: summary.inReviewCases, note: "Assigned", tone: "neutral" },
    { label: "Resolved", value: summary.resolvedCases, note: "Decision recorded", tone: "resolved" },
  ] as const;

  const filteredCases = cases
    .filter(
      (item) =>
        (selectedPriority === "ALL" || item.priority === selectedPriority) &&
        (selectedStatus === "ALL" || item.status === selectedStatus)
    )
    .sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2) ||
        Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );

  return (
    <ProtectedRoute allowedRoles={["MODERATOR", "HEAD_EXAMINER", "SUPER_ADMIN"]}>
      <div className={`workspace-shell ${styles.page}`}>
        <TopNavigation activeTab="moderation" />
        <main className={styles.main}>
          <header className={styles.intro}>
            <div>
              <p className={styles.eyebrow}>
                Quality control <span aria-hidden="true">/</span> Senior review
              </p>
              <h1>Moderation queue</h1>
              <p className={styles.description}>
                Resolve disputed evaluations with the answer, evidence and both examiner decisions in view.
              </p>
            </div>
            <div className={styles.introActions}>
              <Link href="/admin/analytics">
                Quality analytics <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/examiner/dashboard">
                Examiner desk <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </header>

          <section className={styles.summary} aria-label="Moderation overview">
            {metrics.map((metric) => (
              <div
                className={`${styles.metric} ${
                  metric.tone === "critical"
                    ? styles.criticalMetric
                    : metric.tone === "high"
                    ? styles.highMetric
                    : metric.tone === "resolved"
                    ? styles.resolvedMetric
                    : ""
                }`}
                key={metric.label}
              >
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.note}</small>
              </div>
            ))}
          </section>

          <section className={styles.queue} aria-labelledby="moderation-queue-heading">
            <div className={styles.queueHeader}>
              <div>
                <p className={styles.eyebrow}>Decision work</p>
                <h2 id="moderation-queue-heading">
                  Cases requiring review <span>{filteredCases.length}</span>
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <p>Highest priority first, then oldest</p>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  title="Refresh cases"
                  aria-label="Refresh moderation cases"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
                </button>
              </div>
            </div>

            <div className={styles.filters}>
              <span className={styles.filterTitle}>
                <Filter size={16} aria-hidden="true" /> Filter cases
              </span>
              <div className={styles.filterControls}>
                <label>
                  Priority
                  <select
                    value={selectedPriority}
                    onChange={(event) => setSelectedPriority(event.target.value)}
                  >
                    <option value="ALL">All priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                  >
                    <option value="ALL">All statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_REVIEW">In review</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="ESCALATED">Escalated</option>
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center text-xs text-slate-500 space-y-3 bg-white border border-slate-200 rounded-xl">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
                <p className="font-semibold text-slate-700">Loading moderation cases from database...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-xs text-rose-600 space-y-3 bg-white border border-rose-200 rounded-xl">
                <AlertTriangle className="w-6 h-6 mx-auto text-rose-500" />
                <p className="font-semibold text-slate-800">{error}</p>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 bg-[#062834] text-white hover:bg-[#1a4452] rounded-md font-medium text-xs"
                >
                  Retry
                </button>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className={styles.emptyState}>
                <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <strong>No cases match these filters.</strong>
                <p>All evaluations in the queue are in consensus or no moderation cases have been triggered.</p>
                {(selectedPriority !== "ALL" || selectedStatus !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPriority("ALL");
                      setSelectedStatus("ALL");
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <ol className={styles.caseList}>
                {filteredCases.map((item) => (
                  <li
                    className={`${styles.caseRow} ${
                      item.priority === "CRITICAL"
                        ? styles.criticalCase
                        : item.priority === "HIGH"
                        ? styles.highCase
                        : item.priority === "MEDIUM"
                        ? styles.mediumCase
                        : ""
                    }`}
                    key={item.id}
                  >
                    <div className={styles.caseMain}>
                      <div className={styles.caseTopline}>
                        <strong>{item.caseNumber}</strong>
                        <span className={styles.priority}>{item.priority.toLowerCase()} priority</span>
                        <span className={styles.status}>{item.status.replaceAll("_", " ").toLowerCase()}</span>
                      </div>
                      <h3>
                        {item.subject}{" "}
                        <span>
                          · {item.subjectCode} · Sheet {item.scriptId} · {item.questionNumber}
                        </span>
                      </h3>
                      <p>{item.triggerDetail}</p>
                      <dl className={styles.caseFacts}>
                        <div>
                          <dt>Round 1</dt>
                          <dd>
                            {item.round1Marks}/{item.maxMarks}
                          </dd>
                        </div>
                        <div>
                          <dt>Round 2</dt>
                          <dd>
                            {item.round2Marks}/{item.maxMarks}
                          </dd>
                        </div>
                        <div>
                          <dt>AI suggestion</dt>
                          <dd>
                            {item.aiSuggestedMarks}/{item.maxMarks}
                          </dd>
                        </div>
                        <div>
                          <dt>Risk</dt>
                          <dd>
                            {item.overallRiskScore}/100 · {item.riskBand.toLowerCase()}
                          </dd>
                        </div>
                        {item.assignedModerator && (
                          <div>
                            <dt>Assigned to</dt>
                            <dd>{item.assignedModerator}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                    <Link
                      className={styles.openCase}
                      href={`/moderation/${item.id}`}
                      aria-label={`Open moderation case ${item.caseNumber}`}
                    >
                      Open case <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
