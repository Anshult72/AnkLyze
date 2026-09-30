import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import styles from "./MarketingFooter.module.css";

const groups = [
  { title: "Explore", links: [
    { href: "/ai-answer-sheet-evaluation", label: "AI evaluation" },
    { href: "/handwritten-answer-sheet-grading", label: "Handwritten scripts" },
    { href: "/subjective-answer-evaluation", label: "Long answers" },
    { href: "/pricing", label: "Pricing" },
  ] },
  { title: "Learn", links: [
    { href: "/resources", label: "Resource hub" },
    { href: "/resources#accuracy", label: "Accuracy approach" },
    { href: "/resources#responsible-ai", label: "Responsible AI" },
    { href: "/about", label: "Our approach" },
  ] },
  { title: "Connect", links: [
    { href: "/contact", label: "Contact" },
    { href: "/contact?pilot=1", label: "Start a pilot" },
    { href: "/examiner/dashboard", label: "Examiner portal" },
  ] },
];

export default function MarketingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.cta}>
          <div>
            <span className={styles.eyebrow}>THE NEXT PAGE STARTS HERE</span>
            <h2>Give every answer<br /><em>the attention it deserves.</em></h2>
          </div>
          <div className={styles.ctaAction}>
            <p>Bring a sample set of scripts. We&apos;ll show you what a thoughtful first pass can look like.</p>
            <Link href="/examiner/dashboard" className={styles.primary}>Portal <ArrowRight size={18} /></Link>
            <Link href="/pricing" className={styles.secondary}>Explore plans <ArrowUpRight size={16} /></Link>
          </div>
        </div>

        <div className={styles.directory}>
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.brand} aria-label="ANKLYZE home"><Image src="/anklyze-logo.png" alt="ANKLYZE" width={2172} height={724} className={styles.brandImage} /></Link>
            <p>Thoughtful evaluation begins with the student&apos;s work and ends with the educator&apos;s judgement.</p>
            <span className={styles.brandTag}><span /> AI-ASSISTED. EDUCATOR-LED.</span>
          </div>
          {groups.map(group => (
            <nav key={group.title} aria-label={group.title} className={styles.linkGroup}>
              <h3>{group.title}</h3>
              {group.links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            </nav>
          ))}
        </div>
        <div className={styles.bottom}><span>© 2026 ANKLYZE · By MPOnline</span><span>For the people behind every grade.</span></div>
      </div>
    </footer>
  );
}
