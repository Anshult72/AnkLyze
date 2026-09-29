import React from 'react';
import Link from 'next/link';
import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { ArrowRight, BookOpen, ShieldCheck, CheckCircle2, FileText, Download, Award, Lock, ExternalLink } from 'lucide-react';

export const metadata = {
  title: "Resource Hub & Academic Methodology | PaperEval",
  description: "Technical whitepapers, accuracy methodology, compliance standards, and responsible AI documentation for higher education.",
};

export default function ResourcesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF5] selection:bg-amber-200 selection:text-slate-900">
      <MarketingNav />

      <main className="flex-1 pt-32 pb-20">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-4 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/60">
            <span>✦</span>
            <span>RESEARCH, BENCHMARKS &amp; COMPLIANCE</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-[#111827] tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Academic rigor backed by{" "}
            <span className="italic relative inline-block">
              verifiable science
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-[#FBBF24] pointer-events-none"
                viewBox="0 0 280 12"
                fill="none"
              >
                <path d="M3 9C55 4 125 3 277 8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>.
          </h1>

          <p className="text-base sm:text-xl text-[#4B5563] max-w-2xl mx-auto leading-relaxed mt-6">
            Explore our peer-reviewed evaluation benchmarks, double-blind accuracy methodologies, and institutional security frameworks designed for university examination boards.
          </p>
        </section>

        {/* 4 CORE RESOURCE SECTIONS */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 mb-24">
          
          {/* 1. ACCURACY METHODOLOGY */}
          <div id="accuracy" className="p-8 sm:p-10 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-6 scroll-mt-28">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase font-bold text-blue-600 tracking-wider">Methodology Section 01</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Accuracy &amp; Benchmark Methodology</h2>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              PaperEval undergoes continuous double-blind benchmarking against veteran university examination panels. Each AI provisional score is compared against the consensus marks awarded by three independent senior professors.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-2xl font-serif font-bold text-gray-900">98.4%</span>
                <span className="block text-xs text-gray-500 mt-1">Rubric Step Concordance</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-2xl font-serif font-bold text-gray-900">±1.2 Marks</span>
                <span className="block text-xs text-gray-500 mt-1">Max Score Delta on 100M Scale</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-2xl font-serif font-bold text-gray-900">100%</span>
                <span className="block text-xs text-gray-500 mt-1">Faculty Verification Gate</span>
              </div>
            </div>
          </div>

          {/* 2. RESPONSIBLE AI */}
          <div id="responsible-ai" className="p-8 sm:p-10 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-6 scroll-mt-28">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase font-bold text-emerald-600 tracking-wider">Governance Section 02</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Responsible AI Grading Principles</h2>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              We reject black-box autonomous grading. Academic degrees impact student livelihoods, so every algorithm deployed in PaperEval enforces 4 non-negotiable principles:
            </p>

            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Zero autonomous grade release:</strong> No score is published or recorded until a registered human examiner explicitly approves or modifies it.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Evidence grounding:</strong> AI cannot award or deduct marks without highlighting the exact bounding-box snippet on the candidate's answer page.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>No student profiling:</strong> Candidate identity and demographic variables are cryptographically blinded before scripts reach the evaluation engine.</span>
              </li>
            </ul>
          </div>

          {/* 3. SECURITY & COMPLIANCE */}
          <div id="security" className="p-8 sm:p-10 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-6 scroll-mt-28">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase font-bold text-indigo-600 tracking-wider">Compliance Section 03</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Security &amp; Statutory Compliance</h2>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              PaperEval is engineered specifically to meet Indian higher education mandates, state university examination statutes, and data privacy regulations:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <h4 className="font-bold text-sm text-gray-900">NAAC Criterion 2.6 Ready</h4>
                <p className="text-xs text-gray-600">Automated attainment computation for Course Outcomes (CO) and Program Outcomes (PO) required for NAAC self-study reports.</p>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <h4 className="font-bold text-sm text-gray-900">DPDP Act 2023 Conformance</h4>
                <p className="text-xs text-gray-600">Complete student data residency within India, strict purpose limitation, and automated PII anonymization.</p>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <h4 className="font-bold text-sm text-gray-900">AES-256 Bit Encryption</h4>
                <p className="text-xs text-gray-600">Every digitized answer script is encrypted in transit (TLS 1.3) and at rest with institution-managed KMS encryption keys.</p>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <h4 className="font-bold text-sm text-gray-900">Role-Based Examiner Separation</h4>
                <p className="text-xs text-gray-600">Examiners, Head Examiners, and Controllers operate on strictly gated permission tiers with immutable audit logs.</p>
              </div>
            </div>
          </div>

        </section>

        {/* BOTTOM CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-8">
          <div className="p-10 bg-slate-900 text-white rounded-3xl space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl text-white">
              Request institutional whitepapers &amp; audit packs
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Receive our comprehensive security architecture documentation and double-blind validation benchmark report.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all"
              >
                Request documentation pack
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
