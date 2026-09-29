"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, GraduationCap, BookOpen, ShieldCheck, Sparkles, Scale } from "lucide-react";

export default function FeatureSuiteSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      id: "01",
      tag: "01 • HUMAN-IN-THE-LOOP",
      badgeRight: "100% VERIFIED",
      badgeType: "pill",
      verifiedPill: "✓ FACULTY VERIFIED",
      title: "Faculty retains the",
      titleHighlight: "final say",
      titleSuffix: ". Always.",
      highlightStyle: "bg-blue-100 text-[#1D4ED8]",
      body: "AI drafts the evaluation; faculty retains full authority. Every question-level mark connects to explicit rubric lines, creating a complete audit trail without hallucinations.",
      tags: ["100% verified", "Audit trail", "No hallucinations"],
      linkText: "Evaluation workflow →",
      href: "/examiner/dashboard",
      slideIndex: "01/05",
      accentBg: "from-slate-200/50 via-slate-100/30 to-white",
    },
    {
      id: "02",
      tag: "02 • ACCREDITATION",
      badgeRight: "NBA CRITERIA 3.2",
      badgeType: "icon",
      icon: GraduationCap,
      iconBg: "bg-cyan-50 text-cyan-600 border-cyan-200",
      title: "Automated",
      titleHighlight: "CO-PO mapping",
      titleSuffix: " & NAAC reports.",
      highlightStyle: "bg-cyan-100 text-[#0E7490]",
      body: "Stop spending hundreds of manual faculty hours copying marks into Excel sheets. Questions map directly to Course Outcomes for instant NIRF & NAAC compliance.",
      tags: ["NAAC Criteria 2.6", "SAR data export", "Attainment matrix"],
      linkText: "Accreditation workflow →",
      href: "/ai-answer-sheet-evaluation",
      slideIndex: "02/05",
      accentBg: "from-slate-200/50 via-slate-100/30 to-white",
    },
    {
      id: "03",
      tag: "03 • EXAM BRANCHES",
      badgeRight: "THREE-TIER GATE",
      badgeType: "icon",
      icon: BookOpen,
      iconBg: "bg-purple-50 text-purple-600 border-purple-200",
      title: "Three-stage",
      titleHighlight: "sign-offs",
      titleSuffix: " for exam councils.",
      highlightStyle: "bg-purple-100 text-[#7E22CE]",
      body: "Designed around institutional governance protocols. Faculty evaluates, Heads of Department perform audits, and the Controller of Examinations finalizes results.",
      tags: ["Role access", "Moderation pools", "Crypto locks"],
      linkText: "Exam board workflow →",
      href: "/handwritten-answer-sheet-grading",
      slideIndex: "03/05",
      accentBg: "from-slate-200/50 via-slate-100/30 to-white",
    },
    {
      id: "04",
      tag: "04 • PEDAGOGY",
      badgeRight: "CONSTRUCTIVE RUBRIC",
      badgeType: "icon",
      icon: Scale,
      iconBg: "bg-rose-50 text-rose-600 border-rose-200",
      title: "Scores students understand,",
      titleHighlight: "teachers defend",
      titleSuffix: ".",
      highlightStyle: "bg-rose-100 text-[#BE123C]",
      body: "Students receive question-wise breakdown with constructive explanations rather than arbitrary totals, significantly curbing re-evaluation disputes.",
      tags: ["Rubric matching", "Constructive feedback", "RTI defensible"],
      linkText: "Pedagogy workflow →",
      href: "/subjective-answer-evaluation",
      slideIndex: "04/05",
      accentBg: "from-slate-200/50 via-slate-100/30 to-white",
    },
    {
      id: "05",
      tag: "05 • CRYPTOGRAPHIC AUDIT",
      badgeRight: "TAMPER-PROOF",
      badgeType: "icon",
      icon: ShieldCheck,
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
      title: "Double-blind scans with",
      titleHighlight: "cryptographic seals",
      titleSuffix: ".",
      highlightStyle: "bg-emerald-100 text-[#047857]",
      body: "Barcoded anonymization removes candidate PII before evaluation. Every step-score adjustment is signed with SHA-256 integrity logs.",
      tags: ["Anonymized scans", "SHA-256 seal", "Legal defensibility"],
      linkText: "Security workflow →",
      href: "/resources#accuracy",
      slideIndex: "05/05",
      accentBg: "from-slate-200/50 via-slate-100/30 to-white",
    },
  ];

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : features.length - 3));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev < features.length - 3 ? prev + 1 : 0));
  };

  const visibleFeatures = features.slice(currentSlide, currentSlide + 3);

  return (
    <section id="features" className="py-16 sm:py-24 bg-[#FAFAFA] border-t border-gray-100 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* EYEBROW */}
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-4">
          <span>✦</span>
          <span>INSTITUTIONAL FEATURE SUITE</span>
        </div>

        {/* HEADLINE & CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl space-y-3">
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-[#111827] tracking-tight leading-[1.15]">
              Engineered for academic rigor,{" "}
              <span className="italic relative inline-block">
                built for speed
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-[#EF4444] pointer-events-none"
                  viewBox="0 0 280 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 9C55 4 125 3 277 8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
            <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed pt-1">
              Five core capabilities designed specifically for the realities of Indian university evaluations, semester examination boards, and professional entrance tests.
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center space-x-2 self-start md:self-end shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 shadow-2xs transition-colors"
              aria-label="Previous capability"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 shadow-2xs transition-colors"
              aria-label="Next capability"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEATURE CARDS ROW / CAROUSEL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleFeatures.map((f) => (
            <div
              key={f.id}
              className="rounded-2xl border border-gray-200/90 bg-white shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group relative"
            >
              {/* Card Top Shaded Header */}
              <div className={`h-24 p-4 bg-gradient-to-b ${f.accentBg} border-b border-gray-100 flex items-start justify-between relative`}>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-700 bg-white/90 px-2 py-0.5 rounded border border-gray-200/80 shadow-2xs">
                  {f.tag}
                </span>
                <span className="font-mono text-[10px] font-semibold text-[#2563EB] bg-blue-50/90 px-2 py-0.5 rounded border border-blue-200/80 shadow-2xs">
                  {f.badgeRight}
                </span>
              </div>

              {/* Card Body with relative badge */}
              <div className="p-6 sm:p-7 space-y-4 flex-1 flex flex-col justify-between relative">
                {/* Floating Badge on the seam */}
                {f.badgeType === "pill" ? (
                  <div className="absolute -top-3.5 right-6 text-[10px] font-bold tracking-wider text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-green-200/80 shadow-2xs">
                    {f.verifiedPill}
                  </div>
                ) : (
                  <div className={`absolute -top-5 right-6 w-9 h-9 rounded-full border flex items-center justify-center shadow-xs ${f.iconBg}`}>
                    {React.createElement(f.icon, { className: "w-4 h-4" })}
                  </div>
                )}

                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#111827] leading-snug pt-1">
                    {f.title}{" "}
                    <span className={`px-1.5 py-0.5 rounded ${f.highlightStyle}`}>
                      {f.titleHighlight}
                    </span>
                    {f.titleSuffix}
                  </h3>

                  <p className="text-sm text-[#4B5563] leading-relaxed mt-3">
                    {f.body}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  {/* Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {f.tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Footer Link & Counter */}
                  <div className="flex items-center justify-between pt-2 text-xs">
                    <Link
                      href={f.href}
                      className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center space-x-1 group-hover:underline"
                    >
                      <span>{f.linkText}</span>
                    </Link>
                    <span className="font-mono text-gray-400 text-[11px]">{f.slideIndex}</span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION INDICATOR (Pill + Dots matching reference) */}
        <div className="mt-10 flex items-center justify-center space-x-2">
          {features.slice(0, 3).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`transition-all duration-200 ${
                i === currentSlide
                  ? "w-7 h-1.5 rounded-full bg-[#111827]"
                  : "w-1.5 h-1.5 rounded-full bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
