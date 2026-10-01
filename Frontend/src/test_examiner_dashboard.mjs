import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AI_VS_EXAMINER_WORKFLOW_DATA,
  ATTENTION_ITEMS_DATA,
  EVALUATION_QUEUE_DATA,
  EXAMINER_CONTEXT,
  WORK_SUMMARY_DATA,
  getExaminerDashboardModel,
  getSheetCode,
} from "./data/examinerMockData.ts";

test("dashboard workload and preview use the shared examiner records", () => {
  const desk = getExaminerDashboardModel();
  assert.equal(desk.pending, WORK_SUMMARY_DATA.assignedScripts - WORK_SUMMARY_DATA.completed);
  assert.equal(desk.completion, 62);
  assert.equal(desk.openReviewCount, ATTENTION_ITEMS_DATA.length);
  assert.equal(desk.highPriorityCount, ATTENTION_ITEMS_DATA.filter((item) => item.severity === "High").length);
  assert.equal(getSheetCode(desk.next.scriptId), EXAMINER_CONTEXT.nextPendingScriptId);
  assert.deepEqual(desk.queuePreview.map((sheet) => sheet.scriptId), EVALUATION_QUEUE_DATA.slice(0, 4).map((sheet) => sheet.scriptId));
  assert.equal(desk.attentionPreview.length, 3);
  assert.equal(desk.workflow.aiAcceptedCount + desk.workflow.aiOverriddenCount, AI_VS_EXAMINER_WORKFLOW_DATA.totalCompletedSheets);
  assert.ok(desk.workflow.totalCompletedSheets <= WORK_SUMMARY_DATA.completed);
  assert.ok(desk.today.completedSinceLastSession <= desk.today.completedToday);
});

test("dashboard actions only use existing evaluation and review routes", () => {
  const desk = getExaminerDashboardModel();
  assert.equal(`/examiner/evaluate/${getSheetCode(desk.next.scriptId)}`, "/examiner/evaluate/A-10492");
  assert.ok(desk.queuePreview.every((sheet) => /^A-\d+$/.test(getSheetCode(sheet.scriptId))));
  assert.ok(desk.attentionPreview.every((item) =>
    item.href === "/examiner/review" || item.href === `/examiner/evaluate/${getSheetCode(item.scriptId)}`));
  assert.ok(desk.recentActivity.every((event) =>
    !event.href || /^\/examiner\/evaluate\/A-\d+$/.test(event.href)));
});

test("empty queue, review, activity, and today data have safe values", () => {
  const desk = getExaminerDashboardModel({
    summary: { ...WORK_SUMMARY_DATA, assignedScripts: 0, completed: 0, pending: 0 },
    queue: [],
    attention: [],
    activity: [],
    today: { completedToday: 0, completedSinceLastSession: 0, isSample: true },
  });
  assert.equal(desk.next, null);
  assert.equal(desk.pending, 0);
  assert.equal(desk.completion, 0);
  assert.equal(desk.highPriorityCount, 0);
  assert.deepEqual(desk.queuePreview, []);
  assert.deepEqual(desk.attentionPreview, []);
  assert.deepEqual(desk.recentActivity, []);
  assert.equal(desk.today.completedToday, 0);
});
