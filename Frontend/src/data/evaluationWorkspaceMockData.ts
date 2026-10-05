export interface RubricCriterion {
  id: string;
  label: string;
  maxMarks: number;
  suggestedMarks: number;
  matched: boolean;
  note?: string;
}

export interface EvidenceObservation {
  id: string;
  text: string;
  status: "positive" | "negative" | "warning";
  sectionKey: string;
  matchedLineRange?: string;
}

export interface RiskFactorData {
  factorType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  scoreContribution: number;
  measuredValue?: number;
  threshold?: number;
  explanation: string;
  sourceEntityType?: string;
}

export interface RiskAssessmentData {
  overallRiskScore: number;
  riskBand: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresSecondEvaluation: boolean;
  requiresSeniorReview: boolean;
  requiresHumanReview: boolean;
  formulaVersion: string;
  factors: RiskFactorData[];
}

export interface DoubleEvaluationData {
  round1Marks: number;
  round2Marks: number;
  markDelta: number;
  normalizedDelta: number;
  status: "DOUBLE_EVALUATION_AGREED" | "DOUBLE_EVALUATION_DISAGREEMENT" | "PENDING_SECOND_EVALUATION";
  requiresSeniorReview: boolean;
  criteriaDifferencesCount: number;
  round1ExaminerName?: string;
  round2ExaminerName?: string;
}

export interface QuestionData {
  questionNumber: string;
  section: string;
  questionText: string;
  maxMarks: number;
  pageNumber: number;
  aiSuggestedMarks: number;
  aiConfidence: number;
  aiConfidenceRating: "High confidence" | "Medium confidence" | "Low confidence";
  aiConfidenceNote: string;
  rubricItems: RubricCriterion[];
  evidenceItems: EvidenceObservation[];
  detectedRegionNote: string;
  aiProvider?: string;
  aiModel?: string;
  attemptId?: string;
  evaluationId?: string;
  evaluationStatus?: string;
  requiresReview?: boolean;
  riskAssessment?: RiskAssessmentData;
  doubleEvaluationResult?: DoubleEvaluationData;
}

export interface ScriptEvaluationDataset {
  scriptId: string;
  anonymizedCode: string;
  examination: string;
  semester: string;
  subject: string;
  subjectCode: string;
  totalPages: number;
  totalQuestions: number;
  status: "AI Ready" | "Needs Review" | "Attention";
  center: string;
  session: string;
  questions: Record<string, QuestionData>;
}

