"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TopNavigation from "@/components/examiner/TopNavigation";
import { useAuth } from "@/context/AuthContext";

const rawBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");
const API = rawBase.endsWith("/api/v1") ? rawBase : `${rawBase}/api/v1`;

type Subject = { id: string; code: string; name: string };
type PaperSummary = { id: string; originalFilename: string; pageCount: number; processingStatus: string; reviewStatus: string; _count: { items: number } };
type PaperItem = { id: string; questionNumber: string; questionText: string; maximumMarks: number | null; section: string | null; pageNumber: number; reviewStatus: string; confidence: number | null; questionId: string | null };
type Paper = PaperSummary & { storageReference: string; extractionError: string | null; items: PaperItem[] };

async function api<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, { ...options, credentials: "include",
    headers: { Authorization: `Bearer ${token}`, ...(!(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...options.headers } });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new Error(payload?.error?.message || `Request failed (${response.status})`);
  return payload.data as T;
}

export default function QuestionPapersPage() {
  const { accessToken } = useAuth();
  const { examId } = useParams<{ examId: string }>();
  const search = useSearchParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState(search.get("subjectId") || "");
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ questionNumber: "", questionText: "", maximumMarks: "", pageNumber: "1" });

  const loadPapers = useCallback(async (selectedId: string) => {
    if (!accessToken || !selectedId) return;
    setPapers(await api<PaperSummary[]>(`/question-papers/subjects/${selectedId}`, accessToken));
  }, [accessToken]);
  const loadPaper = useCallback(async (paperId: string) => {
    if (!accessToken) return;
    setPaper(await api<Paper>(`/question-papers/${paperId}`, accessToken));
    setDirty(null);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !examId) return;
    api<{ subjects: Subject[] }>(`/exams/${examId}`, accessToken)
      .then((exam) => { setSubjects(exam.subjects || []); setSubjectId((current) => current || exam.subjects?.[0]?.id || ""); })
      .catch((cause) => setError(cause.message));
  }, [accessToken, examId]);
  useEffect(() => { loadPapers(subjectId).catch((cause) => setError(cause.message)); }, [loadPapers, subjectId]);

  const run = async (action: () => Promise<void>, message: string) => {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(message); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed"); }
    finally { setBusy(false); }
  };
  const upload = () => run(async () => {
    if (!accessToken || !file || !subjectId) throw new Error("Choose a subject and PDF");
    const form = new FormData(); form.set("file", file);
    const created = await api<Paper>(`/question-papers/subjects/${subjectId}`, accessToken, { method: "POST", body: form });
    await loadPapers(subjectId); await loadPaper(created.id); setFile(null);
  }, "PDF uploaded. Process it to create review drafts.");
  const process = () => run(async () => {
    if (!accessToken || !paper) return;
    await api(`/question-papers/${paper.id}/process`, accessToken, { method: "POST" });
    await loadPaper(paper.id); await loadPapers(subjectId);
  }, "Extraction complete. Review each candidate before approval.");
  const saveItem = (item: PaperItem, reviewStatus: "VERIFIED" | "REJECTED") => run(async () => {
    if (!accessToken || !paper) return;
    await api(`/question-papers/${paper.id}/items/${item.id}`, accessToken, { method: "PATCH",
      body: JSON.stringify({ questionNumber: item.questionNumber, questionText: item.questionText,
        ...(item.maximumMarks == null ? {} : { maximumMarks: item.maximumMarks }),
        section: item.section, pageNumber: item.pageNumber, reviewStatus }) });
    await loadPaper(paper.id);
  }, reviewStatus === "VERIFIED" ? "Question verified and saved." : "Candidate rejected and saved.");
  const addItem = () => run(async () => {
    if (!accessToken || !paper) return;
    await api(`/question-papers/${paper.id}/items`, accessToken, { method: "POST", body: JSON.stringify({
      questionNumber: newItem.questionNumber, questionText: newItem.questionText,
      maximumMarks: Number(newItem.maximumMarks), pageNumber: Number(newItem.pageNumber),
    }) });
    setNewItem({ questionNumber: "", questionText: "", maximumMarks: "", pageNumber: "1" });
    await loadPaper(paper.id);
  }, "Question added and saved.");
  const approve = () => run(async () => {
    if (!accessToken || !paper) return;
    await api(`/question-papers/${paper.id}/approve`, accessToken, { method: "POST" });
    await loadPaper(paper.id); await loadPapers(subjectId);
  }, "Verified questions published. Add and approve marking criteria in the rubric workflow before evaluation.");

  return <ProtectedRoute allowedRoles={["SUPER_ADMIN", "HEAD_EXAMINER"]}>
    <div className="workspace-shell min-h-screen bg-[#f7f8f5] text-[#082d38]">
      <TopNavigation activeTab="admin-exams" />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><Link href={`/admin/exams/${examId}`} className="text-sm text-[#4d858d]">← Exam workbench</Link>
            <h1 className="mt-2 font-serif text-4xl">Question papers</h1>
            <p className="mt-2 text-[#56707a]">Upload a PDF, inspect extracted questions, then publish verified content.</p></div>
          <select value={subjectId} disabled={!!dirty} onChange={(event) => { setSubjectId(event.target.value); setPaper(null); }}
            className="rounded-xl border border-[#bbd1d0] bg-white px-4 py-3" aria-label="Subject">
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} · {subject.name}</option>)}
          </select>
        </header>
        {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">{notice}</p>}
        <section className="rounded-2xl border border-[#d1e1de] bg-white p-6">
          <h2 className="font-serif text-2xl">Upload source PDF</h2>
          <p className="mb-4 text-sm text-[#56707a]">PDF only, up to 25 MB. The exam must be in draft.</p>
          <div className="flex flex-wrap items-center gap-3"><input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            <button disabled={busy || !file || !subjectId} onClick={upload} className="rounded-lg bg-[#4d858d] px-5 py-2 text-white disabled:opacity-50">Upload paper</button></div>
        </section>
        <section className="grid gap-5 md:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-[#d1e1de] bg-white p-4">
            <h2 className="mb-3 font-serif text-xl">Uploaded papers</h2>
            {papers.length ? papers.map((entry) => <button key={entry.id} disabled={!!dirty} onClick={() => loadPaper(entry.id).catch((cause) => setError(cause.message))}
              className="mb-2 w-full rounded-lg border border-[#d1e1de] p-3 text-left hover:bg-[#edf4f1]">
              <strong className="block truncate text-sm">{entry.originalFilename}</strong>
              <span className="text-xs text-[#56707a]">{entry.pageCount} pages · {entry._count.items} drafts · {entry.reviewStatus}</span></button>)
              : <p className="text-sm text-[#56707a]">No papers uploaded for this subject.</p>}
          </aside>
          <div className="rounded-2xl border border-[#d1e1de] bg-white p-5">
            {!paper ? <p className="text-[#56707a]">Select an uploaded paper to inspect it.</p> : <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#d1e1de] pb-4">
                <div><h2 className="font-serif text-2xl">{paper.originalFilename}</h2>
                  <p className="text-sm text-[#56707a]">{paper.processingStatus} · {paper.reviewStatus} · {paper.pageCount} pages</p>
                  {paper.extractionError && <p className="text-sm text-red-700">{paper.extractionError}</p>}
                  <a href={paper.storageReference} target="_blank" rel="noreferrer" className="text-sm text-[#4d858d] underline">View source PDF ↗</a></div>
                {paper.reviewStatus !== "APPROVED" && <div className="flex gap-2">
                  {(paper.processingStatus === "UPLOADED" || paper.processingStatus === "FAILED") && <button disabled={busy} onClick={process} className="rounded-lg border border-[#4d858d] px-4 py-2">{paper.processingStatus === "FAILED" ? "Retry extraction" : "Extract questions"}</button>}
                  {paper.processingStatus === "COMPLETED" && <button disabled={busy || !!dirty} title={dirty ? "Save question edits before approval" : undefined} onClick={approve} className="rounded-lg bg-[#4d858d] px-4 py-2 text-white disabled:opacity-50">Approve reviewed questions</button>}
                </div>}
              </div>
              {paper.processingStatus === "COMPLETED" && <div className="mt-5 space-y-4">
                {paper.items.length === 0 && <p className="text-sm text-[#56707a]">No question boundaries were detected. Add verified questions below using the PDF.</p>}
                {paper.items.map((item) => <div key={item.id} className="rounded-xl border border-[#d1e1de] p-4">
                  <div className="mb-3 flex justify-between gap-2 text-xs text-[#56707a]"><span>Page {item.pageNumber} · {item.reviewStatus}</span><span>Extraction confidence {item.confidence == null ? "—" : `${Math.round(item.confidence * 100)}%`}</span></div>
                  <div className="grid gap-3 sm:grid-cols-[100px_1fr_100px]">
                    <label className="text-xs">Number<input value={item.questionNumber} disabled={paper.reviewStatus === "APPROVED" || (!!dirty && dirty !== item.id)} onChange={(e) => { setDirty(item.id); setPaper((prev) => prev && ({ ...prev, items: prev.items.map((entry) => entry.id === item.id ? { ...entry, questionNumber: e.target.value } : entry) })); }} className="mt-1 w-full rounded border p-2 text-sm" /></label>
                    <label className="text-xs">Question<textarea value={item.questionText} disabled={paper.reviewStatus === "APPROVED" || (!!dirty && dirty !== item.id)} onChange={(e) => { setDirty(item.id); setPaper((prev) => prev && ({ ...prev, items: prev.items.map((entry) => entry.id === item.id ? { ...entry, questionText: e.target.value } : entry) })); }} className="mt-1 min-h-20 w-full rounded border p-2 text-sm" /></label>
                    <label className="text-xs">Marks<input type="number" min="0.5" step="0.5" value={item.maximumMarks ?? ""} disabled={paper.reviewStatus === "APPROVED" || (!!dirty && dirty !== item.id)} onChange={(e) => { setDirty(item.id); setPaper((prev) => prev && ({ ...prev, items: prev.items.map((entry) => entry.id === item.id ? { ...entry, maximumMarks: e.target.value ? Number(e.target.value) : null } : entry) })); }} className="mt-1 w-full rounded border p-2 text-sm" /></label>
                  </div>
                  {paper.reviewStatus !== "APPROVED" && <div className="mt-3 flex gap-2"><button disabled={busy || !item.maximumMarks || (!!dirty && dirty !== item.id)} onClick={() => saveItem(item, "VERIFIED")} className="rounded-lg bg-[#4d858d] px-3 py-2 text-xs text-white disabled:opacity-50">Save & verify</button>
                    <button disabled={busy || (!!dirty && dirty !== item.id)} onClick={() => saveItem(item, "REJECTED")} className="rounded-lg border px-3 py-2 text-xs">Reject candidate</button></div>}
                </div>)}
                {paper.reviewStatus !== "APPROVED" && <div className="rounded-xl bg-[#edf4f1] p-4">
                  <h3 className="mb-3 font-medium">Add a missed question</h3><div className="grid gap-2 sm:grid-cols-[100px_1fr_90px_90px]">
                    <input placeholder="Number" aria-label="Question number" value={newItem.questionNumber} onChange={(e) => setNewItem({ ...newItem, questionNumber: e.target.value })} className="rounded border p-2 text-sm" />
                    <input placeholder="Question text" aria-label="Question text" value={newItem.questionText} onChange={(e) => setNewItem({ ...newItem, questionText: e.target.value })} className="rounded border p-2 text-sm" />
                    <input type="number" placeholder="Marks" aria-label="Marks" value={newItem.maximumMarks} onChange={(e) => setNewItem({ ...newItem, maximumMarks: e.target.value })} className="rounded border p-2 text-sm" />
                    <input type="number" placeholder="Page" aria-label="Page" value={newItem.pageNumber} onChange={(e) => setNewItem({ ...newItem, pageNumber: e.target.value })} className="rounded border p-2 text-sm" /></div>
                  <button disabled={busy || !newItem.questionNumber || !newItem.questionText || !newItem.maximumMarks} onClick={addItem} className="mt-3 rounded-lg border border-[#4d858d] px-4 py-2 text-sm disabled:opacity-50">Add verified question</button>
                </div>}
              </div>}
            </>}
          </div>
        </section>
      </main>
    </div>
  </ProtectedRoute>;
}
