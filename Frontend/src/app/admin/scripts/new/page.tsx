"use client";

import React, { useState, useEffect } from "react";
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
  RefreshCw,
} from "lucide-react";
import TopNavigation from "@/components/examiner/TopNavigation";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/utils/apiClient";

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

  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Step 1: Form configuration
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [batchCode, setBatchCode] = useState(`BATCH-2026-${Date.now().toString().slice(-4)}`);
  const [source, setSource] = useState("DIGITAL_SCANNER");
  const [batchNotes, setBatchNotes] = useState("Digitized student answer books scan intake");

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

  const isAdminOrHead = user?.role === "SUPER_ADMIN" || user?.role === "HEAD_EXAMINER";

  useEffect(() => {
    async function loadExamsAndSubjects() {
      setLoadingInitial(true);
      try {
        const [examsRes, subjectsRes] = await Promise.all([
          fetchApi<any[]>("/exams"),
          fetchApi<any[]>("/subjects"),
        ]);

        if (examsRes.success && Array.isArray(examsRes.data)) {
          setExams(examsRes.data);
          if (examsRes.data.length > 0) {
            setSelectedExamId(examsRes.data[0].id);
          }
        }
        if (subjectsRes.success && Array.isArray(subjectsRes.data)) {
          setSubjects(subjectsRes.data);
        }
      } catch (err) {
        console.error("Failed to load exams or subjects", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadExamsAndSubjects();
  }, []);

  // Filter subjects for the selected exam
  const availableSubjects = subjects.filter((s) => s.examId === selectedExamId);
  const currentExam = exams.find((e) => e.id === selectedExamId);
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(availableSubjects[0].id);
    }
  }, [selectedExamId, availableSubjects]);

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const firstSubj = subjects.find((s) => s.examId === examId);
    if (firstSubj) {
      setSelectedSubjectId(firstSubj.id);
      const cleanSubj = (firstSubj.code || "SUB").replace(/[^A-Za-z0-9]/g, "");
      setBatchCode(`BATCH-2026-${cleanSubj}-${Date.now().toString().slice(-4)}`);
    } else {
      setSelectedSubjectId("");
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incomingFiles = Array.from(e.target.files);

    const newItems: SelectedFileItem[] = incomingFiles.map((file) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isOversized = file.size > 25 * 1024 * 1024; // 25 MB limit

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

  // Perform Intake Ingestion via Backend API
  const handleStartIngestion = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(15);

    try {
      // 1. Create or ensure the Batch exists in Backend
      let batchId = "";
      const batchCreateRes = await fetchApi<any>("/script-batches", {
        method: "POST",
        body: {
          examId: selectedExamId,
          subjectId: selectedSubjectId,
          batchCode,
          source,
          notes: batchNotes,
        },
      });

      if (batchCreateRes.success && batchCreateRes.data) {
        batchId = batchCreateRes.data.id;
      } else {
        // If batch with code already exists, fetch batches to find ID
        const existingBatches = await fetchApi<any[]>("/script-batches");
        if (existingBatches.success && Array.isArray(existingBatches.data)) {
          const match = existingBatches.data.find((b: any) => b.batchCode === batchCode);
          if (match) batchId = match.id;
        }
      }

      if (!batchId) {
        throw new Error(batchCreateRes.error?.message || "Failed to initialize intake batch record");
      }

      setUploadProgress(40);

      // 2. Upload PDF files via multipart FormData
      const formData = new FormData();
      const validFiles = selectedFiles.filter((f) => f.status !== "REJECTED");

      validFiles.forEach((item) => {
        formData.append("files", item.file);
      });

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://anklyze-gitconnect-38002070587.asia-south1.run.app/api/v1";
      const uploadUrl = `${apiBase}/script-batches/${batchId}/scripts`;

      setUploadProgress(65);

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const json = await res.json();
      setUploadProgress(100);

      if (res.ok && json.success) {
        const d = json.data;
        setBatchSummary({
          batchCode: d.batchCode || batchCode,
          examCode: currentExam?.code || "EXAM-2026",
          subjectCode: currentSubject?.code || "SUB-01",
          totalFiles: d.totalFiles || selectedFiles.length,
          successful: d.successful || 0,
          failed: d.failed || 0,
          duplicates: d.duplicates || 0,
          rejected: d.rejected || selectedFiles.filter((f) => f.status === "REJECTED").length,
          results: d.results?.map((r: any) => ({
            name: r.originalFilename || r.name,
            status: r.status,
            scriptCode: r.scriptCode,
            error: r.error,
          })) || [],
        });
        setStep(3);
      } else {
        alert(json.error?.message || "Batch upload failed. Please verify file integrity.");
      }
    } catch (err: any) {
      alert(err?.message || "Batch ingestion failed. Network or server error.");
    } finally {
      setIsUploading(false);
    }
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
              Only Examination Administrators and Head Examiners have authority to create answer sheet batches.
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
              Answer Sheet Intake
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
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? "text-blue-600" : "text-slate-400"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                1
              </span>
              <span>Batch Configuration</span>
            </div>
            <div className="h-0.5 flex-1 bg-slate-200 mx-4" />
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 2 ? "text-blue-600" : "text-slate-400"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                2
              </span>
              <span>Upload PDF Answer Sheets</span>
            </div>
            <div className="h-0.5 flex-1 bg-slate-200 mx-4" />
            <div className={`flex items-center gap-2 text-xs font-semibold ${step === 3 ? "text-blue-600" : "text-slate-400"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                3
              </span>
              <span>Intake Confirmation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {loadingInitial ? (
          <div className="p-16 text-center text-xs text-slate-500 space-y-3 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="font-semibold text-slate-700">Loading examinations and subjects...</p>
          </div>
        ) : step === 1 ? (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Step 1: Examination &amp; Batch Metadata</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign this intake batch to an active examination and syllabus subject.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Examination *
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => handleExamChange(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Batch Code *
                </label>
                <input
                  type="text"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Scan Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DIGITAL_SCANNER">Institutional High-Speed Scanner</option>
                  <option value="BATCH_FTP">Secure FTP Transfer</option>
                  <option value="MANUAL_UPLOAD">Supervised Administrator Upload</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Batch Notes
              </label>
              <textarea
                rows={2}
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional administrative intake notes..."
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/admin/scripts"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selectedExamId || !selectedSubjectId || !batchCode}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors disabled:opacity-50"
              >
                <span>Continue to Upload</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Step 2: Upload Digitized Answer Sheets</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload student answer books in PDF format for {currentSubject?.name || "selected subject"}.
              </p>
            </div>

            {/* Drag & Drop Box */}
            <div className="p-8 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-blue-500 transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="text-xs font-bold text-blue-600 hover:text-blue-700 underline">
                  Choose PDF files
                </span>
                <span className="text-xs text-slate-500"> or drag and drop answer sheets here</span>
                <input
                  type="file"
                  multiple
                  accept="application/pdf"
                  onChange={handleFilesSelected}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports individual or batch PDF uploads up to 25 MB per document.
              </p>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Selected Answer Books ({selectedFiles.length})</span>
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="text-red-600 hover:text-red-700 text-[11px]"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {selectedFiles.map((file) => (
                    <div key={file.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate max-w-md">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        {file.status === "REJECTED" && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            {file.error || "Rejected"}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Ingesting and storing answer sheets...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Back to Config
              </button>
              <button
                type="button"
                onClick={handleStartIngestion}
                disabled={selectedFiles.length === 0 || isUploading}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? "Uploading..." : `Upload & Ingest ${selectedFiles.length} Sheet(s)`}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Step 3: Batch Results */
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h2 className="text-lg font-bold text-slate-900">Intake Batch Ingested Successfully</h2>
              <p className="text-xs text-slate-500">
                Batch <strong className="font-mono text-slate-800">{batchSummary?.batchCode}</strong> has been registered into the institutional database.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-base text-slate-900">{batchSummary?.totalFiles}</div>
                <div className="text-slate-500 text-[10px]">Total Files</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                <div className="font-bold text-base">{batchSummary?.successful}</div>
                <div className="text-[10px]">Successful</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                <div className="font-bold text-base">{batchSummary?.duplicates}</div>
                <div className="text-[10px]">Duplicates</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-900">
                <div className="font-bold text-base">{batchSummary?.failed}</div>
                <div className="text-[10px]">Failed</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/admin/scripts"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
              >
                View Intake Directory
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
