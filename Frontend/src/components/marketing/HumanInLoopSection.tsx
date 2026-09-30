import { Check, Eye, Flag, LockKeyhole, PenLine, ShieldCheck } from "lucide-react";
import styles from "./HumanInLoopSection.module.css";

const principles = [
  {
    number: "01",
    icon: Eye,
    title: "The evidence stays in view.",
    description: "A suggested mark sits beside the student’s answer and the criterion used to reach it.",
  },
  {
    number: "02",
    icon: PenLine,
    title: "The reviewer can change course.",
    description: "Faculty can confirm a draft, revise the mark, or add the context an automated pass missed.",
  },
  {
    number: "03",
    icon: Flag,
    title: "Uncertain work gets attention.",
    description: "Answers that need a closer look are surfaced for a deliberate human decision.",
  },
  {
    number: "04",
    icon: LockKeyhole,
    title: "Access follows responsibility.",
    description: "Student records and review actions belong in controlled institutional workflows.",
  },
];

export default function HumanInLoopSection() {
  return (
    <section className={styles.section} aria-labelledby="review-desk-title">
      <div className={styles.container}>
        <div className={styles.intro}>
          <div>
            <span className={styles.eyebrow}><span className={styles.eyebrowLine} /> THE REVIEW DESK / 01</span>
            <h2 id="review-desk-title">Every mark gets<br /><em>a second look.</em></h2>
          </div>
          <div className={styles.introAside}>
            <p>ANKLYZE brings the answer, the rubric, and a suggested decision together. The educator reads the evidence and makes the call.</p>
            <span><ShieldCheck size={16} strokeWidth={1.8} /> AUTHORITY REMAINS HUMAN</span>
          </div>
        </div>

        <div className={styles.desk} aria-label="Illustrative evaluation review workflow">
          <div className={styles.deskTop}>
            <div className={styles.deskIdentity}><span className={styles.deskDot} /> ANKLYZE <span className={styles.deskSlash}>/</span> REVIEW DESK</div>
            <span className={styles.deskStatus}>ILLUSTRATIVE WORKFLOW <span>·</span> Q.03(B)</span>
          </div>

          <div className={styles.documentGrid}>
            <article className={`${styles.document} ${styles.script}`}>
              <div className={styles.documentLabel}><span>01 / SOURCE</span><span>SCAN 03</span></div>
              <div className={styles.scriptPaper}>
                <span className={styles.paperSubject}>PHYSICS · STUDENT ANSWER</span>
                <h3>Find the net force.</h3>
                <span className={styles.paperPrompt}>What does “net” mean here?</span>
                <p>Given: m = 2 kg, a = 3 m/s²</p>
                <p>Force = mass × acceleration</p>
                <p className={styles.paperAnswer}>F = 2 × 3 = <mark>6 N</mark></p>
                <span className={styles.paperMargin} aria-hidden="true" />
              </div>
              <p className={styles.documentFoot}>The original work remains visible.</p>
            </article>

            <article className={`${styles.document} ${styles.draft}`}>
              <div className={styles.documentLabel}><span>02 / FIRST PASS</span><span className={styles.draftTag}>DRAFT</span></div>
              <div className={styles.draftScore}><strong>4<span>/5</span></strong><span>SUGGESTED<br />MARK</span></div>
              <div className={styles.evidence}>
                <span className={styles.evidenceTitle}>WHY THIS MARK?</span>
                <div><Check size={15} /><span>Correct relationship: F = ma</span></div>
                <div><Check size={15} /><span>Calculation and unit shown</span></div>
                <p>One mark held for explaining what “net” means.</p>
              </div>
              <p className={styles.documentFoot}>A proposal, ready to be questioned.</p>
            </article>

            <article className={`${styles.document} ${styles.decision}`}>
              <div className={styles.documentLabel}><span>03 / FINAL SAY</span><span>FACULTY</span></div>
              <div className={styles.decisionSeal}><ShieldCheck size={23} strokeWidth={1.7} /></div>
              <span className={styles.decisionKicker}>REVIEWER DECISION</span>
              <h3>4 / 5 <span>confirmed</span></h3>
              <p className={styles.facultyNote}>“The method and unit are clear. Explain what makes this the <em>net</em> force.”</p>
              <div className={styles.signature}><span>Reviewed by faculty</span><span className={styles.signatureLine} aria-hidden="true" /></div>
              <p className={styles.documentFoot}><Check size={14} /> Approved after review</p>
            </article>
          </div>

          <div className={styles.deskBottom}>
            <span>ANSWER</span><span className={styles.flowLine} /><span>EVIDENCE</span><span className={styles.flowLine} /><span>DECISION</span>
          </div>
        </div>

        <div className={styles.principlesHeader}><span>WHAT MAKES THE REVIEW TRUSTWORTHY</span><span>FOUR QUIET SAFEGUARDS</span></div>
        <div className={styles.principles}>
          {principles.map(({ number, icon: Icon, title, description }) => (
            <article className={styles.principle} key={number}>
              <span className={styles.principleNumber}>{number}</span>
              <span className={styles.principleIcon}><Icon size={21} strokeWidth={1.6} /></span>
              <div><h3>{title}</h3><p>{description}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
