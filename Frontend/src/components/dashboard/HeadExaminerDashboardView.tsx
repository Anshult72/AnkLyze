"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Scale, ShieldAlert, FileCheck2, Clock } from "lucide-react";
import { HEAD_EXAMINER_DASHBOARD_DATA } from "@/data/dashboardRoleMockData";
import styles from "@/app/examiner/ExaminerPages.module.css";

export default function HeadExaminerDashboardView() {
  const data = HEAD_EXAMINER_DASHBOARD_DATA;

  return (
    <>
      {/* 1. HEAD EXAMINER HEADER */}
      <header className={styles.dashboardIntro}>
        <div>
          <p className={styles.eyebrow}>
            {data.session} <span aria-hidden="true">/</span> {data.subjectCode}
          </p>
          <h1>Examination overview.</h1>
          <p className={styles.introText}>
            {data.subject} <span aria-hidden="true">·</span> {data.examination}
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
            Oversight: {data.oversight.moderationCasesCount} Moderation Cases ·{" "}
            {data.oversight.secondEvaluationsPendingCount} Second Evaluations Pending
          </span>
        </div>
      </header>

      {/* 2. TOP 4 INSTITUTIONAL STATUS METRICS */}
      <section className={styles.summary} aria-label="Institutional examination status">
        <div className={styles.summaryLead}>
          <span className={styles.overline}>Assigned scripts</span>
          <strong>
            {data.summary.evaluated}
            <span> / {data.summary.assignedScripts}</span>
          </strong>
          <p>evaluated cohort · {data.summary.completionRate}% complete</p>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={data.summary.completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Evaluation completed"
          >
            <span style={{ width: `${data.summary.completionRate}%` }} />
          </div>
        </div>

        <div className={styles.summaryLink}>
          <span className={styles.overline}>Evaluated scripts</span>
          <strong>{data.summary.evaluated}</strong>
          <span>Cohort progress: 77%</span>
        </div>

        <Link href="/examiner/evaluations" className={styles.summaryLink}>
          <span className={styles.overline}>Pending evaluation</span>
          <strong>{data.summary.pending}</strong>
          <span>
            Active desks <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>

        <Link href="/moderation" className={styles.summaryLink}>
          <span className={styles.overline}>Needs moderation</span>
          <strong>{data.summary.needsModeration}</strong>
          <span>
            Open disputes <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>
      </section>

      {/* 3. WORK GRID: NEEDS OVERSIGHT + MODERATION SUMMARY */}
      <div className={styles.workGrid}>
        {/* NEEDS OVERSIGHT */}
        <section className={styles.workSection} aria-labelledby="dashboard-oversight-heading">
          <div className={styles.workHeading}>
            <div>
              <span className={styles.overline}>Institutional oversight</span>
              <h2 id="dashboard-oversight-heading">Needs oversight</h2>
            </div>
            <Link href="/moderation">
              Open Moderation Desk <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.queueList}>
            {data.oversight.items.map((item) => (
              <div className={styles.queueRow} key={item.id}>
                <div className={styles.queueIdentity}>
                  <div className="flex items-center space-x-2">
                    <span className={styles.overline}>{item.category}</span>
                    <span className="text-slate-300">•</span>
                    <span
                      className={`text-[11px] font-bold ${
                        item.severity === "Critical"
                          ? "text-rose-700"
                          : item.severity === "High"
                          ? "text-amber-700"
                          : "text-slate-600"
                      }`}
                    >
                      {item.severity} priority
                    </span>
                  </div>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <div className={styles.queueState}>
                  <span>{item.category}</span>
                </div>
                <Link href={item.href} aria-label={`${item.actionText} for ${item.title}`}>
                  {item.actionText} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* MODERATION SUMMARY */}
        <section className={styles.workSection} aria-labelledby="dashboard-moderation-summary-heading">
          <div className={styles.workHeading}>
            <div>
              <span className={styles.overline}>Dispute resolution</span>
              <h2 id="dashboard-moderation-summary-heading">Moderation summary</h2>
            </div>
            <Link href="/moderation">
              All cases <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="p-5 bg-[#fffefa] border border-[#d5e1db] rounded-xl space-y-4 shadow-2xs mt-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-[#f8faf9] rounded-lg border border-[#e2ece7]">
                <span className="block text-[11px] font-bold uppercase text-[#5b7778] tracking-wider">
                  Open Cases
                </span>
                <span className="block text-2xl font-serif text-[#062834] mt-1">
                  {data.moderationSummary.open}
                </span>
                <span className="text-[11px] text-[#617579]">Requiring review</span>
              </div>

              <div className="p-3 bg-[#f8faf9] rounded-lg border border-[#e2ece7]">
                <span className="block text-[11px] font-bold uppercase text-[#5b7778] tracking-wider">
                  In Review
                </span>
                <span className="block text-2xl font-serif text-[#062834] mt-1">
                  {data.moderationSummary.inReview}
                </span>
                <span className="text-[11px] text-[#617579]">Being examined</span>
              </div>
            </div>

            <dl className={styles.snapshotList} style={{ margin: "12px 0 0" }}>
              <div>
                <dt>Resolved today</dt>
                <dd>{data.moderationSummary.resolvedToday} cases</dd>
              </div>
              <div>
                <dt>Oldest unresolved dispute</dt>
                <dd>{data.moderationSummary.oldestUnresolvedMinutes} min</dd>
              </div>
              <div>
                <dt>Second evaluations pending</dt>
                <dd>{data.oversight.secondEvaluationsPendingCount} allocated</dd>
              </div>
              <div>
                <dt>Unresolved mark deltas</dt>
                <dd>{data.oversight.unresolvedDisagreementsCount} cases</dd>
              </div>
            </dl>

            <Link className={styles.sectionFooterLink} href="/moderation">
              Open Moderation Queue <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      {/* 4. EVALUATION PROGRESS & COHORT BREAKDOWN */}
      <section className={styles.todaySection} aria-labelledby="dashboard-cohort-heading">
        <div className={styles.todayHeading}>
          <div>
            <span className={styles.overline}>Examination Progress</span>
            <h2 id="dashboard-cohort-heading">Evaluation progress</h2>
          </div>
          <span className={styles.sampleNote}>
            92 / 120 completed · 77% cohort progress
          </span>
        </div>
        <div className={styles.todayDetails}>
          <div>
            <strong>3</strong>
            <span>critical risk evaluations</span>
          </div>
          <div>
            <strong>4</strong>
            <span>second evaluations pending</span>
          </div>
          <div>
            <strong>6</strong>
            <span>moderation cases</span>
          </div>
          <div>
            <strong>2</strong>
            <span>unresolved disagreements</span>
          </div>
        </div>
      </section>

      {/* 5. RESULT READINESS + INSTITUTIONAL RECENT ACTIVITY */}
      <div className={styles.lowerGrid}>
        <section className={styles.supportSection} aria-labelledby="dashboard-readiness-heading">
          <span className={styles.overline}>Sign-off & Publishing</span>
          <h2 id="dashboard-readiness-heading">Result readiness</h2>
          <p>Institutional result publication criteria for CS-301 Winter Session.</p>
          <dl className={styles.snapshotList}>
            <div>
              <dt>Evaluation coverage</dt>
              <dd>{data.resultReadiness.evaluationCoverage}%</dd>
            </div>
            <div>
              <dt>Questions awaiting final decision</dt>
              <dd>{data.resultReadiness.questionsAwaitingFinalDecision}</dd>
            </div>
            <div>
              <dt>Validation blockers</dt>
              <dd className="text-amber-800 font-bold">
                {data.resultReadiness.validationBlockers} issues
              </dd>
            </div>
            <div>
              <dt>Readiness status</dt>
              <dd className="text-amber-900 font-semibold">
                {data.resultReadiness.status}
              </dd>
            </div>
          </dl>
          <Link className={styles.sectionFooterLink} href="/admin/results">
            Review results & blockers <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <section className={styles.supportSection} aria-labelledby="dashboard-institutional-activity-heading">
          <span className={styles.overline}>Audit timeline</span>
          <h2 id="dashboard-institutional-activity-heading">Institutional recent activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className={styles.emptyDesk}>No recent institutional activity.</p>
          ) : (
            <ol className={styles.activityList}>
              {data.recentActivity.map((event) => (
                <li key={event.id}>
                  <time>{event.time}</time>
                  <div>
                    {event.href ? (
                      <Link href={event.href}>{event.title}</Link>
                    ) : (
                      <strong>{event.title}</strong>
                    )}
                    <p>{event.detail}</p>
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
