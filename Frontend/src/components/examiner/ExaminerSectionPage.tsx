"use client";

import TopNavigation from "./TopNavigation";
import EvaluationQueue from "./EvaluationQueue";
import AttentionList from "./AttentionList";
import ExaminerReportsView from "./ExaminerReportsView";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { EVALUATION_QUEUE_DATA, ATTENTION_ITEMS_DATA } from "@/data/examinerMockData";
import { EXAMINER_CONTEXT } from "@/data/examinerMockData";
import styles from "@/app/examiner/ExaminerPages.module.css";

const sections = {
  evaluations: { title: "My evaluations", description: "The sheets assigned to you. Pick up where you left off, or filter the queue to find one." },
  review: { title: "Review queue", description: "Independent evaluations assigned to you." },
  reports: { title: "Reports", description: "Batch evaluation records, marking distribution, question review density, and operational workload." },
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
            {section === "evaluations" && (
              <>
                <div className={styles.queueOverview} aria-label="Assigned sheet status">
                  <div><span className={styles.overline}>Ready to mark</span><strong>{EVALUATION_QUEUE_DATA.filter((sheet) => sheet.status === "AI Ready").length}</strong><p>AI suggestions ready for your decision</p></div>
                  <div><span className={styles.overline}>Independent</span><strong>{EVALUATION_QUEUE_DATA.filter((sheet) => sheet.status === "Independent Evaluation").length}</strong><p>Assigned Round 2 evaluation</p></div>
                  <div><span className={styles.overline}>Needs review</span><strong>{EVALUATION_QUEUE_DATA.filter((sheet) => sheet.status === "Needs Review").length}</strong><p>Check the question before finalizing</p></div>
                  <div><span className={styles.overline}>Attention</span><strong>{EVALUATION_QUEUE_DATA.filter((sheet) => sheet.status === "Attention").length}</strong><p>Resolve scan or confidence concerns</p></div>
                  <div><span className={styles.overline}>Completed</span><strong>{EVALUATION_QUEUE_DATA.filter((sheet) => sheet.status === "Completed").length}</strong><p>Evaluated and signed in batch</p></div>
                </div>
                <EvaluationQueue scripts={EVALUATION_QUEUE_DATA} />
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
