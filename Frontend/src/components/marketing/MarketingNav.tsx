"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, BookOpenText, ChevronDown, ClipboardCheck, FilePenLine, LayoutDashboard, Menu, ScanText, ShieldCheck, X } from "lucide-react";
import styles from "./MarketingNav.module.css";

const solutions = [
  { href: "/ai-answer-sheet-evaluation", title: "AI answer sheet evaluation", description: "A clearer first pass on every script", icon: ScanText },
  { href: "/handwritten-answer-sheet-grading", title: "Handwritten script grading", description: "Read working, formulas and diagrams", icon: FilePenLine },
  { href: "/subjective-answer-evaluation", title: "Subjective evaluation", description: "Consistent decisions for open answers", icon: ClipboardCheck },
];

const resources = [
  { href: "/resources", title: "Resource hub", description: "Guides, research and useful reading", icon: BookOpenText },
  { href: "/resources#accuracy", title: "Accuracy methodology", description: "How evaluations are verified", icon: ClipboardCheck },
  { href: "/resources#responsible-ai", title: "Responsible AI grading", description: "The examiner stays in control", icon: ShieldCheck },
];

type OpenMenu = "solutions" | "resources" | null;

export default function MarketingNav() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const closeAll = () => { setOpenMenu(null); setMobileOpen(false); };
  const solutionsActive = solutions.some(item => pathname === item.href);
  const resourcesActive = pathname === "/resources";

  return (
    <header ref={headerRef} className={styles.header}>
      <div className={styles.shell}>
        <Link href="/" className={styles.brand} onClick={closeAll} aria-label="ANKLYZE home">
          <Image src="/anklyze-logo.png" alt="" width={2172} height={724} priority className={styles.brandLogo} />
        </Link>

        <nav className={styles.desktopNav} aria-label="Main navigation">
          <div className={styles.navPill}>
            <div className={styles.dropdownRoot} onMouseEnter={() => setOpenMenu("solutions")} onMouseLeave={() => setOpenMenu(null)}>
              <button type="button" className={`${styles.navItem} ${solutionsActive ? styles.navItemActive : ""}`} aria-expanded={openMenu === "solutions"} aria-controls="solutions-menu" onClick={() => setOpenMenu(openMenu === "solutions" ? null : "solutions")}>
                Solutions <ChevronDown size={14} className={openMenu === "solutions" ? styles.chevronOpen : ""} />
              </button>
              {openMenu === "solutions" && (
                <div className={styles.dropdownZone} id="solutions-menu">
                  <div className={styles.dropdownPanel}>
                    <span className={styles.dropdownLabel}>EVALUATION WORKFLOWS</span>
                    {solutions.map(({ href, title, description, icon: Icon }) => (
                      <Link key={href} href={href} className={styles.dropdownLink} onClick={closeAll}>
                        <span className={styles.dropdownIcon}><Icon size={17} strokeWidth={1.8} /></span>
                        <span><strong>{title}</strong><small>{description}</small></span>
                        <ArrowUpRight className={styles.dropdownArrow} size={15} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.dropdownRoot} onMouseEnter={() => setOpenMenu("resources")} onMouseLeave={() => setOpenMenu(null)}>
              <button type="button" className={`${styles.navItem} ${resourcesActive ? styles.navItemActive : ""}`} aria-expanded={openMenu === "resources"} aria-controls="resources-menu" onClick={() => setOpenMenu(openMenu === "resources" ? null : "resources")}>
                Resources <ChevronDown size={14} className={openMenu === "resources" ? styles.chevronOpen : ""} />
              </button>
              {openMenu === "resources" && (
                <div className={styles.dropdownZone} id="resources-menu">
                  <div className={styles.dropdownPanel}>
                    <span className={styles.dropdownLabel}>LEARN WITH ANKLYZE</span>
                    {resources.map(({ href, title, description, icon: Icon }) => (
                      <Link key={href} href={href} className={styles.dropdownLink} onClick={closeAll}>
                        <span className={styles.dropdownIcon}><Icon size={17} strokeWidth={1.8} /></span>
                        <span><strong>{title}</strong><small>{description}</small></span>
                        <ArrowUpRight className={styles.dropdownArrow} size={15} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link href="/about" className={`${styles.navItem} ${pathname === "/about" ? styles.navItemActive : ""}`} onClick={closeAll}>About</Link>
            <Link href="/contact" className={`${styles.navItem} ${pathname === "/contact" ? styles.navItemActive : ""}`} onClick={closeAll}>Contact</Link>
            <Link href="/pricing" className={`${styles.navItem} ${pathname === "/pricing" ? styles.navItemActive : ""}`} onClick={closeAll}>Pricing</Link>
          </div>
        </nav>

        <div className={styles.actions}>
          <Link href="/examiner/dashboard" className={styles.portalLink} title="Open Portal">
            <LayoutDashboard size={16} strokeWidth={1.8} /> <span>Portal</span>
          </Link>
          <button type="button" className={styles.menuButton} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => { setMobileOpen(!mobileOpen); setOpenMenu(null); }}>
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-navigation" className={styles.mobilePanel} aria-label="Mobile navigation">
          <span className={styles.mobileLabel}>SOLUTIONS</span>
          {solutions.map(({ href, title }) => <Link key={href} href={href} onClick={closeAll} className={styles.mobileLink}>{title}<ArrowUpRight size={15} /></Link>)}
          <div className={styles.mobileDivider} />
          <span className={styles.mobileLabel}>EXPLORE</span>
          {[
            { href: "/resources", title: "Resources" },
            { href: "/about", title: "About" },
            { href: "/pricing", title: "Pricing" },
            { href: "/contact", title: "Contact" },
          ].map(({ href, title }) => <Link key={href} href={href} onClick={closeAll} className={styles.mobileLink}>{title}<ArrowUpRight size={15} /></Link>)}
        </nav>
      )}
    </header>
  );
}