export const MOCK_EVALUATION_SCRIPTS: Record<string, ScriptEvaluationDataset> = {
  "A-10492": {
    scriptId: "SHEET A-10492",
    anonymizedCode: "ANON-0492-MPONL",
    examination: "B.Tech CSE",
    semester: "Semester III",
    subject: "Engineering Mathematics III",
    subjectCode: "CS-301",
    totalPages: 12,
    totalQuestions: 12,
    status: "AI Ready",
    center: "Center #04, Bhopal",
    session: "Winter 2025-26",
    questions: {
      Q01: {
        questionNumber: "Q01",
        section: "Section A • Short Concepts",
        questionText: "Define Cauchy-Riemann equations in polar coordinates and state the necessary conditions for analyticity.",
        maxMarks: 4,
        pageNumber: 2,
        aiSuggestedMarks: 3.5,
        aiConfidence: 94,
        aiConfidenceRating: "High confidence",
        aiConfidenceNote: "Clear formula derivation identified with standard notation.",
        detectedRegionNote: "Page 2 • Upper half (Lines 1–18)",
        rubricItems: [
          { id: "r1", label: "Polar C-R Equations statement", maxMarks: 2, suggestedMarks: 2, matched: true },
          { id: "r2", label: "Analyticity continuity conditions", maxMarks: 1.5, suggestedMarks: 1.5, matched: true },
          { id: "r3", label: "Notation correctness & clarity", maxMarks: 0.5, suggestedMarks: 0, matched: false, note: "Partial derivative symbol omitted in second term" },
        ],
        evidenceItems: [
          { id: "e1", text: "Correct polar equations du/dr = (1/r) dv/dθ and dv/dr = -(1/r) du/dθ present.", status: "positive", sectionKey: "formula" },
          { id: "e2", text: "Partial derivatives continuity condition explicitly noted.", status: "positive", sectionKey: "condition" },
        ],
      },
      Q02: {
        questionNumber: "Q02",
        section: "Section A • Short Concepts",
        questionText: "Evaluate the contour integral ∮ dz / (z - 2) over the circle |z| = 3 using Cauchy's Integral Formula.",
        maxMarks: 4,
        pageNumber: 2,
        aiSuggestedMarks: 4.0,
        aiConfidence: 96,
        aiConfidenceRating: "High confidence",
        aiConfidenceNote: "Standard integral derivation matches model answer completely.",
        detectedRegionNote: "Page 2 • Lower half (Lines 19–34)",
        rubricItems: [
          { id: "r1", label: "Singularity identification inside contour", maxMarks: 1, suggestedMarks: 1, matched: true },
          { id: "r2", label: "Cauchy Integral Formula application", maxMarks: 2, suggestedMarks: 2, matched: true },
          { id: "r3", label: "Final result (2πi)", maxMarks: 1, suggestedMarks: 1, matched: true },
        ],
        evidenceItems: [
          { id: "e1", text: "Singularity at z = 2 identified inside |z| = 3.", status: "positive", sectionKey: "singularity" },
          { id: "e2", text: "Final evaluated answer 2πi boxed clearly.", status: "positive", sectionKey: "result" },
        ],
      },
      Q03: {
        questionNumber: "Q03",
        section: "Section B • Analytical Problems",
        questionText: "Find the Taylor series expansion of f(z) = 1 / ((z + 1)(z + 3)) about the point z = 0.",
        maxMarks: 6,
        pageNumber: 3,
        aiSuggestedMarks: 4.5,
        aiConfidence: 89,
        aiConfidenceRating: "High confidence",
        aiConfidenceNote: "Partial fractions correct; minor summation index omission in term 4.",
        detectedRegionNote: "Page 3 • Full page (Lines 1–32)",
        rubricItems: [
          { id: "r1", label: "Partial fraction decomposition", maxMarks: 2, suggestedMarks: 2, matched: true },
          { id: "r2", label: "Binomial expansion of individual terms", maxMarks: 2, suggestedMarks: 2, matched: true },
          { id: "r3", label: "Region of convergence determination", maxMarks: 2, suggestedMarks: 0.5, matched: false, note: "Valid radius of convergence |z| < 1 mentioned without proof" },
        ],
        evidenceItems: [
          { id: "e1", text: "A = 1/2 and B = -1/2 correctly determined.", status: "positive", sectionKey: "fractions" },
          { id: "e2", text: "General series expression written in sigma notation.", status: "positive", sectionKey: "series" },
          { id: "e3", text: "Radius of convergence not formally checked at singularity boundary.", status: "negative", sectionKey: "convergence" },
        ],
      },
      Q04: {
        questionNumber: "Q04",
        section: "Section B • Descriptive & Analytical Problems",
        questionText: "Explain the working principle of the given system and discuss the major factors affecting its performance.",
        maxMarks: 7,
        pageNumber: 4,
        aiSuggestedMarks: 5.0,
        aiConfidence: 87,
        aiConfidenceRating: "High confidence",
        aiConfidenceNote: "Answer is clearly readable and most rubric criteria are identifiable.",
        detectedRegionNote: "Answer detected: Pages 4–5 (Page 4 primary, Lines 1–28)",
        rubricItems: [
          { id: "r1", label: "Core Concept", maxMarks: 2, suggestedMarks: 2, matched: true, note: "Fourier's law of heat conduction identified" },
          { id: "r2", label: "Working Principle", maxMarks: 2, suggestedMarks: 2, matched: true, note: "Operational mechanism and steady-state condition explained" },
          { id: "r3", label: "Technical Explanation", maxMarks: 1, suggestedMarks: 1, matched: true, note: "Mathematical formulation & parameter definitions provided" },
          { id: "r4", label: "Relevant Example", maxMarks: 1, suggestedMarks: 0, matched: false, note: "Practical industrial application example omitted" },
          { id: "r5", label: "Conclusion", maxMarks: 1, suggestedMarks: 0, matched: false, note: "No summary or concluding statement provided" },
        ],
        evidenceItems: [
          { id: "e1", text: "Core concept is correctly identified.", status: "positive", sectionKey: "concept", matchedLineRange: "Lines 1–4" },
          { id: "e2", text: "Working principle is substantially explained.", status: "positive", sectionKey: "principle", matchedLineRange: "Lines 5–10" },
          { id: "e3", text: "Technical explanation is present.", status: "positive", sectionKey: "technical", matchedLineRange: "Lines 11–18" },
          { id: "e4", text: "Required example is missing.", status: "negative", sectionKey: "example", matchedLineRange: "Omitted" },
          { id: "e5", text: "No clear concluding statement is present.", status: "negative", sectionKey: "conclusion", matchedLineRange: "End of answer" },
        ],
        riskAssessment: {
          overallRiskScore: 68,
          riskBand: "HIGH",
          requiresSecondEvaluation: true,
          requiresSeniorReview: true,
          requiresHumanReview: true,
          formulaVersion: "risk-v1",
          factors: [
            {
              factorType: "AI_HUMAN_DISAGREEMENT",
              severity: "MEDIUM",
              scoreContribution: 20,
              measuredValue: 0.28,
              threshold: 0.20,
              explanation: "Examiner final marks (5.0/7) differ from AI suggestion by 1.0 mark (14.3%).",
              sourceEntityType: "ExaminerEvaluationDecision",
            },
            {
              factorType: "AI_UNCERTAINTY",
              severity: "LOW",
              scoreContribution: 16,
              measuredValue: 0.87,
              threshold: 0.80,
              explanation: "AI confidence is 87% with minor region boundary ambiguity on continuation page.",
              sourceEntityType: "Evaluation",
            },
            {
              factorType: "CRITERION_DISAGREEMENT",
              severity: "LOW",
              scoreContribution: 10,
              measuredValue: 0.40,
              threshold: 0.25,
              explanation: "Examiner overridden 2 of 5 rubric criteria for partial credit.",
              sourceEntityType: "ExaminerCriterionDecision",
            },
            {
              factorType: "SCAN_PAGE_QUALITY",
              severity: "LOW",
              scoreContribution: 10,
              measuredValue: 0.76,
              threshold: 0.80,
              explanation: "Document page scan readability average is 76%.",
              sourceEntityType: "ScriptPage",
            },
            {
              factorType: "RUBRIC_AMBIGUITY",
              severity: "LOW",
              scoreContribution: 7,
              measuredValue: 1,
              threshold: 1,
              explanation: "Alternate derivation method detected in working steps.",
              sourceEntityType: "EvaluationIssue",
            },
            {
              factorType: "SPECIAL_ANSWER_STATE",
              severity: "LOW",
              scoreContribution: 5,
              measuredValue: 1,
              threshold: 1,
              explanation: "Answer spans across multiple booklet pages (Pages 4–5).",
              sourceEntityType: "QuestionAttemptPage",
            },
          ],
        },
        doubleEvaluationResult: {
          round1Marks: 5.0,
          round2Marks: 3.5,
          markDelta: 1.5,
          normalizedDelta: 0.214,
          status: "DOUBLE_EVALUATION_DISAGREEMENT",
          requiresSeniorReview: true,
          criteriaDifferencesCount: 2,
          round1ExaminerName: "Prof. Anshul Tripathi (Round 1)",
          round2ExaminerName: "Prof. M. Joshi (Round 2)",
        },
      },
      Q05: {
        questionNumber: "Q05",
        section: "Section B • Descriptive & Analytical Problems",
        questionText: "State and prove Green's theorem in a plane for a simply connected region bounded by a piecewise smooth curve.",
        maxMarks: 7,
        pageNumber: 5,
        aiSuggestedMarks: 6.0,
        aiConfidence: 91,
        aiConfidenceRating: "High confidence",
        aiConfidenceNote: "Theorem statement and vector line integral transformation complete.",
        detectedRegionNote: "Page 5 • Full page (Lines 1–35)",
        rubricItems: [
          { id: "r1", label: "Formal statement of Green's theorem", maxMarks: 2, suggestedMarks: 2, matched: true },
          { id: "r2", label: "Region projection along x-axis and y-axis", maxMarks: 2, suggestedMarks: 2, matched: true },
          { id: "r3", label: "Integral evaluation along boundaries", maxMarks: 2, suggestedMarks: 1.5, matched: true },
          { id: "r4", label: "Combination into double integral", maxMarks: 1, suggestedMarks: 0.5, matched: true },
        ],
        evidenceItems: [
          { id: "e1", text: "Correct formula ∮(L dx + M dy) = ∬(∂M/∂x - ∂L/∂y) dx dy.", status: "positive", sectionKey: "statement" },
          { id: "e2", text: "Boundary curve C oriented counter-clockwise noted.", status: "positive", sectionKey: "curve" },
        ],
      },
      Q07: {
        questionNumber: "Q07",
        section: "Section C • Applied Engineering Problems",
        questionText: "Derive the one-dimensional wave equation for a vibrating string and state the boundary conditions.",
        maxMarks: 8,
        pageNumber: 7,
        aiSuggestedMarks: 6.0,
        aiConfidence: 74,
        aiConfidenceRating: "Medium confidence",
        aiConfidenceNote: "Divergence between automated step mark and expected intermediate balance.",
        detectedRegionNote: "Page 7 • Full page (Lines 1–38)",
        rubricItems: [
          { id: "r1", label: "String segment force balance (Newton's second law)", maxMarks: 3, suggestedMarks: 2, matched: true, note: "Tension components resolved with small angle approximation" },
          { id: "r2", label: "Derivation of ∂²y/∂t² = c² ∂²y/∂x²", maxMarks: 3, suggestedMarks: 3, matched: true },
          { id: "r3", label: "Fixed boundary conditions y(0,t)=0, y(L,t)=0", maxMarks: 2, suggestedMarks: 1, matched: true, note: "Initial velocity condition omitted" },
        ],
        evidenceItems: [
          { id: "e1", text: "Wave equation ∂²y/∂t² = c² ∂²y/∂x² correctly derived.", status: "positive", sectionKey: "wave_eqn" },
          { id: "e2", text: "Moderator flag: AI scored 6, but derivation step 2 lacks Taylor expansion justification.", status: "warning", sectionKey: "step_justification" },
        ],
      },
      Q09: {
        questionNumber: "Q09",
        section: "Section C • Applied Engineering Problems",
        questionText: "Solve the Laplace equation ∇²u = 0 in polar coordinates for a semi-circular plate of radius R with zero boundary potential.",
        maxMarks: 8,
        pageNumber: 9,
        aiSuggestedMarks: 5.5,
        aiConfidence: 78,
        aiConfidenceRating: "Medium confidence",
        aiConfidenceNote: "Candidate answered both Option A and Option B; requires human selection.",
        detectedRegionNote: "Page 9 • Multi-section attempt (Lines 1–40)",
        rubricItems: [
          { id: "r1", label: "Separation of variables substitution", maxMarks: 2, suggestedMarks: 2, matched: true },
          { id: "r2", label: "Radial and angular ODE solutions", maxMarks: 3, suggestedMarks: 2, matched: true },
          { id: "r3", label: "Fourier sine coefficient integration", maxMarks: 3, suggestedMarks: 1.5, matched: true },
        ],
        evidenceItems: [
          { id: "e1", text: "Candidate attempted both Section II optional alternatives.", status: "warning", sectionKey: "dual_attempt" },
          { id: "e2", text: "Examiner discretion recommended to select the higher-scoring valid attempt.", status: "warning", sectionKey: "discretion" },
        ],
      },
    },
  },
};

