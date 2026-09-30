"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, GraduationCap, LockKeyhole, MessageSquareText, ShieldCheck } from "lucide-react";
import styles from "./FeatureSuiteSection.module.css";

const capabilities = [
  {
    number: "01", label: "Human review", icon: ShieldCheck,
    title: "The final mark belongs to the educator.",
    description: "ANKLYZE prepares a rubric-linked first pass. Faculty can inspect the answer, revise any suggestion, and decide when the work is ready.",
    tags: ["Faculty sign-off", "Evidence beside marks", "Review trail"],
    href: "/examiner/dashboard", link: "Open the review workspace",
    sampleLabel: "FACULTY DECISION", sampleValue: "4 / 5", sampleNote: "Method checked. Unit confirmed.", sampleFooter: "Reviewed before release",
  },
  {
    number: "02", label: "Outcome mapping", icon: GraduationCap,
    title: "See how each question connects to outcomes.",
    description: "Question-level evaluation can be organized around course outcomes, so the reporting work begins with the actual student answer.",
    tags: ["Question mapping", "Course outcomes", "Report-ready data"],
    href: "/ai-answer-sheet-evaluation", link: "Explore evaluation",
    sampleLabel: "OUTCOME THREAD", sampleValue: "Q.03 → CO2", sampleNote: "Apply Newton’s second law", sampleFooter: "Evidence stays attached",
  },
  {
    number: "03", label: "Moderation", icon: BookOpenCheck,
    title: "A clear route from script to sign-off.",
    description: "Give examiners and moderators a shared view of what was proposed, what changed, and who made the final decision.",
    tags: ["Role-based review", "Moderation queue", "Decision history"],
    href: "/handwritten-answer-sheet-grading", link: "See script workflow",
    sampleLabel: "REVIEW ROUTE", sampleValue: "01 → 02 → 03", sampleNote: "Examiner · Moderator · Approval", sampleFooter: "Every step has an owner",
  },
  {
    number: "04", label: "Useful feedback", icon: MessageSquareText,
    title: "A number with a reason behind it.",
    description: "Turn a score into a specific observation linked to the answer, while keeping the educator’s own voice in the final note.",
    tags: ["Criterion notes", "Student clarity", "Editable feedback"],
    href: "/subjective-answer-evaluation", link: "Explore long-answer review",
    sampleLabel: "MARGIN NOTE", sampleValue: "Good method.", sampleNote: "Explain what makes this the net force.", sampleFooter: "Feedback worth reading",
  },
  {
    number: "05", label: "Responsible records", icon: LockKeyhole,
    title: "The record should tell the whole story.",
    description: "Keep the script, suggested mark, reviewer changes, and final decision together for a more accountable evaluation process.",
    tags: ["Review history", "Controlled access", "Traceable changes"],
    href: "/resources#security", link: "Read the approach",
    sampleLabel: "REVIEW RECORD", sampleValue: "Q.03 / 4 marks", sampleNote: "Draft checked by faculty", sampleFooter: "Decision recorded",
  },
];

export default function FeatureSuiteSection() {
  const [active, setActive] = useState(0);
  const feature = capabilities[active];
  const Icon = feature.icon;

  return (
    <section id="features" className={styles.section} aria-labelledby="feature-suite-title">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>THE ANKLYZE TOOLKIT <span> / 05 CAPABILITIES</span></span>
          <h2 id="feature-suite-title">Built around the <em>decision,</em><br />not just the digit.</h2>
          <p>Five connected capabilities, from the first reading of a page to the educator’s final word.</p>
        </div>

        <div className={styles.layout}>
          <div className={styles.index} aria-label="Capabilities">
            {capabilities.map((item, index) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.number}
                  type="button"
                  aria-pressed={active === index}
                  onClick={() => setActive(index)}
                  className={`${styles.indexItem} ${active === index ? styles.indexActive : ""}`}
                >
                  <span className={styles.indexNumber}>{item.number}</span>
                  <ItemIcon size={19} strokeWidth={1.6} />
                  <span>{item.label}</span>
                  <span className={styles.indexArrow}>↗</span>
                </button>
              );
            })}
          </div>

          <div id="capability-panel" className={styles.panel}>
            <div className={styles.panelCopy}>
              <div className={styles.panelMeta}><span>CAPABILITY {feature.number} / 05</span><span className={styles.panelIcon}><Icon size={22} strokeWidth={1.6} /></span></div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className={styles.tags}>{feature.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
              <Link href={feature.href} className={styles.panelLink}>{feature.link} <ArrowUpRight size={17} /></Link>
            </div>
            <div className={styles.sample} aria-label={`${feature.sampleLabel}: ${feature.sampleValue}`}>
              <div className={styles.sampleTop}><span className={styles.sampleDot} /> EXAMINATION DESK <span>{feature.number} / 05</span></div>
              <div className={styles.sampleSheet}>
                <span className={styles.sampleLabel}>{feature.sampleLabel}</span>
                <strong>{feature.sampleValue}</strong>
                <p>{feature.sampleNote}</p>
                <div><ShieldCheck size={15} /> {feature.sampleFooter}</div>
              </div>
              <span className={styles.sampleCaption}>THE WORK BEHIND THE MARK</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
