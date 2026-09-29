"use client";

import React from "react";
import { Shield, Eye, Lock, Scale, Check } from "lucide-react";

export default function HumanInLoopSection() {
  const cards = [
    {
      number: "01 / Human Control",
      title: "Educators make the final call.",
      body: "AI prepares an evidence-grounded draft. No score or report is released to students until faculty inspects and approves it.",
      icon: Shield,
      iconBg: "bg-[#DCFCE7]",
      iconColor: "text-[#16A34A]",
    },
    {
      number: "02 / Transparent Reasoning",
      title: "Every single mark has evidence.",
      body: "Question-level marks link straight to rubric clauses and text excerpts, making evaluations fully defensible against grievances and RTI requests.",
      icon: Eye,
      iconBg: "bg-[#DBEAFE]",
      iconColor: "text-[#2563EB]",
    },
    {
      number: "03 / Private by Design",
      title: "Institutional data stays sovereign.",
      body: "Strict tenant-isolated environments and database Row-Level Security guarantee data sovereignty. Dedicated government cloud deployments available.",
      icon: Lock,
      iconBg: "bg-[#F3E8FF]",
      iconColor: "text-[#9333EA]",
    },
    {
      number: "04 / Consistent Assessment",
      title: "One standard rubric, applied fairly.",
      body: "Standardized evaluation eliminates fatigue drift and evaluator bias while empowering teachers to handle edge cases effortlessly.",
      icon: Scale,
      iconBg: "bg-[#FFE4E6]",
      iconColor: "text-[#E11D48]",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* EYEBROW */}
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-4">
          <span>✦</span>
          <span>INSTITUTIONAL TRUST &amp; INTEGRITY</span>
        </div>

        {/* SPLIT HEADER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-[#111827] tracking-tight leading-[1.15]">
              AI drafts.
              <br />
              <span className="text-[#2563EB] italic">Educators decide.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 space-y-2">
            <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed">
              Grading automation is only meaningful when it remains fully explainable, secure, and defensible. ANKLYZE keeps academic authority firmly in the hands of faculty.
            </p>
            <div className="flex items-center space-x-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#16A34A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              <span>HUMAN-IN-THE-LOOP BY DESIGN</span>
            </div>
          </div>
        </div>

        {/* PROCESS FLOW LINE ART ILLUSTRATION */}
        <div className="my-10 py-6 px-4 bg-gray-50/50 rounded-2xl border border-gray-100 hidden md:block">
          <svg viewBox="0 0 1000 160" className="w-full max-w-4xl mx-auto text-[#1E293B] fill-none" stroke="currentColor">
            
            {/* 1. Bot Head */}
            <g transform="translate(60, 30)">
              <rect x="0" y="10" width="70" height="55" rx="14" strokeWidth="2" fill="white" />
              <circle cx="22" cy="38" r="6" fill="#2563EB" />
              <circle cx="48" cy="38" r="6" fill="#2563EB" />
              <path d="M 28 50 Q 35 56 42 50" strokeWidth="2" strokeLinecap="round" />
              {/* Antenna */}
              <line x1="35" y1="10" x2="35" y2="0" strokeWidth="2" />
              <circle cx="35" cy="0" r="3.5" fill="#2563EB" />
              {/* Sparks around bot */}
              <circle cx="-6" cy="25" r="2.5" fill="#F59E0B" />
              <circle cx="76" cy="18" r="2" fill="#F59E0B" />
            </g>

            {/* Connecting curve 1 */}
            <path d="M 145 65 C 190 65, 210 95, 255 70" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />

            {/* 2. Scanned Paper */}
            <g transform="translate(265, 20)">
              <rect x="0" y="0" width="65" height="85" rx="4" strokeWidth="1.75" fill="white" />
              {/* Graph / Math */}
              <line x1="12" y1="18" x2="52" y2="18" strokeWidth="1.5" />
              <text x="14" y="32" className="font-serif text-[10px] fill-current">a² + b² = c²</text>
              {/* Mini graph */}
              <line x1="14" y1="42" x2="14" y2="68" strokeWidth="1" />
              <line x1="14" y1="68" x2="48" y2="68" strokeWidth="1" />
              <path d="M 14 65 Q 28 62 42 45" strokeWidth="1.5" stroke="#2563EB" />
            </g>

            {/* Connecting curve 2 with pen doodle */}
            <path d="M 345 60 C 375 60, 395 100, 435 70" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />

            {/* 3. Pen signing / rubric marks */}
            <g transform="translate(440, 25)">
              {/* Pen */}
              <line x1="10" y1="55" x2="35" y2="15" strokeWidth="2" stroke="#1E293B" strokeLinecap="round" />
              <path d="M 10 55 L 7 60 L 15 57 Z" fill="#1E293B" />
              {/* Signature loop */}
              <path d="M 10 65 Q 25 55 40 68 T 65 65" strokeWidth="1.5" stroke="#2563EB" />
              {/* Rubric check bubbles */}
              <circle cx="75" cy="40" r="4" stroke="#16A34A" strokeWidth="1.5" />
              <circle cx="75" cy="55" r="4" stroke="#16A34A" strokeWidth="1.5" />
              <circle cx="75" cy="70" r="4" stroke="#16A34A" strokeWidth="1.5" />
            </g>

            {/* Connecting curve 3 */}
            <path d="M 530 65 C 570 65, 590 95, 630 65" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />

            {/* 4. Rubric Matrix & Score */}
            <g transform="translate(640, 35)">
              <text x="0" y="25" className="font-serif text-[18px] font-bold fill-current">∑</text>
              <circle cx="35" cy="22" r="14" stroke="#16A34A" strokeWidth="1.75" />
              <path d="M 29 22 L 33 26 L 41 17" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* 3 stars */}
              <text x="10" y="-5" className="text-xs fill-[#F59E0B]">★ ★ ★</text>
            </g>

            {/* Connecting curve 4 */}
            <path d="M 710 65 C 750 65, 765 80, 800 65" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />

            {/* 5. Human Teacher / Faculty */}
            <g transform="translate(815, 15)">
              <circle cx="35" cy="30" r="20" strokeWidth="2" fill="white" />
              {/* Glasses */}
              <circle cx="28" cy="28" r="5" strokeWidth="1.5" />
              <circle cx="42" cy="28" r="5" strokeWidth="1.5" />
              <line x1="33" y1="28" x2="37" y2="28" strokeWidth="1.5" />
              {/* Smile */}
              <path d="M 30 38 Q 35 43 40 38" strokeWidth="1.5" strokeLinecap="round" />
              {/* Body */}
              <path d="M 12 75 C 15 55, 55 55, 58 75 Z" strokeWidth="2" fill="white" />
              {/* Verified badge */}
              <circle cx="68" cy="25" r="10" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5" />
              <path d="M 64 25 L 67 28 L 73 21" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>

          </svg>
        </div>

        {/* 4-CARD 2x2 GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((c, idx) => {
            const IconComponent = c.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-2xl border border-gray-200/90 bg-white hover:border-gray-300 hover:shadow-sm transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl ${c.iconBg} ${c.iconColor} flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-gray-400 font-semibold tracking-wider">
                    {c.number}
                  </span>
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#111827] tracking-tight">
                  {c.title}
                </h3>

                <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                  {c.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* COMPLIANCE BADGES STRIP */}
        <div className="mt-10 p-4 sm:p-5 rounded-xl border border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 font-bold text-[#111827] uppercase tracking-wider font-mono">
            <Check className="w-4 h-4 text-[#16A34A]" />
            <span>STANDARDS &amp; COMPLIANCE:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 font-medium text-[#111827] shadow-2xs">
              NAAC Criteria 2 Ready
            </span>
            <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 font-medium text-[#111827] shadow-2xs">
              NBA CO-PO Attainment
            </span>
            <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 font-medium text-[#111827] shadow-2xs">
              DPDP Act 2023 Ready
            </span>
            <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 font-medium text-[#111827] shadow-2xs">
              Tenant-Isolated Cloud
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
