'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Sparkles, ShieldCheck } from 'lucide-react';

export default function MarketingFooter() {
  return (
    <footer className="bg-[#12151B] text-white pt-20 pb-12 border-t border-slate-800 relative overflow-hidden">
      {/* Background glow subtlety */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top CTA Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-16 border-b border-slate-800/80 gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#F59E0B] text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
                ✦ READY WHEN YOUR INSTITUTION IS
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-white leading-tight">
              Make every grade faster,{' '}
              <span className="text-[#FBBF24] italic font-serif">clearer</span>, and defensible.
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm transition-all hover:shadow-blue-500/25 hover:-translate-y-0.5"
            >
              Start a free pilot
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-medium rounded-lg text-sm border border-slate-700 transition-colors"
            >
              Explore plans
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Main Footer Links & Brand */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 py-16">
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block bg-white p-2.5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2.5 px-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  AK
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 tracking-tight text-base leading-none">ANKLYZE</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-blue-600 mt-0.5">MPOnline EdTech</span>
                </div>
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Human-controlled AI grading for handwritten assessments, institutional workflows, and accountable academic decisions.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                HUMAN-IN-THE-LOOP
              </span>
              <span className="text-slate-600">•</span>
              <span className="uppercase tracking-wider">BUILT FOR MPONLINE INSTITUTIONS</span>
            </div>
          </div>

          {/* Product Column */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-[#FBBF24] text-xs font-bold tracking-widest uppercase">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/ai-answer-sheet-evaluation" className="text-slate-300 hover:text-white transition-colors">
                  AI answer sheet evaluation
                </Link>
              </li>
              <li>
                <Link href="/handwritten-answer-sheet-grading" className="text-slate-300 hover:text-white transition-colors">
                  Handwritten answer sheet grading
                </Link>
              </li>
              <li>
                <Link href="/subjective-answer-evaluation" className="text-slate-300 hover:text-white transition-colors">
                  Subjective answer evaluation
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-slate-300 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#workflow" className="text-slate-300 hover:text-white transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[#FBBF24] text-xs font-bold tracking-widest uppercase">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-slate-300 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/examiner/dashboard" className="text-slate-300 hover:text-blue-400 font-medium transition-colors flex items-center gap-1">
                  Examiner Portal
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[#FBBF24] text-xs font-bold tracking-widest uppercase">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/resources" className="text-slate-300 hover:text-white transition-colors">
                  Resource hub
                </Link>
              </li>
              <li>
                <Link href="/resources#accuracy" className="text-slate-300 hover:text-white transition-colors">
                  Accuracy methodology
                </Link>
              </li>
              <li>
                <Link href="/resources#responsible-ai" className="text-slate-300 hover:text-white transition-colors">
                  Responsible AI
                </Link>
              </li>
              <li>
                <Link href="/resources#evaluation" className="text-slate-300 hover:text-white transition-colors">
                  Evaluation methodology
                </Link>
              </li>
              <li>
                <Link href="/resources#security" className="text-slate-300 hover:text-white transition-colors">
                  Security & compliance
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-300 hover:text-white transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 ANKLYZE • Analyse the marks, not just the paper • MPOnline Examination System.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">
              Terms
            </Link>
            <Link href="/data-processing" className="hover:text-slate-400 transition-colors">
              Data processing
            </Link>
            <Link href="/subprocessors" className="hover:text-slate-400 transition-colors">
              Subprocessors
            </Link>
            <Link href="/trust" className="hover:text-slate-400 transition-colors">
              Trust & Security
            </Link>
            <Link href="/accessibility" className="hover:text-slate-400 transition-colors">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
