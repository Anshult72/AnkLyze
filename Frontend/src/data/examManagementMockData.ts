export interface CriterionData {
  id: string;
  name: string;
  description: string;
  maximumMarks: number;
  orderIndex: number;
  partialCreditAllowed: boolean;
  alternateMethodAccepted: boolean;
}

export interface QuestionData {
  id: string;
  subjectId: string;
  questionNumber: string;
  questionText: string;
  maximumMarks: number;
  orderIndex: number;
  section?: string;
  criteria?: CriterionData[];
}

export interface MarkingSchemeData {
  id: string;
  subjectId: string;
  title: string;
  instructions: string;
  version: number;
  status: "DRAFT" | "APPROVED" | "SUPERSEDED";
}

// ------------------------------------------------------------------------------
// Phase 6: AI Rubric Engine Interfaces
// ------------------------------------------------------------------------------

export interface RubricIssueData {
  id: string;
  type: "AMBIGUITY" | "INCOMPLETE_RULE" | "MARK_MISMATCH" | "POLICY_CONFLICT";
  severity: "LOW" | "MEDIUM" | "HIGH";
  issue: string;
  explanation: string;
  suggestedClarification?: string;
  questionNumber?: string;
  isResolved: boolean;
}

export interface RubricCriterionData {
  id: string;
  name: string;
  description: string;
  maximumMarks: number;
  orderIndex: number;
  partialCreditAllowed: boolean;
  alternateMethodAccepted: boolean;
  isHumanModified: boolean;
  originalAiValue?: {
    name: string;
    description: string;
    maximumMarks: number;
    partialCreditAllowed?: boolean;
    alternateMethodAccepted?: boolean;
  };
  modifiedByName?: string;
  modifiedAt?: string;
  modificationReason?: string;
}

export interface RubricQuestionData {
  id: string;
  questionId: string;
  questionNumber: string;
  questionText: string;
  maximumMarks: number;
  criteria: RubricCriterionData[];
  specialInstructions: string[];
  isReviewRequired: boolean;
  issues: RubricIssueData[];
}

export interface RubricAnalysisData {
  id: string;
  markingSchemeId: string;
  version: number;
  overallStatus: "ANALYSIS_PENDING" | "ANALYSIS_COMPLETE" | "READY_FOR_REVIEW" | "REVIEW_REQUIRED" | "APPROVED" | "REJECTED" | "SUPERSEDED" | "FAILED";
  provider: string;
  model: string;
  promptVersion: string;
  confidence: number;
  confidenceBand: "HIGH" | "MEDIUM" | "LOW";
  fallbackUsed: boolean;
  summary?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  questions: RubricQuestionData[];
  issues: RubricIssueData[];
}

export interface AssignedExaminerData {
  id: string;
  examinerId: string;
  examinerName: string;
  email: string;
  department: string;
  institution: string;
  status: "ACTIVE" | "REVOKED" | "COMPLETED";
  assignedAt: string;
}

export interface SubjectData {
  id: string;
  examId: string;
  code: string;
  name: string;
  description?: string;
  maxMarks: number;
  questions: QuestionData[];
  markingSchemes: MarkingSchemeData[];
  assignedExaminers: AssignedExaminerData[];
}

export interface ExamData {
  id: string;
  title: string;
  code: string;
  academicTerm: string;
  academicYear: string;
  semester: string;
  institution: string;
  description?: string;
  status: "DRAFT" | "ACTIVE" | "EVALUATION_IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  startDate?: string;
  endDate?: string;
  totalMarks: number;
  partialMarking: boolean;
  negativeMarking: boolean;
  anonymityEnabled: boolean;
  updatedAt: string;
  subjects: SubjectData[];
}

