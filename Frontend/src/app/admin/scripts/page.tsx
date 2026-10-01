"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import TopNavigation from "@/components/examiner/TopNavigation";
import { useAuth } from "@/context/AuthContext";
import {
  MOCK_SCRIPT_BATCHES,
  MOCK_ANSWER_SCRIPTS,
  MOCK_EXAMS,
  AnswerScriptData,
} from "@/data/examManagementMockData";

export default function ScriptDirectoryPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const isAdminOrHead =
    user?.role === "SUPER_ADMIN" || user?.role === "HEAD_EXAMINER";

  // Filtered scripts
  const filteredScripts = useMemo(() => {
    return MOCK_ANSWER_SCRIPTS.filter((script) => {
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
  }, [selectedExamId, selectedSubjectId, selectedStatus, searchQuery]);

  // Derived metrics
  const totalScriptsCount = MOCK_ANSWER_SCRIPTS.length;
  const totalBatchesCount = MOCK_SCRIPT_BATCHES.length;
  const readyCount = MOCK_ANSWER_SCRIPTS.filter(
    (s) => s.status === "READY_FOR_PROCESSING"
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
                  Cloudinary Active
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Digitally scanned answer book ingestion, anonymized sheet identity, and cryptographic audit trail.
              </p>
            </div>

            <div className="flex items-center gap-3">
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
                Cloudinary Storage
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
              placeholder="Search by Sheet ID (e.g. A-10492), file, or batch..."
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
              {MOCK_EXAMS.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.code}
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
              <option value="READY_FOR_PROCESSING">Ready for Processing</option>
              <option value="VALIDATED">Validated</option>
              <option value="UPLOADING">Uploading</option>
              <option value="FAILED">Failed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Answer Scripts Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ingested Answer Sheets</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {filteredScripts.length} of {totalScriptsCount} total answer books
              </p>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Student anonymity strictly enforced</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Sheet ID
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Exam & Subject
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Intake Batch
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Pages / Size
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Checksum (SHA-256)
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredScripts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No answer sheets found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try modifying search query or start a new intake batch.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredScripts.map((script) => (
                    <tr key={script.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Anonymized Script ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80 text-xs">
                            {script.scriptCode}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 font-mono truncate max-w-[150px]">
                          {script.originalFilename}
                        </div>
                      </td>

                      {/* Exam & Subject */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {script.subjectCode}: {script.subjectName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{script.examCode}</div>
                      </td>

                      {/* Batch */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {script.batchCode}
                        </span>
                      </td>

                      {/* Pages and Size */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <div className="font-medium text-slate-900">{script.pageCount} pages</div>
                        <div className="text-slate-400 mt-0.5">
                          {(script.fileSize / 1024).toFixed(0)} KB
                        </div>
                      </td>

                      {/* Checksum */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                        <div
                          className="flex items-center gap-1 text-slate-600 max-w-[120px] truncate"
                          title={script.checksum}
                        >
                          <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{script.checksum.substring(0, 12)}...</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {script.status === "READY_FOR_PROCESSING" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Ready for Processing
                          </span>
                        ) : script.status === "VALIDATED" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Validated
                          </span>
                        ) : script.status === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            {script.status}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/admin/scripts/${script.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
