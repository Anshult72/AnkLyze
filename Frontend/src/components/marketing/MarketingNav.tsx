"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X, ArrowRight, BookOpen, ExternalLink, ShieldCheck } from "lucide-react";

export default function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.06)] px-4 sm:px-6 py-3 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <span className="font-bold text-xs tracking-wider">AK</span>
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-bold tracking-tight text-[#111827]">
              ANK<span className="text-[#2563EB]">LYZE</span>
            </span>
            <span className="ml-1.5 text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200 hidden sm:inline-block font-semibold">
              MPOnline
            </span>
          </div>
        </Link>

        {/* DESKTOP NAV LINKS */}
        <nav className="hidden lg:flex items-center space-x-1" aria-label="Main navigation">
          
          {/* Solutions Dropdown */}
          <div className="relative" onMouseLeave={() => setSolutionsOpen(false)}>
            <button
              type="button"
              onClick={() => setSolutionsOpen(!solutionsOpen)}
              onMouseEnter={() => setSolutionsOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium text-[#4B5563] hover:text-[#111827] hover:bg-gray-50 transition-colors"
              aria-expanded={solutionsOpen}
            >
              <span>Solutions</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {solutionsOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl border border-gray-200 shadow-xl py-2 z-50 animate-in fade-in duration-100">
                <Link
                  href="/ai-answer-sheet-evaluation"
                  className="block px-4 py-2.5 text-xs text-[#111827] hover:bg-blue-50/80 transition-colors"
                >
                  <span className="font-semibold block text-sm">AI Answer Sheet Evaluation</span>
                  <span className="text-gray-500 text-[11px]">OCR parsing &amp; rubric evaluation</span>
                </Link>
                <Link
                  href="/handwritten-answer-sheet-grading"
                  className="block px-4 py-2.5 text-xs text-[#111827] hover:bg-blue-50/80 transition-colors"
                >
                  <span className="font-semibold block text-sm">Handwritten Script Grading</span>
                  <span className="text-gray-500 text-[11px]">Complex formulas &amp; diagrams</span>
                </Link>
                <Link
                  href="/subjective-answer-evaluation"
                  className="block px-4 py-2.5 text-xs text-[#111827] hover:bg-blue-50/80 transition-colors"
                >
                  <span className="font-semibold block text-sm">Subjective Evaluation</span>
                  <span className="text-gray-500 text-[11px]">Essay &amp; analytical marking</span>
                </Link>
              </div>
            )}
          </div>

          {/* Resources Dropdown */}
          <div className="relative" onMouseLeave={() => setResourcesOpen(false)}>
            <button
              type="button"
              onClick={() => setResourcesOpen(!resourcesOpen)}
              onMouseEnter={() => setResourcesOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium text-[#4B5563] hover:text-[#111827] hover:bg-gray-50 transition-colors"
              aria-expanded={resourcesOpen}
            >
              <span>Resources</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {resourcesOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl border border-gray-200 shadow-xl py-2 z-50 animate-in fade-in duration-100">
                <Link
                  href="/resources"
                  className="block px-4 py-2.5 text-xs text-[#111827] hover:bg-blue-50/80 transition-colors"
                >
                  <span className="font-semibold block text-sm">Resource Hub</span>
                  <span className="text-gray-500 text-[11px]">Whitepapers, guides &amp; studies</span>
                </Link>
                <Link
                  href="/resources#accuracy"
                  className="block px-4 py-2.5 text-xs text-[#111827] hover:bg-blue-50/80 transition-colors"
                >
                  <span className="font-semibold block text-sm">Accuracy Methodology</span>
                  <span className="text-gray-500 text-[11px]">Double-blind verification &amp; benchmarks</span>
                </Link>
                <Link
                  href="/resources#responsible-ai"
                  className="block px-4 py-2.5 text-xs text-[#111827] hover:bg-blue-50/80 transition-colors"
                >
                  <span className="font-semibold block text-sm">Responsible AI Grading</span>
                  <span className="text-gray-500 text-[11px]">Human-in-the-loop compliance</span>
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/about"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#4B5563] hover:text-[#111827] hover:bg-gray-50 transition-colors"
          >
            About
          </Link>

          <Link
            href="/contact"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#4B5563] hover:text-[#111827] hover:bg-gray-50 transition-colors"
          >
            Contact
          </Link>

          <Link
            href="/pricing"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#4B5563] hover:text-[#111827] hover:bg-gray-50 transition-colors"
          >
            Pricing
          </Link>

        </nav>

        {/* RIGHT: CTAs */}
        <div className="flex items-center space-x-2.5">
          <Link
            href="/examiner/dashboard"
            className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#111827] bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
            title="Open Examiner Workspace Cockpit"
          >
            <span>Examiner Portal</span>
            <ExternalLink className="w-3 h-3 text-gray-500" />
          </Link>

          <Link
            href="/contact?pilot=1"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] transition-all shadow-xs"
          >
            <span>Start a free pilot</span>
          </Link>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 space-y-3 animate-in fade-in duration-150">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3">Solutions</span>
            <Link
              href="/ai-answer-sheet-evaluation"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:bg-blue-50"
            >
              AI Answer Sheet Evaluation
            </Link>
            <Link
              href="/handwritten-answer-sheet-grading"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:bg-blue-50"
            >
              Handwritten Script Grading
            </Link>
            <Link
              href="/subjective-answer-evaluation"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:bg-blue-50"
            >
              Subjective Evaluation
            </Link>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3">Platform</span>
            <Link
              href="/resources"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:bg-blue-50"
            >
              Resource Hub
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:bg-blue-50"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:bg-blue-50"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:bg-blue-50"
            >
              Contact
            </Link>
          </div>

          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <Link
              href="/examiner/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 px-3 rounded-lg text-xs font-semibold bg-gray-100 text-gray-900 border border-gray-200"
            >
              Launch Examiner Portal Cockpit
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
