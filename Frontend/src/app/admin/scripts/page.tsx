"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  Database,
  Shield,
  Layers,
  ExternalLink,
  ChevronRight,
  Eye,
  Hash,
  RefreshCw,
} from "lucide-react";
import TopNavigation from "@/components/examiner/TopNavigation";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/utils/apiClient";

interface LiveAnswerScript {
  id: string;
  scriptCode: string;
  originalFilename: string;
  checksum: string;
  barcodeValue?: string;
  status: string;
  pageCount: number;
  totalQuestionsDetected: number;
  batchCode: string;
  examId: string;
  examTitle: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  reconstructionStatus?: string;
  createdAt: string;
}

export default function ScriptDirectoryPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [scripts, setScripts] = useState<LiveAnswerScript[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const isAdminOrHead = user?.role === "SUPER_ADMIN" || user?.role === "HEAD_EXAMINER";

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [scriptsRes, batchesRes, examsRes] = await Promise.all([
        fetchApi<any[]>("/scripts?limit=100"),
        fetchApi<any[]>("/script-batches").catch(() => ({ success: true, data: [] })),
        fetchApi<any[]>("/exams").catch(() => ({ success: true, data: [] })),
      ]);

      if (scriptsRes.success && Array.isArray(scriptsRes.data)) {
        const mapped: LiveAnswerScript[] = scriptsRes.data.map((item: any) => ({
          id: item.id,
          scriptCode: item.scriptCode || `SCRIPT-${item.id.slice(0, 6)}`,
          originalFilename: item.originalFilename || "uploaded_sheet.pdf",
          checksum: item.checksum || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          barcodeValue: item.barcodeValue,
          status: item.status || "VALIDATED",
          pageCount: item.pageCount || 1,
          totalQuestionsDetected: item.totalQuestionsDetected || item.pageCount || 1,
          batchCode: item.batch?.batchCode || "BATCH-01",
          examId: item.examId || item.exam?.id || "",
          examTitle: item.exam?.title || "Board Examination 2026",
          subjectId: item.subjectId || item.subject?.id || "",
          subjectName: item.subject?.name || "Subject Examination",
          subjectCode: item.subject?.code || "SUB-01",
          reconstructionStatus: item.reconstructionStatus,
          createdAt: item.createdAt,
        }));
        setScripts(mapped);
      } else {
        setScripts([]);
      }

      if (batchesRes.success && Array.isArray(batchesRes.data)) {
        setBatches(batchesRes.data);
      }
      if (examsRes.success && Array.isArray(examsRes.data)) {
        setExams(examsRes.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load intake scripts from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered scripts
  const filteredScripts = useMemo(() => {
    return scripts.filter((script) => {
      if (selectedExamId !== "all" && script.examId !== selectedExamId) {
        return false;
      }
      if (selectedSubjectId !== "all" && script.subjectId !== selectedSubjectId) {
        return false;
      }
      if (selectedStatus !== "all" && script.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = script.scriptCode.toLowerCase().includes(query);
        const matchesFile = script.originalFilename.toLowerCase().includes(query);
        const matchesBatch = script.batchCode.toLowerCase().includes(query);
        const matchesBarcode = script.barcodeValue?.toLowerCase().includes(query);
        if (!matchesCode && !matchesFile && !matchesBatch && !matchesBarcode) {
          return false;
        }
      }
      return true;
    });
  }, [scripts, selectedExamId, selectedSubjectId, selectedStatus, searchQuery]);

  // Derived metrics
  const totalScriptsCount = scripts.length;
  const totalBatchesCount = batches.length;
  const readyCount = scripts.filter(
    (s) => s.status === "READY_FOR_PROCESSING" || s.status === "VALIDATED"
  ).length;

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
              Only authorized Examination Administrators and Head Examiners may access the
              Answer Sheet Intake Directory.
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

      {/* Main Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3" aria-label="Breadcrumb">
            <Link href="/examiner/dashboard" className="hover:text-blue-600 transition-colors">
              Portal
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Administration</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-900">Answer Sheet Intake & Storage</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Answer Sheet Intake
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Storage Active
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Digitally scanned answer book ingestion, anonymized sheet identity, and cryptographic audit trail.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium bg-white hover:bg-slate-50 shadow-2xs transition-colors"
                title="Refresh Intake Directory"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                <span>Refresh</span>
              </button>
              <Link
                href="/admin/scripts/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-xs transition-colors"
              >
                <Upload className="w-4 h-4" />
                New Intake Batch
              </Link>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ingested Sheets
                </span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{totalScriptsCount}</p>
            </div>

            <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Intake Batches
                </span>
                <FolderArchive className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{totalBatchesCount}</p>
            </div>

            <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Processing Ready
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{readyCount}</p>
            </div>

            <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Storage Provider
                </span>
                <Database className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Integrated Storage
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Sheet ID, file, or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Exam selector */}
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Examinations</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>

            {/* Status selector */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="VALIDATED">Validated</option>
              <option value="READY_FOR_PROCESSING">Ready for Processing</option>
              <option value="PROCESSING">Processing</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Scripts Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-500 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="font-semibold text-slate-700">Loading intake directory from server...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-xs text-rose-600 space-y-3">
              <AlertTriangle className="w-6 h-6 mx-auto text-rose-500" />
              <p className="font-semibold text-slate-800">{error}</p>
              <button
                onClick={loadData}
                className="px-3.5 py-1.5 bg-[#062834] text-white hover:bg-[#1a4452] rounded-lg font-medium text-xs"
              >
                Retry
              </button>
            </div>
          ) : filteredScripts.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-800">No Answer Sheets Ingested</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                No answer sheets match your current filters. Start a new intake batch to ingest digitized candidate answer books.
              </p>
              <Link
                href="/admin/scripts/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Answer Sheets
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Sheet Identity</th>
                    <th className="px-4 py-3">Exam / Subject</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3 text-center">Pages</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredScripts.map((script) => (
                    <tr key={script.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-900">{script.scriptCode}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{script.originalFilename}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{script.subjectName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{script.examTitle}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {script.batchCode}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">
                        {script.pageCount}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            script.status === "VALIDATED" || script.status === "READY_FOR_PROCESSING"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : script.status === "PROCESSING"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {script.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/examiner/evaluate/${script.scriptCode}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