export const AVAILABLE_QUESTIONS = [
  { id: "Q01", label: "Q01", maxMarks: 4, page: 2, status: "evaluated", marks: 3.5 },
  { id: "Q02", label: "Q02", maxMarks: 4, page: 2, status: "evaluated", marks: 4.0 },
  { id: "Q03", label: "Q03", maxMarks: 6, page: 3, status: "evaluated", marks: 4.5 },
  { id: "Q04", label: "Q04", maxMarks: 7, page: 4, status: "active", marks: 5.0 },
  { id: "Q05", label: "Q05", maxMarks: 7, page: 5, status: "pending", marks: null },
  { id: "Q06", label: "Q06", maxMarks: 6, page: 6, status: "pending", marks: null },
  { id: "Q07", label: "Q07", maxMarks: 8, page: 7, status: "flagged", marks: 6.0 },
  { id: "Q08", label: "Q08", maxMarks: 6, page: 8, status: "pending", marks: null },
  { id: "Q09", label: "Q09", maxMarks: 8, page: 9, status: "review", marks: 5.5 },
  { id: "Q10", label: "Q10", maxMarks: 6, page: 10, status: "pending", marks: null },
  { id: "Q11", label: "Q11", maxMarks: 7, page: 11, status: "pending", marks: null },
  { id: "Q12", label: "Q12", maxMarks: 7, page: 12, status: "pending", marks: null },
];

export type EvaluationWorkspaceData = ScriptEvaluationDataset;
export const EVALUATION_DATASET_MOCK: EvaluationWorkspaceData = MOCK_EVALUATION_SCRIPTS["A-10492"];

export function getScriptDataset(scriptId: string): ScriptEvaluationDataset {
  const cleanId = scriptId.replace(/^(?:SCRIPT|SHEET)\s+/i, "").trim();
  if (MOCK_EVALUATION_SCRIPTS[cleanId]) {
    return MOCK_EVALUATION_SCRIPTS[cleanId];
  }
  // Construct dynamic fallback with clean scriptId
  const base = MOCK_EVALUATION_SCRIPTS["A-10492"];
  return {
    ...base,
    scriptId: cleanId.startsWith("A-") ? cleanId : `A-${cleanId}`,
    anonymizedCode: `ANON-${cleanId}-MPONL`,
  };
}