export const INITIAL_EXAMS: ExamData[] = [
  {
    id: "exam-2026-w-cs3",
    title: "ANKLYZE Demo Exam - B.Tech CSE Semester III",
    code: "EXAM-2026-W-CS3",
    academicTerm: "Winter Session 2025-26",
    academicYear: "2025-2026",
    semester: "Semester III",
    institution: "MP State Board of Technical Examinations, Bhopal",
    description: "Official evaluation and assessment cycle for third semester computer engineering cohorts.",
    status: "ACTIVE",
    startDate: "2026-01-10T09:00:00Z",
    endDate: "2026-02-15T17:00:00Z",
    totalMarks: 70,
    partialMarking: true,
    negativeMarking: false,
    anonymityEnabled: true,
    updatedAt: "2026-02-18",
    subjects: [
      {
        id: "subj-cs301",
        examId: "exam-2026-w-cs3",
        code: "CS-301",
        name: "Engineering Mathematics III",
        description: "Advanced differential equations, residue calculus, Fourier series, and matrix decomposition.",
        maxMarks: 70,
        questions: [
          {
            id: "q-301-1",
            subjectId: "subj-cs301",
            questionNumber: "Q01",
            questionText: "Define eigenvalues and eigenvectors of an n x n square matrix. State the Cayley-Hamilton theorem and demonstrate how it is used to compute matrix inverse.",
            maximumMarks: 14,
            orderIndex: 1,
            section: "Section A",
            criteria: [
              {
                id: "c-1-1",
                name: "Eigenvalues & Eigenvectors Definition",
                description: "Matrix characteristic equation det(A - lambda*I) = 0 and non-zero vector definition.",
                maximumMarks: 4,
                orderIndex: 1,
                partialCreditAllowed: true,
                alternateMethodAccepted: false,
              },
              {
                id: "c-1-2",
                name: "Cayley-Hamilton Theorem Statement",
                description: "Explicit statement that every square matrix satisfies its own characteristic equation.",
                maximumMarks: 4,
                orderIndex: 2,
                partialCreditAllowed: true,
                alternateMethodAccepted: false,
              },
              {
                id: "c-1-3",
                name: "Inverse Matrix Computation Formula",
                description: "Multiplication by A^-1 to derive A^-1 in terms of powers of A.",
                maximumMarks: 6,
                orderIndex: 3,
                partialCreditAllowed: true,
                alternateMethodAccepted: true,
              },
            ],
          },
          {
            id: "q-301-2",
            subjectId: "subj-cs301",
            questionNumber: "Q02",
            questionText: "Evaluate the contour integral of f(z) = (z^2 + 1)/(z^2 - 4) around circle |z| = 3 using Cauchy's Residue Theorem.",
            maximumMarks: 14,
            orderIndex: 2,
            section: "Section A",
            criteria: [],
          },
          {
            id: "q-301-3",
            subjectId: "subj-cs301",
            questionNumber: "Q03",
            questionText: "Formulate the partial differential equation by eliminating arbitrary functions f and g from z = f(x + at) + g(x - at).",
            maximumMarks: 14,
            orderIndex: 3,
            section: "Section B",
            criteria: [],
          },
          {
            id: "q-301-4",
            subjectId: "subj-cs301",
            questionNumber: "Q04",
            questionText: "Derive the one-dimensional wave equation for a vibrating string under uniform tension. Obtain D'Alembert's closed-form solution with initial displacement f(x) and velocity g(x).",
            maximumMarks: 7,
            orderIndex: 4,
            section: "Section B",
            criteria: [
              {
                id: "c-4-1",
                name: "Wave PDE Formulation & Assumptions",
                description: "Clear statement of Newton's second law on string element, small deflection assumption, and horizontal tension equilibrium.",
                maximumMarks: 2,
                orderIndex: 1,
                partialCreditAllowed: true,
                alternateMethodAccepted: false,
              },
              {
                id: "c-4-2",
                name: "Wave Equation Derivation (∂²u/∂t² = c² ∂²u/∂x²)",
                description: "Step-by-step differential derivation establishing wave speed c = sqrt(T/rho).",
                maximumMarks: 2,
                orderIndex: 2,
                partialCreditAllowed: true,
                alternateMethodAccepted: true,
              },
              {
                id: "c-4-3",
                name: "D'Alembert Canonical Transformation",
                description: "Introduction of characteristic coordinates xi = x - ct and eta = x + ct, integration of ∂²u/∂xi∂eta = 0.",
                maximumMarks: 2,
                orderIndex: 3,
                partialCreditAllowed: true,
                alternateMethodAccepted: true,
              },
              {
                id: "c-4-4",
                name: "Initial & Boundary Condition Evaluation",
                description: "Substitution of u(x,0) = f(x) and u_t(x,0) = g(x) to yield complete D'Alembert solution formula.",
                maximumMarks: 1,
                orderIndex: 4,
                partialCreditAllowed: true,
                alternateMethodAccepted: false,
              },
            ],
          },
        ],
        markingSchemes: [
          {
            id: "sch-301-1",
            subjectId: "subj-cs301",
            title: "Official Evaluation Scheme - Winter 2025-26",
            instructions: "Step-marking applies to all derivation steps. Alternate valid mathematical approaches should be awarded equivalent marks.",
            version: 1,
            status: "APPROVED",
          },
        ],
        assignedExaminers: [
          {
            id: "asgn-01",
            examinerId: "usr-examiner-001",
            examinerName: "Prof. R. K. Sharma",
            email: "examiner@anklyze.demo",
            department: "Computer Science & Engineering",
            institution: "MPOnline Examination Center #04",
            status: "ACTIVE",
            assignedAt: "2026-01-15",
          },
        ],
      },
      {
        id: "subj-cs302",
        examId: "exam-2026-w-cs3",
        code: "CS-302",
        name: "Data Structures & Algorithms",
        description: "Algorithm analysis, balanced trees, graph traversal, and dynamic programming paradigms.",
        maxMarks: 70,
        questions: [
          {
            id: "q-302-1",
            subjectId: "subj-cs302",
            questionNumber: "Q01",
            questionText: "Analyze time and space complexity of QuickSort algorithm. Contrast average vs worst case pivot selections.",
            maximumMarks: 14,
            orderIndex: 1,
            section: "Section A",
            criteria: [],
          },
          {
            id: "q-302-2",
            subjectId: "subj-cs302",
            questionNumber: "Q02",
            questionText: "Implement an AVL Tree insertion algorithm with LL, RR, LR, and RL rotation cases explained.",
            maximumMarks: 14,
            orderIndex: 2,
            section: "Section A",
            criteria: [],
          },
        ],
        markingSchemes: [
          {
            id: "sch-302-1",
            subjectId: "subj-cs302",
            title: "Algorithms Scheme v1",
            instructions: "Code logic correctness given 70% weight; syntax given 30% weight.",
            version: 1,
            status: "DRAFT",
          },
        ],
        assignedExaminers: [
          {
            id: "asgn-02",
            examinerId: "usr-examiner-001",
            examinerName: "Prof. R. K. Sharma",
            email: "examiner@anklyze.demo",
            department: "Computer Science & Engineering",
            institution: "MPOnline Examination Center #04",
            status: "ACTIVE",
            assignedAt: "2026-01-15",
          },
        ],
      },
    ],
  },
  {
    id: "exam-2026-w-ec4",
    title: "ANKLYZE Assessment - B.Tech Electronics Semester IV",
    code: "EXAM-2026-W-EC4",
    academicTerm: "Winter Session 2025-26",
    academicYear: "2025-2026",
    semester: "Semester IV",
    institution: "State Board of Technical Examinations, MP",
    description: "Signals and Systems, Analog Communication Systems evaluation cycle.",
    status: "DRAFT",
    totalMarks: 70,
    partialMarking: true,
    negativeMarking: false,
    anonymityEnabled: true,
    updatedAt: "2026-02-12",
    subjects: [
      {
        id: "subj-ec401",
        examId: "exam-2026-w-ec4",
        code: "EC-401",
        name: "Signals & Systems",
        maxMarks: 70,
        questions: [],
        markingSchemes: [],
        assignedExaminers: [],
      },
    ],
  },
];

export const AVAILABLE_ACADEMIC_EXAMINERS = [
  {
    id: "usr-examiner-001",
    fullName: "Prof. R. K. Sharma",
    email: "examiner@anklyze.demo",
    role: "EXAMINER",
    department: "Department of Computer Science & Engineering",
    institution: "MPOnline Examination Center #04",
  },
  {
    id: "usr-examiner-002",
    fullName: "Dr. P. N. Mishra",
    email: "p.mishra@anklyze.demo",
    role: "EXAMINER",
    department: "Department of Applied Mathematics",
    institution: "State Board Center #02",
  },
  {
    id: "usr-examiner-003",
    fullName: "Dr. Sunita Rao",
    email: "s.rao@anklyze.demo",
    role: "EXAMINER",
    department: "Department of Information Technology",
    institution: "State Board Center #08",
  },
];

