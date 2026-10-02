"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import TopNavigation from "@/components/examiner/TopNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  EXAMINER_CONTEXT,
  WORK_SUMMARY_DATA,
  getExaminerDashboardModel,
  getSheetCode,
} from "@/data/examinerMockData";
import styles from "../ExaminerPages.module.css";

const desk = getExaminerDashboardModel();

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
            <div className={styles.heroAction}>
              <Link
                className={styles.primaryLink}
                href={
                  desk.next
                    ? desk.next.status === "Independent Evaluation"
                      ? `/examiner/evaluate/${getSheetCode(desk.next.scriptId)}?round=2&question=${desk.next.resumeQuestion || desk.next.lastQuestion || "Q04"}`
                      : `/examiner/evaluate/${getSheetCode(desk.next.scriptId)}`
                    : "/examiner/evaluations"
                }
                id="btn-continue-evaluation"
              >
                {desk.next ? "Continue evaluation" : "View your queue"} <ArrowRight size={18} aria-hidden="true" />
              </Link>
              {desk.next && (
                <span>
                  Next:{" "}
                  {desk.next.status === "Independent Evaluation"
                    ? `Sheet ${getSheetCode(desk.next.scriptId)} · ${desk.next.resumeQuestion || "Q04"} · Independent Evaluation`
                    : `Sheet ${getSheetCode(desk.next.scriptId)} · ${desk.next.status === "AI Ready" ? "Ready to evaluate" : desk.next.status}`}
                </span>
              )}
            </div>
          </header>

          <section className={styles.summary} aria-label="Current work status">
            <div className={styles.summaryLead}>
              <span className={styles.overline}>Current batch</span>
              <strong>{WORK_SUMMARY_DATA.completed}<span> / {WORK_SUMMARY_DATA.assignedScripts}</span></strong>
              <p>sheets completed · {desk.completion}%</p>
              <div className={styles.progressTrack} role="progressbar" aria-valuenow={desk.completion} aria-valuemin={0} aria-valuemax={100} aria-label="Batch completed"><span style={{ width: `${desk.completion}%` }} /></div>
            </div>
            <Link href="/examiner/evaluations" className={styles.summaryLink}>
              <span className={styles.overline}>Awaiting evaluation</span><strong>{desk.pending}</strong>
              <span>View sheets <ArrowUpRight size={16} aria-hidden="true" /></span>
            </Link>
            <Link href="/examiner/review" className={styles.summaryLink}>
              <span className={styles.overline}>Open review items</span><strong>{desk.openReviewCount}</strong>
              <span>View reviews <ArrowUpRight size={16} aria-hidden="true" /></span>
            </Link>
            <Link href="/examiner/review" className={styles.summaryLink}>
              <span className={styles.overline}>High priority flags</span><strong>{desk.highPriorityCount}</strong>
              <span>Inspect flags <ArrowUpRight size={16} aria-hidden="true" /></span>
            </Link>
          </section>

          <div className={styles.workGrid}>
            <section className={styles.workSection} aria-labelledby="dashboard-queue-heading">
              <div className={styles.workHeading}>
                <div><span className={styles.overline}>Assigned work</span><h2 id="dashboard-queue-heading">Your queue</h2></div>
                <Link href="/examiner/evaluations">View full queue <ArrowUpRight size={16} aria-hidden="true" /></Link>
              </div>
              {desk.queuePreview.length === 0 ? (
                <p className={styles.emptyDesk}>{desk.pending === 0 ? "No evaluations waiting right now." : "No sheets assigned in this queue yet."}</p>
              ) : (
                <div className={styles.queueList}>
                  {desk.queuePreview.map((sheet, index) => {
                    const code = getSheetCode(sheet.scriptId);
                    const isIndep = sheet.status === "Independent Evaluation";
                    const targetQ = sheet.resumeQuestion || sheet.lastQuestion || "Q04";
                    const evalUrl = isIndep
                      ? `/examiner/evaluate/${code}?round=2&question=${targetQ}`
                      : `/examiner/evaluate/${code}`;

                    return (
                      <div className={`${styles.queueRow} ${index === 0 ? styles.queueRowFeatured : ""}`} key={sheet.id}>
                        <div className={styles.queueIdentity}>
                          {index === 0 && <span className={styles.overline}>Up next</span>}
                          <strong>
                            {isIndep ? `Sheet ${code} · ${targetQ}` : `Sheet ${code}`}
                          </strong>
                          <span>
                            {isIndep
                              ? "Independent Evaluation · Second evaluation required"
                              : sheet.status === "In Progress"
                              ? `${sheet.evaluatedAnswers || 8} of ${sheet.totalAnswers} answers · Resume ${sheet.resumeQuestion || "Q07"}`
                              : `${sheet.detectedAnswers} of ${sheet.totalAnswers} answers detected`}
                          </span>
                        </div>
                        <div className={styles.queueState}>
                          <span>
                            {isIndep
                              ? "Independent Evaluation"
                              : sheet.status === "AI Ready"
                              ? "Ready to evaluate"
                              : sheet.status}
                          </span>
                          {sheet.riskLevel.includes("High") && <small>High risk</small>}
                        </div>
                        <Link href={evalUrl} aria-label={`${isIndep ? "Evaluate" : index === 0 ? "Open answer book" : "Open"} for Sheet ${code}`}>
                          {isIndep
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

            <section className={styles.workSection} aria-labelledby="dashboard-attention-heading">
              <div className={styles.workHeading}>
                <div><span className={styles.overline}>Review before sign-off</span><h2 id="dashboard-attention-heading">Needs your attention</h2></div>
              </div>
              {desk.attentionPreview.length === 0 ? (
                <p className={styles.emptyDesk}>Nothing needs your attention.</p>
              ) : (
                <div className={styles.attentionList}>
                  {desk.attentionPreview.map((item) => (
                    <div className={styles.attentionRow} key={item.id}>
                      <span className={styles.questionCode}>{item.questionNumber}</span>
                      <div>
                        <strong>{item.issueTitle}</strong>
                        <p>Sheet {getSheetCode(item.scriptId)} · {item.issueDetail}</p>
                        <span>{item.severity} priority</span>
                      </div>
                      <Link href={item.href} aria-label={`Review ${item.questionNumber} on Sheet ${getSheetCode(item.scriptId)}`}><ArrowUpRight size={17} aria-hidden="true" /></Link>
                    </div>
                  ))}
                </div>
              )}
              <Link className={styles.sectionFooterLink} href="/examiner/review">View all review items <ArrowRight size={16} aria-hidden="true" /></Link>
            </section>
          </div>

          <section className={styles.todaySection} aria-labelledby="dashboard-today-heading">
            <div className={styles.todayHeading}>
              <div><span className={styles.overline}>Workload</span><h2 id="dashboard-today-heading">Today&apos;s progress</h2></div>
              {desk.today.isSample && <span className={styles.sampleNote}>Demo session data · updated {WORK_SUMMARY_DATA.lastUpdated}</span>}
            </div>
            {desk.today.completedToday === 0 ? (
              <p className={styles.emptyDesk}>No evaluation activity yet today.</p>
            ) : (
              <div className={styles.todayDetails}>
                <div><strong>{desk.today.completedToday}</strong><span>sheets evaluated today</span></div>
                <div><strong>+{desk.today.completedSinceLastSession}</strong><span>since the last session</span></div>
                <div><strong>{desk.averageTimePerSheet}</strong><span>average per sheet</span></div>
                <div><strong>{desk.estimatedRemainingWorkload}</strong><span>estimated work remaining</span></div>
              </div>
            )}
          </section>

          <div className={styles.lowerGrid}>
            <section className={styles.supportSection} aria-labelledby="dashboard-snapshot-heading">
              <span className={styles.overline}>Decision record</span>
              <h2 id="dashboard-snapshot-heading">Evaluation snapshot</h2>
              <p>AI suggestions stay advisory until an examiner signs off.</p>
              <dl className={styles.snapshotList}>
                <div><dt>Suggestions accepted</dt><dd>{desk.workflow.aiAcceptedCount}</dd></div>
                <div><dt>Examiner adjustments</dt><dd>{desk.workflow.aiOverriddenCount}</dd></div>
                <div><dt>Open question flags</dt><dd>{desk.openReviewCount}</dd></div>
              </dl>
              <Link className={styles.sectionFooterLink} href="/examiner/reports">View workflow report <ArrowRight size={16} aria-hidden="true" /></Link>
            </section>

            <section className={styles.supportSection} aria-labelledby="dashboard-activity-heading">
              <span className={styles.overline}>Latest changes</span>
              <h2 id="dashboard-activity-heading">Recent activity</h2>
              {desk.recentActivity.length === 0 ? (
                <p className={styles.emptyDesk}>No recent evaluation activity.</p>
              ) : (
                <ol className={styles.activityList}>
                  {desk.recentActivity.map((event) => (
                    <li key={event.id}>
                      <time>{event.time ?? event.timestamp}</time>
                      <div>
                        {event.href ? <Link href={event.href}>{event.title}</Link> : <strong>{event.title}</strong>}
                        <p>{event.detail ?? event.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
