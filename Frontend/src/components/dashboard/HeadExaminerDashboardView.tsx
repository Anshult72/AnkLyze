"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Scale, ShieldAlert, FileCheck2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/utils/apiClient";
import styles from "@/app/examiner/ExaminerPages.module.css";

interface LiveHeadExaminerData {
  assignedScripts: number;
  evaluated: number;
  pending: number;
  needsModeration: number;
  completionRate: number;
  oversight: {
    moderationCasesCount: number;
    criticalRiskCount: number;
    secondEvaluationsPendingCount: number;
    unresolvedDisagreementsCount: number;
    items: Array<{ id: string; category: string; severity: string; title: string }>;
  };
  moderationSummary: {
    open: number;
    inReview: number;
    resolvedToday: number;
    oldestUnresolvedMinutes: number;
  };
  resultReadiness: {
    evaluationCoverage: number;
    questionsAwaitingFinalDecision: number;
    validationBlockers: number;
    status: string;
  };
  recentActivity: Array<{ id: string; time: string; title: string }>;
}

export default function HeadExaminerDashboardView() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<LiveHeadExaminerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setIsLoading(true);
    setError(null);
    fetchApi<LiveHeadExaminerData>("/dashboards/head-examiner", { token: accessToken })
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
          setError(null);
        } else {
          setError(res.error?.message || "Failed to load dashboard data");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      })
      .finally(() => setIsLoading(false));
  };


  useEffect(() => {
    loadData();
  }, [accessToken]);

  const assigned = data?.assignedScripts ?? 0;
  const evaluated = data?.evaluated ?? 0;
  const pending = data?.pending ?? 0;
  const completionRate = data?.completionRate ?? 0;
  const moderationCount = data?.oversight?.moderationCasesCount ?? 0;
  const secondEvalPending = data?.oversight?.secondEvaluationsPendingCount ?? 0;
  const oversightItems = data?.oversight?.items ?? [];
  const activityItems = data?.recentActivity ?? [];

  return (
    <>
      {/* 1. HEAD EXAMINER HEADER */}
      <header className={styles.dashboardIntro}>
        <div>
          <p className={styles.eyebrow}>
            ACADEMIC OVERSIGHT <span aria-hidden="true">/</span> INSTITUTIONAL DESK
          </p>
          <h1>Examination overview.</h1>
          <p className={styles.introText}>
            All Ingested Examination Operations &amp; Evaluation Cohorts
          </p>
        </div>
        <div className={styles.heroAction}>
          <Link
            className={styles.primaryLink}
            href="/moderation"
            id="btn-review-priority-work"
          >
            Review priority work <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <span>
            Oversight: {moderationCount} Moderation Cases ·{" "}
            {secondEvalPending} Second Evaluations Pending
          </span>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Could not load live dashboard data: {error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-2.5 py-1 rounded bg-white text-rose-700 font-semibold border border-rose-300 hover:bg-rose-100 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* 2. TOP 4 INSTITUTIONAL STATUS METRICS */}
      <section className={styles.summary} aria-label="Institutional examination status">
        <div className={styles.summaryLead}>
          <span className={styles.overline}>Assigned scripts</span>
          <strong>
            {evaluated}
            <span> / {assigned}</span>
          </strong>
          <p>evaluated cohort · {completionRate}% complete</p>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Evaluation completed"
          >
            <span style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <Link href="/examiner/evaluations" className={styles.summaryLink}>
          <span className={styles.overline}>Pending evaluation</span>
          <strong>{pending}</strong>
          <span>
            Inspect backlog <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>

        <Link href="/moderation" className={styles.summaryLink}>
          <span className={styles.overline}>Requires moderation</span>
          <strong>{moderationCount}</strong>
          <span>
            Open cases <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>

        <Link href="/admin/results" className={styles.summaryLink}>
          <span className={styles.overline}>Result readiness</span>
          <strong>{data?.resultReadiness?.status || (assigned === 0 ? "Empty" : "In Progress")}</strong>
          <span>
            View results <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>
      </section>

      {/* 3. WORK GRID: OVERSIGHT QUEUE & MODERATION SUMMARY */}
      <div className={styles.workGrid}>
        {/* NEEDS OVERSIGHT */}
        <section className={styles.workSection} aria-labelledby="dashboard-oversight-heading">
          <div className={styles.workHeading}>
            <div>
              <span className={styles.overline}>Attention required</span>
              <h2 id="dashboard-oversight-heading">Needs oversight</h2>
            </div>
            <Link href="/moderation">
              View all moderation <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {isLoading ? (
            <p className={styles.emptyDesk}>Loading oversight items...</p>
          ) : oversightItems.length === 0 ? (
            <p className={styles.emptyDesk}>No active moderation cases or critical flags requiring immediate oversight.</p>
          ) : (
            <div className={styles.queueList}>
              {oversightItems.map((item) => (
                <div className={styles.queueRow} key={item.id}>
                  <div className={styles.queueIdentity}>
                    <span className={styles.overline}>{item.category}</span>
                    <strong>{item.title}</strong>
                    <span>{item.severity} severity priority</span>
                  </div>
                  <Link href="/moderation" aria-label={`Inspect ${item.title}`}>
                    Inspect <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MODERATION SUMMARY PANEL */}
        <section className={styles.workSection} aria-labelledby="dashboard-modsum-heading">
          <div className={styles.workHeading}>
            <div>
              <span className={styles.overline}>Quality control</span>
              <h2 id="dashboard-modsum-heading">Moderation summary</h2>
            </div>
            <Link href="/moderation">
              Manage queue <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.attentionList}>
            <div className={styles.attentionRow}>
              <Scale className="text-amber-700" size={20} />
              <div>
                <strong>{data?.moderationSummary?.open ?? 0} cases open</strong>
                <p>Awaiting senior reviewer assignment or resolution</p>
                <span>Active quality queue</span>
              </div>
            </div>
            <div className={styles.attentionRow}>
              <ShieldAlert className="text-rose-700" size={20} />
              <div>
                <strong>{data?.oversight?.criticalRiskCount ?? 0} critical risk flags</strong>
                <p>Disagreements exceeding standard tolerance</p>
                <span>High priority</span>
              </div>
            </div>
            <div className={styles.attentionRow}>
              <FileCheck2 className="text-emerald-700" size={20} />
              <div>
                <strong>{data?.moderationSummary?.resolvedToday ?? 0} resolved today</strong>
                <p>Decisions finalized and archived</p>
                <span>Quality record</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 4. RESULT READINESS & RECENT ACTIVITY */}
      <div className={styles.lowerGrid}>
        <section className={styles.supportSection} aria-labelledby="dashboard-resread-heading">
          <span className={styles.overline}>Institutional publication</span>
          <h2 id="dashboard-resread-heading">Result readiness</h2>
          <p>Results cannot be approved until all evaluations and verifications pass.</p>
          <dl className={styles.snapshotList}>
            <div>
              <dt>Evaluation cohort coverage</dt>
              <dd>{completionRate}%</dd>
            </div>
            <div>
              <dt>Awaiting final decision</dt>
              <dd>{pending} scripts</dd>
            </div>
            <div>
              <dt>Active validation blockers</dt>
              <dd>{data?.resultReadiness?.validationBlockers ?? 0}</dd>
            </div>
            <div>
              <dt>Publication readiness</dt>
              <dd>{data?.resultReadiness?.status ?? (assigned === 0 ? "Empty" : "In Progress")}</dd>
            </div>
          </dl>
          <Link className={styles.sectionFooterLink} href="/admin/results">
            View examination results <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <section className={styles.supportSection} aria-labelledby="dashboard-activity-heading">
          <span className={styles.overline}>Supervisory log</span>
          <h2 id="dashboard-activity-heading">Recent activity</h2>
          {isLoading ? (
            <p className={styles.emptyDesk}>Loading activity...</p>
          ) : activityItems.length === 0 ? (
            <p className={styles.emptyDesk}>No recent oversight activity.</p>
          ) : (
            <ol className={styles.activityList}>
              {activityItems.map((event) => (
                <li key={event.id}>
                  <time>{event.time}</time>
                  <div>
                    <strong>{event.title}</strong>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
