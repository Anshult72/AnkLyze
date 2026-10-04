"use client";

import React, { useState, useEffect } from "react";
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
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/utils/apiClient";
import styles from "@/app/examiner/ExaminerPages.module.css";

interface LiveSuperAdminData {
  activeExams: number;
  activeSubjects: number;
  scriptsIngested: number;
  evaluations: number;
  operations: {
    scriptsProcessing: number;
    ocrPending: number;
    moderationQueue: number;
    activeExaminers: number;
  };
  resultsOverview: {
    readyCount: number;
    blockedCount: number;
    approvedCount: number;
    revaluationsCount: number;
  };
  systemStatus: {
    api: string;
    database: string;
    realtime: string;
    storage: string;
  };
  recentActivity: Array<{ id: string; time: string; title: string; detail?: string }>;
}

export default function SuperAdminDashboardView() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<LiveSuperAdminData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setIsLoading(true);
    setError(null);
    fetchApi<LiveSuperAdminData>("/dashboards/super-admin", { token: accessToken })
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

  const activeExams = data?.activeExams ?? 0;
  const activeSubjects = data?.activeSubjects ?? 0;
  const scriptsIngested = data?.scriptsIngested ?? 0;
  const evaluationsCount = data?.evaluations ?? 0;
  const operations = data?.operations ?? { scriptsProcessing: 0, ocrPending: 0, moderationQueue: 0, activeExaminers: 0 };
  const results = data?.resultsOverview ?? { readyCount: 0, blockedCount: 0, approvedCount: 0, revaluationsCount: 0 };
  const systemStatus = data?.systemStatus ?? { api: "OPERATIONAL", database: "CONNECTED", realtime: "OPERATIONAL", storage: "CONFIGURED" };
  const recentItems = data?.recentActivity ?? [];

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
            All Examination Cycles, Infrastructure Services &amp; System Pipelines Active
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
            {activeExams} Active Examinations · {activeSubjects} Subjects Ingested
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

      {/* 2. TOP 4 PLATFORM STATUS METRICS */}
      <section className={styles.summary} aria-label="Platform operational status">
        <div className={styles.summaryLead}>
          <span className={styles.overline}>Active exams</span>
          <strong>
            {activeExams}
            <span> programs</span>
          </strong>
          <p>{activeSubjects} concurrent subjects running</p>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={100}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Active programs"
          >
            <span style={{ width: "100%" }} />
          </div>
        </div>

        <Link href="/admin/scripts" className={styles.summaryLink}>
          <span className={styles.overline}>Scripts ingested</span>
          <strong>{scriptsIngested}</strong>
          <span>
            Intake intake <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>

        <Link href="/admin/examiners" className={styles.summaryLink}>
          <span className={styles.overline}>Active examiners</span>
          <strong>{operations.activeExaminers}</strong>
          <span>
            Directory <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>

        <Link href="/admin/results" className={styles.summaryLink}>
          <span className={styles.overline}>Approved results</span>
          <strong>{results.approvedCount}</strong>
          <span>
            Results desk <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>
      </section>

      {/* 3. WORK GRID: PROCESSING OPERATIONS & RESULTS OVERVIEW */}
      <div className={styles.workGrid}>
        {/* INTAKE & PROCESSING PIPELINE */}
        <section className={styles.workSection} aria-labelledby="dashboard-pipeline-heading">
          <div className={styles.workHeading}>
            <div>
              <span className={styles.overline}>Data operations</span>
              <h2 id="dashboard-pipeline-heading">Processing pipeline</h2>
            </div>
            <Link href="/admin/scripts">
              View sheet intake <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.attentionList}>
            <div className={styles.attentionRow}>
              <FileStack className="text-[#326c74]" size={20} />
              <div>
                <strong>{operations.scriptsProcessing} scripts in active OCR processing</strong>
                <p>Background worker tasks running</p>
                <span>Pipeline health: Nominal</span>
              </div>
            </div>
            <div className={styles.attentionRow}>
              <Cpu className="text-blue-700" size={20} />
              <div>
                <strong>{operations.ocrPending} pages pending OCR rasterization</strong>
                <p>Google Cloud Vision pipeline queue</p>
                <span>Queue status: Healthy</span>
              </div>
            </div>
            <div className={styles.attentionRow}>
              <ShieldCheck className="text-purple-700" size={20} />
              <div>
                <strong>{operations.moderationQueue} cases in moderation queue</strong>
                <p>Academic quality control disputes</p>
                <span>Senior review</span>
              </div>
            </div>
          </div>
        </section>

        {/* RESULTS OVERVIEW PANEL */}
        <section className={styles.workSection} aria-labelledby="dashboard-adminres-heading">
          <div className={styles.workHeading}>
            <div>
              <span className={styles.overline}>Institutional records</span>
              <h2 id="dashboard-adminres-heading">Results overview</h2>
            </div>
            <Link href="/admin/results">
              View all results <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.attentionList}>
            <div className={styles.attentionRow}>
              <FileCheck2 className="text-emerald-700" size={20} />
              <div>
                <strong>{results.approvedCount} examination results published</strong>
                <p>Digitally signed with cryptographic SHA-256 fingerprint</p>
                <span>Permanent ledger</span>
              </div>
            </div>
            <div className={styles.attentionRow}>
              <HardDrive className="text-amber-700" size={20} />
              <div>
                <strong>{results.readyCount} results pending publication review</strong>
                <p>Validated cohorts ready for institutional sign-off</p>
                <span>Publication pipeline</span>
              </div>
            </div>
            <div className={styles.attentionRow}>
              <Server className="text-rose-700" size={20} />
              <div>
                <strong>{results.blockedCount} results blocked by validation</strong>
                <p>Unresolved question decisions or score variance</p>
                <span>Integrity gate</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 4. SYSTEM HEALTH & RECENT LOGS */}
      <div className={styles.lowerGrid}>
        <section className={styles.supportSection} aria-labelledby="dashboard-syshealth-heading">
          <span className={styles.overline}>Infrastructure status</span>
          <h2 id="dashboard-syshealth-heading">System integrity</h2>
          <p>Real-time status of backend services and data stores.</p>
          <dl className={styles.snapshotList}>
            <div>
              <dt>Core REST API</dt>
              <dd className="text-emerald-700 font-bold">{systemStatus.api}</dd>
            </div>
            <div>
              <dt>PostgreSQL Database</dt>
              <dd className="text-emerald-700 font-bold">{systemStatus.database}</dd>
            </div>
            <div>
              <dt>WebSocket Realtime</dt>
              <dd className="text-emerald-700 font-bold">{systemStatus.realtime}</dd>
            </div>
            <div>
              <dt>Cloud Object Storage</dt>
              <dd className="text-emerald-700 font-bold">{systemStatus.storage}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.supportSection} aria-labelledby="dashboard-syslogs-heading">
          <span className={styles.overline}>Governance log</span>
          <h2 id="dashboard-syslogs-heading">Platform activity</h2>
          {isLoading ? (
            <p className={styles.emptyDesk}>Checking platform logs...</p>
          ) : recentItems.length === 0 ? (
            <p className={styles.emptyDesk}>No recent platform administrative activity.</p>
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
