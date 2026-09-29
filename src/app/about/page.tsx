import React from 'react';
import Link from 'next/link';
import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { ArrowRight, ArrowUpRight, Shield, Award, Users, CheckCircle } from 'lucide-react';

export const metadata = {
  title: "About PaperEval | Examination Technology & Academic Integrity",
  description: "Learn how PaperEval combines vision AI with human educator oversight to eliminate grading delays and ensure academic defensibility.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF5] selection:bg-amber-200 selection:text-slate-900">
      <MarketingNav />

      <main className="flex-1 pt-32 pb-20">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-4 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/60">
            <span>✦</span>
            <span>INSTITUTIONAL MISSION &amp; INTEGRITY</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-[#111827] tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Restoring time &amp; trust to{" "}
            <span className="italic relative inline-block">
              every grade
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-[#2563EB] pointer-events-none"
                viewBox="0 0 280 12"
                fill="none"
              >
                <path d="M3 9C55 4 125 3 277 8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>.
          </h1>

          <p className="text-base sm:text-xl text-[#4B5563] max-w-2xl mx-auto leading-relaxed mt-6">
            Higher education in India conducts hundreds of millions of handwritten evaluations every semester. PaperEval was founded to protect faculty from valuation fatigue while giving students transparent, defensible results.
          </p>
        </section>

        {/* 3 CORE PILLARS */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Educators Over Automation</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We believe AI should prepare the groundwork—transcription, rubric checks, step matching—never issue the final verdict. Faculty expertise is irreplaceable.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Defensible Evidence</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every awarded mark links to candidate handwriting snippets and explicit rubric clauses, virtually eliminating arbitrary scoring and student RTI appeals.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">National Accreditation Ready</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Direct question-level mapping to Bloom's taxonomy and Course Outcomes (CO-PO) automates statutory compliance for NAAC and NBA accreditation.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-8">
          <div className="p-10 bg-slate-900 text-white rounded-3xl space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl text-white">
              Experience the future of examination evaluation
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Explore the examiner workspace cockpit or get in touch for an institutional pilot.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/examiner/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all"
              >
                Launch Examiner Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-sm transition-all border border-slate-700"
              >
                Contact Academic Team
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
