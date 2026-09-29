import React from 'react';
import Link from 'next/link';
import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { ArrowRight, ArrowUpRight, Scale, BookOpen, CheckCircle, FileCheck, Award, MessageSquare } from 'lucide-react';

export const metadata = {
  title: "Subjective Answer Evaluation | PaperEval",
  description: "Rubric-grounded evaluation for long-form answers, university essays, and case studies with defensible step marks.",
};

export default function SubjectiveAnswerEvaluationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF5] selection:bg-amber-200 selection:text-slate-900">
      <MarketingNav />

      <main className="flex-1 pt-32 pb-20">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-4 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/60">
            <span>✦</span>
            <span>SOLUTION: SUBJECTIVE &amp; ESSAY EVALUATION</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-[#111827] tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Evaluate long answers with{" "}
            <span className="italic relative inline-block">
              objective rigor
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-[#16A34A] pointer-events-none"
                viewBox="0 0 280 12"
                fill="none"
              >
                <path d="M3 9C55 4 125 3 277 8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>.
          </h1>

          <p className="text-base sm:text-xl text-[#4B5563] max-w-2xl mx-auto leading-relaxed mt-6">
            Subjective grading shouldn't depend on which evaluator marks the paper or how tired they feel at 5 PM. PaperEval binds multi-criteria rubrics to every paragraph.
          </p>

          <div className="mt-8 flex flex-row items-center justify-center gap-3">
            <Link
              href="/contact?solution=subjective"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all shadow-sm"
            >
              <span>Explore subjective workflows</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center space-x-1.5 px-6 py-3 rounded-lg text-sm font-semibold text-[#111827] bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs transition-all"
            >
              <span>View institutional pricing</span>
              <ArrowUpRight className="w-4 h-4 text-gray-500" />
            </Link>
          </div>
        </section>

        {/* 3 COLUMNS OF RUBRIC RIGOR */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Multi-Dimensional Rubrics</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Splits 15-mark and 20-mark descriptive answers into Conceptual Clarity (40%), Evidence &amp; Examples (30%), Terminology (20%), and Structure (10%).
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Borderline Mark Detection</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Flags answer scripts hovering on passing thresholds (e.g. 38% - 42%) or grade boundary jumps for mandatory dual-examiner verification.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Defensible Margin Notes</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Generates concise, constructive feedback explanations tied directly to rubric clauses, minimizing student grievances and re-checking appeals.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM PILOT CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-8">
          <div className="p-10 bg-slate-900 text-white rounded-3xl space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl text-white">
              Eliminate subjective valuation disparities
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Standardize grading across large faculties, affiliated colleges, and visiting examiners.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all"
              >
                Schedule an institutional evaluation pilot
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
