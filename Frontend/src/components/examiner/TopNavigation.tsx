"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck, ChartNoAxesCombined, ChevronDown,
  ClipboardList, FileStack, LayoutDashboard, LogOut, Menu,
  ShieldCheck, UserRound, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EXAMINER_CONTEXT } from "@/data/examinerMockData";
import styles from "./TopNavigation.module.css";

interface TopNavigationProps {
  activeTab?: "dashboard" | "evaluations" | "review" | "reports" | "admin-exams" | "admin-scripts";
}

const baseItems = [
  { id: "dashboard", label: "Dashboard", href: "/examiner/dashboard", icon: LayoutDashboard },
  { id: "evaluations", label: "My Evaluations", href: "/examiner/evaluations", icon: BookOpenCheck },
  { id: "review", label: "Review Queue", href: "/examiner/review", icon: ClipboardList },
  { id: "reports", label: "Reports", href: "/examiner/reports", icon: ChartNoAxesCombined },
] as const;

const adminItems = [
  { id: "admin-exams", label: "Exam Management", href: "/admin/exams", icon: FileStack },
  { id: "admin-scripts", label: "Script Intake", href: "/admin/scripts", icon: ShieldCheck },
] as const;

export default function TopNavigation({ activeTab = "dashboard" }: TopNavigationProps) {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const selectedNav = [...baseItems, ...adminItems].find(item => item.href === pathname)?.id ?? activeTab;

  const displayName = user?.fullName || EXAMINER_CONTEXT.examinerName;
  const displayRole = user?.role || "EXAMINER";
  const isAdminOrHead = displayRole === "SUPER_ADMIN" || displayRole === "HEAD_EXAMINER";
  const initials = displayName.split(" ").map(part => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const closeDrawer = () => {
    setDrawerOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  const renderLink = (item: (typeof baseItems)[number] | (typeof adminItems)[number]) => {
    const Icon = item.icon;
    const selected = selectedNav === item.id;
    return (
      <Link key={item.id} href={item.href} onClick={closeDrawer} className={`${styles.navLink} ${selected ? styles.navLinkActive : ""}`} aria-current={selected ? "page" : undefined} aria-label={item.label} title={item.label}>
        <Icon size={22} strokeWidth={1.8} />
        <span className={styles.navLabel}>{item.label}</span>
        {selected && <span className={styles.activeMark} aria-hidden="true" />}
      </Link>
    );
  };

  return (
    <>
      <header className={styles.mobileBar}>
        <button type="button" className={styles.menuButton} onClick={() => setDrawerOpen(true)} aria-label="Open portal menu" aria-expanded={drawerOpen} aria-controls="portal-sidebar"><Menu size={21} /></button>
        <Link href="/examiner/dashboard" className={styles.mobileBrand} aria-label="ANKLYZE dashboard"><Image src="/anklyze-logo.png" alt="ANKLYZE" width={135} height={45} priority /></Link>
        <span className={styles.mobileRole}>PORTAL</span>
      </header>

      {drawerOpen && <button type="button" className={styles.backdrop} aria-label="Close portal menu" onClick={closeDrawer} />}

      <aside id="portal-sidebar" className={`portal-sidebar ${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ""}`} aria-label="Portal navigation">
        <div className={styles.brandRow}>
          <Link href="/examiner/dashboard" onClick={closeDrawer} className={styles.brand} aria-label="ANKLYZE dashboard"><Image src="/anklyze-mark.png" alt="" width={48} height={48} priority className={styles.compactLogo} /><Image src="/anklyze-logo.png" alt="ANKLYZE" width={210} height={70} priority className={styles.fullLogo} /></Link>
          <button type="button" className={styles.closeButton} onClick={closeDrawer} aria-label="Close portal menu"><X size={19} /></button>
        </div>


        <nav className={styles.navigation} aria-label="Main portal navigation">
          <div className={styles.navGroup}>
            {baseItems.map(renderLink)}
          </div>
          {isAdminOrHead && (
            <div className={styles.navGroup}>
              {adminItems.map(renderLink)}
            </div>
          )}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.utility}>
            <button type="button" className={`${styles.accountButton} ${profileOpen ? styles.utilityButtonOpen : ""}`} onClick={() => { setProfileOpen(value => !value); }} aria-label={`Account: ${displayName}`} aria-expanded={profileOpen} aria-controls="portal-account">
              <span className={styles.avatar}>{initials || "EX"}</span>
              <span className={styles.accountText}><strong>{displayName}</strong><small>{displayRole.replaceAll("_", " ")}</small></span>
              <ChevronDown size={16} className={profileOpen ? styles.chevronOpen : ""} />
            </button>
            {profileOpen && (
              <div id="portal-account" className={styles.utilityPanel}>
                <p className={styles.accountDetail}><UserRound size={15} /> {user?.email || "examiner@anklyze.demo"}</p>
                <p className={styles.accountDetail}><ShieldCheck size={15} /> {user?.institution || EXAMINER_CONTEXT.evaluationCenter}</p>
                <button type="button" className={styles.logoutButton} onClick={() => { closeDrawer(); void logout(); }}><LogOut size={16} /> Lock &amp; Exit Session</button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
