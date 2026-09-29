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
      
      {/* 1. DOCUMENT VIEWER TOOLBAR */}
      <div className="h-12 bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0">
        
        {/* Left: Zoom Controls */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 70 && !fitMode}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs font-bold text-slate-900 w-12 text-center">
            {fitMode ? "Fit" : `${zoomLevel}%`}
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 175}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors"
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
            Fit Width
          </button>
        </div>

        {/* Center: Contextual Answer Tag */}
        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500">
          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {question.questionNumber}
          </span>
          <span>Max Marks: {question.maxMarks}</span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-blue-600 font-medium">
            {isCurrentQuestionPage ? "Active Answer Region" : `Answer on Page ${question.pageNumber}`}
          </span>
        </div>

        {/* Right: Page Navigation Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Selector Dropdown */}
          <div className="flex items-center space-x-1 font-mono text-xs">
            <span className="text-slate-500">Page</span>
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
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 2. SCROLLABLE SCAN VIEWPORT */}
      <div className="flex-1 overflow-auto p-3 sm:p-6 flex justify-center items-start bg-slate-200/50 relative">
        
        {/* Real Answer Book Paper Sheet */}
        <div
          className="bg-[#FCFAF5] shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] border border-slate-300 transition-transform duration-150 origin-top relative overflow-hidden rounded-md"
          style={{
            width: fitMode ? "100%" : `${zoomLevel}%`,
            maxWidth: fitMode ? "820px" : "none",
            minHeight: "1050px",
          }}
        >
          {/* Subtle Paper Grain Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(#111827 0.75px, transparent 0.75px)`,
              backgroundSize: "8px 8px",
            }}
          />

          {/* Left Red Margin Line */}
          <div className="absolute left-14 sm:left-18 top-0 bottom-0 w-[1px] bg-rose-500/30 pointer-events-none" />

          {/* Ruled Blue Notebook Guide Lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.12]"
            style={{
              backgroundImage: `linear-gradient(to bottom, transparent 27px, #3B82F6 28px)`,
              backgroundSize: "100% 28px",
            }}
          />

          {/* Left Spine Binder Punch Hole Marks */}
          <div className="absolute left-3.5 top-16 w-3 h-3 rounded-full border border-slate-300 bg-slate-100" />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-slate-300 bg-slate-100" />
          <div className="absolute left-3.5 bottom-16 w-3 h-3 rounded-full border border-slate-300 bg-slate-100" />

          {/* HEADER BAND OF ANSWER SHEET */}
          <div className="px-6 sm:px-10 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900">MP BOARD OF TECHNICAL EXAMINATIONS</span>
              <span>•</span>
              <span>DIGITAL ANSWER BOOK</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[10px] tracking-widest text-slate-400 font-semibold">
                |||| ||| |||| | ||| |||||
              </span>
              <span className="font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                PAGE {currentPage < 10 ? `0${currentPage}` : currentPage} OF {totalPages}
              </span>
            </div>
          </div>

          {/* PAGE CONTENT CONTAINER */}
          <div className="pl-16 sm:pl-22 pr-6 sm:pr-10 pt-6 pb-12 relative min-h-[960px]">
            
            {/* If we are on Page 4 (The current question page) */}
            {currentPage === 4 ? (
              <div className="space-y-4">
                
                {/* DETECTED ANSWER REGION HIGHLIGHT */}
                <div
                  className={`relative p-4 sm:p-5 rounded-xl border ${
                    activeEvidenceKey
                      ? "border-blue-500 bg-blue-50/[0.04]"
                      : "border-blue-300 bg-blue-50/[0.02]"
                  } transition-all`}
                >
                  {/* Top-Left Region Label */}
                  <div className="absolute -top-3 left-3 bg-blue-600 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded shadow-xs flex items-center space-x-1.5">
                    <Crosshair className="w-3 h-3" />
                    <span>DETECTED ANSWER: Q04 (Page 4)</span>
                  </div>

                  {/* Student Question Identifier in Margin/Top */}
                  <div className="flex items-baseline space-x-3 pt-1 mb-2 font-serif">
                    <span className="text-lg font-bold text-slate-900 tracking-tight underline decoration-slate-400">
                      Ans 4.
                    </span>
                    <span className="text-sm font-semibold text-slate-800 italic">
                      Working Principle &amp; Performance Factors of Thermal Conduction System
                    </span>
                  </div>

                  {/* Paragraph 1: Core Concept / Working Principle */}
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      activeEvidenceKey === "principle"
                        ? "bg-blue-100/50 border-l-2 border-blue-600"
                        : "hover:bg-slate-100/40"
                    }`}
                  >
                    <p className="text-[14px] sm:text-[15px] leading-7 text-slate-900 font-serif tracking-wide">
                      The operating principle of the thermal conduction system is governed primarily by{" "}
                      <span className="font-semibold underline decoration-slate-400">Fourier&apos;s Law of Heat Conduction</span>.
                      Under steady-state condition, the heat transfer rate through a homogeneous medium is directly proportional
                      to the negative temperature gradient along the path of flow and normal cross-sectional area:
                    </p>
                  </div>

                  {/* Mathematical Formulation (Handwritten-style Box) */}
                  <div className="my-2 py-2.5 px-4 bg-white/80 border border-slate-200 rounded-xl max-w-md mx-auto text-center font-serif text-slate-900 space-y-1 shadow-2xs">
                    <div className="text-[16px] sm:text-[17px] tracking-wide font-medium italic">
                      q<sub>x</sub> = − k · A · ( dT / dx )
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans">
                      where k = thermal conductivity, A = area, dT/dx = temperature gradient
                    </div>
                  </div>

                  {/* System Schematic Diagram */}
                  <div
                    className={`my-3 p-3.5 rounded-xl border border-slate-200 bg-white/70 transition-colors ${
                      activeEvidenceKey === "diagram"
                        ? "ring-2 ring-blue-600 bg-blue-50/30"
                        : ""
                    }`}
                  >
                    <div className="text-center text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1 font-semibold">
                      Figure 4.1: Schematic Representation of System Conduction Boundary
                    </div>
                    
                    <svg
                      viewBox="0 0 540 180"
                      className="w-full max-w-[480px] mx-auto text-slate-900 stroke-current fill-none"
                      style={{ strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round" }}
                    >
                      {/* Thermal Wall Block */}
                      <rect x="160" y="25" width="160" height="110" strokeDasharray="1 0" className="fill-slate-50/80" />
                      <line x1="160" y1="25" x2="320" y2="25" />
                      <line x1="160" y1="135" x2="320" y2="135" />
                      <line x1="160" y1="25" x2="160" y2="135" />
                      <line x1="320" y1="25" x2="320" y2="135" />

                      {/* Hatching in slab to look hand-sketched */}
                      <line x1="175" y1="35" x2="195" y2="55" strokeWidth="1" strokeOpacity="0.5" />
                      <line x1="205" y1="35" x2="225" y2="55" strokeWidth="1" strokeOpacity="0.5" />
                      <line x1="235" y1="35" x2="255" y2="55" strokeWidth="1" strokeOpacity="0.5" />
                      <line x1="265" y1="35" x2="285" y2="55" strokeWidth="1" strokeOpacity="0.5" />
                      <line x1="295" y1="35" x2="315" y2="55" strokeWidth="1" strokeOpacity="0.5" />

                      {/* Heat Inflow Arrow */}
                      <path d="M 60 80 L 145 80 M 135 73 L 145 80 L 135 87" strokeWidth="2.2" stroke="#2563EB" />
                      <text x="50" y="65" className="fill-slate-900 stroke-none font-serif text-[12px] font-semibold">
                        Heat In (Q_in)
                      </text>
                      <text x="65" y="105" className="fill-slate-500 stroke-none font-mono text-[10px]">
                        T_hot = 380 K
                      </text>

                      {/* Heat Outflow Arrow */}
                      <path d="M 335 80 L 420 80 M 410 73 L 420 80 L 410 87" strokeWidth="2.2" stroke="#2563EB" />
                      <text x="350" y="65" className="fill-slate-900 stroke-none font-serif text-[12px] font-semibold">
                        Heat Out (Q_out)
                      </text>
                      <text x="360" y="105" className="fill-slate-500 stroke-none font-mono text-[10px]">
                        T_cold = 300 K
                      </text>

                      {/* Temperature Profiles */}
                      <line x1="160" y1="50" x2="320" y2="110" stroke="#DC2626" strokeWidth="2" strokeDasharray="4 2" />
                      <text x="210" y="70" className="fill-rose-600 stroke-none font-sans text-[10px] font-bold">
                        Linear Gradient
                      </text>
                    </svg>
                  </div>

                  {/* Paragraph 2: Operational Factors */}
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      activeEvidenceKey === "factors"
                        ? "bg-blue-100/50 border-l-2 border-blue-600"
                        : "hover:bg-slate-100/40"
                    }`}
                  >
                    <p className="text-[14px] sm:text-[15px] leading-7 text-slate-900 font-serif tracking-wide">
                      Key operating factors influencing conduction rate include:
                      <br />
                      1. <span className="font-semibold">Material Conductivity (k):</span> Higher in pure metals like Copper (385 W/mK) vs Insulators.
                      <br />
                      2. <span className="font-semibold">Thickness (dx):</span> Rate decreases inversely with wall depth.
                      <br />
                      3. <span className="font-semibold">Surface Contact Area (A):</span> Direct linear scaling of heat flux.
                    </p>
                  </div>

                  {/* Examiner Annotation / Evidence Overlay */}
                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center space-x-1 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>OCR Alignment Confirmed (96.2%)</span>
                    </span>
                    <span>Confidence Tier: High</span>
                  </div>

                </div>

              </div>
            ) : (
              /* Other Pages Fallback */
              <div className="py-20 text-center space-y-3">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="font-serif text-lg font-bold text-slate-700">
                  Page {currentPage} of Digital Answer Script
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Currently viewing auxiliary booklet page. Click &ldquo;Page 04&rdquo; in toolbar to inspect the active response area for Question 04.
                </p>
                <button
                  type="button"
                  onClick={() => onPageChange(4)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs"
                >
                  <span>Jump to Active Answer (Page 04)</span>
                </button>
              </div>
            )}

          </div>

          {/* Footer of the physical paper */}
          <div className="px-6 sm:px-10 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>BARCODE: *MP-2026-CS-10492-P{currentPage}*</span>
            <span>CONFIDENTIAL VALUATION COPY</span>
          </div>

        </div>

      </div>

    </div>
  );
}
