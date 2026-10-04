"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/utils/apiClient";
import styles from "@/app/examiner/ExaminerPages.module.css";

const getSheetCode = (reference: string) =>
  reference ? (reference.includes("-") ? reference : `A-${reference.slice(0, 5)}`) : "A-10001";

interface LiveExaminerDesk {
  assignedScripts: number;
  completed: number;
  pending: number;
  openReviewCount: number;
  highPriorityCount: number;
  todayCompleted: number;
  todaySinceLastSession: number;
  aiAcceptanceRate: number;
  aiAcceptedCount: number;
  aiOverriddenCount: number;
  queue: Array<{ id: string; scriptId: string; status: string; isIndependent?: boolean }>;
  attention: Array<{ questionNumber: string; issueTitle: string; severity: string; scriptId: string }>;
  recentActivity: Array<{ id: string; time: string; title: string; detail?: string }>;
}

export default function ExaminerDashboardView() {
  const { accessToken, user } = useAuth();
  const [liveData, setLiveData] = useState<LiveExaminerDesk | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setIsLoading(true);
    setError(null);
    fetchApi<LiveExaminerDesk>("/dashboards/examiner", { token: accessToken })
      .then((res) => {
        if (res.success && res.data) {
          setLiveData(res.data);
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

  const assigned = liveData?.assignedScripts ?? 0;
  const completed = liveData?.completed ?? 0;
  const pending = liveData?.pending ?? 0;
  const completionRate = assigned > 0 ? Math.min(100, Math.round((completed / assigned) * 100)) : 0;
  const openReviews = liveData?.openReviewCount ?? 0;
  const highPriority = liveData?.highPriorityCount ?? 0;
  const queueItems = liveData?.queue ?? [];
  const attentionItems = liveData?.attention ?? [];
  const recentItems = liveData?.recentActivity ?? [];
  const nextItem = queueItems[0] || null;

  return (
    <>
      {/* 1. EXAMINER HEADER */}
      <header className={styles.dashboardIntro}>
        <div>
          <p className={styles.eyebrow}>
            {user?.department || "Central Evaluation"} <span aria-hidden="true">/</span> {user?.role || "EXAMINER"}
          </p>
          <h1>Your evaluation desk.</h1>
          <p className={styles.introText}>
            {user?.institution || "Board Examination Center"} <span aria-hidden="true">·</span> Academic Session 2026
          </p>
        </div>
        <div className={styles.heroAction}>
          <Link
            className={styles.primaryLink}
            href={
              nextItem
                ? nextItem.isIndependent
                  ? `/examiner/evaluate/${getSheetCode(nextItem.scriptId)}?round=2&question=Q04`
                  : `/examiner/evaluate/${getSheetCode(nextItem.scriptId)}`
                : "/examiner/evaluations"
            }
            id="btn-continue-evaluation"
          >
            {nextItem ? "Continue evaluation" : "View your queue"}{" "}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          {nextItem && (
            <span>
              Next: Sheet {getSheetCode(nextItem.scriptId)} · {nextItem.status}
            </span>
          )}
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

      {/* 2. TOP 4 STATUS METRICS */}
      <section className={styles.summary} aria-label="Current work status">
        <div className={styles.summaryLead}>
          <span className={styles.overline}>Current batch</span>
          <strong>
            {completed}
            <span> / {assigned}</span>
          </strong>
          <p>sheets completed · {completionRate}%</p>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Batch completed"
          >
            <span style={{ width: `${completionRate}%` }} />
          </div>
        </div>
        <Link href="/examiner/evaluations" className={styles.summaryLink}>
          <span className={styles.overline}>Awaiting evaluation</span>
          <strong>{pending}</strong>
          <span>
            View sheets <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>
        <Link href="/examiner/review" className={styles.summaryLink}>
          <span className={styles.overline}>Open review items</span>
          <strong>{openReviews}</strong>
          <span>
            View reviews <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>
        <Link href="/examiner/review" className={styles.summaryLink}>
          <span className={styles.overline}>High priority flags</span>
          <strong>{highPriority}</strong>
          <span>
            Inspect flags <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>
      </section>

      {/* 3. WORK GRID: YOUR QUEUE + NEEDS YOUR ATTENTION */}
      <div className={styles.workGrid}>
        {/* YOUR QUEUE */}
        <section className={styles.workSection} aria-labelledby="dashboard-queue-heading">
          <div className={styles.workHeading}>
            <div>
              <span className={styles.overline}>Assigned work</span>
              <h2 id="dashboard-queue-heading">Your queue</h2>
            </div>
            <Link href="/examiner/evaluations">
              View full queue <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {isLoading ? (
            <p className={styles.emptyDesk}>Loading assigned queue...</p>
          ) : queueItems.length === 0 ? (
            <p className={styles.emptyDesk}>No sheets assigned in this queue yet.</p>
          ) : (
            <div className={styles.queueList}>
              {queueItems.map((sheet, index) => {
                const code = getSheetCode(sheet.scriptId);
                const evalUrl = sheet.isIndependent
                  ? `/examiner/evaluate/${code}?round=2&question=Q04`
                  : `/examiner/evaluate/${code}`;

                return (
                  <div
                    className={`${styles.queueRow} ${index === 0 ? styles.queueRowFeatured : ""}`}
                    key={sheet.id}
                  >
                    <div className={styles.queueIdentity}>
                      {index === 0 && <span className={styles.overline}>Up next</span>}
                      <strong>
                        {sheet.isIndependent ? `Sheet ${code} · Q04` : `Sheet ${code}`}
                      </strong>
                      <span>
                        {sheet.isIndependent
                          ? "Independent Evaluation · Second evaluation required"
                          : sheet.status}
                      </span>
                    </div>
                    <Link
                      href={evalUrl}
                      aria-label={`${sheet.isIndependent ? "Evaluate" : index === 0 ? "Open answer book" : "Open"} for Sheet ${code}`}
                    >
                      {sheet.isIndependent
                        ? "Evaluate"
                        : sheet.status === "In Progress"
                        ? "Resume"
                        : index === 0
                        ? "Open answer book"
                        : "Open"}{" "}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* NEEDS YOUR ATTENTION */}
        <section className={styles.workSection} aria-labelledby="dashboard-attention-heading">
          <div className={styles.workHeading}>
            <div>
              <span className={styles.overline}>Review before sign-off</span>
              <h2 id="dashboard-attention-heading">Needs your attention</h2>
            </div>
          </div>
          {isLoading ? (
            <p className={styles.emptyDesk}>Checking attention flags...</p>
          ) : attentionItems.length === 0 ? (
            <p className={styles.emptyDesk}>Nothing needs your attention.</p>
          ) : (
            <div className={styles.attentionList}>
              {attentionItems.map((item, idx) => (
                <div className={styles.attentionRow} key={`${item.questionNumber}-${idx}`}>
                  <span className={styles.questionCode}>{item.questionNumber}</span>
                  <div>
                    <strong>{item.issueTitle}</strong>
                    <p>
                      Sheet {getSheetCode(item.scriptId)}
                    </p>
                    <span>{item.severity} priority</span>
                  </div>
                  <Link
                    href={`/examiner/evaluate/${getSheetCode(item.scriptId)}?round=2&question=${item.questionNumber}`}
                    aria-label={`Review ${item.questionNumber} on Sheet ${getSheetCode(item.scriptId)}`}
                  >
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          )}
          <Link className={styles.sectionFooterLink} href="/examiner/review">
            View all review items <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>

      {/* 4. TODAY'S PROGRESS */}
      <section className={styles.todaySection} aria-labelledby="dashboard-today-heading">
        <div className={styles.todayHeading}>
          <div>
            <span className={styles.overline}>Workload</span>
            <h2 id="dashboard-today-heading">Today&apos;s progress</h2>
          </div>
        </div>
        <div className={styles.todayDetails}>
          <div>
            <strong>{liveData?.todayCompleted ?? 0}</strong>
            <span>evaluated today</span>
          </div>
          <div>
            <strong>{liveData?.todaySinceLastSession ?? 0}</strong>
            <span>since session start</span>
          </div>
          <div>
            <strong>{liveData?.openReviewCount ?? 0}</strong>
            <span>open reviews</span>
          </div>
          <div>
            <strong>{liveData?.aiAcceptanceRate ?? 0}%</strong>
            <span>AI consensus rate</span>
          </div>
        </div>
      </section>

      {/* 5. WORKFLOW SNAPSHOT + RECENT ACTIVITY */}
      <div className={styles.lowerGrid}>
        <section className={styles.supportSection} aria-labelledby="dashboard-snapshot-heading">
          <span className={styles.overline}>Decision record</span>
          <h2 id="dashboard-snapshot-heading">Evaluation snapshot</h2>
          <p>AI suggestions stay advisory until an examiner signs off.</p>
          <dl className={styles.snapshotList}>
            <div>
              <dt>AI suggestions accepted</dt>
              <dd>{liveData?.aiAcceptedCount ?? 0}</dd>
            </div>
            <div>
              <dt>AI suggestions overridden</dt>
              <dd>{liveData?.aiOverriddenCount ?? 0}</dd>
            </div>
            <div>
              <dt>Questions sent for review</dt>
              <dd>{liveData?.openReviewCount ?? 0}</dd>
            </div>
            <div>
              <dt>Consensus acceptance rate</dt>
              <dd>{liveData?.aiAcceptanceRate ?? 0}%</dd>
            </div>
          </dl>
          <Link className={styles.sectionFooterLink} href="/examiner/reports">
            View workflow report <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <section className={styles.supportSection} aria-labelledby="dashboard-activity-heading">
          <span className={styles.overline}>Latest changes</span>
          <h2 id="dashboard-activity-heading">Recent activity</h2>
          {isLoading ? (
            <p className={styles.emptyDesk}>Loading activity...</p>
          ) : recentItems.length === 0 ? (
            <p className={styles.emptyDesk}>No recent evaluation activity.</p>
          ) : (
            <ol className={styles.activityList}>
              {recentItems.map((event) => (
                <li key={event.id}>
                  <time>{event.time}</time>
                  <div>
                    <strong>{event.title}</strong>
                    {event.detail && <p>{event.detail}</p>}
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
