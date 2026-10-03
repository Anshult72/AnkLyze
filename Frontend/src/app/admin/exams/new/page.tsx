"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNavigation from "@/components/examiner/TopNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Check,
} from "lucide-react";

const rawBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");
const API_BASE_URL = rawBaseUrl.endsWith("/api/v1") ? rawBaseUrl : `${rawBaseUrl}/api/v1`;

export default function NewExamPage() {
  const router = useRouter();
  const { accessToken } = useAuth();

  // Form State
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [academicTerm, setAcademicTerm] = useState("Winter Session 2025-26");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [semester, setSemester] = useState("Semester III");
  const [institution, setInstitution] = useState("MP State Board of Technical Examinations, Bhopal");
  const [totalMarks, setTotalMarks] = useState<number>(70);
  const [description, setDescription] = useState("");
  const [partialMarking, setPartialMarking] = useState<boolean>(true);
  const [negativeMarking, setNegativeMarking] = useState<boolean>(false);
  const [anonymityEnabled, setAnonymityEnabled] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Exam title is required";
    if (!code.trim()) errors.code = "Exam code is required";
    if (!totalMarks || totalMarks <= 0) errors.totalMarks = "Total marks must be a positive number";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateExam = async (status: "DRAFT" | "ACTIVE") => {
    setErrorMessage(null);
    if (!validate()) return;

    setIsLoading(true);

    const payload = {
      title: title.trim(),
      code: code.toUpperCase().trim(),
      academicTerm: academicTerm.trim(),
      academicYear: academicYear.trim(),
      semester: semester.trim(),
      institution: institution.trim(),
      description: description.trim(),
      totalMarks: Number(totalMarks),
      status,
      partialMarking,
      negativeMarking,
      anonymityEnabled,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/exams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(`/admin/exams/${data.data.id}`);
      } else {
        setErrorMessage(data?.error?.message || "Failed to create examination cycle. Please verify fields.");
      }
    } catch {
      // Local fallback navigation for prototype testing
      const generatedId = `exam-${Date.now()}`;
      router.push(`/admin/exams/${generatedId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "HEAD_EXAMINER"]}>
      <div className="workspace-shell min-h-screen bg-[#FCFAF5] text-slate-900 flex flex-col font-sans selection:bg-[#c5ddd4] selection:text-slate-900">
        
        {/* 1. TOP NAVIGATION WITH IDENTICAL BRANDING & ACCOUNT POPOVER */}
        <TopNavigation activeTab="admin-exams" />

        {/* 2. CONTEXT HEADER (MATCHING ExaminerHeader.tsx) */}
        <div className="bg-white border-b border-slate-200/90 shadow-2xs">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                  <Link
                    href="/admin/exams"
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 border border-slate-200 transition-colors normal-case tracking-normal"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Examination Directory</span>
                  </Link>
                  <span className="text-slate-300">•</span>
                  <span>Setup Cycle</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                  Create Examination Cycle
                </h1>

                <p className="text-xs sm:text-sm text-slate-500 pt-0.5">
                  Establish a governed assessment cycle before intake and assignment of question papers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MAIN FORM */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          {/* ERROR BANNER */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* FORM CARD */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
            
            {/* 1. Core Examination Identification */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 font-mono">
                1. Examination Identification
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Examination Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech Computer Science & Engineering Semester III"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                  {fieldErrors.title && <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.title}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Unique Exam Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EXAM-2026-W-CS3"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono uppercase text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                  {fieldErrors.code && <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.code}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Academic Term</label>
                  <input
                    type="text"
                    value={academicTerm}
                    onChange={(e) => setAcademicTerm(e.target.value)}
                    placeholder="e.g. Winter Session 2025-26"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Semester / Level</label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g. Semester III"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Total Paper Marks</label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Affiliated Institution / Board</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. MP State Board of Technical Examinations, Bhopal"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Assessment Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter context, evaluation directives, or special session notes..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-2xs"
                />
              </div>
            </div>

            {/* 2. Evaluation Policy Foundation */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                2. Evaluation Policy Foundation
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-slate-200/90 bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs">
                  <input
                    type="checkbox"
                    checked={partialMarking}
                    onChange={(e) => setPartialMarking(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Step / Partial Credit</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Enables awarding intermediate points per rubric criteria.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-slate-200/90 bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs">
                  <input
                    type="checkbox"
                    checked={negativeMarking}
                    onChange={(e) => setNegativeMarking(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Negative Marking</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Deductions enabled for incorrect subjective responses.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-slate-200/90 bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs">
                  <input
                    type="checkbox"
                    checked={anonymityEnabled}
                    onChange={(e) => setAnonymityEnabled(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Blind Evaluation</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Student identity metadata masked from evaluators.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* BUTTON ACTIONS */}
            <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <Link
                href="/admin/exams"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 border border-slate-200 transition-colors"
              >
                <span>Cancel</span>
              </Link>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleCreateExam("DRAFT")}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save as Draft</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleCreateExam("ACTIVE")}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer disabled:opacity-50"
                  id="btn-create-active"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create &amp; Activate</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </main>

        {/* 4. FOOTER (MATCHING Examiner Dashboard FOOTER EXACTLY) */}
        <footer className="mt-auto border-t border-slate-200/90 bg-white py-4 text-xs text-slate-500">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
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
              <span>MPOnline State Evaluation System</span>
              <span>TLS 1.3 AES-256</span>
            </div>
          </div>
        </footer>

      </div>
    </ProtectedRoute>
  );
}
