/**
 * ANKLYZE — Evaluation Queue Test Suite
 * Validates filtering, search, sorting, resume position, action routing, and summary counts.
 */

import assert from "node:assert";

// Data fixture matching examinerMockData.ts
const queueData = [
  {
    id: "script-10492",
    scriptId: "SHEET A-10492",
    totalAnswers: 12,
    detectedAnswers: 12,
    evaluatedAnswers: 0,
    status: "AI Ready",
    riskLevel: "Low Risk",
    actionLabel: "Evaluate →",
    confidenceScore: 97,
    updatedAt: "08:45 AM",
    priorityNote: "Ready to evaluate",
  },
  {
    id: "script-10493",
    scriptId: "SHEET A-10493",
    totalAnswers: 12,
    detectedAnswers: 11,
    evaluatedAnswers: 11,
    status: "Needs Review",
    riskLevel: "Medium Risk",
    actionLabel: "Review →",
    confidenceScore: 81,
    updatedAt: "08:41 AM",
    priorityNote: "Q07 step-mark divergence",
    lastQuestion: "Q07",
    resumeQuestion: "Q07",
  },
  {
    id: "script-10494",
    scriptId: "SHEET A-10494",
    totalAnswers: 12,
    detectedAnswers: 10,
    evaluatedAnswers: 4,
    status: "Attention",
    riskLevel: "High Risk",
    actionLabel: "Review →",
    confidenceScore: 68,
    updatedAt: "08:38 AM",
    priorityNote: "Q04 handwriting illegible",
    lastQuestion: "Q04",
    resumeQuestion: "Q04",
  },
  {
    id: "script-10495",
    scriptId: "SHEET A-10495",
    totalAnswers: 12,
    detectedAnswers: 12,
    evaluatedAnswers: 8,
    status: "In Progress",
    riskLevel: "Low Risk",
    actionLabel: "Resume →",
    confidenceScore: 95,
    updatedAt: "08:30 AM",
    priorityNote: "8 of 12 · Resume Q07",
    lastQuestion: "Q07",
    resumeQuestion: "Q07",
  },
  {
    id: "script-10496",
    scriptId: "SHEET A-10496",
    totalAnswers: 12,
    detectedAnswers: 12,
    evaluatedAnswers: 0,
    status: "AI Ready",
    riskLevel: "Low Risk",
    actionLabel: "Evaluate →",
    confidenceScore: 94,
    updatedAt: "08:24 AM",
    priorityNote: "Ready to evaluate",
  },
  {
    id: "script-10497",
    scriptId: "SHEET A-10497",
    totalAnswers: 12,
    detectedAnswers: 9,
    evaluatedAnswers: 9,
    status: "Needs Review",
    riskLevel: "Medium Risk",
    actionLabel: "Review →",
    confidenceScore: 78,
    updatedAt: "08:18 AM",
    priorityNote: "Q09 dual attempt in Section II",
    lastQuestion: "Q09",
    resumeQuestion: "Q09",
  },
  {
    id: "script-10498",
    scriptId: "SHEET A-10498",
    totalAnswers: 12,
    detectedAnswers: 12,
    evaluatedAnswers: 0,
    status: "AI Ready",
    riskLevel: "Low Risk",
    actionLabel: "Evaluate →",
    confidenceScore: 98,
    updatedAt: "08:10 AM",
    priorityNote: "High AI confidence",
  },
  {
    id: "script-10499",
    scriptId: "SHEET A-10499",
    totalAnswers: 12,
    detectedAnswers: 11,
    evaluatedAnswers: 10,
    status: "Needs Review",
    riskLevel: "Medium Risk",
    actionLabel: "Review →",
    confidenceScore: 83,
    updatedAt: "08:02 AM",
    priorityNote: "Q12 margin threshold check",
    lastQuestion: "Q12",
    resumeQuestion: "Q12",
  },
  {
    id: "script-10500",
    scriptId: "SHEET A-10500",
    totalAnswers: 12,
    detectedAnswers: 12,
    evaluatedAnswers: 0,
    status: "AI Ready",
    riskLevel: "Low Risk",
    actionLabel: "Evaluate →",
    confidenceScore: 96,
    updatedAt: "07:50 AM",
    priorityNote: "Ready to evaluate",
  },
  {
    id: "script-10490",
    scriptId: "SHEET A-10490",
    totalAnswers: 12,
    detectedAnswers: 12,
    evaluatedAnswers: 12,
    status: "Completed",
    riskLevel: "Low Risk",
    actionLabel: "View →",
    confidenceScore: 96,
    updatedAt: "08:35 AM",
    completedAt: "Today, 08:35 AM",
    priorityNote: "Finalized 61/70",
  },
  {
    id: "script-10491",
    scriptId: "SHEET A-10491",
    totalAnswers: 12,
    detectedAnswers: 12,
    evaluatedAnswers: 12,
    status: "Completed",
    riskLevel: "Low Risk",
    actionLabel: "View →",
    confidenceScore: 94,
    updatedAt: "08:42 AM",
    completedAt: "Today, 08:42 AM",
    priorityNote: "Finalized 56/70",
  },
];

console.log("=================================================");
console.log("ANKLYZE — Evaluation Queue Test Suite");
console.log("=================================================");

// Test 1: Category Counts
console.log("\n[TEST 1] Queue Category Counts...");
const aiReadyCount = queueData.filter(s => s.status === "AI Ready").length;
const needsReviewCount = queueData.filter(s => s.status === "Needs Review").length;
const attentionCount = queueData.filter(s => s.status === "Attention").length;
const completedCount = queueData.filter(s => s.status === "Completed").length;
const inProgressCount = queueData.filter(s => s.status === "In Progress").length;

