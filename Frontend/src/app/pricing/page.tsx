import Link from "next/link";
import { ArrowRight, Check, Plus } from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import styles from "../InteriorPage.module.css";

export const metadata = {
  title: "Institutional Pricing | ANKLYZE",
  description: "Explore ANKLYZE pilot, campus and board-scale evaluation plans.",
};

const plans = [
  { index: "01", scope: "DEPARTMENT", title: "Academic Pilot", price: "₹14", unit: "/ evaluated booklet", volume: "Up to 15,000 scripts / semester", description: "A measured first cycle for a department or a focused examination set.", features: ["Handwritten script reading", "Question and rubric mapping", "Examiner workspace", "Onboarding support"], href: "/contact?plan=pilot", action: "Discuss a pilot" },
  { index: "02", scope: "UNIVERSITY", title: "Campus Review", price: "₹9.50", unit: "/ evaluated booklet", volume: "15,000–150,000 scripts / semester", description: "A connected review process across faculties, examiners and moderators.", features: ["Everything in Academic Pilot", "Course outcome mapping", "Moderation and sign-off", "Faculty orientation"], href: "/contact?plan=university", action: "Plan a campus rollout", featured: true },
  { index: "03", scope: "BOARD / CONSORTIUM", title: "At Scale", price: "Custom", unit: "scope and support", volume: "150,000+ scripts / cycle", description: "A deployment shaped around the throughput and governance of a larger examination body.", features: ["Volume and workflow planning", "Integration discovery", "Hosting options review", "Dedicated rollout design"], href: "/contact?plan=enterprise", action: "Scope your requirements" },
];

const questions = [
  ["Does the plan include educator review?", "Yes. Suggested marks are prepared for an educator to inspect, revise and approve before the final decision."],
  ["Can we begin with a small script set?", "A department pilot is designed to test the workflow with a defined collection of scripts and your marking scheme."],
  ["How is a larger deployment priced?", "Board and consortium requirements vary. We scope volume, integration, hosting and support with your examination team."],
];

export default function PricingPage() {
  return (
    <div className={styles.page}>
      <MarketingNav />
      <main>
        <section className={`${styles.hero} ${styles.pricingHero}`}>
          <div><span className={styles.eyebrow}>PLANS / BUILT AROUND YOUR CYCLE</span><h1>Start with a script set. <em>Grow with confidence.</em></h1></div>
          <p>From one department to a board-wide evaluation, choose the scale of your first step. Each plan keeps the faculty review at the centre.</p>
        </section>
        <section className={styles.pricingSection} aria-label="Pricing plans">
          <div className={styles.planGrid}>
            {plans.map(plan => (
              <article key={plan.index} className={`${styles.plan} ${plan.featured ? styles.planFeatured : ""}`}>
                <div className={styles.planTop}><span>{plan.index} / {plan.scope}</span>{plan.featured && <span className={styles.planHighlight}>CAMPUS CHOICE</span>}</div>
                <div className={styles.planMain}><h2>{plan.title}</h2><p>{plan.description}</p><div className={styles.price}><strong>{plan.price}</strong><span>{plan.unit}</span></div><span className={styles.volume}>{plan.volume}</span></div>
                <ul>{plan.features.map(feature => <li key={feature}><Check size={16} strokeWidth={1.8} /> {feature}</li>)}</ul>
                <Link href={plan.href}>{plan.action} <ArrowRight size={16} /></Link>
              </article>
            ))}
          </div>
          <p className={styles.pricingNote}>Indicative plan structure. Final scope and commercial terms are confirmed with your institution.</p>
        </section>
        <section className={styles.faq}><div><span>THE PRACTICAL QUESTIONS</span><h2>Before you begin.</h2><p>Clear answers for planning a first evaluation cycle.</p></div><div className={styles.faqList}>{questions.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={18} /></summary><p>{answer}</p></details>)}</div></section>
      </main>
      <MarketingFooter />
    </div>
  );
}
