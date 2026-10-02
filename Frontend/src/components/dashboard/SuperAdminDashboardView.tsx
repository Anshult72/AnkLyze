"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Server,
  Database,
  HardDrive,
  Cpu,
  Radio,
  FileStack,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";
import { SUPER_ADMIN_DASHBOARD_DATA } from "@/data/dashboardRoleMockData";
import styles from "@/app/examiner/ExaminerPages.module.css";

export default function SuperAdminDashboardView() {
  const data = SUPER_ADMIN_DASHBOARD_DATA;

  return (
    <>
      {/* 1. SUPER ADMIN HEADER */}
      <header className={styles.dashboardIntro}>
        <div>
          <p className={styles.eyebrow}>
            ANKLYZE CENTRAL ADMINISTRATION <span aria-hidden="true">/</span> PLATFORM
          </p>
          <h1>ANKLYZE platform overview.</h1>
          <p className={styles.introText}>
            {data.session} <span aria-hidden="true">·</span> All Examination Operations Active
          </p>
        </div>
        <div className={styles.heroAction}>
          <Link
            className={styles.primaryLink}
            href="/admin/exams"
            id="btn-manage-exams"
          >
            Manage examinations <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <span>
            {data.summary.activeExams} Active Examinations · {data.summary.activeSubjects} Subjects Ingested
          </span>
        </div>
      </header>

      {/* 2. TOP 4 PLATFORM STATUS METRICS */}
      <section className={styles.summary} aria-label="Platform operational status">
        <div className={styles.summaryLead}>
          <span className={styles.overline}>Active exams</span>
          <strong>
            {data.summary.activeExams}
            <span> programs</span>
          </strong>
          <p>{data.summary.activeSubjects} concurrent subjects running</p>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={78}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Platform evaluations progress"
          >
            <span style={{ width: "78%" }} />
          </div>
        </div>

        <Link href="/admin/exams" className={styles.summaryLink}>
          <span className={styles.overline}>Active subjects</span>
          <strong>{data.summary.activeSubjects}</strong>
          <span>
            View subjects <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>

        <Link href="/admin/scripts" className={styles.summaryLink}>
          <span className={styles.overline}>Scripts ingested</span>
          <strong>{data.summary.scriptsIngested.toLocaleString()}</strong>
          <span>
            Intake pipeline <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>

        <Link href="/admin/results" className={styles.summaryLink}>
          <span className={styles.overline}>Evaluations completed</span>
          <strong>{data.summary.evaluations.toLocaleString()}</strong>
          <span>
            Review results <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>
      </section>

      {/* 3. WORK GRID: EXAMINATION OPERATIONS + RESULTS OVERVIEW */}
      <div className={styles.workGrid}>
        {/* EXAMINATION OPERATIONS */}
        <section className={styles.workSection} aria-labelledby="dashboard-operations-heading">
          <div className={styles.workHeading}>
            <div>
              <span className={styles.overline}>Platform pipeline</span>
              <h2 id="dashboard-operations-heading">Examination operations</h2>
            </div>
            <Link href="/admin/scripts">
              Sheet intake <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.queueList}>
            <div className={styles.queueRow}>
              <div className={styles.queueIdentity}>
                <span className={styles.overline}>Ingestion</span>
                <strong>Scripts processing in digitizer</strong>
                <span>Scanned booklet intake, page boundary separation, and integrity validation</span>
              </div>
              <div className={styles.queueState}>
                <strong className="text-xl font-serif text-[#062834]">
                  {data.operations.scriptsProcessing}
                </strong>
                <small className="text-[#468189] font-medium">In flight</small>
              </div>
              <Link href="/admin/scripts">
                Manage <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className={styles.queueRow}>
              <div className={styles.queueIdentity}>
                <span className={styles.overline}>Vision AI</span>
                <strong>OCR and vision transcription pending</strong>
                <span>Handwriting recognition and rubric layout alignment queue</span>
              </div>
              <div className={styles.queueState}>
                <strong className="text-xl font-serif text-[#062834]">
                  {data.operations.ocrPending}
                </strong>
                <small className="text-[#468189] font-medium">Processing</small>
              </div>
              <Link href="/admin/scripts">
                Inspect <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className={styles.queueRow}>
              <div className={styles.queueIdentity}>
                <span className={styles.overline}>Desks</span>
                <strong>Evaluations pending across pools</strong>
                <span>Assigned to examiner queues across active evaluation centers</span>
              </div>
              <div className={styles.queueState}>
                <strong className="text-xl font-serif text-[#062834]">
                  {data.operations.evaluationsPending}
                </strong>
                <small className="text-[#376c70] font-medium">Active desks</small>
              </div>
              <Link href="/admin/exams">
                View cohorts <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className={styles.queueRow}>
              <div className={styles.queueIdentity}>
                <span className={styles.overline}>Oversight</span>
                <strong>Moderation cases platform-wide</strong>
                <span>Disagreements and high-variance escalations across all subjects</span>
              </div>
              <div className={styles.queueState}>
                <strong className="text-xl font-serif text-amber-900">
                  {data.operations.moderationCases}
                </strong>
                <small className="text-amber-800 font-medium">Needs review</small>
              </div>
              <Link href="/moderation">
                Moderate <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* RESULTS & INTEGRITY OVERVIEW */}
        <section className={styles.workSection} aria-labelledby="dashboard-results-summary-heading">
          <div className={styles.workHeading}>
            <div>
              <span className={styles.overline}>Academic integrity</span>
              <h2 id="dashboard-results-summary-heading">Results overview</h2>
            </div>
            <Link href="/admin/results">
              All results <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="p-5 bg-[#fffefa] border border-[#d5e1db] rounded-xl space-y-4 shadow-2xs mt-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-[#f8faf9] rounded-lg border border-[#e2ece7]">
                <span className="block text-[11px] font-bold uppercase text-[#5b7778] tracking-wider">
                  Ready for Validation
                </span>
                <span className="block text-2xl font-serif text-[#062834] mt-1">
                  {data.results.readyForValidation}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">Cohorts ≥ 98%</span>
              </div>

              <div className="p-3 bg-[#f8faf9] rounded-lg border border-[#e2ece7]">
                <span className="block text-[11px] font-bold uppercase text-[#5b7778] tracking-wider">
                  Validation Blocked
                </span>
                <span className="block text-2xl font-serif text-rose-900 mt-1">
                  {data.results.validationBlocked}
                </span>
                <span className="text-[11px] text-rose-700 font-medium">Action required</span>
              </div>
            </div>

            <dl className={styles.snapshotList} style={{ margin: "12px 0 0" }}>
              <div>
                <dt>Approved institutional results</dt>
                <dd>{data.results.approvedResults} cohorts</dd>
              </div>
              <div>
                <dt>Revaluation requests queued</dt>
                <dd>{data.results.revaluationRequests} requests</dd>
              </div>
              <div>
                <dt>Active examiners online</dt>
                <dd>{data.operations.activeExaminersOnline} active</dd>
              </div>
              <div>
                <dt>Evaluation centers operational</dt>
                <dd>{data.operations.centersActive} centers</dd>
              </div>
            </dl>

            <Link className={styles.sectionFooterLink} href="/admin/results">
              Open Result Validation Dashboard <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      {/* 4. RESTRAINED SYSTEM STATUS */}
      <section className={styles.todaySection} aria-labelledby="dashboard-system-status-heading">
        <div className={styles.todayHeading}>
          <div>
            <span className={styles.overline}>Infrastructure health</span>
            <h2 id="dashboard-system-status-heading">System status</h2>
          </div>
          <span className="text-xs text-[#5b7778] font-mono">
            Platform heartbeat: normal
          </span>
        </div>
        <div className={styles.todayDetails}>
          <div>
            <div className="flex items-center space-x-1.5 mb-1">
              <Server className="w-3.5 h-3.5 text-emerald-700" />
              <strong className="text-base text-emerald-800">
                {data.systemStatus.api.status}
              </strong>
            </div>
            <span>API Server · {data.systemStatus.api.detail}</span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5 mb-1">
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <strong className="text-base text-emerald-800">
                {data.systemStatus.database.status}
              </strong>
            </div>
            <span>Database · {data.systemStatus.database.detail}</span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-blue-700" />
              <strong className="text-base text-blue-800">
                {data.systemStatus.storage.status}
              </strong>
            </div>
            <span>Storage · {data.systemStatus.storage.detail}</span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5 mb-1">
              <Cpu className="w-3.5 h-3.5 text-blue-700" />
              <strong className="text-base text-blue-800">
                {data.systemStatus.aiProvider.status}
              </strong>
            </div>
            <span>AI Multimodal · {data.systemStatus.aiProvider.detail}</span>
          </div>
        </div>
      </section>

      {/* 5. PLATFORM RECENT ACTIVITY + CENTRAL AUDIT */}
      <div className={styles.lowerGrid}>
        <section className={styles.supportSection} aria-labelledby="dashboard-admin-summary-heading">
          <span className={styles.overline}>Central authority</span>
          <h2 id="dashboard-admin-summary-heading">Platform administration</h2>
          <p>Global examination orchestration and security provenance monitoring.</p>
          <dl className={styles.snapshotList}>
            <div>
              <dt>Total digitized pages</dt>
              <dd>29,760 pages</dd>
            </div>
            <div>
              <dt>Audit events logged today</dt>
              <dd>1,482 events</dd>
            </div>
            <div>
              <dt>Security anomalies</dt>
              <dd className="text-emerald-700">0 detected</dd>
            </div>
            <div>
              <dt>Active evaluator sessions</dt>
              <dd>34 connected</dd>
            </div>
          </dl>
          <Link className={styles.sectionFooterLink} href="/admin/examiners">
            Manage examiner credentials <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <section className={styles.supportSection} aria-labelledby="dashboard-platform-activity-heading">
          <span className={styles.overline}>Platform timeline</span>
          <h2 id="dashboard-platform-activity-heading">Platform recent activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className={styles.emptyDesk}>No recent platform activity.</p>
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