export const INITIAL_RUBRIC_ANALYSES: Record<string, RubricAnalysisData[]> = {
  "sch-301-1": [
    {
      id: "rubric-cs301-v1",
      markingSchemeId: "sch-301-1",
      version: 1,
      overallStatus: "READY_FOR_REVIEW",
      provider: "gemini",
      model: "gemini-1.5-flash",
      promptVersion: "rubric-analysis-v1",
      confidence: 0.91,
      confidenceBand: "HIGH",
      fallbackUsed: false,
      summary: "Successfully analyzed human marking scheme for CS-301. Structured criteria generated for all 4 questions with explicit step allocations, partial credit identification, and alternate method rules.",
      createdAt: "2026-02-18T10:30:00Z",
      questions: [
        {
          id: "rq-301-1",
          questionId: "q-301-1",
          questionNumber: "Q01",
          questionText: "Define eigenvalues and eigenvectors of an n x n square matrix. State the Cayley-Hamilton theorem and demonstrate how it is used to compute matrix inverse.",
          maximumMarks: 14,
          specialInstructions: ["Award proportionate marks if characteristic polynomial is factored accurately."],
          isReviewRequired: false,
          issues: [],
          criteria: [
            {
              id: "rc-1-1",
              name: "Eigenvalues & Eigenvectors Definition",
              description: "Matrix characteristic equation det(A - lambda*I) = 0 and non-zero vector definition.",
              maximumMarks: 4,
              orderIndex: 1,
              partialCreditAllowed: true,
              alternateMethodAccepted: false,
              isHumanModified: false,
            },
            {
              id: "rc-1-2",
              name: "Cayley-Hamilton Theorem Statement",
              description: "Explicit statement that every square matrix satisfies its own characteristic equation.",
              maximumMarks: 4,
              orderIndex: 2,
              partialCreditAllowed: true,
              alternateMethodAccepted: false,
              isHumanModified: false,
            },
            {
              id: "rc-1-3",
              name: "Inverse Matrix Computation Formula",
              description: "Multiplication by A^-1 to derive A^-1 in terms of powers of A.",
              maximumMarks: 6,
              orderIndex: 3,
              partialCreditAllowed: true,
              alternateMethodAccepted: true,
              isHumanModified: false,
            },
          ],
        },
        {
          id: "rq-301-2",
          questionId: "q-301-2",
          questionNumber: "Q02",
          questionText: "Evaluate the contour integral of f(z) = (z^2 + 1)/(z^2 - 4) around circle |z| = 3 using Cauchy's Residue Theorem.",
          maximumMarks: 14,
          specialInstructions: ["Check that student clearly mentions which poles lie strictly inside |z| = 3."],
          isReviewRequired: false,
          issues: [],
          criteria: [
            {
              id: "rc-2-1",
              name: "Pole Identification (z = ±2)",
              description: "Determination that both simple poles z = 2 and z = -2 lie within contour |z| = 3.",
              maximumMarks: 3,
              orderIndex: 1,
              partialCreditAllowed: true,
              alternateMethodAccepted: false,
              isHumanModified: false,
            },
            {
              id: "rc-2-2",
              name: "Residue Computation at z = 2 and z = -2",
              description: "Correct limit evaluation yielding Res(f, 2) = 5/4 and Res(f, -2) = -5/4.",
              maximumMarks: 6,
              orderIndex: 2,
              partialCreditAllowed: true,
              alternateMethodAccepted: true,
              isHumanModified: false,
            },
            {
              id: "rc-2-3",
              name: "Application of Residue Theorem & Final Value",
              description: "Integral = 2*pi*i*(sum of residues) = 2*pi*i*(5/4 - 5/4) = 0.",
              maximumMarks: 5,
              orderIndex: 3,
              partialCreditAllowed: true,
              alternateMethodAccepted: false,
              isHumanModified: false,
            },
          ],
        },
        {
          id: "rq-301-3",
          questionId: "q-301-3",
          questionNumber: "Q03",
          questionText: "Formulate the partial differential equation by eliminating arbitrary functions f and g from z = f(x + at) + g(x - at).",
          maximumMarks: 14,
          specialInstructions: [],
          isReviewRequired: false,
          issues: [],
          criteria: [
            {
              id: "rc-3-1",
              name: "First Order Partial Derivatives (p, q)",
              description: "Calculation of ∂z/∂x = f' + g' and ∂z/∂t = a(f' - g').",
              maximumMarks: 4,
              orderIndex: 1,
              partialCreditAllowed: true,
              alternateMethodAccepted: false,
              isHumanModified: false,
            },
            {
              id: "rc-3-2",
              name: "Second Order Partial Derivatives (r, t)",
              description: "Derivation of ∂²z/∂x² = f'' + g'' and ∂²z/∂t² = a²(f'' + g'').",
              maximumMarks: 5,
              orderIndex: 2,
              partialCreditAllowed: true,
              alternateMethodAccepted: true,
              isHumanModified: false,
            },
            {
              id: "rc-3-3",
              name: "Elimination & Final Wave PDE Relation",
              description: "Substitution establishing ∂²z/∂t² = a²(∂²z/∂x²).",
              maximumMarks: 5,
              orderIndex: 3,
              partialCreditAllowed: true,
              alternateMethodAccepted: false,
              isHumanModified: false,
            },
          ],
        },
        {
          id: "rq-301-4",
          questionId: "q-301-4",
          questionNumber: "Q04",
          questionText: "Derive the one-dimensional wave equation for a vibrating string under uniform tension. Obtain D'Alembert's closed-form solution with initial displacement f(x) and velocity g(x).",
          maximumMarks: 7,
          specialInstructions: ["Check characteristic transformation coordinates xi = x - ct and eta = x + ct."],
          isReviewRequired: true,
          issues: [
            {
              id: "iss-q4-1",
              type: "AMBIGUITY",
              severity: "MEDIUM",
              questionNumber: "Q04",
              issue: "Partial-credit rule is mentioned but the exact allocation is not defined.",
              explanation: "The human marking scheme mentions step-marking generally, but does not define exact deduction if velocity condition g(x) is partially integrated.",
              suggestedClarification: "Review the partial-credit allocation before approving the rubric: recommend awarding 0.5 for displacement f(x) and 0.5 for velocity g(x).",
              isResolved: false,
            },
          ],
          criteria: [
            {
              id: "rc-4-1",
              name: "Wave PDE Formulation & Assumptions",
              description: "Clear statement of Newton's second law on string element, small deflection assumption, and horizontal tension equilibrium.",
              maximumMarks: 2,
              orderIndex: 1,
              partialCreditAllowed: true,
              alternateMethodAccepted: false,
              isHumanModified: false,
            },
            {
              id: "rc-4-2",
              name: "Wave Equation Derivation (∂²u/∂t² = c² ∂²u/∂x²)",
              description: "Step-by-step differential derivation establishing wave speed c = sqrt(T/rho).",
              maximumMarks: 2,
              orderIndex: 2,
              partialCreditAllowed: true,
              alternateMethodAccepted: true,
              isHumanModified: false,
            },
            {
              id: "rc-4-3",
              name: "D'Alembert Canonical Transformation",
              description: "Introduction of characteristic coordinates xi = x - ct and eta = x + ct, integration of ∂²u/∂xi∂eta = 0.",
              maximumMarks: 2,
              orderIndex: 3,
              partialCreditAllowed: true,
              alternateMethodAccepted: true,
              isHumanModified: false,
            },
            {
              id: "rc-4-4",
              name: "Initial & Boundary Condition Evaluation",
              description: "Substitution of u(x,0) = f(x) and u_t(x,0) = g(x) to yield complete D'Alembert solution formula.",
              maximumMarks: 1,
              orderIndex: 4,
              partialCreditAllowed: true,
              alternateMethodAccepted: false,
              isHumanModified: false,
            },
          ],
        },
      ],
      issues: [
        {
          id: "iss-q4-1",
          type: "AMBIGUITY",
          severity: "MEDIUM",
          questionNumber: "Q04",
          issue: "Partial-credit rule is mentioned but the exact allocation is not defined.",
          explanation: "The human marking scheme mentions step-marking generally, but does not define exact deduction if velocity condition g(x) is partially integrated.",
          suggestedClarification: "Review the partial-credit allocation before approving the rubric: recommend awarding 0.5 for displacement f(x) and 0.5 for velocity g(x).",
          isResolved: false,
        },
      ],
    },
  ],
};

