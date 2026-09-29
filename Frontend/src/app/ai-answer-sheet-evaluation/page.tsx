import React from 'react';
import Link from 'next/link';
import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { ArrowRight, ArrowUpRight, CheckCircle2, FileText, Check, Shield, Layers, BrainCircuit, Sparkles, Scale } from 'lucide-react';

export const metadata = {
  title: "AI Answer Sheet Evaluation | PaperEval",
  description: "Automated preliminary grading for handwritten university exam sheets with rubric linkage and 100% faculty approval gate.",
};

export default function AIAnswerSheetEvaluationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF5] selection:bg-amber-200 selection:text-slate-900">
      <MarketingNav />

      <main className="flex-1 pt-32 pb-20">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-4 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/60">
            <span>✦</span>
            <span>SOLUTION: AI ANSWER SHEET EVALUATION</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-[#111827] tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Automate script grading.{" "}
            <span className="italic relative inline-block">
              Keep faculty
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-[#FBBF24] pointer-events-none"
                viewBox="0 0 280 12"
                fill="none"
              >
                <path d="M3 9C55 4 125 3 277 8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>{" "}
            in control.
          </h1>

          <p className="text-base sm:text-xl text-[#4B5563] max-w-2xl mx-auto leading-relaxed mt-6">
            PaperEval ingests high-resolution scans of student booklets, isolates question boundaries, matches steps against the marking scheme, and drafts provisional marks for educator sign-off.
          </p>

          <div className="mt-8 flex flex-row items-center justify-center gap-3">
            <Link
              href="/contact?solution=ai-eval"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all shadow-sm"
            >
              <span>Request institutional demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/examiner/dashboard"
              className="inline-flex items-center space-x-1.5 px-6 py-3 rounded-lg text-sm font-semibold text-[#111827] bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs transition-all"
            >
              <span>Explore live portal</span>
              <ArrowUpRight className="w-4 h-4 text-gray-500" />
            </Link>
          </div>
        </section>

        {/* COMPARISON CALLOUT BANNER */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-white rounded-3xl border border-gray-200/90 shadow-sm">
            <div className="space-y-4 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
              <span className="text-xs font-mono uppercase font-bold text-gray-400 tracking-wider">Traditional Script Grading</span>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Manual Evaluation Latency</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>25 to 35 minutes per 32-page subjective answer booklet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Severe fatigue drift between script #1 and script #80</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Opaque total marks resulting in frequent re-evaluation RTI disputes</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4 md:pl-2">
              <span className="text-xs font-mono uppercase font-bold text-blue-600 tracking-wider">PaperEval Assisted Workflow</span>
              <h3 className="font-serif text-2xl font-bold text-blue-950">AI-Drafted, Educator-Verified</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>5 to 7 minutes</strong> per booklet with pre-extracted OCR text</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Strict rubric alignment</strong> prevents grading leniency or harshness drift</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Step-level audit trail</strong> protects teachers with defensible evidence links</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3 CORE CAPABILITY CARDS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#111827]">
              Engineered for multi-format examinations
            </h2>
            <p className="text-base text-gray-600 mt-3">
              From engineering derivations and medical case studies to humanities essays, PaperEval adapts to institutional marking schemes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-blue-600 font-semibold uppercase tracking-wider block">Capability 01</span>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Booklet Question Segmentation</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Automatically detects question numbers, sub-parts, attempted options (e.g. Question 3A vs 3B), and maps them to the master key.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-amber-600 font-semibold uppercase tracking-wider block">Capability 02</span>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Step-Wise Rubric Grading</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Breaks questions into discrete rubric criteria (derivation, formula, final calculation, diagram) and assigns transparent partial marks.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Scale className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-emerald-600 font-semibold uppercase tracking-wider block">Capability 03</span>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Single-Click Faculty Override</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Examiners can adjust partial marks in 1 click, add custom margin notes, or flag for Chief Examiner moderation without loss of audit logs.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM PILOT CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-8">
          <div className="p-10 bg-slate-900 text-white rounded-3xl space-y-6 relative overflow-hidden">
            <h2 className="font-serif text-3xl sm:text-4xl text-white">
              Ready to pilot AI evaluation in your next examination cycle?
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              We provide sample batch calibration, rubric onboarding, and faculty orientation within 48 hours.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all"
              >
                Schedule an institutional onboarding
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
