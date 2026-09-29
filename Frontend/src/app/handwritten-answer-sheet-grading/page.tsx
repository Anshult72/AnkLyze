import React from 'react';
import Link from 'next/link';
import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { ArrowRight, ArrowUpRight, Check, Eye, PenTool, Sparkles, Binary, ShieldCheck, Cpu } from 'lucide-react';

export const metadata = {
  title: "Handwritten Answer Sheet Grading | PaperEval",
  description: "Advanced vision AI for cursive handwriting recognition, diagram parsing, and mathematical equation evaluation on handwritten exam sheets.",
};

export default function HandwrittenAnswerSheetGradingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF5] selection:bg-amber-200 selection:text-slate-900">
      <MarketingNav />

      <main className="flex-1 pt-32 pb-20">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-4 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/60">
            <span>✦</span>
            <span>SOLUTION: HANDWRITTEN SCRIPT GRADING</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-[#111827] tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Untidy cursive, complex diagrams,{" "}
            <span className="italic relative inline-block">
              accurately parsed
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
            Trained on millions of authentic handwritten student scripts. PaperEval handles non-standard handwriting, struck-out working notes, freehand sketches, and dual-language submissions with high fidelity.
          </p>

          <div className="mt-8 flex flex-row items-center justify-center gap-3">
            <Link
              href="/contact?solution=handwritten"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all shadow-sm"
            >
              <span>Test with your sample scripts</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/examiner/dashboard"
              className="inline-flex items-center space-x-1.5 px-6 py-3 rounded-lg text-sm font-semibold text-[#111827] bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs transition-all"
            >
              <span>View sample evaluation</span>
              <ArrowUpRight className="w-4 h-4 text-gray-500" />
            </Link>
          </div>
        </section>

        {/* 4 HANDWRITING CAPABILITIES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white border border-gray-200/90 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Adaptive Cursive OCR</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Overcomes low-contrast pencil marks, fast cursive slants, and rough paper bleeding. Converts messy handwritten paragraphs into clean searchable transcripts linked word-for-word to the original raster scan.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-gray-200/90 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Equations & Scientific Notations</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Parses fractions, integral symbols, matrix arrays, chemical formulas, and subscript indices with syntactic awareness. Recognizes intermediate steps even when calculations skip standard lines.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-gray-200/90 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Binary className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Hand-Drawn Diagram Verification</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Detects labels, nodes, geometric angles, and circuit schematics. Validates whether mandatory elements (e.g. tree root, directional arrows, circuit grounding) are correctly illustrated.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-gray-200/90 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">Struck-Out Text Disregard</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Identifies crossed-out rough notes, discarded scratch equations, and margin doodles, ensuring they are excluded from formal grading without penalizing the final response.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-8">
          <div className="p-10 bg-slate-900 text-white rounded-3xl space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl text-white">
              Benchmark your university's answer scripts
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Upload a blinded test set of 20 scanned scripts and experience accuracy rates before full institutional deployment.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all"
              >
                Request a sample validation run
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
