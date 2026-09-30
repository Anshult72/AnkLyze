"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import TopNavigation from "@/components/examiner/TopNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ATTENTION_ITEMS_DATA, EVALUATION_QUEUE_DATA, EXAMINER_CONTEXT, WORK_SUMMARY_DATA } from "@/data/examinerMockData";
import styles from "../ExaminerPages.module.css";

const reviewItem = ATTENTION_ITEMS_DATA[0];
const nextScript = EVALUATION_QUEUE_DATA.find(script => script.status === "AI Ready") ?? EVALUATION_QUEUE_DATA[0];
const completion = Math.round(WORK_SUMMARY_DATA.completed / WORK_SUMMARY_DATA.assignedScripts * 100);

export default function ExaminerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["EXAMINER", "HEAD_EXAMINER", "SUPER_ADMIN"]}>
      <div className={`workspace-shell ${styles.page}`}>
        <TopNavigation activeTab="dashboard" />
        <main className={styles.main}>
          <header className={styles.dashboardIntro}>
            <div>
              <p className={styles.eyebrow}>{EXAMINER_CONTEXT.session} <span aria-hidden="true">/</span> {EXAMINER_CONTEXT.subjectCode}</p>
              <h1>Your evaluation desk.</h1>
              <p className={styles.introText}>{EXAMINER_CONTEXT.subject} <span aria-hidden="true">·</span> {EXAMINER_CONTEXT.examination}</p>
            </div>
            <Link className={styles.primaryLink} href={`/examiner/evaluate/${EXAMINER_CONTEXT.nextPendingScriptId}`} id="btn-continue-evaluation">Continue evaluation <ArrowRight size={18} aria-hidden="true" /></Link>
          </header>

          <section className={styles.summary} aria-label="Batch summary">
            <div className={styles.summaryLead}>
              <span className={styles.overline}>Current batch</span>
              <strong>{WORK_SUMMARY_DATA.completed}<span> / {WORK_SUMMARY_DATA.assignedScripts}</span></strong>
              <p>scripts completed</p>
              <div className={styles.progressTrack} role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100} aria-label="Batch completed"><span style={{ width: `${completion}%` }} /></div>
            </div>
            <Link href="/examiner/evaluations" className={styles.summaryLink}>
              <span className={styles.overline}>Awaiting evaluation</span><strong>{WORK_SUMMARY_DATA.pending}</strong>
              <span>View scripts <ArrowUpRight size={16} aria-hidden="true" /></span>
            </Link>
            <Link href="/examiner/review" className={styles.summaryLink}>
              <span className={styles.overline}>Open review items</span><strong>{ATTENTION_ITEMS_DATA.length}</strong>
              <span>View reviews <ArrowUpRight size={16} aria-hidden="true" /></span>
            </Link>
          </section>

          <section className={styles.dashboardGrid} aria-label="Next actions">
            <article className={styles.focusCard}>
              <div className={styles.cardTopline}><span className={styles.overline}>Up next</span><span className={styles.mono}>{EXAMINER_CONTEXT.subjectCode}</span></div>
              <h2>{nextScript.scriptId.replace(/^SCRIPT\s+/, "Script ")}</h2>
              <p>{nextScript.detectedAnswers} answers detected. Review the suggested marks before signing off.</p>
              <Link href={`/examiner/evaluate/${nextScript.scriptId.replace(/^SCRIPT\s+/, "")}`} className={styles.textLink}>Open answer book <ArrowRight size={17} aria-hidden="true" /></Link>
            </article>
            <article className={styles.reviewCard}>
              <div className={styles.cardTopline}><span className={styles.overline}>Needs a closer look</span><span className={styles.mono}>{reviewItem.questionNumber}</span></div>
              <h2>{reviewItem.issueTitle}</h2>
              <p>{reviewItem.scriptId.replace(/^SCRIPT\s+/, "Script ")} · {reviewItem.issueDetail}</p>
              <Link href="/examiner/review" className={styles.textLink}>See review queue <ArrowRight size={17} aria-hidden="true" /></Link>
            </article>
          </section>
          <Link href="/examiner/reports" className={styles.reportsLink}>View batch report <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </main>
      </div>
    </ProtectedRoute>
  );
}
