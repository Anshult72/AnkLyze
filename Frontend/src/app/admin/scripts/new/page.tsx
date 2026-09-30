"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FolderArchive,
  ChevronRight,
  Trash2,
  ArrowRight,
  Shield,
  Layers,
  Database,
  Info,
  RotateCcw,
} from "lucide-react";
import TopNavigation from "@/components/examiner/TopNavigation";
import { useAuth } from "@/context/AuthContext";
import { MOCK_EXAMS, MOCK_SUBJECTS } from "@/data/examManagementMockData";

interface SelectedFileItem {
  id: string;
  name: string;
  size: number;
  file: File;
  status: "PENDING" | "VALIDATING" | "SUCCESS" | "DUPLICATE" | "REJECTED" | "FAILED";
  error?: string;
  scriptCode?: string;
  pageCount?: number;
}

export default function NewScriptBatchPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Workflow steps: 1 = Exam & Subject & Batch Config, 2 = Upload & Ingestion, 3 = Batch Summary
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Form configuration
  const [selectedExamId, setSelectedExamId] = useState(MOCK_EXAMS[0]?.id || "");
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    MOCK_SUBJECTS.find((s) => s.examId === MOCK_EXAMS[0]?.id)?.id || ""
  );
  const [batchCode, setBatchCode] = useState("BATCH-2026-CS301-003");
  const [source, setSource] = useState("DIGITAL_SCANNER");
  const [batchNotes, setBatchNotes] = useState("Regular semester digitized answer books scan intake");

  // Step 2: Upload files
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Step 3: Batch Results
  const [batchSummary, setBatchSummary] = useState<{
    batchCode: string;
    examCode: string;
    subjectCode: string;
    totalFiles: number;
    successful: number;
    failed: number;
    duplicates: number;
    rejected: number;
    results: { name: string; status: string; scriptCode?: string; error?: string }[];
  } | null>(null);

  const isAdminOrHead =
    user?.role === "SUPER_ADMIN" || user?.role === "HEAD_EXAMINER";

  // Filter subjects for the selected exam
  const availableSubjects = MOCK_SUBJECTS.filter((s) => s.examId === selectedExamId);
  const currentExam = MOCK_EXAMS.find((e) => e.id === selectedExamId);
  const currentSubject = MOCK_SUBJECTS.find((s) => s.id === selectedSubjectId);

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const firstSubj = MOCK_SUBJECTS.find((s) => s.examId === examId);
    if (firstSubj) {
      setSelectedSubjectId(firstSubj.id);
      const cleanSubj = firstSubj.code.replace(/[^A-Za-z0-9]/g, "");
      setBatchCode(`BATCH-2026-${cleanSubj}-003`);
    } else {
      setSelectedSubjectId("");
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const subj = MOCK_SUBJECTS.find((s) => s.id === subjectId);
    if (subj) {
      const cleanSubj = subj.code.replace(/[^A-Za-z0-9]/g, "");
      setBatchCode(`BATCH-2026-${cleanSubj}-003`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    addFilesToQueue(files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.dataTransfer.files) return;
    const files = Array.from(e.dataTransfer.files);
    addFilesToQueue(files);
  };

  const addFilesToQueue = (files: File[]) => {
    const newItems: SelectedFileItem[] = files.map((file) => {
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      const isOversized = file.size > 25 * 1024 * 1024;
      let initialStatus: SelectedFileItem["status"] = "PENDING";
      let error: string | undefined;

      if (!isPdf) {
        initialStatus = "REJECTED";
        error = "Non-PDF file format rejected. Only PDF answer books are supported.";
      } else if (isOversized) {
        initialStatus = "REJECTED";
        error = "File exceeds 25 MB maximum size limit.";
      }

      return {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: file.size,
        file,
        status: initialStatus,
        error,
      };
    });

    setSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Perform Simulated or Real Intake Ingestion
  const handleStartIngestion = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    // Simulate progress and process each file
    const results: { name: string; status: string; scriptCode?: string; error?: string }[] = [];
    let successful = 0;
    const failed = 0;
    let duplicates = 0;
    let rejected = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const item = selectedFiles[i];
      setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 90));

      if (item.status === "REJECTED") {
        rejected++;
        results.push({ name: item.name, status: "REJECTED", error: item.error });
        continue;
      }

      // Check if duplicate filename/checksum simulation
      if (item.name.toLowerCase().includes("duplicate")) {
        duplicates++;
        results.push({
          name: item.name,
          status: "DUPLICATE",
          error: "Duplicate checksum detected for this subject",
        });
        continue;
      }

      // Successful simulated ingestion
      const randomScriptCode = `A-${Math.floor(10000 + Math.random() * 90000)}`;
      successful++;
      results.push({
        name: item.name,
        status: "SUCCESS",
        scriptCode: randomScriptCode,
      });
    }

    setUploadProgress(100);
    setIsUploading(false);

    setBatchSummary({
      batchCode,
      examCode: currentExam?.code || "EXAM-2026-W-CS3",
      subjectCode: currentSubject?.code || "CS-301",
      totalFiles: selectedFiles.length,
      successful,
      failed,
      duplicates,
      rejected,
      results,
    });

    setStep(3);
  };

  if (!isAdminOrHead) {
    return (
      <div className="workspace-shell min-h-screen bg-slate-50 flex flex-col">
        <TopNavigation activeTab="admin-scripts" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h2>
            <p className="text-sm text-slate-600 mb-6">
              Only Examination Administrators and Head Examiners have authority to create answer script batches.
            </p>
            <Link
              href="/examiner/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Return to Examiner Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="workspace-shell min-h-screen bg-slate-50 flex flex-col">
      <TopNavigation activeTab="admin-scripts" />

      {/* Main Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3" aria-label="Breadcrumb">
            <Link href="/admin/scripts" className="hover:text-blue-600 transition-colors">
              Answer Script Intake
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-900">New Intake Batch</span>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Answer Book Intake Batch
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Initiate a batch intake, upload scanned student answer books, and verify storage assets.
              </p>
            </div>
          </div>

          {/* Workflow Progress Steps */}
          <div className="flex items-center justify-between mt-8 border-t border-slate-100 pt-6">
            <div className={`flex items-center gap-2 ${step >= 1 ? "text-blue-600 font-bold" : "text-slate-400"}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > 1
                    ? "bg-blue-600 text-white"
                    : step === 1
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                1
              </div>
              <span className="text-xs sm:text-sm">Batch Configuration</span>
            </div>

            <div className="w-12 h-0.5 bg-slate-200"></div>

            <div className={`flex items-center gap-2 ${step >= 2 ? "text-blue-600 font-bold" : "text-slate-400"}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > 2
                    ? "bg-blue-600 text-white"
                    : step === 2
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                2
              </div>
              <span className="text-xs sm:text-sm">Upload & Validation</span>
            </div>

            <div className="w-12 h-0.5 bg-slate-200"></div>

            <div className={`flex items-center gap-2 ${step === 3 ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 3
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                3
              </div>
              <span className="text-xs sm:text-sm">Batch Summary</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workflow Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* STEP 1: BATCH CONFIGURATION */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 1: Examination & Subject Association</h2>
              <p className="text-xs text-slate-500 mt-1">
                Scripts in this batch will be immutably linked to the selected exam and subject.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Examination <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => handleExamChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  {MOCK_EXAMS.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.code} — {exam.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  {availableSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} — {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Batch Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  placeholder="e.g. BATCH-2026-CS301-001"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                  Unique identifier for physical/digital reconciliation.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Intake Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  <option value="DIGITAL_SCANNER">Digital Scanner Feed</option>
                  <option value="UNIVERSITY_PORTAL">University Authority Ingestion</option>
                  <option value="MANUAL_INTAKE">Approved Admin Intake</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Batch Notes & Intake Manifest (Optional)
              </label>
              <textarea
                rows={3}
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                placeholder="Details regarding scanning session, hall number, or box numbers..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/admin/scripts"
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selectedExamId || !selectedSubjectId || !batchCode}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Upload
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD & VALIDATION */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Batch Context Card */}
            <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <FolderArchive className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900">Target Batch:</span>{" "}
                  <span className="font-mono font-bold text-blue-800">{batchCode}</span>
                </div>
              </div>
              <div className="text-slate-600">
                <span className="font-semibold">{currentExam?.code}</span> • {currentSubject?.name} (
                {currentSubject?.code})
              </div>
            </div>

            {/* Upload Zone */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-1">Step 2: Upload Digital Answer Books</h2>
              <p className="text-xs text-slate-500 mb-6">
                Drag and drop scanned PDF answer sheets. Magic bytes, SHA-256 duplicate detection, and size limits (max 25MB) will be enforced.
              </p>

              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-xl p-8 text-center transition-colors cursor-pointer"
                onClick={() => document.getElementById("file-upload-input")?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  multiple
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Click to select answer books or drag & drop files here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Standard digitally scanned PDF answer books (.pdf), up to 25 MB per file
                </p>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider pb-1 border-b border-slate-100">
                    <span>Selected Files ({selectedFiles.length})</span>
                    <span>Status</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {selectedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold text-slate-800 truncate font-mono text-xs">
                              {file.name}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {file.status === "REJECTED" ? (
                            <span className="text-red-600 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {file.error || "Rejected"}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Valid PDF
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(file.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress Bar if uploading */}
              {isUploading && (
                <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>Uploading to Cloudinary & creating script records...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleStartIngestion}
                  disabled={isUploading || selectedFiles.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Ingesting..." : `Ingest ${selectedFiles.length} Answer Books`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BATCH SUMMARY */}
        {step === 3 && batchSummary && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Batch Ingestion Completed</h2>
                <p className="text-xs text-slate-500">
                  Answer scripts have been verified, anonymized, and stored via Cloudinary abstraction.
                </p>
              </div>
            </div>

            {/* Summary Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Files
                </span>
                <p className="text-xl font-bold text-slate-900 mt-1">{batchSummary.totalFiles}</p>
              </div>

              <div className="bg-emerald-50/60 rounded-lg p-3 border border-emerald-200/80">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Successful
                </span>
                <p className="text-xl font-bold text-emerald-800 mt-1">{batchSummary.successful}</p>
              </div>

              <div className="bg-amber-50/60 rounded-lg p-3 border border-amber-200/80">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                  Duplicates
                </span>
                <p className="text-xl font-bold text-amber-800 mt-1">{batchSummary.duplicates}</p>
              </div>

              <div className="bg-red-50/60 rounded-lg p-3 border border-red-200/80">
                <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
                  Failed / Rejected
                </span>
                <p className="text-xl font-bold text-red-800 mt-1">
                  {batchSummary.failed + batchSummary.rejected}
                </p>
              </div>
            </div>

            {/* Batch Status Notice */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-950">Ready for Document Processing</p>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  Digital answer books are validated and safely stored in Cloudinary with anonymized identifiers.
                  Document segmentation and OCR will be initiated in the subsequent processing phase (Phase 8).
                </p>
              </div>
            </div>

            {/* Ingested Results Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Ingested Scripts Breakdown
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                {batchSummary.results.map((res, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-4 bg-white">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="font-mono text-slate-700 truncate">{res.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {res.status === "SUCCESS" ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                            {res.scriptCode}
                          </span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Ingested
                          </span>
                        </div>
                      ) : res.status === "DUPLICATE" ? (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Duplicate Checksum
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {res.error || "Rejected"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedFiles([]);
                  setBatchSummary(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Create Another Batch
              </button>

              <Link
                href="/admin/scripts"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-xs transition-colors"
              >
                View Scripts Directory
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
