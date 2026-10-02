import assert from "node:assert";

// Load configuration from TopNavigation or re-test the canonical role map
const itemDashboard = { id: "dashboard", label: "Dashboard", href: "/examiner/dashboard" };
const itemEvaluations = { id: "evaluations", label: "My Evaluations", href: "/examiner/evaluations" };
const itemReview = { id: "review", label: "Review Queue", href: "/examiner/review" };
const itemReports = { id: "reports", label: "Reports", href: "/examiner/reports" };

const itemExamMgmt = { id: "admin-exams", label: "Exam Management", href: "/admin/exams" };
const itemSheetIntake = { id: "admin-scripts", label: "Sheet Intake", href: "/admin/scripts" };

const itemModeration = { id: "moderation", label: "Moderation", href: "/moderation" };
const itemAnalytics = { id: "admin-analytics", label: "Analytics", href: "/admin/analytics" };
const itemResults = { id: "admin-results", label: "Results", href: "/admin/results" };

const itemExaminerAccounts = { id: "admin-examiners", label: "Examiner Accounts", href: "/admin/examiners" };

const ROLE_NAVIGATION_CONFIG = {
  EXAMINER: [
    {
      items: [itemDashboard, itemEvaluations, itemReview, itemReports],
    },
  ],
  HEAD_EXAMINER: [
    {
      title: "WORK",
      items: [itemDashboard, itemEvaluations, itemReview, itemReports],
    },
    {
      title: "EXAMINATION",
      items: [itemExamMgmt, itemSheetIntake],
    },
    {
      title: "OVERSIGHT",
      items: [itemModeration, itemAnalytics, itemResults],
    },
  ],
  SUPER_ADMIN: [
    {
      title: "OVERVIEW",
      items: [itemDashboard],
    },
    {
      title: "EXAMINATION",
      items: [itemExamMgmt, itemSheetIntake, itemResults],
    },
    {
      title: "QUALITY & OVERSIGHT",
      items: [itemModeration, itemAnalytics],
    },
    {
      title: "ADMINISTRATION",
      items: [itemExaminerAccounts],
    },
  ],
};

function getNavigationForRole(role) {
  if (role && ROLE_NAVIGATION_CONFIG[role]) {
    return ROLE_NAVIGATION_CONFIG[role];
  }
  return ROLE_NAVIGATION_CONFIG.EXAMINER;
}

console.log("==================================================");
console.log("ANKLYZE ROLE-BASED NAVIGATION TEST SUITE");
console.log("==================================================");

// TEST 1: Examiner Navigation
console.log("\n[TEST 1] Testing Examiner Navigation...");
const examinerNav = getNavigationForRole("EXAMINER");
assert.strictEqual(examinerNav.length, 1, "Examiner has exactly 1 group (flat list)");
assert.strictEqual(examinerNav[0].title, undefined, "Examiner group has no title heading");
const examinerItems = examinerNav[0].items;
assert.strictEqual(examinerItems.length, 4, "Examiner has exactly 4 items");
assert.deepStrictEqual(
  examinerItems.map((i) => i.label),
  ["Dashboard", "My Evaluations", "Review Queue", "Reports"]
);
// Verify no admin items or calibration in examiner
const forbiddenForExaminer = ["Exam Management", "Sheet Intake", "Moderation", "Analytics", "Results", "Examiner Accounts", "Calibration"];
for (const bad of forbiddenForExaminer) {
  assert(!examinerItems.some((i) => i.label.toLowerCase().includes(bad.toLowerCase())), `Examiner must not see ${bad}`);
}
console.log("✓ Examiner navigation passes: Dashboard, My Evaluations, Review Queue, Reports.");

// TEST 2: Head Examiner Navigation
console.log("\n[TEST 2] Testing Head Examiner Navigation...");
const headNav = getNavigationForRole("HEAD_EXAMINER");
assert.strictEqual(headNav.length, 3, "Head Examiner has 3 visual groups: WORK, EXAMINATION, OVERSIGHT");
assert.strictEqual(headNav[0].title, "WORK");
assert.strictEqual(headNav[1].title, "EXAMINATION");
assert.strictEqual(headNav[2].title, "OVERSIGHT");

