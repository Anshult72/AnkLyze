"use client";

import TopNavigation from "./TopNavigation";
import EvaluationQueue from "./EvaluationQueue";
import AttentionList from "./AttentionList";
import ProgressSection from "./ProgressSection";
import RecentActivity from "./RecentActivity";
import WorkSummary from "./WorkSummary";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { EVALUATION_QUEUE_DATA, ATTENTION_ITEMS_DATA, PROGRESS_METRICS_DATA, RECENT_ACTIVITY_DATA, WORK_SUMMARY_DATA } from "@/data/examinerMockData";
import { EXAMINER_CONTEXT } from "@/data/examinerMockData";
import styles from "@/app/examiner/ExaminerPages.module.css";

const sections = {
  evaluations: { title: "My evaluations", description: "The scripts assigned to you. Pick up where you left off, or filter the queue to find one." },
  review: { title: "Review queue", description: "Answers that need a second look before their marks are finalized." },
  reports: { title: "Reports", description: "Batch progress and a record of recent evaluation work." },
};

export default function ExaminerSectionPage({ section }: { section: keyof typeof sections }) {
  const { title, description } = sections[section];
  return (
    <ProtectedRoute allowedRoles={["EXAMINER", "HEAD_EXAMINER", "SUPER_ADMIN"]}>
      <div className={`workspace-shell ${styles.page}`}>
        <TopNavigation activeTab={section} />
        <main className={styles.main}>
          <header className={styles.sectionIntro}>
            <div>
              <p className={styles.eyebrow}>Examiner desk <span aria-hidden="true">/</span> {EXAMINER_CONTEXT.subjectCode}</p>
              <h1>{title}</h1>
              <p className={styles.introText}>{description}</p>
            </div>
            <span className={styles.sectionMeta}>{EXAMINER_CONTEXT.session}</span>
          </header>
          <div className={styles.sectionContent}>
            {section === "evaluations" && <EvaluationQueue scripts={EVALUATION_QUEUE_DATA} />}
            {section === "review" && <AttentionList items={ATTENTION_ITEMS_DATA} />}
            {section === "reports" && (
            <>
              <WorkSummary metrics={WORK_SUMMARY_DATA} />
              <div className={styles.reportsGrid}>
                <ProgressSection metrics={PROGRESS_METRICS_DATA} />
                <RecentActivity activities={RECENT_ACTIVITY_DATA} />
              </div>
            </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