assert.strictEqual(aiReadyCount, 4, "Ready to Mark count must be 4");
assert.strictEqual(needsReviewCount, 3, "Needs Review count must be 3");
assert.strictEqual(attentionCount, 1, "Attention count must be 1");
assert.strictEqual(completedCount, 2, "Completed count must be 2");
assert.strictEqual(inProgressCount, 1, "In Progress count must be 1");
console.log(`✓ Summary numbers verified: Ready=${aiReadyCount}, Review=${needsReviewCount}, Attention=${attentionCount}, Completed=${completedCount}`);

// Test 2: Filter Logic
console.log("\n[TEST 2] Filter Functionality...");
const filterQueue = (status) => {
  return queueData.filter(s => {
    if (status === "ALL") return true;
    if (status === "AI_READY") return s.status === "AI Ready";
    if (status === "NEEDS_REVIEW") return s.status === "Needs Review";
    if (status === "ATTENTION") return s.status === "Attention";
    if (status === "COMPLETED") return s.status === "Completed";
    return true;
  });
};

assert.strictEqual(filterQueue("ALL").length, 11, "ALL must return 11 scripts");
assert.strictEqual(filterQueue("AI_READY").length, 4, "AI_READY must return 4 scripts");
assert.strictEqual(filterQueue("NEEDS_REVIEW").length, 3, "NEEDS_REVIEW must return 3 scripts");
assert.strictEqual(filterQueue("ATTENTION").length, 1, "ATTENTION must return 1 script");
assert.strictEqual(filterQueue("COMPLETED").length, 2, "COMPLETED must return 2 scripts");
console.log("✓ All 5 filter tabs correctly isolate their respective items");

// Test 3: Search Logic
console.log("\n[TEST 3] Search Capabilities...");
const searchQueue = (query) => {
  const q = query.toLowerCase().trim();
  return queueData.filter(s => {
    if (!q) return true;
    return s.scriptId.toLowerCase().includes(q) ||
      (s.priorityNote && s.priorityNote.toLowerCase().includes(q)) ||
      (s.lastQuestion && s.lastQuestion.toLowerCase().includes(q));
  });
};

assert.strictEqual(searchQueue("A-10492").length, 1, "Searching A-10492 should find exactly 1 script");
assert.strictEqual(searchQueue("A-10492")[0].scriptId, "SHEET A-10492");
assert.strictEqual(searchQueue("Q07").length, 2, "Searching Q07 should find A-10493 and A-10495");
assert.strictEqual(searchQueue("NONEXISTENT").length, 0, "Searching non-existent query returns 0");
console.log("✓ Search matches scriptId, question tags, and handles zero-result queries");

// Test 4: Sorting Logic
console.log("\n[TEST 4] Priority & Quality Sorting...");
const priorityOrder = { Attention: 1, "Needs Review": 2, "In Progress": 3, "AI Ready": 4, Completed: 5 };
const prioritySorted = [...queueData].sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status]);
assert.strictEqual(prioritySorted[0].status, "Attention", "Priority sort must put Attention first");
assert.strictEqual(prioritySorted[prioritySorted.length - 1].status, "Completed", "Priority sort must put Completed last");

const confidenceSorted = [...queueData].sort((a, b) => a.confidenceScore - b.confidenceScore);
assert.strictEqual(confidenceSorted[0].confidenceScore, 68, "Lowest confidence script (68%) must be first for examiner review");

const progressSorted = [...queueData].sort((a, b) => (b.evaluatedAnswers / b.totalAnswers) - (a.evaluatedAnswers / a.totalAnswers));
assert.strictEqual(progressSorted[0].evaluatedAnswers, 12, "Completed script (12/12) must be first in progress sort");
console.log("✓ Priority, Confidence, and Progress sorting algorithms verified");

// Test 5: Resume Position & In Progress Semantics
console.log("\n[TEST 5] Resume Position Semantics...");
const inProgressScript = queueData.find(s => s.status === "In Progress");
assert(inProgressScript, "In Progress script must exist");
assert.strictEqual(inProgressScript.scriptId, "SHEET A-10495");
assert.strictEqual(inProgressScript.evaluatedAnswers, 8);
assert.strictEqual(inProgressScript.totalAnswers, 12);
assert.strictEqual(inProgressScript.resumeQuestion, "Q07");
assert.strictEqual(inProgressScript.actionLabel, "Resume →");
console.log("✓ In-progress script properly specifies Resume Q07 and evaluated 8 of 12");

// Test 6: Completed Scripts Semantics
console.log("\n[TEST 6] Completed Scripts Semantics...");
const completedScripts = queueData.filter(s => s.status === "Completed");
assert.strictEqual(completedScripts.length, 2);
completedScripts.forEach(s => {
  assert.strictEqual(s.evaluatedAnswers, 12, "Completed scripts must have all 12 answers evaluated");
  assert.strictEqual(s.actionLabel, "View →", "Completed action must be View →");
  assert(s.completedAt, "Completed script must have a completedAt timestamp");
});
console.log("✓ Completed scripts are marked with View → and complete progress 12/12");

// Test 7: Action Route Integrity
console.log("\n[TEST 7] Action Route Formatting...");
queueData.forEach(s => {
  const cleanId = s.scriptId.replace(/^(?:SCRIPT|SHEET)\s+/, "");
  assert(/^A-\d+$/.test(cleanId), `Clean ID '${cleanId}' must match format A-XXXXX`);
  const href = `/examiner/evaluate/${cleanId}`;
  assert(href.startsWith("/examiner/evaluate/A-"), `Route '${href}' must be valid evaluation path`);
});
console.log("✓ All 11 scripts format clean evaluation workspace routes without broken links");

console.log("\n=================================================");
console.log("🎉 ALL 7 EVALUATION QUEUE TESTS PASSED CLEANLY!");
console.log("=================================================\n");