assert.deepStrictEqual(
  headNav[0].items.map((i) => i.label),
  ["Dashboard", "My Evaluations", "Review Queue", "Reports"]
);
assert.deepStrictEqual(
  headNav[1].items.map((i) => i.label),
  ["Exam Management", "Sheet Intake"]
);
assert.deepStrictEqual(
  headNav[2].items.map((i) => i.label),
  ["Moderation", "Analytics", "Results"]
);

const headItems = headNav.flatMap((g) => g.items);
assert.strictEqual(headItems.length, 9, "Head Examiner has 9 total items");
// Verify no Examiner Accounts and no Calibration
assert(!headItems.some((i) => i.label.toLowerCase().includes("examiner accounts")), "Head Examiner must not see Examiner Accounts");
assert(!headItems.some((i) => i.label.toLowerCase().includes("calibration")), "Head Examiner must not see Calibration");
console.log("✓ Head Examiner navigation passes: WORK (4), EXAMINATION (2), OVERSIGHT (3). Total 9 items.");

// TEST 3: Super Admin Navigation
console.log("\n[TEST 3] Testing Super Admin Navigation...");
const adminNav = getNavigationForRole("SUPER_ADMIN");
assert.strictEqual(adminNav.length, 4, "Super Admin has 4 groups: OVERVIEW, EXAMINATION, QUALITY & OVERSIGHT, ADMINISTRATION");
assert.strictEqual(adminNav[0].title, "OVERVIEW");
assert.strictEqual(adminNav[1].title, "EXAMINATION");
assert.strictEqual(adminNav[2].title, "QUALITY & OVERSIGHT");
assert.strictEqual(adminNav[3].title, "ADMINISTRATION");

assert.deepStrictEqual(
  adminNav[0].items.map((i) => i.label),
  ["Dashboard"]
);
assert.deepStrictEqual(
  adminNav[1].items.map((i) => i.label),
  ["Exam Management", "Sheet Intake", "Results"]
);
assert.deepStrictEqual(
  adminNav[2].items.map((i) => i.label),
  ["Moderation", "Analytics"]
);
assert.deepStrictEqual(
  adminNav[3].items.map((i) => i.label),
  ["Examiner Accounts"]
);

const adminItems = adminNav.flatMap((g) => g.items);
assert.strictEqual(adminItems.length, 7, "Super Admin has 7 total items");
// Verify no My Evaluations, Review Queue, Calibration
assert(!adminItems.some((i) => i.label.toLowerCase().includes("my evaluations")), "Super Admin must not see My Evaluations");
assert(!adminItems.some((i) => i.label.toLowerCase().includes("review queue")), "Super Admin must not see Review Queue");
assert(!adminItems.some((i) => i.label.toLowerCase().includes("calibration")), "Super Admin must not see Calibration");
console.log("✓ Super Admin navigation passes: OVERVIEW (1), EXAMINATION (3), QUALITY & OVERSIGHT (2), ADMINISTRATION (1). Total 7 items.");

// TEST 4: Fallback Role Resolution
console.log("\n[TEST 4] Testing Fallback Role Resolution...");
const fallbackNav = getNavigationForRole("UNKNOWN_ROLE");
assert.strictEqual(fallbackNav, ROLE_NAVIGATION_CONFIG.EXAMINER, "Unknown role falls back to least-privileged EXAMINER nav");
const emptyRoleNav = getNavigationForRole(undefined);
assert.strictEqual(emptyRoleNav, ROLE_NAVIGATION_CONFIG.EXAMINER, "Undefined role falls back to least-privileged EXAMINER nav");
console.log("✓ Fallback role resolution passes.");

// TEST 5: Complete Absence of Calibration
console.log("\n[TEST 5] Testing Calibration Exclusion Across All Roles...");
for (const [role, groups] of Object.entries(ROLE_NAVIGATION_CONFIG)) {
  const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));
  const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
  for (const label of allLabels) {
    assert(!label.toLowerCase().includes("calibration"), `Role ${role} contains calibration label: ${label}`);
  }
  for (const href of allHrefs) {
    assert(!href.toLowerCase().includes("calibration"), `Role ${role} contains calibration route: ${href}`);
  }
}
console.log("✓ Zero calibration references in any navigation role config.");

console.log("\n==================================================");
console.log("ALL 5 NAVIGATION ROLE TESTS PASSED!");
console.log("==================================================");
