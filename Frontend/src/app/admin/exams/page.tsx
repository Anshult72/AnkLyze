"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import TopNavigation from "@/components/examiner/TopNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { INITIAL_EXAMS, ExamData } from "@/data/examManagementMockData";
import {
  Plus,
  Search,
  BookOpen,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

export default function AdminExamsListPage() {
  const [exams, setExams] = useState<ExamData[]>(INITIAL_EXAMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Fetch live exams from backend if available
  useEffect(() => {
    async function fetchExams() {
      try {
        const res = await fetch("http://localhost:5000/api/v1/exams", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setExams((prev) => {
              const liveIds = new Set(data.data.map((e: ExamData) => e.id));
              const combined = [
                ...data.data.map((d: ExamData) => ({
                  ...d,
                  subjects: d.subjects || [],
                })),
                ...prev.filter((p) => !liveIds.has(p.id)),
              ];
              return combined;
            });
          }
        }
      } catch {
        // Preserves initial data for mock evaluation
      }
    }
    fetchExams();
  }, []);

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        exam.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        exam.code.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        exam.institution.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesStatus =
        statusFilter === "ALL" || exam.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [exams, searchQuery, statusFilter]);

  // Metrics
  const totalExams = exams.length;
  const activeExams = exams.filter((e) => e.status === "ACTIVE").length;
  const totalSubjects = exams.reduce((acc, curr) => acc + (curr.subjects?.length || 0), 0);
  const totalQuestions = exams.reduce(
    (acc, curr) =>
      acc +
      (curr.subjects || []).reduce(
        (subAcc, sub) => subAcc + (sub.questions?.length || 0),
        0
      ),
    0
  );

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3 mr-1 text-amber-600" />
        Draft
      </span>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "HEAD_EXAMINER"]}>
      <div className="workspace-shell min-h-screen bg-[#FCFAF5] text-slate-900 flex flex-col font-sans selection:bg-[#c5ddd4] selection:text-slate-900">
        
        {/* 1. TOP NAVIGATION WITH IDENTICAL BRANDING & ACCOUNT POPOVER */}
        <TopNavigation activeTab="admin-exams" />

        {/* 2. CONTEXT HEADER (MATCHING ExaminerHeader.tsx) */}
        <div className="bg-white border-b border-slate-200/90 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              {/* Contextual Information */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                  <span>✦ Examination Governance</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-normal">State Assessment Board</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                  Examination Cycles
                </h1>

                <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-slate-500 pt-0.5">
                  <span className="font-semibold text-slate-800">MPOnline State Board</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-700 font-medium">Curriculum Papers &amp; Marking Schemes</span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                    {totalExams} Total Cycles
                  </span>
                </div>
              </div>

              {/* Primary Call to Action */}
              <div className="flex items-center sm:self-center">
                <Link
                  href="/admin/exams/new"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  id="btn-create-exam"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Examination Cycle</span>
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* 3. MAIN CONTENT WORKSPACE (MATCHING Examiner Dashboard LAYOUT) */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* WORK SUMMARY SURFACE (MATCHING WorkSummary.tsx EXACTLY) */}
          <section aria-labelledby="exam-summary-heading" className="w-full">
            <h2 id="exam-summary-heading" className="sr-only">Examination Metrics Summary</h2>
            <div className="workspace-metric-deck bg-white border border-slate-200/90 rounded-2xl shadow-xs divide-y md:divide-y-0 md:divide-x divide-slate-100 grid grid-cols-2 md:grid-cols-4 overflow-hidden">
              
              <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
                    Exam Cycles
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-slate-900">
                    {totalExams}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Total allocated cycles
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
                    Active Cycles
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    Live
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#16A34A]">
                    {activeExams}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    In evaluation progress
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
                    Subject Papers
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                    Curricula
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-blue-600">
                    {totalSubjects}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Course curricula registered
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
                    Structured Qs
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                    Criteria Catalog
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-slate-900">
                    {totalQuestions}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Questions with rubric steps
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* EXAMINATIONS DIRECTORY TABLE CARD (MATCHING EvaluationQueue.tsx EXACTLY) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            
            {/* Header and Controls */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    All Examination Cycles
                  </h2>
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    {filteredExams.length} of {exams.length} Cycles
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Click an examination to manage curriculum papers, questions, and marking criteria
                </p>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Quick Filter Tabs */}
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ALL")}
                    className={`px-3 py-1 rounded-md transition-all ${
                      statusFilter === "ALL"
                        ? "bg-white text-blue-600 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ACTIVE")}
                    className={`px-3 py-1 rounded-md transition-all ${
                      statusFilter === "ACTIVE"
                        ? "bg-white text-blue-600 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("DRAFT")}
                    className={`px-3 py-1 rounded-md transition-all ${
                      statusFilter === "DRAFT"
                        ? "bg-white text-amber-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Draft
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Exam..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-52"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 font-bold">Examination Cycle</th>
                    <th scope="col" className="px-4 py-3.5 font-bold">Session &amp; Term</th>
                    <th scope="col" className="px-4 py-3.5 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3.5 font-bold">Curriculum Papers</th>
                    <th scope="col" className="px-4 py-3.5 font-bold">Total Marks</th>
                    <th scope="col" className="px-5 py-3.5 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExams.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        No examinations match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredExams.map((exam) => (
                      <tr
                        key={exam.id}
                        className="hover:bg-blue-50/25 transition-colors group"
                      >
                        {/* Title & Code */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Link
                            href={`/admin/exams/${exam.id}`}
                            className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors block"
                          >
                            {exam.title}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                              {exam.code}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
                              {exam.institution}
                            </span>
                          </div>
                        </td>

                        {/* Session & Term */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-900 block leading-tight">
                            {exam.semester || "Semester III"}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {exam.academicTerm}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getStatusBadge(exam.status)}
                        </td>

                        {/* Curriculum Papers */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5 text-slate-800 font-medium">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                            <span>{exam.subjects?.length || 0} Subject Papers</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {(exam.subjects || []).map((s) => s.code).join(", ") || "None"}
                          </span>
                        </td>

                        {/* Total Marks */}
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-slate-900 text-sm">
                          {exam.totalMarks}
                          <span className="text-[10px] text-slate-400 font-normal ml-0.5">Marks</span>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/exams/${exam.id}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                            id={`btn-open-${exam.id}`}
                          >
                            <span>Configure</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Governance: <strong className="font-mono text-slate-800">MPOnline State Board</strong></span>
              <span>All changes tracked under institutional audit bylaws</span>
            </div>

          </div>

        </main>

        {/* 4. FOOTER (MATCHING Examiner Dashboard FOOTER EXACTLY) */}
        <footer className="mt-auto border-t border-slate-200/90 bg-white py-4 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900 tracking-tight">ANKLYZE</span>
              <span>•</span>
              <span>Analyse the marks, not just the paper</span>
              <span>•</span>
              <Link href="/" className="text-blue-600 hover:underline font-semibold">
                Public Website ↗
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
              <span>Station: MPONLINE-GOV-01</span>
              <span>TLS 1.3 AES-256</span>
              <span>Governance Module Active</span>
            </div>
          </div>
        </footer>

      </div>
    </ProtectedRoute>
  );
}
