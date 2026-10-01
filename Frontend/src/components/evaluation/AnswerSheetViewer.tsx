"use client";

import React, { useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  Eye,
  Crosshair,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { QuestionData } from "@/data/evaluationWorkspaceMockData";

interface AnswerSheetViewerProps {
  question: QuestionData;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  activeEvidenceKey?: string | null;
  onSelectEvidence?: (key: string | null) => void;
}

export default function AnswerSheetViewer({
  question,
  currentPage,
  totalPages,
  onPageChange,
  activeEvidenceKey,
  onSelectEvidence,
}: AnswerSheetViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fitMode, setFitMode] = useState<boolean>(true);

  const handleZoomIn = () => {
    setFitMode(false);
    setZoomLevel((prev) => Math.min(prev + 15, 175));
  };

  const handleZoomOut = () => {
    setFitMode(false);
    setZoomLevel((prev) => Math.max(prev - 15, 70));
  };

  const handleResetZoom = () => {
    setFitMode(true);
    setZoomLevel(100);
  };

  const isCurrentQuestionPage = currentPage === question.pageNumber;

  return (
    <div className="flex flex-col h-full bg-slate-100 border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden select-none">
      
      {/* 1. TOP QUESTION CONTEXT BAR (Compacted per prompt specs) */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center space-x-2.5">
          <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
            QUESTION {question.questionNumber.replace(/^Q/i, "")}
          </span>
          <span className="text-xs font-semibold text-slate-800">
            Maximum Marks: {question.maxMarks}
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            {question.section}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-blue-700 bg-blue-50/80 px-2.5 py-0.5 rounded-full border border-blue-200 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          <span>Answer detected: Pages 4–5</span>
        </div>
      </div>

      {/* 2. DOCUMENT VIEWER TOOLBAR */}
      <div className="h-12 bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0">
        
        {/* Left: Zoom Controls */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 70 && !fitMode}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs font-bold text-slate-900 w-12 text-center">
            {fitMode ? "100%" : `${zoomLevel}%`}
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 175}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={handleResetZoom}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              fitMode
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
            }`}
            title="Fit document to view width"
          >
            Fit to View
          </button>
        </div>

        {/* Right: Page Navigation Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Indicator & Dropdown */}
          <div className="flex items-center space-x-1.5 font-mono text-xs">
            <span className="text-slate-500 font-medium">Page</span>
            <select
              value={currentPage}
              onChange={(e) => onPageChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs cursor-pointer"
              aria-label="Select answer sheet page"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <option key={pg} value={pg}>
                  {pg < 10 ? `0${pg}` : pg}
                </option>
              ))}
            </select>
            <span className="text-slate-400">/ {totalPages}</span>
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 3. LIGHTWEIGHT PAGE SELECTOR TABS STRIP (Quick Page Navigation) */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-3 py-1 flex items-center space-x-1 overflow-x-auto scrollbar-none shrink-0 text-[11px] font-mono">
        <span className="text-slate-400 font-semibold uppercase text-[10px] mr-1 hidden sm:inline">
          Booklet:
        </span>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
          const isSelected = pg === currentPage;
          const isQ4 = pg === 4;
          return (
            <button
              type="button"
              key={pg}
              onClick={() => onPageChange(pg)}
              className={`px-2 py-0.5 rounded transition-all shrink-0 flex items-center space-x-1 ${
                isSelected
                  ? "bg-slate-900 text-white font-bold shadow-2xs"
                  : isQ4
                  ? "bg-blue-100 text-blue-800 font-bold hover:bg-blue-200"
                  : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/60"
              }`}
            >
              <span>Pg {pg < 10 ? `0${pg}` : pg}</span>
              {isQ4 && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </button>
          );
        })}
      </div>

      {/* 4. SCROLLABLE SCAN VIEWPORT */}
      <div className="flex-1 overflow-auto p-2 sm:p-5 flex justify-center items-start bg-slate-200/60 relative">
        
        {/* Physical Paper Document with Subtle Scan Imperfections */}
        <div
          className="scanned-paper relative origin-top rounded-xs transition-transform duration-150 overflow-hidden border border-slate-300"
          style={{
            width: fitMode ? "100%" : `${zoomLevel}%`,
            maxWidth: fitMode ? "820px" : "none",
            minHeight: "1080px",
            // Natural flatbed scanner alignment (subtle 0.1deg tilt and scan vignette)
            transform: "rotate(0.08deg)",
          }}
        >
          {/* Subtle Scan Vignette / Scanner Edge Shadows */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_16px_rgba(0,0,0,0.06)] z-10" />

          {/* Natural Paper Grain Texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.035] z-10"
            style={{
              backgroundImage: `radial-gradient(#0f172a 0.75px, transparent 0.75px)`,
              backgroundSize: "7px 7px",
            }}
          />

          {/* Vertical Red Margin Rule (Indian Examination Standard: 70px from left) */}
          <div className="absolute left-14 sm:left-18 top-0 bottom-0 w-[1.5px] bg-rose-500/35 pointer-events-none z-10" />

          {/* Ruled Blue Notebook Guide Lines (28px standard spacing) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.14] z-0"
            style={{
              backgroundImage: `linear-gradient(to bottom, transparent 27px, #9DBEBB 28px)`,
              backgroundSize: "100% 28px",
            }}
          />

          {/* Left Binder Punch Perforations */}
          <div className="absolute left-3.5 top-16 w-3 h-3 rounded-full border border-slate-300/80 bg-slate-200/90 shadow-inner z-10" />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-slate-300/80 bg-slate-200/90 shadow-inner z-10" />
          <div className="absolute left-3.5 bottom-16 w-3 h-3 rounded-full border border-slate-300/80 bg-slate-200/90 shadow-inner z-10" />

          {/* Corner Alignment Crosshairs (Authentic scanner registration marks) */}
          <span className="absolute top-2 left-2 text-[10px] text-slate-400 font-mono select-none pointer-events-none">+</span>
          <span className="absolute top-2 right-2 text-[10px] text-slate-400 font-mono select-none pointer-events-none">+</span>
          <span className="absolute bottom-2 left-2 text-[10px] text-slate-400 font-mono select-none pointer-events-none">+</span>
          <span className="absolute bottom-2 right-2 text-[10px] text-slate-400 font-mono select-none pointer-events-none">+</span>

          {/* PRINTED HEADER OF ANSWER BOOKLET */}
          <div className="px-5 sm:px-9 pt-4 pb-2.5 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono bg-white/40">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 tracking-tight">MP STATE BOARD OF TECHNICAL EXAMINATIONS</span>
              <span>•</span>
              <span className="text-slate-600">MAIN ANSWER BOOKLET</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[9px] tracking-widest text-slate-400 font-bold hidden sm:inline">
                |||||| | ||||| || |||||||
              </span>
              <span className="font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 text-[10px]">
                PAGE {currentPage < 10 ? `0${currentPage}` : currentPage} / {totalPages}
              </span>
            </div>
          </div>

          {/* PAGE CONTENT CONTAINER */}
          <div className="pl-16 sm:pl-22 pr-5 sm:pr-9 pt-5 pb-12 relative min-h-[980px]">
            
            {/* ========================================================================= */}
            {/* PAGE 4: ACTIVE QUESTION (Q04) - AUTHENTIC HANDWRITTEN ANSWER */}
            {/* ========================================================================= */}
            {currentPage === 4 ? (
              <div className="space-y-4">
                
                {/* QUESTION 04 DETECTED ANSWER REGION HIGHLIGHT */}
                <div
                  className={`relative p-3.5 sm:p-5 rounded-xl border transition-all ${
                    activeEvidenceKey
                      ? "border-blue-500 bg-blue-50/[0.04] ring-1 ring-blue-500/30"
                      : "border-blue-400/80 bg-blue-50/[0.02]"
                  }`}
                >
                  {/* Region Identifier Badge */}
                  <div className="absolute -top-3 left-3 bg-blue-600 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded shadow-xs flex items-center space-x-1.5 z-20">
                    <Crosshair className="w-3 h-3" />
                    <span>QUESTION 04 • DETECTED ANSWER (PAGE 04)</span>
                  </div>

                  {/* Student Margined Question Number & Answer Title */}
                  <div className="flex items-baseline space-x-3 pt-2 mb-2 font-handwriting">
                    <span className="text-2xl font-bold text-blue-950 underline decoration-blue-900 decoration-2 tracking-wide">
                      Ans 4.
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-blue-950 underline decoration-blue-900/60 decoration-1 tracking-wide">
                      Working Principle &amp; Performance Factors of Thermal Conduction System
                    </span>
                  </div>

                  {/* SECTION 1: CORE CONCEPT & FOURIER'S LAW */}
                  <div
                    onClick={() => onSelectEvidence?.("concept")}
                    className={`p-2.5 rounded-lg transition-all cursor-pointer ${
                      activeEvidenceKey === "concept"
                        ? "bg-blue-100/60 border-l-3 border-blue-600 shadow-2xs"
                        : "hover:bg-blue-50/30"
                    }`}
                    title="Click to focus Core Concept evidence"
                  >
                    <p className="handwritten-blue-ink text-base sm:text-lg leading-[32px]">
                      The fundamental working principle of the thermal conduction system is governed by{" "}
                      <span className="font-bold underline decoration-blue-900">Fourier&apos;s Law of Heat Conduction</span>.
                      Under steady-state conditions, heat flows spontaneously through a homogeneous solid medium from a region
                      of higher temperature to lower temperature via lattice vibrational waves (phonons) and free electron migration.
                    </p>
                  </div>

                  {/* SECTION 2: WORKING PRINCIPLE & SLIP-OF-PEN CORRECTION */}
                  <div
                    onClick={() => onSelectEvidence?.("principle")}
                    className={`p-2.5 rounded-lg transition-all cursor-pointer ${
                      activeEvidenceKey === "principle"
                        ? "bg-blue-100/60 border-l-3 border-blue-600 shadow-2xs"
                        : "hover:bg-blue-50/30"
                    }`}
                    title="Click to focus Working Principle evidence"
                  >
                    <p className="handwritten-blue-ink text-base sm:text-lg leading-[32px]">
                      The rate of conductive heat transfer is directly proportional to the normal cross-sectional surface area (A)
                      and the negative temperature gradient (dT/dx) along the direction of flow. In this{" "}
                      {/* Realistic student crossed-out word and correction */}
                      <span className="inline-flex flex-col items-center mx-1 align-middle">
                        <span className="text-[12px] font-bold text-blue-900 leading-none">conductive</span>
                        <span className="line-through decoration-blue-900 decoration-2 text-blue-800/70">convective</span>
                      </span>{" "}
                      arrangement, no bulk physical displacement of the medium occurs during the steady-state thermal transport.
                    </p>
                  </div>

                  {/* SECTION 3: MATHEMATICAL FORMULATION (Handwritten Boxed Formula) */}
                  <div
                    onClick={() => onSelectEvidence?.("technical")}
                    className={`my-3 p-3.5 rounded-xl transition-all cursor-pointer ${
                      activeEvidenceKey === "technical"
                        ? "bg-blue-100/60 border border-blue-500 shadow-2xs"
                        : "bg-white/80 border border-slate-200/90 hover:bg-white"
                    }`}
                    title="Click to focus Technical Explanation evidence"
                  >
                    <div className="max-w-md mx-auto text-center font-handwriting space-y-1">
                      <div className="inline-block p-2 border-2 border-blue-950 rounded-lg text-xl sm:text-2xl font-bold text-blue-950 tracking-wider shadow-2xs">
                        q = − k · A · ( dT / dx ) &nbsp;&nbsp;{" "}
                        <span className="text-sm font-sans text-slate-500 font-normal">--- Eq. (1)</span>
                      </div>
                      <div className="text-left pt-2 text-xs sm:text-sm text-blue-900 leading-relaxed font-handwriting">
                        <p>where:</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-2 text-blue-950">
                          <li><strong>k</strong> = thermal conductivity of medium (W / m·K)</li>
                          <li><strong>A</strong> = cross-sectional area perpendicular to heat path (m²)</li>
                          <li><strong>dT / dx</strong> = temperature gradient across wall thickness (K / m)</li>
                          <li>negative sign represents heat flow in direction of decreasing temperature.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: AUTHENTIC HAND-SKETCHED TECHNICAL DIAGRAM */}
                  <div
                    onClick={() => onSelectEvidence?.("technical")}
                    className={`my-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      activeEvidenceKey === "technical"
                        ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
                        : "border-slate-300/80 bg-white/70 hover:bg-white/90"
                    }`}
                    title="Click to focus Technical Explanation evidence"
                  >
                    <div className="text-center font-handwriting text-xs text-blue-950 font-bold mb-1">
                      Fig 4.1: Schematic of Steady-State Conduction Across Homogeneous Plane Wall
                    </div>
                    
                    <svg
                      viewBox="0 0 540 180"
                      className="w-full max-w-[480px] mx-auto text-blue-950 stroke-current fill-none"
                      style={{ strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }}
                    >
                      {/* Thermal Wall Slab Block (Hand-sketched lines with slight organic waver) */}
                      <rect x="160" y="25" width="160" height="115" className="fill-amber-50/50" />
                      <line x1="160" y1="25" x2="320" y2="25" />
                      <line x1="160" y1="140" x2="320" y2="140" />
                      <line x1="160" y1="25" x2="160" y2="140" />
                      <line x1="320" y1="25" x2="320" y2="140" />

                      {/* Hand-drawn crosshatching inside the slab */}
                      <line x1="175" y1="35" x2="195" y2="55" strokeWidth="1.2" strokeOpacity="0.45" />
                      <line x1="205" y1="35" x2="225" y2="55" strokeWidth="1.2" strokeOpacity="0.45" />
                      <line x1="235" y1="35" x2="255" y2="55" strokeWidth="1.2" strokeOpacity="0.45" />
                      <line x1="265" y1="35" x2="285" y2="55" strokeWidth="1.2" strokeOpacity="0.45" />
                      <line x1="295" y1="35" x2="315" y2="55" strokeWidth="1.2" strokeOpacity="0.45" />

                      {/* Heat Inflow Arrow */}
                      <path d="M 55 80 L 145 80 M 135 73 L 145 80 L 135 87" strokeWidth="2.4" stroke="#326c74" />
                      <text x="45" y="65" className="fill-blue-950 stroke-none font-handwriting text-[14px] font-bold">
                        Heat In (Q_in)
                      </text>
                      <text x="50" y="105" className="fill-slate-600 stroke-none font-mono text-[11px]">
                        T_hot = 380 K
                      </text>

                      {/* Heat Outflow Arrow */}
                      <path d="M 335 80 L 425 80 M 415 73 L 425 80 L 415 87" strokeWidth="2.4" stroke="#326c74" />
                      <text x="345" y="65" className="fill-blue-950 stroke-none font-handwriting text-[14px] font-bold">
                        Heat Out (Q_out)
                      </text>
                      <text x="350" y="105" className="fill-slate-600 stroke-none font-mono text-[11px]">
                        T_cold = 300 K
                      </text>

                      {/* Wall Thickness Dimension L / dx */}
                      <line x1="160" y1="155" x2="320" y2="155" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1="160" y1="150" x2="160" y2="160" strokeWidth="1" />
                      <line x1="320" y1="150" x2="320" y2="160" strokeWidth="1" />
                      <text x="215" y="170" className="fill-blue-950 stroke-none font-handwriting text-[13px] font-bold">
                        Thickness L = 0.05 m
                      </text>

                      {/* Linear Temperature Gradient Slope */}
                      <line x1="160" y1="50" x2="320" y2="115" stroke="#dc2626" strokeWidth="2" strokeDasharray="4 2" />
                      <text x="180" y="75" className="fill-rose-700 stroke-none font-handwriting text-[12px] font-bold">
                        dT/dx (Linear Profile)
                      </text>
                    </svg>
                  </div>

                  {/* SECTION 5: MAJOR FACTORS AFFECTING PERFORMANCE */}
                  <div
                    onClick={() => onSelectEvidence?.("principle")}
                    className={`p-2.5 rounded-lg transition-all cursor-pointer ${
                      activeEvidenceKey === "principle"
                        ? "bg-blue-100/60 border-l-3 border-blue-600 shadow-2xs"
                        : "hover:bg-blue-50/30"
                    }`}
                    title="Click to focus Working Principle / Factors"
                  >
                    <p className="handwritten-blue-ink text-base sm:text-lg leading-[32px]">
                      <strong>Major Factors Affecting Conduction Performance:</strong>
                      <br />
                      1. <span className="underline decoration-blue-900">Thermal Conductivity (k):</span> Pure metals (e.g. Copper ~385 W/mK) transfer heat rapidly, whereas insulators (e.g. fiberglass ~0.04 W/mK) impede flux.
                      <br />
                      2. <span className="underline decoration-blue-900">Wall Thickness (dx):</span> Conduction rate decreases inversely with increasing thickness due to greater thermal resistance.
                      <br />
                      3. <span className="underline decoration-blue-900">Surface Area (A):</span> Heat dissipation scales directly with available contact area.
                      <br />
                      4. <span className="underline decoration-blue-900">Temperature Differential (ΔT):</span> Larger gradient across boundaries increases total transfer driving force.
                    </p>
                  </div>

                  {/* OMITTED ELEMENTS (RUBRIC DEFICIENCY NOTED BY AI EVIDENCE) */}
                  {(activeEvidenceKey === "example" || activeEvidenceKey === "conclusion") && (
                    <div className="mt-3 p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-xs font-mono text-amber-900 animate-in fade-in duration-150">
                      <div className="font-bold flex items-center space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        <span>Rubric Observation Gap Identified</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                        {activeEvidenceKey === "example"
                          ? "Candidate has described the theoretical factors but omitted the required real-world engineering example (e.g. heat exchanger wall or furnace lagging). Rubric marks: 0 / 1."
                          : "Candidate did not provide a concluding summary of operational efficiency under varying load. Rubric marks: 0 / 1."}
                      </p>
                    </div>
                  )}

                  {/* Candidate End of Answer Mark */}
                  <div className="mt-4 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-500">
                    <span className="font-handwriting text-blue-950 font-bold text-sm">
                      --- // [End of Answer 4] // ---
                    </span>
                    <span className="text-[11px] text-slate-400">
                      OCR Quality: 96.8% • Alignment Verified
                    </span>
                  </div>

                </div>

              </div>
            ) : currentPage === 1 ? (
              /* ========================================================================= */
              /* PAGE 1: COVER PAGE / ANONYMIZED CANDIDATE BOOKLET COVER */
              /* ========================================================================= */
              <div className="space-y-6 pt-4 text-slate-900">
                
                {/* Board Seal & Header */}
                <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-5">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-900 mx-auto flex items-center justify-center font-serif font-bold text-lg mb-2">
                    MP
                  </div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold uppercase tracking-tight">
                    Madhya Pradesh Board of Technical Examinations
                  </h2>
                  <p className="text-xs font-mono text-slate-600 uppercase tracking-widest font-semibold">
                    Semester Assessment Digital Valuation Booklet (2025-26)
                  </p>
                </div>

                {/* Stamped Double-Blind Anonymization Box */}
                <div className="p-4 sm:p-5 border-2 border-dashed border-blue-600 bg-blue-50/50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-800 uppercase tracking-wider">
                      ★ DOUBLE-BLIND VALUATION SECURE STAMP
                    </span>
                    <span className="font-mono text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-bold">
                      A-10492
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    Candidate identifiers have been anonymized under MPOnline Board Examination Statutes.
                    Barcode token: <strong className="font-mono text-slate-900">MP-CS301-B03-10492-AES256</strong>.
                  </p>
                </div>

                {/* Examination Metadata Matrix */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono border border-slate-200 p-4 rounded-xl bg-white/70">
                  <div>
                    <span className="text-slate-400 block">Examination:</span>
                    <span className="font-bold text-slate-900">B.Tech CSE • Semester III</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Subject &amp; Code:</span>
                    <span className="font-bold text-slate-900">Engg. Mathematics III (CS-301)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Evaluation Batch:</span>
                    <span className="font-bold text-slate-900">Batch B-03 (Digital Scans)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Questions:</span>
                    <span className="font-bold text-slate-900">12 Questions</span>
                  </div>
                </div>

                {/* Jump to Active Question CTA */}
                <div className="text-center pt-6">
                  <button
                    type="button"
                    onClick={() => onPageChange(4)}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                  >
                    <span>Proceed to Active Question 04 (Page 04)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ) : currentPage === 2 ? (
              /* ========================================================================= */
              /* PAGE 2: Q01 & Q02 HANDWRITTEN CONTENT */
              /* ========================================================================= */
              <div className="space-y-6 pt-2 font-handwriting">
                <div className="p-4 rounded-xl border border-slate-200 bg-white/60 space-y-2">
                  <div className="flex items-baseline space-x-2 text-xl font-bold text-blue-950 underline decoration-blue-900">
                    <span>Ans 1.</span>
                    <span className="text-base font-semibold">Cauchy-Riemann Equations in Polar Coordinates</span>
                  </div>
                  <p className="handwritten-blue-ink text-base leading-[30px]">
                    Let z = r·e^(iθ). The polar form of C-R equations requires:
                    <br />
                    ∂u/∂r = (1/r) · ∂v/∂θ &nbsp;&nbsp;&nbsp;&nbsp; and &nbsp;&nbsp;&nbsp;&nbsp; ∂v/∂r = −(1/r) · ∂u/∂θ
                    <br />
                    Provided the four first-order partial derivatives exist and are continuous at (r, θ).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white/60 space-y-2">
                  <div className="flex items-baseline space-x-2 text-xl font-bold text-blue-950 underline decoration-blue-900">
                    <span>Ans 2.</span>
                    <span className="text-base font-semibold">Contour Integral Evaluation</span>
                  </div>
                  <p className="handwritten-blue-ink text-base leading-[30px]">
                    To evaluate ∮ dz / (z − 2) over |z| = 3.
                    <br />
                    Singularity occurs at z₀ = 2, which lies inside the circular contour |z| = 3.
                    <br />
                    Applying Cauchy&apos;s Integral Formula: ∮ f(z)/(z − z₀) dz = 2πi · f(z₀).
                    <br />
                    Here f(z) = 1, hence evaluated integral = <strong>2πi</strong>.
                  </p>
                </div>
              </div>
            ) : currentPage === 3 ? (
              /* ========================================================================= */
              /* PAGE 3: Q03 HANDWRITTEN CONTENT */
              /* ========================================================================= */
              <div className="space-y-4 pt-2 font-handwriting">
                <div className="p-4 rounded-xl border border-slate-200 bg-white/60 space-y-2">
                  <div className="flex items-baseline space-x-2 text-xl font-bold text-blue-950 underline decoration-blue-900">
                    <span>Ans 3.</span>
                    <span className="text-base font-semibold">Taylor Series Expansion about z = 0</span>
                  </div>
                  <p className="handwritten-blue-ink text-base leading-[30px]">
                    Given f(z) = 1 / ((z + 1)(z + 3)).
                    <br />
                    Decomposing into partial fractions:
                    <br />
                    f(z) = (1/2) · [ 1/(z + 1) − 1/(z + 3) ] = (1/2) · [ (1 + z)⁻¹ − (1/3) · (1 + z/3)⁻¹ ]
                    <br />
                    Expanding binomially for |z| &lt; 1:
                    <br />
                    f(z) = (1/2) · ∑ [ (−1)ⁿ · zⁿ − (1/3) · (−1)ⁿ · (z/3)ⁿ ]
                  </p>
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* OTHER PAGES: REALISTIC EXAMINATION PAGE PLACEHOLDER */
              /* ========================================================================= */
              <div className="py-20 text-center space-y-3 font-sans">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="font-serif text-lg font-bold text-slate-700">
                  Page {currentPage} of Digital Answer Sheet
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Viewing supplementary booklet page. Click &ldquo;Pg 04&rdquo; in the tab strip above to inspect Question 04.
                </p>
                <button
                  type="button"
                  onClick={() => onPageChange(4)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs"
                >
                  <span>Jump to Active Question 04 (Page 04)</span>
                </button>
              </div>
            )}

          </div>

          {/* PHYSICAL PAPER FOOTER BAND */}
          <div className="px-5 sm:px-9 py-2.5 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>BARCODE: *MP-2026-CS-10492-P{currentPage}*</span>
            <span className="font-semibold text-slate-500">CONFIDENTIAL VALUATION COPY</span>
          </div>

        </div>

      </div>

    </div>
  );
}
