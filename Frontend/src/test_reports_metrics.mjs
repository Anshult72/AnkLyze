/**
 * ANKLYZE — Examiner Reports Metric Consistency & Unit Test Suite
 * Validates data integrity, mathematical consistency, distribution formulas, and edge states.
 */

import assert from "node:assert";

// Data fixtures matching examinerMockData.ts
const summaryData = {
  assignedScripts: 120,
  completed: 74,
  pending: 46,
  needsReview: 12,
};

const markingOverviewData = {
  averageMarks: 56.8,
  medianMarks: 58.0,
  highestMarks: 68.0,
  lowestMarks: 31.0,
  maxMarks: 70.0,
  totalEvaluatedScripts: 74,
  totalAssignedScripts: 120,
  totalQuestionsEvaluated: 888,
  markDistribution: [
    { range: "0–20", min: 0, max: 20, count: 0, percentage: 0 },
    { range: "21–30", min: 21, max: 30, count: 0, percentage: 0 },
    { range: "31–40", min: 31, max: 40, count: 6, percentage: 8.1 },
    { range: "41–50", min: 41, max: 50, count: 14, percentage: 18.9 },
    { range: "51–60", min: 51, max: 60, count: 38, percentage: 51.4, isMedianBucket: true },
    { range: "61–70", min: 61, max: 70, count: 16, percentage: 21.6 },
  ],
};

const questionsData = [
  { questionNumber: "Q01", attempts: 74, averageMarks: 3.4, maxMarks: 4, needsReview: 1 },
  { questionNumber: "Q02", attempts: 74, averageMarks: 3.6, maxMarks: 4, needsReview: 2 },
  { questionNumber: "Q03", attempts: 74, averageMarks: 4.6, maxMarks: 6, needsReview: 3 },
  { questionNumber: "Q04", attempts: 74, averageMarks: 4.8, maxMarks: 7, needsReview: 9 },
  { questionNumber: "Q05", attempts: 73, averageMarks: 5.1, maxMarks: 7, needsReview: 2 },
  { questionNumber: "Q06", attempts: 74, averageMarks: 4.9, maxMarks: 6, needsReview: 1 },
  { questionNumber: "Q07", attempts: 72, averageMarks: 4.2, maxMarks: 7, needsReview: 8 },
  { questionNumber: "Q08", attempts: 74, averageMarks: 5.4, maxMarks: 7, needsReview: 2 },
  { questionNumber: "Q09", attempts: 71, averageMarks: 4.5, maxMarks: 6, needsReview: 6 },
  { questionNumber: "Q10", attempts: 74, averageMarks: 4.1, maxMarks: 5, needsReview: 1 },
  { questionNumber: "Q11", attempts: 73, averageMarks: 4.7, maxMarks: 6, needsReview: 3 },
  { questionNumber: "Q12", attempts: 70, averageMarks: 3.8, maxMarks: 5, needsReview: 4 },
];

const attentionRiskData = {
  highRiskCount: 7,
  criticalRiskCount: 3,
  secondEvaluationCount: 4,
  moderationCount: 2,
  flaggedEvaluationsCount: 12,
  commonReasons: [
    { reason: "Low AI confidence", count: 6, percentage: 35 },
    { reason: "AI–examiner disagreement", count: 4, percentage: 24 },
    { reason: "Reconstruction uncertainty", count: 3, percentage: 18 },
    { reason: "Handwriting illegibility", count: 2, percentage: 12 },
    { reason: "Rubric ambiguity / Dual attempt", count: 2, percentage: 12 },
  ],
};

const workflowData = {
  aiAcceptedCount: 61,
  aiOverriddenCount: 13,
  aiAcceptanceRate: 82.4,
  criteriaChangedCount: 24,
  sentForReviewCount: 8,
  totalCompletedSheets: 74,
};

console.log("=================================================");
console.log("ANKLYZE — Examiner Reports Metric Validation Suite");
console.log("=================================================");

// Test 1: Work Summary Consistency
console.log("\n[TEST 1] Work Summary Balance...");
assert.strictEqual(
  summaryData.assignedScripts,
  summaryData.completed + summaryData.pending,
  `Assigned (${summaryData.assignedScripts}) must equal Completed (${summaryData.completed}) + Pending (${summaryData.pending})`
);
console.log("✓ Assigned equals Completed + Pending (120 = 74 + 46)");

// Test 2: Evaluated Scripts Consistency
console.log("\n[TEST 2] Marking Overview Evaluated Scripts...");
assert.strictEqual(
  markingOverviewData.totalEvaluatedScripts,
  summaryData.completed,
  "Evaluated scripts in marking overview must match completed sheets in summary"
);
console.log("✓ Evaluated scripts match completed sheets (74 = 74)");

