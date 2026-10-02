"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  FileStack,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EXAMINER_CONTEXT } from "@/data/examinerMockData";
import styles from "./TopNavigation.module.css";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

// Canonical items definition
const itemDashboard: NavItem = { id: "dashboard", label: "Dashboard", href: "/examiner/dashboard", icon: LayoutDashboard };
const itemEvaluations: NavItem = { id: "evaluations", label: "My Evaluations", href: "/examiner/evaluations", icon: BookOpenCheck };
const itemReview: NavItem = { id: "review", label: "Review Queue", href: "/examiner/review", icon: ClipboardList };
const itemReports: NavItem = { id: "reports", label: "Reports", href: "/examiner/reports", icon: ChartNoAxesCombined };

const itemExamMgmt: NavItem = { id: "admin-exams", label: "Exam Management", href: "/admin/exams", icon: FileStack };
const itemSheetIntake: NavItem = { id: "admin-scripts", label: "Sheet Intake", href: "/admin/scripts", icon: ShieldCheck };

const itemModeration: NavItem = { id: "moderation", label: "Moderation", href: "/moderation", icon: Scale };
const itemAnalytics: NavItem = { id: "admin-analytics", label: "Analytics", href: "/admin/analytics", icon: BarChart3 };
const itemResults: NavItem = { id: "admin-results", label: "Results", href: "/admin/results", icon: FileCheck2 };

const itemExaminerAccounts: NavItem = { id: "admin-examiners", label: "Examiner Accounts", href: "/admin/examiners", icon: UsersRound };

// Canonical Role-based Navigation Configuration
export const ROLE_NAVIGATION_CONFIG: Record<string, NavGroup[]> = {
  EXAMINER: [
    {
      items: [itemDashboard, itemEvaluations, itemReview, itemReports],
    },
  ],
  HEAD_EXAMINER: [
    {
      title: "WORK",
      items: [itemDashboard, itemEvaluations, itemReview, itemReports],
    },
    {
      title: "EXAMINATION",
      items: [itemExamMgmt, itemSheetIntake],
    },
    {
      title: "OVERSIGHT",
      items: [itemModeration, itemAnalytics, itemResults],
    },
  ],
  SUPER_ADMIN: [
    {
      title: "OVERVIEW",
      items: [itemDashboard],
    },
    {
      title: "EXAMINATION",
      items: [itemExamMgmt, itemSheetIntake, itemResults],
    },
    {
      title: "QUALITY & OVERSIGHT",
      items: [itemModeration, itemAnalytics],
    },
    {
      title: "ADMINISTRATION",
      items: [itemExaminerAccounts],
    },
  ],
};

export function getNavigationForRole(role?: string): NavGroup[] {
  if (role && ROLE_NAVIGATION_CONFIG[role]) {
    return ROLE_NAVIGATION_CONFIG[role];
  }
  return ROLE_NAVIGATION_CONFIG.EXAMINER;
}

export interface TopNavigationProps {
  activeTab?: string;
}

