import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, PenLine, ScanText, ShieldCheck } from "lucide-react";
import MarketingNav from "./MarketingNav";
import MarketingFooter from "./MarketingFooter";
import styles from "./SolutionPage.module.css";

type Variant = "evaluation" | "handwriting" | "subjective";

const content = {
  evaluation: {
    issue: "01 / AI EVALUATION",
    title: <>Let the first pass find the <em>evidence.</em></>,
    description: "From scanned answer book to rubric-linked draft, ANKLYZE organizes the work before an educator makes the decision.",
    firstAction: "Request an evaluation pilot",
    contact: "/contact?solution=ai-eval",
    exampleLabel: "RUBRIC REVIEW / Q.03(B)",
    exampleTitle: "Newton’s second law",
    exampleLine: "F = m × a = 6 N",
    exampleNote: "Formula and calculation supported by the answer.",
    steps: [
      ["Find the question", "Separate attempts and sub-parts so the answer is read against the right marking scheme."],
      ["Attach the evidence", "Place each suggested step mark beside the line or diagram that supports it."],
      ["Leave room to decide", "Faculty can accept, adjust, or flag the draft before any final result."],
    ],
    closing: "A faster first pass. A more thoughtful final one.",
  },
  handwriting: {
    issue: "02 / HANDWRITTEN SCRIPTS",
    title: <>Read the work <em>as it was written.</em></>,
    description: "Messy margins, crossed-out starts and working between the lines carry meaning. The original page stays in view as the script is interpreted.",
    firstAction: "Try sample scripts",
    contact: "/contact?solution=handwritten",
    exampleLabel: "ORIGINAL PAGE / TRANSCRIPTION",
    exampleTitle: "The student’s working",
    exampleLine: "F = 2 × 3 = 6 N",
    exampleNote: "A corrected calculation remains visible in the source scan.",
    steps: [
      ["Keep the page", "Preserve the scanned answer as the source of truth for every interpretation."],
      ["Read beyond plain text", "Bring handwriting, equations and labelled sketches into the same review view."],
      ["Ask when unclear", "Route uncertain readings to an educator instead of hiding the ambiguity."],
    ],
    closing: "The page has character. The review keeps its context.",
  },
  subjective: {
    issue: "03 / LONG ANSWERS",
    title: <>Make room for <em>more than one right sentence.</em></>,
    description: "Essay and case-study answers need a framework that can recognize reasoning, evidence and structure without flattening them into a single keyword match.",
    firstAction: "Explore long-answer review",
    contact: "/contact?solution=subjective",
    exampleLabel: "CRITERION VIEW / Q.06",
    exampleTitle: "A reasoned response",
    exampleLine: "Claim → evidence → conclusion",
    exampleNote: "Each criterion can be reviewed and edited by faculty.",
    steps: [
      ["Start with a rubric", "Set the criteria and weights that fit the question, subject and institution."],
      ["Read the reasoning", "Compare the student’s argument and examples with each criterion."],
      ["Explain the mark", "Give a specific note that an educator can refine before sign-off."],
    ],
    closing: "A long answer deserves a considered answer back.",
  },
} as const;

function Example({ variant }: { variant: Variant }) {
  const item = content[variant];
  return (
    <div className={`${styles.example} ${styles[variant]}`} aria-label={item.exampleLabel}>
      <div className={styles.exampleTop}><span className={styles.exampleDot} /> ANKLYZE / WORKING VIEW <span>03 / 08</span></div>
      <div className={styles.examplePaper}>
        <span className={styles.exampleLabel}>{item.exampleLabel}</span>
        <h2>{item.exampleTitle}</h2>
        <div className={styles.exampleLine}>{item.exampleLine}</div>
        <p>{item.exampleNote}</p>
        <div className={styles.exampleCheck}><Check size={15} /> ORIGINAL WORK LINKED</div>
      </div>
      <div className={styles.exampleBottom}><span>ANSWER IN CONTEXT</span><span>EDUCATOR IN CONTROL</span></div>
    </div>
  );
}

export default function SolutionPage({ variant }: { variant: Variant }) {
  const item = content[variant];
  return (
    <div className={styles.page}>
      <MarketingNav />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}><span /> SOLUTIONS / {item.issue}</span>
            <h1>{item.title}</h1>
            <p>{item.description}</p>
            <div className={styles.actions}>
              <Link href={item.contact} className={styles.primary}>{item.firstAction} <ArrowRight size={17} /></Link>
              <Link href="/examiner/dashboard" className={styles.secondary}>View examiner desk <ArrowUpRight size={16} /></Link>
            </div>
            <div className={styles.heroFoot}><ShieldCheck size={17} /> AI-ASSISTED · EDUCATOR-LED</div>
          </div>
          <Example variant={variant} />
        </section>

        <section className={styles.method}>
          <div className={styles.methodIntro}><span>THE METHOD / IN THREE MOVES</span><h2>From the page<br />to a <em>reviewable decision.</em></h2></div>
          <div className={styles.steps}>
            {item.steps.map(([title, description], index) => (
              <article key={title} className={styles.step}>
                <span>0{index + 1}</span>
                <div className={styles.stepIcon}>{index === 0 ? <ScanText size={24} strokeWidth={1.5} /> : index === 1 ? <PenLine size={24} strokeWidth={1.5} /> : <ShieldCheck size={24} strokeWidth={1.5} />}</div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.closing}><span>ANKLYZE / THE NEXT STEP</span><h2>{item.closing}</h2><Link href={item.contact}>Start a conversation <ArrowRight size={18} /></Link></section>
      </main>
      <MarketingFooter />
    </div>
  );
}
