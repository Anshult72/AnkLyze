"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  ChartNoAxesCombined,
  ClipboardList,
  FileCheck2,
  FileStack,
  LayoutDashboard,
  LogOut,
  Scale,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./TopNavigation.module.css";

export interface NavItem {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

// Canonical items definition with icon-first design, short dock labels, and full titles for tooltips
const itemDashboard: NavItem = {
  id: "dashboard",
  label: "Dashboard",
  shortLabel: "Home",
  href: "/examiner/dashboard",
  icon: LayoutDashboard,
};

const itemEvaluations: NavItem = {
  id: "evaluations",
  label: "My Evaluations",
  shortLabel: "My Work",
  href: "/examiner/evaluations",
  icon: BookOpenCheck,
};

const itemReview: NavItem = {
  id: "review",
  label: "Review Queue",
  shortLabel: "Review",
  href: "/examiner/review",
  icon: ClipboardList,
};

const itemReports: NavItem = {
  id: "reports",
  label: "Reports",
  shortLabel: "Reports",
  href: "/examiner/reports",
  icon: ChartNoAxesCombined,
};

const itemExamMgmt: NavItem = {
  id: "admin-exams",
  label: "Exam Management",
  shortLabel: "Exams",
  href: "/admin/exams",
  icon: FileStack,
};

const itemSheetIntake: NavItem = {
  id: "admin-scripts",
  label: "Sheet Intake",
  shortLabel: "Intake",
  href: "/admin/scripts",
  icon: ShieldCheck,
};

const itemModeration: NavItem = {
  id: "moderation",
  label: "Moderation",
  shortLabel: "Moderation",
  href: "/moderation",
  icon: Scale,
};

const itemAnalytics: NavItem = {
  id: "admin-analytics",
  label: "Analytics",
  shortLabel: "Analytics",
  href: "/admin/analytics",
  icon: BarChart3,
};

const itemResults: NavItem = {
  id: "admin-results",
  label: "Results",
  shortLabel: "Results",
  href: "/admin/results",
  icon: FileCheck2,
};

const itemExaminerAccounts: NavItem = {
  id: "admin-examiners",
  label: "Examiner Accounts",
  shortLabel: "Users",
  href: "/admin/examiners",
  icon: UsersRound,
};

// Canonical Role-based Navigation Configuration (strictly preserved)
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
  MODERATOR: [
    {
      title: "OVERVIEW",
      items: [itemDashboard],
    },
    {
      title: "OVERSIGHT",
      items: [itemModeration],
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
  const [profileOpen, setProfileOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Role and identity resolution
  const displayRole = user?.role || "EXAMINER";
  let roleLabel = "EXAMINER";
  let defaultName = "Examiner";
  if (displayRole === "SUPER_ADMIN") {
    roleLabel = "SUPER ADMIN";
    defaultName = "ANKLYZE Platform Admin";
  } else if (displayRole === "HEAD_EXAMINER") {
    roleLabel = "HEAD EXAMINER";
    defaultName = "Head Examiner";
  } else if (displayRole === "MODERATOR") {
    roleLabel = "MODERATOR";
    defaultName = "Moderator";
  }

  const displayName = user?.fullName || defaultName;
  const initials = displayName
    .split(" ")
    .map((part: string) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navigationGroups = getNavigationForRole(displayRole);

  // Close profile on escape or outside click
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };
    const onClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onEscape);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onEscape);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const isItemActive = (item: NavItem) => {
    if (item.href === "/examiner/dashboard") {
      return pathname === "/examiner/dashboard";
    }
    if (item.id === "evaluations" && pathname?.startsWith("/examiner/evaluate")) {
      return true;
    }
    if (pathname === item.href) {
      return true;
    }
    if (pathname?.startsWith(item.href + "/")) {
      return true;
    }
    return activeTab === item.id;
  };

  const renderDockItem = (item: NavItem) => {
    const Icon = item.icon;
    const selected = isItemActive(item);

    return (
      <Link
        key={item.id}
        href={item.href}
        className={`${styles.dockItem} ${selected ? styles.dockItemActive : ""}`}
        aria-current={selected ? "page" : undefined}
        aria-label={item.label}
        onClick={() => setProfileOpen(false)}
      >
        <span className={styles.tooltip} role="tooltip">
          {item.label}
        </span>
        <div className={styles.iconWrapper}>
          <Icon size={20} strokeWidth={1.8} />
        </div>
        <span className={styles.shortLabel}>{item.shortLabel}</span>
        {selected && <span className={styles.activeDot} aria-hidden="true" />}
      </Link>
    );
  };

  const fallbackEmail =
    displayRole === "SUPER_ADMIN"
      ? "superadmin@anklyze.demo"
      : displayRole === "HEAD_EXAMINER"
      ? "head.examiner@anklyze.demo"
      : displayRole === "MODERATOR"
      ? "moderator@anklyze.demo"
      : "examiner@anklyze.demo";

  const fallbackInstitution =
    displayRole === "SUPER_ADMIN"
      ? "ANKLYZE Central Administration"
      : user?.department || "Central Evaluation Board";

  return (
    <nav
      id="portal-dock"
      className={`portal-dock ${styles.dockWrapper}`}
      aria-label="Portal navigation dock"
    >
      <div className={styles.dockBar} role="toolbar" aria-label="Application dock">
        {navigationGroups.map((group, groupIdx) => (
          <div key={group.title || `group-${groupIdx}`} className={styles.groupWrapper}>
            {groupIdx > 0 && <div className={styles.dockSeparator} aria-hidden="true" />}
            <div className={styles.groupItems} role="group" aria-label={group.title || "Navigation group"}>
              {group.items.map(renderDockItem)}
            </div>
          </div>
        ))}

        <div className={styles.dockSeparator} aria-hidden="true" />

        {/* Profile / Account utility trigger */}
        <div className={styles.accountItemWrapper} ref={accountRef}>
          <button
            type="button"
            className={`${styles.dockItem} ${styles.accountTrigger} ${profileOpen ? styles.dockItemActive : ""}`}
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-label={`Account: ${displayName}`}
            aria-expanded={profileOpen}
            aria-haspopup="dialog"
          >
            {!profileOpen && (
              <span className={styles.tooltip} role="tooltip">
                {displayName} ({roleLabel})
              </span>
            )}
            <div className={styles.avatarWrapper}>
              <span className={styles.avatarText}>{initials || "EX"}</span>
            </div>
            <span className={styles.shortLabel}>Account</span>
          </button>

          {profileOpen && (
            <div
              id="dock-account-popover"
              className={styles.accountPopover}
              role="dialog"
              aria-label="User Account Menu"
            >
              <div className={styles.popoverHeader}>
                <span className={styles.popoverAvatar}>{initials || "EX"}</span>
                <div className={styles.popoverUserInfo}>
                  <strong className={styles.popoverName}>{displayName}</strong>
                  <span className={styles.popoverRoleBadge}>{roleLabel}</span>
                </div>
              </div>

              <div className={styles.popoverDivider} />

              <div className={styles.popoverDetails}>
                <p className={styles.popoverDetailRow}>
                  <UserRound size={14} className={styles.popoverDetailIcon} />
                  <span>{user?.email || fallbackEmail}</span>
                </p>
                <p className={styles.popoverDetailRow}>
                  <ShieldCheck size={14} className={styles.popoverDetailIcon} />
                  <span>{user?.institution || fallbackInstitution}</span>
                </p>
              </div>

              <div className={styles.popoverDivider} />

              <button
                type="button"
                className={styles.logoutButton}
                onClick={() => {
                  setProfileOpen(false);
                  void logout();
                }}
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