export default function TopNavigation({ activeTab = "dashboard" }: TopNavigationProps) {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();

  // Role and identity resolution
  const displayRole = user?.role || "EXAMINER";
  let roleLabel = "EXAMINER";
  let defaultName = EXAMINER_CONTEXT.examinerName;
  if (displayRole === "SUPER_ADMIN") {
    roleLabel = "SUPER ADMIN";
    defaultName = "ANKLYZE Platform Admin";
  } else if (displayRole === "HEAD_EXAMINER") {
    roleLabel = "HEAD EXAMINER";
    defaultName = "Head Examiner";
  }

  const displayName = user?.fullName || defaultName;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navigationGroups = getNavigationForRole(displayRole);

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

  const isItemActive = (item: NavItem) => {
    if (item.href === "/examiner/dashboard") {
      return pathname === "/examiner/dashboard";
    }
    if (item.id === "evaluations" && pathname.startsWith("/examiner/evaluate")) {
      return true;
    }
    if (pathname === item.href) {
      return true;
    }
    if (pathname.startsWith(item.href + "/")) {
      return true;
    }
    return activeTab === item.id;
  };

  const renderLink = (item: NavItem) => {
    const Icon = item.icon;
    const selected = isItemActive(item);
    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={closeDrawer}
        className={`${styles.navLink} ${selected ? styles.navLinkActive : ""}`}
        aria-current={selected ? "page" : undefined}
        aria-label={item.label}
        title={item.label}
      >
        <Icon size={22} strokeWidth={1.8} />
        <span className={styles.navLabel}>{item.label}</span>
        {selected && <span className={styles.activeMark} aria-hidden="true" />}
      </Link>
    );
  };

  return (
    <>
      <header className={styles.mobileBar}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open portal menu"
          aria-expanded={drawerOpen}
          aria-controls="portal-sidebar"
        >
          <Menu size={21} />
        </button>
        <Link href="/examiner/dashboard" className={styles.mobileBrand} aria-label="ANKLYZE dashboard">
          <Image src="/anklyze-logo.png" alt="ANKLYZE" width={135} height={45} priority />
        </Link>
        <span className={styles.mobileRole}>{roleLabel}</span>
      </header>

      {drawerOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close portal menu"
          onClick={closeDrawer}
        />
      )}

      <aside
        id="portal-sidebar"
        className={`portal-sidebar ${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ""}`}
        aria-label="Portal navigation"
      >
        <div className={styles.brandRow}>
          <Link href="/examiner/dashboard" onClick={closeDrawer} className={styles.brand} aria-label="ANKLYZE dashboard">
            <Image src="/anklyze-mark.png" alt="" width={48} height={48} priority className={styles.compactLogo} />
            <Image src="/anklyze-logo.png" alt="ANKLYZE" width={210} height={70} priority className={styles.fullLogo} />
          </Link>
          <button type="button" className={styles.closeButton} onClick={closeDrawer} aria-label="Close portal menu">
            <X size={19} />
          </button>
        </div>

        <nav className={styles.navigation} aria-label="Main portal navigation">
          {navigationGroups.map((group, groupIdx) => (
            <div
              key={group.title || `group-${groupIdx}`}
              className={styles.navGroup}
              role="group"
              aria-label={group.title || "Main menu"}
            >
              {group.title && (
                <span className={styles.groupHeading} id={`nav-heading-${groupIdx}`}>
                  {group.title}
                </span>
              )}
              {group.items.map(renderLink)}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.utility}>
            <button
              type="button"
              className={`${styles.accountButton} ${profileOpen ? styles.utilityButtonOpen : ""}`}
              onClick={() => {
                setProfileOpen((value) => !value);
              }}
              aria-label={`Account: ${displayName}`}
              aria-expanded={profileOpen}
              aria-controls="portal-account"
            >
              <span className={styles.avatar}>{initials || "EX"}</span>
              <span className={styles.accountText}>
                <strong>{displayName}</strong>
                <small>{roleLabel}</small>
              </span>
              <ChevronDown size={16} className={profileOpen ? styles.chevronOpen : ""} />
            </button>
            {profileOpen && (
              <div id="portal-account" className={styles.utilityPanel}>
                <p className={styles.accountDetail}>
                  <UserRound size={15} />{" "}
                  {user?.email ||
                    (displayRole === "SUPER_ADMIN"
                      ? "superadmin@anklyze.demo"
                      : displayRole === "HEAD_EXAMINER"
                      ? "head.examiner@anklyze.demo"
                      : "examiner@anklyze.demo")}
                </p>
                <p className={styles.accountDetail}>
                  <ShieldCheck size={15} />{" "}
                  {user?.institution ||
                    (displayRole === "SUPER_ADMIN"
                      ? "ANKLYZE Central Administration"
                      : EXAMINER_CONTEXT.evaluationCenter)}
                </p>
                <button
                  type="button"
                  className={styles.logoutButton}
                  onClick={() => {
                    closeDrawer();
                    void logout();
                  }}
                >
                  <LogOut size={16} /> Lock &amp; Exit Session
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
