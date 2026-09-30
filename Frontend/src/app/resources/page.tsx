import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Eye, LockKeyhole, ScanText } from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import styles from "../InteriorPage.module.css";

export const metadata = {
  title: "Resource Hub & Methodology | ANKLYZE",
  description: "A field guide to rubric-linked evaluation, responsible AI and educator review.",
};

const chapters = [
  { id: "accuracy", number: "01", title: "Reading accuracy", icon: ScanText, lead: "Begin with the page, not the prediction.", body: "Handwriting and layout can be ambiguous. A responsible reading workflow keeps the source scan close to any extracted text, highlights uncertain regions and makes correction possible before marking.", points: ["Preserve original page context", "Show uncertain readings for review", "Check equations, diagrams and struck-out work"] },
  { id: "responsible-ai", number: "02", title: "Responsible AI", icon: Eye, lead: "Make the suggestion inspectable.", body: "A proposed mark should point to the answer evidence and a criterion in the marking scheme. The educator needs enough context to understand why a suggestion appeared and where it may be wrong.", points: ["Display answer and rubric together", "Keep suggestions editable", "Route unclear cases to a person"] },
  { id: "evaluation", number: "03", title: "Evaluation method", icon: BookOpen, lead: "Follow the work, step by step.", body: "A complex answer often earns marks for more than its final line. Question-level criteria can separate a correct method, supporting working and a final result without losing the whole response.", points: ["Map sub-parts to criteria", "Record partial credit with evidence", "Let faculty add a specific note"] },
  { id: "security", number: "04", title: "Security & governance", icon: LockKeyhole, lead: "A decision needs a clear owner.", body: "Examination work involves sensitive records and multiple roles. Review permissions, change history and institutional controls should be part of the workflow from the start.", points: ["Use role-aware access", "Keep reviewer changes traceable", "Plan retention and hosting with the institution"] },
];

export default function ResourcesPage() {
  return (
    <div className={styles.page}>
      <MarketingNav />
      <main>
        <section className={`${styles.hero} ${styles.resourcesHero}`}>
          <div><span className={styles.eyebrow}>THE ANKLYZE FIELD GUIDE / VOL. 01</span><h1>Good questions make <em>better systems.</em></h1></div>
          <p>How should a handwritten answer be read? What makes a suggested mark reviewable? This guide collects the principles behind a more accountable evaluation workflow.</p>
        </section>
        <section className={styles.library}>
          <aside className={styles.libraryIndex}><span>CONTENTS</span><nav aria-label="Resource chapters">{chapters.map(chapter => <a key={chapter.id} href={`#${chapter.id}`}><span>{chapter.number}</span>{chapter.title}</a>)}</nav><Link href="/contact">Ask us a question <ArrowUpRight size={15} /></Link></aside>
          <div className={styles.chapters}>
            {chapters.map(({ id, number, title, icon: Icon, lead, body, points }) => (
              <article id={id} key={id} className={styles.chapter}>
                <div className={styles.chapterTop}><span>CHAPTER {number} / 04</span><Icon size={24} strokeWidth={1.5} /></div>
                <h2>{title}</h2><h3>{lead}</h3><p>{body}</p>
                <ul>{points.map(point => <li key={point}><span />{point}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.resourceClosing}><span>THE NEXT CONVERSATION</span><h2>Bring your own evaluation questions.</h2><Link href="/contact">Talk with the team <ArrowRight size={17} /></Link></section>
      </main>
      <MarketingFooter />
    </div>
  );
}