// ------------------------------------------------------------------------------
// Phase 7: Answer Script Intake Interfaces & Mock Data
// ------------------------------------------------------------------------------

export interface ScriptBatchData {
  id: string;
  batchCode: string;
  examId: string;
  subjectId: string;
  examTitle: string;
  examCode: string;
  subjectName: string;
  subjectCode: string;
  source: string;
  status: "CREATED" | "UPLOADING" | "COMPLETED" | "PARTIAL_FAILURE" | "FAILED" | "READY_FOR_PROCESSING";
  totalScripts: number;
  successfulScripts: number;
  failedScripts: number;
  duplicateScripts: number;
  notes?: string;
  createdAt: string;
}

export interface MockOCRBlock {
  blockType: string;
  text: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface MockOCRResultData {
  id: string;
  version: number;
  provider: string;
  feature: string;
  pipelineVersion: string;
  confidence: number;
  languageCode: string;
  fullText: string;
  blocks: MockOCRBlock[];
  createdAt: string;
}

export interface MockScriptPageData {
  id: string;
  pageNumber: number;
  imageReference: string;
  width: number;
  height: number;
  qualityScore: number;
  processingStatus: "PENDING" | "PROCESSING" | "OCR_COMPLETE" | "FAILED" | "NEEDS_REVIEW";
  errorMessage?: string;
  ocrResults: MockOCRResultData[];
}

export type MockQuestionAttemptState =
  | "ACTIVE"
  | "CANCELLED"
  | "BLANK"
  | "CONTINUATION"
  | "DUPLICATE_ATTEMPT"
  | "UNREADABLE"
  | "REQUIRES_REVIEW";

export type MockReconstructionStatus =
  | "NOT_STARTED"
  | "PROCESSING"
  | "COMPLETED"
  | "PARTIALLY_RECONSTRUCTED"
  | "NEEDS_REVIEW"
  | "FAILED";

export interface MockQuestionAttempt {
  id: string;
  questionId: string;
  questionNumber: string;
  questionText: string;
  attemptIndex: number;
  state: MockQuestionAttemptState;
  confidence: number;
  startPageNumber: number;
  endPageNumber: number;
  pages: number[];
  reason: string;
  detectedLabel?: string;
  candidateQuestions?: string[];
  isAmbiguous?: boolean;
}

export interface MockReconstructionReviewCase {
  id: string;
  issue: string;
  affectedPages: number[];
  questionNumber?: string;
  candidateQuestions?: string[];
  confidence: number;
  reason: string;
  isResolved?: boolean;
  resolvedQuestion?: string;
  resolvedState?: MockQuestionAttemptState;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface MockScriptReconstructionData {
  id: string;
  version: number;
  status: MockReconstructionStatus;
  pipelineVersion: string;
  ocrVersion: number;
  provider: string;
  model: string;
  fallbackUsed: boolean;
  confidence: number;
  totalPages: number;
  mappedQuestionsCount: number;
  reviewCasesCount: number;
  attempts: MockQuestionAttempt[];
  reviewCases: MockReconstructionReviewCase[];
  pageToQuestionMap: Array<{
    pageNumber: number;
    questionNumbers: string[];
    isContinuation: boolean;
    state: MockQuestionAttemptState;
  }>;
}

export interface AnswerScriptData {
  id: string;
  scriptCode: string; // e.g. "A-10492" (anonymized)
  batchId: string;
  batchCode: string;
  examId: string;
  examTitle: string;
  examCode: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  pageCount: number;
  storageProvider: "CLOUDINARY" | "MOCK";
  storageAssetId: string;
  storageReference: string;
  barcodeValue?: string;
  status: "UPLOADING" | "UPLOADED" | "VALIDATING" | "VALIDATED" | "READY_FOR_PROCESSING" | "PROCESSING" | "PROCESSING_FAILED" | "REJECTED";
  documentStatus?: "NOT_STARTED" | "PROCESSING" | "PARTIALLY_PROCESSED" | "COMPLETED" | "FAILED" | "NEEDS_REVIEW";
  processedPagesCount?: number;
  averageOcrConfidence?: number;
  pages?: MockScriptPageData[];
  reconstructionStatus?: MockReconstructionStatus;
  reconstruction?: MockScriptReconstructionData;
  createdAt: string;
}

export const MOCK_SCRIPT_BATCHES: ScriptBatchData[] = [
  {
    id: "batch-cs301-001",
    batchCode: "BATCH-2026-CS301-001",
    examId: "exam-cs-2026",
    subjectId: "subj-cs301",
    examTitle: "B.Tech Computer Science & Engineering (Semester III Examination 2026)",
    examCode: "EXAM-2026-W-CS3",
    subjectName: "Engineering Mathematics III",
    subjectCode: "CS-301",
    source: "DIGITAL_SCANNER",
    status: "READY_FOR_PROCESSING",
    totalScripts: 4,
    successfulScripts: 4,
    failedScripts: 0,
    duplicateScripts: 0,
    notes: "Main hall digitized sheets intake - Session 1",
    createdAt: "2026-09-28T09:30:00Z",
  },
  {
    id: "batch-cs301-002",
    batchCode: "BATCH-2026-CS301-002",
    examId: "exam-cs-2026",
    subjectId: "subj-cs301",
    examTitle: "B.Tech Computer Science & Engineering (Semester III Examination 2026)",
    examCode: "EXAM-2026-W-CS3",
    subjectName: "Engineering Mathematics III",
    subjectCode: "CS-301",
    source: "DIGITAL_SCANNER",
    status: "READY_FOR_PROCESSING",
    totalScripts: 2,
    successfulScripts: 2,
    failedScripts: 0,
    duplicateScripts: 0,
    notes: "Annex center digitized sheets intake - Session 2",
    createdAt: "2026-09-28T14:15:00Z",
  },
];

export const MOCK_ANSWER_SCRIPTS: AnswerScriptData[] = [
  {
    id: "script-10492",
    scriptCode: "A-10492",
    batchId: "batch-cs301-001",
    batchCode: "BATCH-2026-CS301-001",
    examId: "exam-cs-2026",
    examTitle: "B.Tech Computer Science & Engineering (Semester III Examination 2026)",
    examCode: "EXAM-2026-W-CS3",
    subjectId: "subj-cs301",
    subjectName: "Engineering Mathematics III",
    subjectCode: "CS-301",
    originalFilename: "scanner_box_01_sheet_001.pdf",
    mimeType: "application/pdf",
    fileSize: 485210,
    checksum: "3a7b8e5c1d9f2a4e6b8c0d1e2f3a4b5c6d7e8f90123456789abcdef012345678",
    pageCount: 8,
    storageProvider: "CLOUDINARY",
    storageAssetId: "ANKLYZE/answer-scripts/EXAM-2026-W-CS3/CS-301/BATCH-2026-CS301-001/A-10492",
    storageReference: "https://res.cloudinary.com/anklyze-cloud/raw/upload/v1/ANKLYZE/answer-scripts/EXAM-2026-W-CS3/CS-301/BATCH-2026-CS301-001/A-10492.pdf",
    barcodeValue: "BC-8839210-01",
    status: "READY_FOR_PROCESSING",
    documentStatus: "NEEDS_REVIEW",
    processedPagesCount: 8,
    averageOcrConfidence: 0.835,
    reconstructionStatus: "NEEDS_REVIEW",
    reconstruction: {
      id: "recon-10492-v1",
      version: 1,
      status: "NEEDS_REVIEW",
      pipelineVersion: "reconstruct-pipeline-v1",
      ocrVersion: 1,
      provider: "hybrid-gemini",
      model: "gemini-1.5-flash",
      fallbackUsed: false,
      confidence: 0.85,
      totalPages: 8,
      mappedQuestionsCount: 5,
      reviewCasesCount: 1,
      attempts: [
        {
          id: "att-10492-q1",
          questionId: "q-301-1",
          questionNumber: "Q1",
          questionText: "Let f(z) = u(x, y) + i v(x, y) be an analytic function. Show that u and v satisfy Cauchy-Riemann equations and are harmonic.",
          attemptIndex: 1,
          state: "ACTIVE",
          confidence: 0.94,
          startPageNumber: 1,
          endPageNumber: 2,
          pages: [1, 2],
          reason: "Question 1 Cauchy-Riemann proof detected on page 1 and completed on page 2.",
          detectedLabel: "Q1",
        },
        {
          id: "att-10492-q2",
          questionId: "q-301-2",
          questionNumber: "Q2",
          questionText: "Evaluate contour integral I = ∮_C [e^z / (z - 2)] dz where C is the circle |z| = 3 using Cauchy's Integral Formula.",
          attemptIndex: 1,
          state: "ACTIVE",
          confidence: 0.91,
          startPageNumber: 3,
          endPageNumber: 3,
          pages: [3],
          reason: "Question 2 heading and complete contour integration response contained on page 3.",
          detectedLabel: "Q2",
        },
        {
          id: "att-10492-q3",
          questionId: "q-301-3",
          questionNumber: "Q3",
          questionText: "Form a partial differential equation by eliminating arbitrary functions f and g from z = f(x + at) + g(x - at).",
          attemptIndex: 1,
          state: "CONTINUATION",
          confidence: 0.88,
          startPageNumber: 4,
          endPageNumber: 5,
          pages: [4, 5],
          reason: "Question 3 working begins on page 4 and continues onto page 5 without intervening question break.",
          detectedLabel: "Q3",
        },
        {
          id: "att-10492-q4",
          questionId: "q-301-4",
          questionNumber: "Q4",
          questionText: "Obtain the Fourier series expansion of f(x) = x² on the interval [-π, π] and deduce Parseval's identity.",
          attemptIndex: 1,
          state: "BLANK",
          confidence: 0.99,
          startPageNumber: 6,
          endPageNumber: 6,
          pages: [6],
          reason: "Question marker detected on page 6 but no meaningful answer content present; candidate skipped response.",
          detectedLabel: "Q4",
        },
        {
          id: "att-10492-q5",
          questionId: "q-301-5",
          questionNumber: "Q5",
          questionText: "Solve one-dimensional heat conduction equation ∂u/∂t = c² ∂²u/∂x² subject to end conditions u(0, t) = u(L, t) = 0.",
          attemptIndex: 1,
          state: "REQUIRES_REVIEW",
          confidence: 0.52,
          startPageNumber: 7,
          endPageNumber: 8,
          pages: [7, 8],
          reason: "Question number ambiguous: handwritten label '5' conflicts between Q05 (PDE) and 5(a) (Analytic sub-question).",
          detectedLabel: "5",
          candidateQuestions: ["Q05 (Heat PDE)", "5(a) (Analytic Functions)"],
          isAmbiguous: true,
        },
      ],
      reviewCases: [
        {
          id: "rc-10492-1",
          issue: "Ambiguous Question Number & Mapping",
          affectedPages: [7, 8],
          questionNumber: "Q5",
          candidateQuestions: ["Q05 (Heat PDE)", "5(a) (Analytic Functions)"],
          confidence: 0.52,
          reason: "Question number ambiguous: handwritten numeral '5' could represent Question 5 or sub-question 5(a). Page 7 also suffered dense pencil shading.",
          isResolved: false,
        },
      ],
      pageToQuestionMap: [
        { pageNumber: 1, questionNumbers: ["Q1"], isContinuation: false, state: "ACTIVE" },
        { pageNumber: 2, questionNumbers: ["Q1"], isContinuation: true, state: "ACTIVE" },
        { pageNumber: 3, questionNumbers: ["Q2"], isContinuation: false, state: "ACTIVE" },
        { pageNumber: 4, questionNumbers: ["Q3"], isContinuation: false, state: "CONTINUATION" },
        { pageNumber: 5, questionNumbers: ["Q3"], isContinuation: true, state: "CONTINUATION" },
        { pageNumber: 6, questionNumbers: ["Q4"], isContinuation: false, state: "BLANK" },
        { pageNumber: 7, questionNumbers: ["Q5"], isContinuation: false, state: "REQUIRES_REVIEW" },
        { pageNumber: 8, questionNumbers: ["Q5"], isContinuation: true, state: "REQUIRES_REVIEW" },
      ],
    },
    pages: [
      {
        id: "page-10492-1",
        pageNumber: 1,
        imageReference: "/api/placeholder/400/560",
        width: 1240,
        height: 1754,
        qualityScore: 0.95,
        processingStatus: "OCR_COMPLETE",
        ocrResults: [
          {
            id: "ocr-10492-1-v1",
            version: 1,
            provider: "google-vision",
            feature: "DOCUMENT_TEXT_DETECTION",
            pipelineVersion: "ocr-v1",
            confidence: 0.942,
            languageCode: "en",
            fullText: "SECTION A: COMPLEX ANALYSIS\nQuestion 1:\nLet f(z) = u(x, y) + i v(x, y) be an analytic function in a simply connected domain D.\nShow that u and v satisfy Cauchy-Riemann equations: ∂u/∂x = ∂v/∂y and ∂u/∂y = -∂v/∂x.\nProof: Consider limit as Δz -> 0 along real axis...\nHence f'(z) = ux + i vx = vy - i uy.",
            blocks: [
              {
                blockType: "TEXT",
                text: "SECTION A: COMPLEX ANALYSIS\nQuestion 1:",
                confidence: 0.97,
                boundingBox: { x: 80, y: 120, width: 950, height: 110 },
              },
              {
                blockType: "TEXT",
                text: "Let f(z) = u(x, y) + i v(x, y) be an analytic function in a simply connected domain D.\nShow that u and v satisfy Cauchy-Riemann equations: ∂u/∂x = ∂v/∂y and ∂u/∂y = -∂v/∂x.",
                confidence: 0.94,
                boundingBox: { x: 80, y: 260, width: 1020, height: 210 },
              },
              {
                blockType: "TEXT",
                text: "Proof: Consider limit as Δz -> 0 along real axis...\nHence f'(z) = ux + i vx = vy - i uy.",
                confidence: 0.92,
                boundingBox: { x: 80, y: 500, width: 980, height: 280 },
              },
            ],
            createdAt: "2026-09-28T09:35:10Z",
          },
        ],
      },
      {
        id: "page-10492-2",
        pageNumber: 2,
        imageReference: "/api/placeholder/400/560",
        width: 1240,
        height: 1754,
        qualityScore: 0.92,
        processingStatus: "OCR_COMPLETE",
        ocrResults: [
          {
            id: "ocr-10492-2-v1",
            version: 1,
            provider: "google-vision",
            feature: "DOCUMENT_TEXT_DETECTION",
            pipelineVersion: "ocr-v1",
            confidence: 0.915,
            languageCode: "en",
            fullText: "Differentiating with respect to x:\n∂²u/∂x² = ∂²v/∂x∂y\nDifferentiating with respect to y:\n∂²u/∂y² = -∂²v/∂y∂x = -∂²v/∂x∂y\nAdding both: ∂²u/∂x² + ∂²u/∂y² = ∇²u = 0.\nTherefore u is harmonic. Harmonic conjugate v satisfies identical Laplace criteria.",
            blocks: [
              {
                blockType: "TEXT",
                text: "Differentiating with respect to x:\n∂²u/∂x² = ∂²v/∂x∂y",
                confidence: 0.93,
                boundingBox: { x: 80, y: 130, width: 880, height: 160 },
              },
              {
                blockType: "TEXT",
                text: "Differentiating with respect to y:\n∂²u/∂y² = -∂²v/∂y∂x = -∂²v/∂x∂y",
                confidence: 0.91,
                boundingBox: { x: 80, y: 310, width: 910, height: 160 },
              },
              {
                blockType: "TEXT",
                text: "Adding both: ∂²u/∂x² + ∂²u/∂y² = ∇²u = 0.\nTherefore u is harmonic. Harmonic conjugate v satisfies identical Laplace criteria.",
                confidence: 0.90,
                boundingBox: { x: 80, y: 490, width: 990, height: 210 },
              },
            ],
            createdAt: "2026-09-28T09:35:14Z",
          },
        ],
      },
      {
        id: "page-10492-3",
        pageNumber: 3,
        imageReference: "/api/placeholder/400/560",
        width: 1240,
        height: 1754,
        qualityScore: 0.89,
        processingStatus: "OCR_COMPLETE",
        ocrResults: [
          {
            id: "ocr-10492-3-v1",
            version: 1,
            provider: "google-vision",
            feature: "DOCUMENT_TEXT_DETECTION",
            pipelineVersion: "ocr-v1",
            confidence: 0.884,
            languageCode: "en",
            fullText: "Question 2: Contour Integration\nEvaluate I = ∮_C [e^z / (z - 2)] dz where C is circle |z| = 3.\nPole at z = 2 lies inside contour C since |2| = 2 < 3.\nBy Cauchy's Integral Formula:\n∮_C [f(z) / (z - z0)] dz = 2πi f(z0)\nHere f(z) = e^z, so f(2) = e².\nTherefore I = 2πi e².",
            blocks: [
              {
                blockType: "TEXT",
                text: "Question 2: Contour Integration\nEvaluate I = ∮_C [e^z / (z - 2)] dz where C is circle |z| = 3.",
                confidence: 0.92,
                boundingBox: { x: 80, y: 120, width: 920, height: 180 },
              },
              {
                blockType: "TEXT",
                text: "Pole at z = 2 lies inside contour C since |2| = 2 < 3.\nBy Cauchy's Integral Formula:\n∮_C [f(z) / (z - z0)] dz = 2πi f(z0)",
                confidence: 0.87,
                boundingBox: { x: 80, y: 320, width: 960, height: 220 },
              },
              {
                blockType: "TEXT",
                text: "Here f(z) = e^z, so f(2) = e².\nTherefore I = 2πi e².",
                confidence: 0.86,
                boundingBox: { x: 80, y: 560, width: 780, height: 150 },
              },
            ],
            createdAt: "2026-09-28T09:35:19Z",
          },
        ],
      },
      {
        id: "page-10492-4",
        pageNumber: 4,
        imageReference: "/api/placeholder/400/560",
        width: 1240,
        height: 1754,
        qualityScore: 0.61,
        processingStatus: "NEEDS_REVIEW",
        ocrResults: [
          {
            id: "ocr-10492-4-v1",
            version: 1,
            provider: "google-vision",
            feature: "DOCUMENT_TEXT_DETECTION",
            pipelineVersion: "ocr-v1",
            confidence: 0.448,
            languageCode: "en",
            fullText: "Q3 partial scribble: L{t sin 2t} = -d/ds [2/(s²+4)] ... [low contrast handwriting diagram with unparsed fraction strokes] ... = 4s / (s²+4)² ... tentative.",
            blocks: [
              {
                blockType: "TEXT",
                text: "Q3 partial scribble: L{t sin 2t} = -d/ds [2/(s²+4)] ... [low contrast handwriting diagram with unparsed fraction strokes]",
                confidence: 0.43,
                boundingBox: { x: 90, y: 140, width: 850, height: 320 },
              },
              {
                blockType: "TEXT",
                text: "= 4s / (s²+4)² ... tentative.",
                confidence: 0.47,
                boundingBox: { x: 90, y: 480, width: 620, height: 140 },
              },
            ],
            createdAt: "2026-09-28T09:35:24Z",
          },
        ],
      },
      {
        id: "page-10492-5",
        pageNumber: 5,
        imageReference: "/api/placeholder/400/560",
        width: 1240,
        height: 1754,
        qualityScore: 0.94,
        processingStatus: "OCR_COMPLETE",
        ocrResults: [
          {
            id: "ocr-10492-5-v1",
            version: 1,
            provider: "google-vision",
            feature: "DOCUMENT_TEXT_DETECTION",
            pipelineVersion: "ocr-v1",
            confidence: 0.931,
            languageCode: "en",
            fullText: "Question 4: Fourier Series Expansion\nGiven f(x) = x² on [-π, π], f(x) is even function.\nHence bn = 0 for all n >= 1.\na0 = (1/π) ∫[0 to π] x² dx = (1/π) [x³/3] = π²/3.\nan = (2/π) ∫[0 to π] x² cos(nx) dx = 4(-1)^n / n².\nFourier Series: f(x) = π²/3 + ∑_{n=1}^∞ [4(-1)^n / n²] cos(nx).",
            blocks: [
              {
                blockType: "TEXT",
                text: "Question 4: Fourier Series Expansion\nGiven f(x) = x² on [-π, π], f(x) is even function.\nHence bn = 0 for all n >= 1.",
                confidence: 0.95,
                boundingBox: { x: 80, y: 120, width: 980, height: 210 },
              },
              {
                blockType: "TEXT",
                text: "a0 = (1/π) ∫[0 to π] x² dx = (1/π) [x³/3] = π²/3.\nan = (2/π) ∫[0 to π] x² cos(nx) dx = 4(-1)^n / n².",
                confidence: 0.93,
                boundingBox: { x: 80, y: 350, width: 1010, height: 240 },
              },
              {
                blockType: "TEXT",
                text: "Fourier Series: f(x) = π²/3 + ∑_{n=1}^∞ [4(-1)^n / n²] cos(nx).",
                confidence: 0.91,
                boundingBox: { x: 80, y: 610, width: 940, height: 160 },
              },
            ],
            createdAt: "2026-09-28T09:35:28Z",
          },
        ],
      },
      {
        id: "page-10492-6",
        pageNumber: 6,
        imageReference: "/api/placeholder/400/560",
        width: 1240,
        height: 1754,
        qualityScore: 0.88,
        processingStatus: "OCR_COMPLETE",
        ocrResults: [
          {
            id: "ocr-10492-6-v1",
            version: 1,
            provider: "google-vision",
            feature: "DOCUMENT_TEXT_DETECTION",
            pipelineVersion: "ocr-v1",
            confidence: 0.892,
            languageCode: "en",
            fullText: "Deduction for Parseval's identity:\nSetting x = 0:\n0 = π²/3 + 4 ∑ (-1)^n / n²\n∑_{n=1}^∞ (-1)^{n+1} / n² = π²/12.\nSetting x = π gives Basel identity: ∑ 1/n² = π²/6.",
            blocks: [
              {
                blockType: "TEXT",
                text: "Deduction for Parseval's identity:\nSetting x = 0:\n0 = π²/3 + 4 ∑ (-1)^n / n²",
                confidence: 0.91,
                boundingBox: { x: 80, y: 130, width: 870, height: 190 },
              },
              {
                blockType: "TEXT",
                text: "∑_{n=1}^∞ (-1)^{n+1} / n² = π²/12.\nSetting x = π gives Basel identity: ∑ 1/n² = π²/6.",
                confidence: 0.88,
                boundingBox: { x: 80, y: 340, width: 920, height: 180 },
              },
            ],
            createdAt: "2026-09-28T09:35:33Z",
          },
        ],
      },
      {
        id: "page-10492-7",
        pageNumber: 7,
        imageReference: "/api/placeholder/400/560",
        width: 1240,
        height: 1754,
        qualityScore: 0.38,
        processingStatus: "FAILED",
        errorMessage: "Google Cloud Vision API: OCR text extraction timed out after 25000ms on dense sketch layer",
        ocrResults: [],
      },
      {
        id: "page-10492-8",
        pageNumber: 8,
        imageReference: "/api/placeholder/400/560",
        width: 1240,
        height: 1754,
        qualityScore: 0.91,
        processingStatus: "OCR_COMPLETE",
        ocrResults: [
          {
            id: "ocr-10492-8-v1",
            version: 1,
            provider: "google-vision",
            feature: "DOCUMENT_TEXT_DETECTION",
            pipelineVersion: "ocr-v1",
            confidence: 0.923,
            languageCode: "en",
            fullText: "Question 5: Partial Differential Equations\nSolve ∂²u/∂x² = 1/c² ∂²u/∂t² with boundary conditions u(0, t) = u(L, t) = 0.\nUsing separation of variables: u(x, t) = X(x) T(t).\nX''(x)/X(x) = T''(t)/(c² T(t)) = -p².\nGeneral solution: u(x, t) = ∑_{n=1}^∞ [An cos(nπct/L) + Bn sin(nπct/L)] sin(nπx/L).\nEnd of answer book.",
            blocks: [
              {
                blockType: "TEXT",
                text: "Question 5: Partial Differential Equations\nSolve ∂²u/∂x² = 1/c² ∂²u/∂t² with boundary conditions u(0, t) = u(L, t) = 0.",
                confidence: 0.94,
                boundingBox: { x: 80, y: 120, width: 970, height: 190 },
              },
              {
                blockType: "TEXT",
                text: "Using separation of variables: u(x, t) = X(x) T(t).\nX''(x)/X(x) = T''(t)/(c² T(t)) = -p².\nGeneral solution: u(x, t) = ∑_{n=1}^∞ [An cos(nπct/L) + Bn sin(nπct/L)] sin(nπx/L).",
                confidence: 0.92,
                boundingBox: { x: 80, y: 330, width: 1040, height: 260 },
              },
              {
                blockType: "TEXT",
                text: "End of answer book.",
                confidence: 0.98,
                boundingBox: { x: 80, y: 620, width: 450, height: 80 },
              },
            ],
            createdAt: "2026-09-28T09:35:41Z",
          },
        ],
      },
    ],
    createdAt: "2026-09-28T09:31:12Z",
  },
  {
    id: "script-10493",
    scriptCode: "A-10493",
    batchId: "batch-cs301-001",
    batchCode: "BATCH-2026-CS301-001",
    examId: "exam-cs-2026",
    examTitle: "B.Tech Computer Science & Engineering (Semester III Examination 2026)",
    examCode: "EXAM-2026-W-CS3",
    subjectId: "subj-cs301",
    subjectName: "Engineering Mathematics III",
    subjectCode: "CS-301",
    originalFilename: "scanner_box_01_sheet_002.pdf",
    mimeType: "application/pdf",
    fileSize: 392104,
    checksum: "7c6b5a4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b",
    pageCount: 6,
    storageProvider: "CLOUDINARY",
    storageAssetId: "ANKLYZE/answer-scripts/EXAM-2026-W-CS3/CS-301/BATCH-2026-CS301-001/A-10493",
    storageReference: "https://res.cloudinary.com/anklyze-cloud/raw/upload/v1/ANKLYZE/answer-scripts/EXAM-2026-W-CS3/CS-301/BATCH-2026-CS301-001/A-10493.pdf",
    barcodeValue: "BC-8839210-02",
    status: "READY_FOR_PROCESSING",
    createdAt: "2026-09-28T09:32:04Z",
  },
  {
    id: "script-10494",
    scriptCode: "A-10494",
    batchId: "batch-cs301-001",
    batchCode: "BATCH-2026-CS301-001",
    examId: "exam-cs-2026",
    examTitle: "B.Tech Computer Science & Engineering (Semester III Examination 2026)",
    examCode: "EXAM-2026-W-CS3",
    subjectId: "subj-cs301",
    subjectName: "Engineering Mathematics III",
    subjectCode: "CS-301",
    originalFilename: "scanner_box_01_sheet_003.pdf",
    mimeType: "application/pdf",
    fileSize: 461890,
    checksum: "8b1a9953c4611296a827abf8c47804d7e3b0c44298fc1c149afbf4c8996fb924",
    pageCount: 8,
    storageProvider: "CLOUDINARY",
    storageAssetId: "ANKLYZE/answer-scripts/EXAM-2026-W-CS3/CS-301/BATCH-2026-CS301-001/A-10494",
    storageReference: "https://res.cloudinary.com/anklyze-cloud/raw/upload/v1/ANKLYZE/answer-scripts/EXAM-2026-W-CS3/CS-301/BATCH-2026-CS301-001/A-10494.pdf",
    barcodeValue: "BC-8839210-03",
    status: "READY_FOR_PROCESSING",
    createdAt: "2026-09-28T09:33:45Z",
  },
  {
    id: "script-10495",
    scriptCode: "A-10495",
    batchId: "batch-cs301-001",
    batchCode: "BATCH-2026-CS301-001",
    examId: "exam-cs-2026",
    examTitle: "B.Tech Computer Science & Engineering (Semester III Examination 2026)",
    examCode: "EXAM-2026-W-CS3",
    subjectId: "subj-cs301",
    subjectName: "Engineering Mathematics III",
    subjectCode: "CS-301",
    originalFilename: "scanner_box_01_sheet_004.pdf",
    mimeType: "application/pdf",
    fileSize: 580230,
    checksum: "1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
    pageCount: 10,
    storageProvider: "CLOUDINARY",
    storageAssetId: "ANKLYZE/answer-scripts/EXAM-2026-W-CS3/CS-301/BATCH-2026-CS301-001/A-10495",
    storageReference: "https://res.cloudinary.com/anklyze-cloud/raw/upload/v1/ANKLYZE/answer-scripts/EXAM-2026-W-CS3/CS-301/BATCH-2026-CS301-001/A-10495.pdf",
    barcodeValue: "BC-8839210-04",
    status: "READY_FOR_PROCESSING",
    createdAt: "2026-09-28T09:35:10Z",
  },
  {
    id: "script-10496",
    scriptCode: "A-10496",
    batchId: "batch-cs301-002",
    batchCode: "BATCH-2026-CS301-002",
    examId: "exam-cs-2026",
    examTitle: "B.Tech Computer Science & Engineering (Semester III Examination 2026)",
    examCode: "EXAM-2026-W-CS3",
    subjectId: "subj-cs301",
    subjectName: "Engineering Mathematics III",
    subjectCode: "CS-301",
    originalFilename: "scanner_box_02_sheet_001.pdf",
    mimeType: "application/pdf",
    fileSize: 375410,
    checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    pageCount: 6,
    storageProvider: "CLOUDINARY",
    storageAssetId: "ANKLYZE/answer-scripts/EXAM-2026-W-CS3/CS-301/BATCH-2026-CS301-002/A-10496",
    storageReference: "https://res.cloudinary.com/anklyze-cloud/raw/upload/v1/ANKLYZE/answer-scripts/EXAM-2026-W-CS3/CS-301/BATCH-2026-CS301-002/A-10496.pdf",
    barcodeValue: "BC-8839210-05",
    status: "READY_FOR_PROCESSING",
    createdAt: "2026-09-28T14:16:30Z",
  },
];

export const MOCK_EXAMS = INITIAL_EXAMS;
export const MOCK_SUBJECTS = INITIAL_EXAMS.flatMap((e) => e.subjects);


