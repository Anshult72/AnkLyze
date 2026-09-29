"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, Menu, X, Check, ShieldCheck, User, LogOut, Clock, ExternalLink, Globe } from "lucide-react";
import { EXAMINER_CONTEXT } from "@/data/examinerMockData";

interface TopNavigationProps {
  activeTab?: "dashboard" | "evaluations" | "review" | "reports";
}

export default function TopNavigation({ activeTab = "dashboard" }: TopNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  const navItems = [
    { id: "dashboard", label: "Dashboard", href: "/examiner/dashboard" },
    { id: "evaluations", label: "My Evaluations", href: "/examiner/dashboard?view=evaluations" },
    { id: "review", label: "Review Queue", href: "/examiner/dashboard?view=review" },
    { id: "reports", label: "Reports", href: "/examiner/dashboard?view=reports" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white text-slate-900 border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LEFT: Application Identity */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/examiner/dashboard" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-xs">
                PE
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 leading-tight">
                    PaperEval
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-blue-50 text-blue-600 border border-blue-200 tracking-wider uppercase font-mono">
                    MPONLINE
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium leading-none hidden sm:inline-block">
                  Confidential Examiner Portal
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER / MAIN: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-blue-600 bg-blue-50/80 border border-blue-200/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Website Link, Notifications & Examiner Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* REQUIRED: Visit Website Link */}
            <Link
              href="/"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 border border-slate-200 transition-colors"
              title="Return to public marketing website"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              <span>Visit Website</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileDropdownOpen(false);
                }}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label={`Notifications, ${unreadNotifications} unread items`}
                aria-expanded={notificationsOpen}
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification Popover */}
              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 sm:w-88 max-w-[calc(100vw-1.5rem)] bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  role="dialog"
                  aria-label="Evaluation notifications"
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      System Notifications
                    </span>
                    <button
                      type="button"
                      onClick={() => setUnreadNotifications(0)}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    <div className="p-3 hover:bg-slate-50 text-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-0.5">
                        <span className="font-semibold text-slate-900">Batch CS-301 Assigned</span>
                        <span>08:15 AM</span>
                      </div>
                      <p className="text-slate-600">120 digitized answer scripts released for evaluation at Station 04.</p>
                    </div>
                    <div className="p-3 hover:bg-slate-50 text-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-0.5">
                        <span className="font-semibold text-amber-600">Moderator Alert</span>
                        <span>08:39 AM</span>
                      </div>
                      <p className="text-slate-600">Q07 step discrepancy flagged for review in Script A-10493.</p>
                    </div>
                    <div className="p-3 hover:bg-slate-50 text-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-0.5">
                        <span className="font-semibold text-emerald-600">Daily Quota Synced</span>
                        <span>07:30 AM</span>
                      </div>
                      <p className="text-slate-600">Evaluation benchmark pace set to 15 scripts/hour.</p>
                    </div>
                  </div>
                  <div className="p-2 border-t border-slate-100 text-center bg-slate-50 rounded-b-2xl">
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Close Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Examiner Profile Button & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center space-x-2 py-1 px-2 rounded-lg hover:bg-slate-100 border border-slate-200/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                aria-label="Examiner account menu"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  RS
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {EXAMINER_CONTEXT.examinerName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono leading-tight">
                    {EXAMINER_CONTEXT.examinerId}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in duration-100"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{EXAMINER_CONTEXT.examinerName}</p>
                    <p className="text-[11px] text-slate-500">{EXAMINER_CONTEXT.examinerId} • Lead Evaluator</p>
                    <div className="mt-1 flex items-center text-[10px] text-emerald-600 font-medium">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Session Verified &amp; Secure
                    </div>
                  </div>

                  <div className="py-1 text-xs text-slate-600">
                    <div className="px-4 py-1.5">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Center</span>
                      <span className="text-slate-900 font-medium">{EXAMINER_CONTEXT.evaluationCenter}</span>
                    </div>
                    <div className="px-4 py-1.5">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Active Batch</span>
                      <span className="text-slate-900 font-medium">{EXAMINER_CONTEXT.currentBatch}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <Link
                      href="/"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        <span>Visit Public Website</span>
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>Evaluation Guidelines</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>Keyboard Shortcuts</span>
                      <span className="font-mono text-[10px] text-slate-400">Ctrl + /</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        alert("Session securely locked. All current evaluations are preserved.");
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Lock &amp; Exit Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* MOBILE NAVIGATION DRAWER */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-1 animate-in fade-in duration-100">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-blue-600 bg-blue-50/80 border border-blue-200/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* REQUIRED: Mobile Visit Website Link */}
            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Visit Public Website</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
