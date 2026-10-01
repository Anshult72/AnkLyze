/**
 * ANKLYZE — Deterministic Examiner Report Export Utilities
 * Provides reliable, client-side report exports (CSV & Print) without server round-trips.
 */

import { ExaminerReportsDataset } from "@/data/examinerMockData";

function triggerDownload(content: string, filename: string, mimeType: string = "text/csv;charset=utf-8;"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports Question-wise Marking statistics as CSV
 */
export function exportQuestionWiseReportCSV(data: ExaminerReportsDataset): void {
  const rows = [
    ["Question Number", "Section", "Topic / Concept", "Total Attempts", "Average Awarded Marks", "Maximum Marks", "Needs Review Count", "Primary Attention Reason"],
    ...data.questions.map((q) => [
      q.questionNumber,
      `"${q.section}"`,
      `"${q.topic}"`,
      q.attempts,
      q.averageMarks.toFixed(1),
      q.maxMarks,
      q.needsReview,
      `"${q.primaryAttentionReason || "None"}"`,
    ]),
  ];

  const csvContent = rows.map((r) => r.join(",")).join("\r\n");
  triggerDownload(csvContent, `ANKLYZE_CS301_Question_Marking_Report_Batch_B03.csv`);
}

/**
 * Exports Attention & Risk operational summary as CSV
 */
export function exportAttentionRiskReportCSV(data: ExaminerReportsDataset): void {
  const rows = [
    ["ANKLYZE Attention & Risk Operational Report", "Winter Session 2025-26", "Batch B-03"],
    [],
    ["Metric", "Count", "Operational Meaning"],
    ["Total Flagged Evaluations", data.attentionRisk.flaggedEvaluationsCount, "Scripts flagged for review across assigned batch"],
    ["High Risk Scripts", data.attentionRisk.highRiskCount, "Significant variance or confidence flags"],
    ["Critical Risk Scripts", data.attentionRisk.criticalRiskCount, "Dual attempt / severe discrepancy"],
    ["Second Evaluation Cases", data.attentionRisk.secondEvaluationCount, "Independent second evaluation mandated"],
    ["Moderation Referral Cases", data.attentionRisk.moderationCount, "Referred for Head Examiner moderation"],
    [],
    ["Most Common Attention Reasons", "Case Count", "Frequency Share (%)", "Risk Category"],
    ...data.attentionRisk.commonReasons.map((r) => [
      `"${r.reason}"`,
      r.count,
      `${r.percentage}%`,
      r.category,
    ]),
  ];

  const csvContent = rows.map((r) => r.join(",")).join("\r\n");
  triggerDownload(csvContent, `ANKLYZE_CS301_Attention_Risk_Report_Batch_B03.csv`);
}

/**
 * Exports Evaluation Activity Timeline as CSV
 */
export function exportActivityLogCSV(data: ExaminerReportsDataset): void {
  const rows = [
    ["Timestamp", "Event Title", "Details", "Script Reference", "Category"],
    ...data.recentActivity.map((a) => [
      a.time || a.timestamp || "-",
      `"${a.title || a.description || ""}"`,
      `"${a.detail || ""}"`,
      `"${a.scriptRef || "-"}"`,
      a.category,
    ]),
  ];

  const csvContent = rows.map((r) => r.join(",")).join("\r\n");
  triggerDownload(csvContent, `ANKLYZE_CS301_Evaluation_Activity_Log.csv`);
}
