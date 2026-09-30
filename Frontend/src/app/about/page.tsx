import Link from "next/link";
import { ArrowRight, ArrowUpRight, Eye, HeartHandshake, ShieldCheck } from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import styles from "../InteriorPage.module.css";

export const metadata = {
  title: "About ANKLYZE | A More Thoughtful Way to Evaluate",
  description: "Learn why ANKLYZE keeps student work, rubric evidence and educator judgement together.",
};

const beliefs = [
  { number: "01", icon: HeartHandshake, title: "The student is more than a score.", body: "Working, corrections and partial understanding all deserve to be seen. A useful evaluation starts by reading the answer in full." },
  { number: "02", icon: Eye, title: "A mark should show its reason.", body: "Suggestions should point back to the answer and the marking criterion so an educator can challenge or confirm them." },
  { number: "03", icon: ShieldCheck, title: "The final decision is human.", body: "Technology can prepare the desk. Faculty expertise supplies the context, the judgement and the sign-off." },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <MarketingNav />
      <main>
        <section className={`${styles.hero} ${styles.aboutHero}`}>
          <div>
            <span className={styles.eyebrow}>ANKLYZE / OUR POINT OF VIEW</span>
            <h1>Better evaluation begins with <em>better attention.</em></h1>
            <p>Every answer sheet holds a student&apos;s attempt to explain, apply and improve. We built ANKLYZE to help educators see that work clearly and make decisions they can stand behind.</p>
            <Link href="/contact?pilot=1" className={styles.primaryLink}>Start a conversation <ArrowRight size={17} /></Link>
          </div>
          <div className={styles.manifesto}>
            <span>NOTE NO. 01 / FROM OUR DESK</span>
            <p>“The most important part of an evaluation isn&apos;t the number at the end. It&apos;s the thinking we noticed along the way.”</p>
            <div><span>AI-ASSISTED</span><span>EDUCATOR-LED</span></div>
          </div>
        </section>

        <section className={styles.beliefs}>
          <div className={styles.sectionIntro}><span>THREE BELIEFS / ONE WORKFLOW</span><h2>What we keep<br /><em>at the centre.</em></h2></div>
          <div className={styles.beliefList}>
            {beliefs.map(({ number, icon: Icon, title, body }) => (
              <article key={number} className={styles.belief}>
                <span className={styles.beliefNumber}>{number}</span>
                <span className={styles.beliefIcon}><Icon size={23} strokeWidth={1.5} /></span>
                <div><h3>{title}</h3><p>{body}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.aboutClosing}><span>WHERE THE WORK GOES NEXT</span><h2>Put a real script on the table.</h2><p>See how a rubric-linked draft and a faculty decision can sit side by side.</p><div><Link href="/examiner/dashboard">Explore examiner desk <ArrowUpRight size={17} /></Link><Link href="/contact">Talk to our team <ArrowRight size={17} /></Link></div></section>
      </main>
      <MarketingFooter />
    </div>
  );
}