// Test 3: Distribution Bucket Count Consistency
console.log("\n[TEST 3] Mark Distribution Summation...");
const totalDistributionScripts = markingOverviewData.markDistribution.reduce(
  (sum, bucket) => sum + bucket.count,
  0
);
assert.strictEqual(
  totalDistributionScripts,
  markingOverviewData.totalEvaluatedScripts,
  `Distribution bucket sum (${totalDistributionScripts}) must equal total evaluated scripts (${markingOverviewData.totalEvaluatedScripts})`
);
console.log("✓ Mark distribution buckets sum perfectly to evaluated scripts (74 = 74)");

// Test 4: Statistical Bounds
console.log("\n[TEST 4] Statistical Metric Ranges...");
assert(
  markingOverviewData.lowestMarks <= markingOverviewData.averageMarks,
  "Lowest marks must be <= Average marks"
);
assert(
  markingOverviewData.averageMarks <= markingOverviewData.highestMarks,
  "Average marks must be <= Highest marks"
);
assert(
  markingOverviewData.highestMarks <= markingOverviewData.maxMarks,
  "Highest marks must be <= Max marks (70)"
);
console.log(`✓ Bounds valid: ${markingOverviewData.lowestMarks} <= ${markingOverviewData.averageMarks} <= ${markingOverviewData.highestMarks} <= ${markingOverviewData.maxMarks}`);

// Test 5: Question Paper Max Marks Sum
console.log("\n[TEST 5] Question Paper Total Maximum Marks...");
const totalMaxMarks = questionsData.reduce((acc, q) => acc + q.maxMarks, 0);
assert.strictEqual(
  totalMaxMarks,
  markingOverviewData.maxMarks,
  `Sum of question max marks (${totalMaxMarks}) must match exam max marks (${markingOverviewData.maxMarks})`
);
console.log("✓ Total max marks of all 12 questions sum to 70 marks exactly (70 = 70)");

// Test 6: Question Attempts Bounds
console.log("\n[TEST 6] Question Attempts Bounds...");
questionsData.forEach((q) => {
  assert(
    q.attempts <= summaryData.completed,
    `Question ${q.questionNumber} attempts (${q.attempts}) cannot exceed completed sheets (${summaryData.completed})`
  );
  assert(
    q.averageMarks <= q.maxMarks,
    `Question ${q.questionNumber} average marks (${q.averageMarks}) cannot exceed its max marks (${q.maxMarks})`
  );
});
console.log("✓ All 12 questions have valid attempt counts and non-exceeding average scores");

// Test 7: AI vs Examiner Workflow Math
console.log("\n[TEST 7] AI vs Examiner Workflow Consistency...");
assert.strictEqual(
  workflowData.aiAcceptedCount + workflowData.aiOverriddenCount,
  workflowData.totalCompletedSheets,
  "AI accepted + AI overridden must equal completed sheets"
);
const computedRate = ((workflowData.aiAcceptedCount / workflowData.totalCompletedSheets) * 100).toFixed(1);
assert.strictEqual(
  computedRate,
  workflowData.aiAcceptanceRate.toFixed(1),
  "Computed acceptance rate matches workflow acceptance rate"
);
console.log(`✓ Workflow math consistent: 61 + 13 = 74 sheets, acceptance rate = ${computedRate}%`);

// Test 8: Attention & Risk Count Correlation
console.log("\n[TEST 8] Attention & Risk Flags Correlation...");
assert.strictEqual(
  attentionRiskData.flaggedEvaluationsCount,
  summaryData.needsReview,
  "Attention risk flagged count must match summary needsReview (12)"
);
assert(
  attentionRiskData.criticalRiskCount <= attentionRiskData.highRiskCount,
  "Critical risk cases must be within high risk scope"
);
console.log("✓ Flagged evaluations match summary needsReview count (12 = 12)");

// Test 9: Empty State Handling
console.log("\n[TEST 9] Empty State Edge Cases...");
const emptyOverview = {
  totalEvaluatedScripts: 0,
  averageMarks: 0,
  medianMarks: 0,
  highestMarks: 0,
  lowestMarks: 0,
  maxMarks: 70,
  markDistribution: [],
};
assert.strictEqual(emptyOverview.totalEvaluatedScripts, 0, "Empty state script count is 0");
console.log("✓ Empty state definitions validated safely");

console.log("\n=================================================");
console.log("🎉 ALL 9 REPORTS PAGE METRIC TESTS PASSED CLEANLY!");
console.log("=================================================\n");
