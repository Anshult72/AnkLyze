"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="pt-8 sm:pt-14 pb-16 sm:pb-20 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* EYEBROW */}
        <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#4B5563] mb-5">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span>AI-ASSISTED. EDUCATOR-LED.</span>
        </div>

        {/* HEADLINE */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-[70px] font-normal leading-[1.12] text-[#111827] max-w-4xl mx-auto tracking-tight">
          A better grading experience starts with{" "}
          <span className="italic relative inline-block">
            understanding
            {/* Hand-drawn yellow underline highlight */}
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-[#FBBF24] pointer-events-none"
              viewBox="0 0 280 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 8.5C65 3.5 175 2.5 277 8.5"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>{" "}
          every answer.
        </h1>

        {/* SUBTITLE */}
        <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed mt-6">
          Turn handwritten answers into thoughtful, rubric-linked feedback.
          <br className="hidden sm:inline" />
          {" "}ANKLYZE takes the first pass. You hold the final pen.
        </p>

        {/* CTA BUTTONS */}
        <div className="mt-8 flex flex-row items-center justify-center gap-2.5 sm:gap-3.5 w-full">
          <Link
            href="/contact?pilot=1"
            className="inline-flex items-center justify-center space-x-1.5 sm:space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] transition-all shadow-sm shrink-0"
          >
            <span>Start a free pilot</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>

          <Link
            href="/pricing"
            className="inline-flex items-center justify-center space-x-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold text-[#111827] bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs transition-all shrink-0"
          >
            <span>Explore plans</span>
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
          </Link>
        </div>

        {/* MICRO-COPY */}
        <p className="text-xs text-gray-400 mt-3 font-medium">
          For the people behind every grade.
        </p>

        {/* LAYERED REALISTIC VISUAL COMPOSITION */}
        <div className="mt-14 sm:mt-18 relative max-w-4xl mx-auto">
          
          {/* Subtle curved background lines */}
          <div className="absolute inset-0 -top-12 flex items-center justify-center pointer-events-none opacity-40">
            <svg width="800" height="400" viewBox="0 0 800 400" fill="none">
              <path d="M50 200 C 250 80, 550 80, 750 200" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
          </div>

          <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
            
            {/* LEFT CARD: THE ANSWER SHEET */}
            <div className="w-full md:w-[460px] bg-[#FCFAF5] rounded-xl border border-gray-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6 sm:p-8 text-left md:-rotate-2 transition-transform hover:rotate-0 duration-300 relative z-10">
              
              {/* Handwritten annotation pointing from top-left */}
              <div className="hidden lg:block absolute -top-10 -left-20 text-left font-serif italic text-sm text-[#2563EB] pointer-events-none">
                <span className="text-[10px] uppercase font-sans tracking-widest text-gray-400 block font-semibold not-italic">
                  IT STARTS WITH
                </span>
                <span>A little original thinking.</span>
                <svg className="w-12 h-8 text-[#2563EB] mt-1 -rotate-12" viewBox="0 0 50 30" fill="none">
                  <path d="M5 5 C 20 25, 35 25, 45 15 M 40 10 L 45 15 L 35 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Sheet Header */}
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 border-b border-gray-200 pb-3 mb-4">
                <span className="uppercase tracking-wider font-semibold">THE ANSWER SHEET</span>
                <span>03 / 08</span>
              </div>

              {/* Question */}
              <h3 className="font-serif text-lg font-bold text-[#111827] mb-3">
                What makes a binary tree?
              </h3>

              {/* Student Handwritten Response */}
              <div className="space-y-3 font-serif text-[#1E293B]">
                <p className="text-[15px] sm:text-[16px] leading-relaxed italic">
                  A binary tree is a data structure where each node has at most{" "}
                  <mark className="bg-[#FEF08A] px-1 py-0.5 rounded text-[#111827] not-italic font-medium">
                    two children
                  </mark>{" "}
                  — left and right.
                </p>

                {/* Hand-drawn Binary Tree Diagram */}
                <div className="my-4 py-2 flex justify-center">
                  <svg width="180" height="90" viewBox="0 0 180 90" fill="none" className="text-[#1E293B]">
                    {/* Node A (Root) */}
                    <circle cx="90" cy="20" r="14" stroke="currentColor" strokeWidth="1.75" fill="white" />
                    <text x="90" y="24" textAnchor="middle" className="font-serif text-xs font-bold fill-current">A</text>

                    {/* Left branch & Node B */}
                    <line x1="80" y1="32" x2="52" y2="58" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="45" cy="68" r="14" stroke="currentColor" strokeWidth="1.75" fill="white" />
                    <text x="45" y="72" textAnchor="middle" className="font-serif text-xs font-bold fill-current">B</text>

                    {/* Right branch & Node C */}
                    <line x1="100" y1="32" x2="128" y2="58" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="135" cy="68" r="14" stroke="currentColor" strokeWidth="1.75" fill="white" />
                    <text x="135" y="72" textAnchor="middle" className="font-serif text-xs font-bold fill-current">C</text>
                  </svg>
                </div>

                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-400 font-serif italic">
                  <span>Every node has a place.</span>
                  <span className="font-sans text-[11px] not-italic text-gray-400">Their handwriting. Their understanding.</span>
                </div>
              </div>

            </div>

            {/* RIGHT CARD: THE HUMAN PART (Pinned Yellow Note) */}
            <div className="w-full md:w-[380px] bg-[#FEFCE8] rounded-xl border border-[#FEF08A] shadow-[0_12px_36px_rgba(0,0,0,0.1)] p-6 sm:p-7 text-left md:-ml-8 md:rotate-2 transition-transform hover:rotate-0 duration-300 relative z-20">
              
              {/* Tape bar at top */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/70 backdrop-blur-xs border border-gray-200/50 rounded-xs shadow-2xs rotate-1" />

              {/* Star doodle top right */}
              <div className="absolute top-4 right-4 text-[#EAB308]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Note Header */}
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#854D0E] font-semibold mb-2">
                THE HUMAN PART
              </div>

              {/* Heading */}
              <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#713F12] mb-3 leading-snug">
                Good thinking.
                <br />
                Let&apos;s build on it.
              </h4>

              {/* Educator Feedback in blue ink */}
              <p className="font-serif italic text-[#1D4ED8] text-sm sm:text-base leading-relaxed mb-4">
                &ldquo;The definition is clear. Now walk me through the traversal order.&rdquo;
              </p>

              <div className="border-t border-[#FEF08A] pt-3 flex items-center justify-between text-xs text-[#854D0E]/80">
                <span className="text-[11px]">A little guidance. A lot of possibility.</span>
                <span className="font-bold text-sm">✦</span>
              </div>

              {/* Handwritten annotation pointing from right */}
              <div className="hidden lg:block absolute -right-32 top-14 text-left font-serif italic text-sm text-[#2563EB] pointer-events-none">
                <svg className="w-10 h-7 text-[#2563EB] mb-1 -rotate-45" viewBox="0 0 50 30" fill="none">
                  <path d="M5 25 C 20 5, 35 5, 45 15 M 40 18 L 45 15 L 43 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Your experience.</span>
                <span className="block font-semibold">The final say.</span>
              </div>

            </div>

          </div>

          {/* THREE-STEP FLOW INDICATOR BELOW HERO */}
          <div className="mt-14 sm:mt-16 pt-8 border-t border-gray-100 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-medium text-[#4B5563]">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-[#2563EB]">01</span>
              <span>Read the handwriting</span>
            </div>
            <div className="w-8 h-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-[#2563EB]">02</span>
              <span>Connect the reasoning</span>
            </div>
            <div className="w-8 h-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-[#2563EB]">03</span>
              <span>Keep the human judgement</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
