import React from 'react';
import Link from 'next/link';
import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { ArrowRight, Check, Sparkles, HelpCircle } from 'lucide-react';

export const metadata = {
  title: "Institutional Pricing & Plans | PaperEval",
  description: "Transparent script-based licensing tiers for colleges, universities, and state examination boards.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF5] selection:bg-amber-200 selection:text-slate-900">
      <MarketingNav />

      <main className="flex-1 pt-32 pb-20">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-4 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/60">
            <span>✦</span>
            <span>INSTITUTIONAL LICENSING &amp; PLANS</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-normal text-[#111827] tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Defensible academic grading,{" "}
            <span className="italic relative inline-block">
              predictable costs
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-[#FBBF24] pointer-events-none"
                viewBox="0 0 280 12"
                fill="none"
              >
                <path d="M3 9C55 4 125 3 277 8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>.
          </h1>

          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed mt-5">
            Transparent per-script pricing designed around Indian semester cycles and state board valuation camps. Zero hidden fees.
          </p>
        </section>

        {/* 3 PRICING TIERS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* Tier 1: Department Pilot */}
            <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500 block">Department Tier</span>
                <h3 className="font-serif text-2xl font-bold text-gray-900">Academic Pilot</h3>
                <p className="text-xs text-gray-500">Perfect for departmental trials, mid-term internals, or mock accreditation audits.</p>
                <div className="pt-2 pb-4 border-b border-gray-100">
                  <span className="text-3xl font-serif font-bold text-gray-900">₹14</span>
                  <span className="text-xs text-gray-500 font-medium"> / evaluated booklet</span>
                  <span className="block text-[11px] text-gray-400 mt-0.5">Up to 15,000 scripts / semester</span>
                </div>

                <ul className="space-y-3 text-xs text-gray-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Full handwriting &amp; cursive OCR engine</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Rubric question mapping &amp; step marks</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Examiner Evaluation Workspace access</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Standard 48-hour onboarding support</li>
                </ul>
              </div>

              <Link
                href="/contact?plan=pilot"
                className="w-full py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-900 font-semibold text-xs text-center transition-colors block"
              >
                Start Department Pilot
              </Link>
            </div>

            {/* Tier 2: University Campus (FEATURED) */}
            <div className="p-8 rounded-3xl bg-white border-2 border-blue-600 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                MOST POPULAR
              </div>

              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 block">Campus-Wide Tier</span>
                <h3 className="font-serif text-2xl font-bold text-gray-900">University Campus</h3>
                <p className="text-xs text-gray-500">Comprehensive solution for autonomous colleges and multi-faculty universities.</p>
                <div className="pt-2 pb-4 border-b border-gray-100">
                  <span className="text-3xl font-serif font-bold text-blue-600">₹9.50</span>
                  <span className="text-xs text-gray-500 font-medium"> / evaluated booklet</span>
                  <span className="block text-[11px] text-gray-400 mt-0.5">15,000 - 150,000 scripts / semester</span>
                </div>

                <ul className="space-y-3 text-xs text-gray-700">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> <strong>Everything in Pilot</strong>, plus:</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Automated NAAC CO-PO Attainment Matrix</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> 3-Stage Moderation Council &amp; HOD sign-off</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Dedicated tenant isolation cloud instance</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Faculty evaluation training workshop</li>
                </ul>
              </div>

              <Link
                href="/contact?plan=university"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs text-center transition-colors block shadow-sm"
              >
                Schedule Campus Rollout
              </Link>
            </div>

            {/* Tier 3: State Board / Consortium */}
            <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 block">Enterprise / Government</span>
                <h3 className="font-serif text-2xl font-bold text-white">Board &amp; Consortium</h3>
                <p className="text-xs text-slate-400">Custom volume deployment for state examination boards and pan-university valuation camps.</p>
                <div className="pt-2 pb-4 border-b border-slate-800">
                  <span className="text-3xl font-serif font-bold text-white">Custom</span>
                  <span className="text-xs text-slate-400 font-medium"> SLA contract</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">150,000+ scripts / examination camp</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0" /> High-throughput local camp scanner drivers</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Air-gapped on-premise or GovCloud hosting</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Custom ERP &amp; Result Tabulation integration</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0" /> 24/7 dedicated valuation support room</li>
                </ul>
              </div>

              <Link
                href="/contact?plan=enterprise"
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs text-center transition-colors block border border-slate-700"
              >
                Request Enterprise Contract
              </Link>
            </div>

          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-xs text-gray-500 mt-1">Clear answers regarding institutional adoption and evaluation rigor.</p>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-gray-200">
              <h4 className="font-serif text-base font-bold text-gray-900">Does PaperEval replace university faculty?</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Strictly no. PaperEval operates on an educator-in-the-loop mandate. AI performs the labor-intensive initial pass (OCR transcription, diagram validation, step-wise rubric alignment), drafting provisional scores. Faculty examiners retain 100% legal signing authority and can modify any score in 1 click.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200">
              <h4 className="font-serif text-base font-bold text-gray-900">How do we upload our subject-specific question rubrics?</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Rubrics can be uploaded as standard PDF question schemes, Word documents, or entered via our structured Rubric Builder in the Examiner Cockpit. The engine automatically maps question criteria and step weights.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200">
              <h4 className="font-serif text-base font-bold text-gray-900">Where is student answer script data stored?</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                All data is encrypted with AES-256 and hosted within certified tier-4 data centers physically located in India in strict compliance with the Digital Personal Data Protection (DPDP) Act 2023.
              </p>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
