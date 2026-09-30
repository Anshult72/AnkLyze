export interface CalibrationSetItem {
  id: string;
  questionNumber: string;
  sampleQuestionText: string;
  sampleAnswerText: string;
  maxMarks: number;
  referenceMarks: number; // Revealed only post-submission
  referenceCriteria: Array<{
    criterionId: string;
    criterionName: string;
    maxMarks: number;
    referenceMarks: number;
    rationale: string;
  }>;
  explanation: string;
}

export interface CalibrationSetSummary {
  id: string;
  code: string;
  title: string;
  subject: string;
  subjectCode: string;
  examination: string;
  itemCount: number;
  items: CalibrationSetItem[];
}

export const MOCK_CALIBRATION_SETS: CalibrationSetSummary[] = [
  {
    id: "cal-set-01",
    code: "CAL-MATH-2026-V1",
    title: "Engineering Mathematics III Benchmark Calibration Benchmark",
    subject: "Engineering Mathematics III",
    subjectCode: "CS-301",
    examination: "Winter 2025-26",
    itemCount: 2,
    items: [
      {
        id: "item-01",
        questionNumber: "Q04",
        sampleQuestionText: "Explain the working principle of the thermal conduction system and discuss the major factors affecting its performance.",
        sampleAnswerText: "The fundamental working principle of the thermal conduction system is governed by Fourier's Law of Heat Conduction. Heat flows spontaneously through a homogeneous solid medium from high temperature to low temperature. Formula: q = -k * A * (dT/dx). Factors affecting performance include cross-sectional area, temperature gradient, and thermal conductivity k.",
        maxMarks: 7.0,
        referenceMarks: 5.5,
        referenceCriteria: [
          { criterionId: "c1", criterionName: "Core Concept Identification", maxMarks: 2.0, referenceMarks: 2.0, rationale: "Fourier's law correctly stated and defined." },
          { criterionId: "c2", criterionName: "Working Principle Formulation", maxMarks: 2.0, referenceMarks: 2.0, rationale: "Mechanism of molecular/lattice conduction explained." },
          { criterionId: "c3", criterionName: "Technical Parameter Formulation", maxMarks: 1.0, referenceMarks: 1.0, rationale: "q = -k A (dT/dx) formula provided with parameter definitions." },
          { criterionId: "c4", criterionName: "Industrial Example", maxMarks: 1.0, referenceMarks: 0.0, rationale: "Practical application example was omitted by candidate." },
          { criterionId: "c5", criterionName: "Concluding Remarks", maxMarks: 1.0, referenceMarks: 0.5, rationale: "Brief summary provided without quantitative range." },
        ],
        explanation: "Authoritative reference marking according to MP state examination board scheme.",
      },
      {
        id: "item-02",
        questionNumber: "Q01",
        sampleQuestionText: "Define Cauchy-Riemann equations in polar coordinates and state the necessary conditions for analyticity.",
        sampleAnswerText: "In polar coordinates z = r e^(iθ), the C-R equations are: ∂u/∂r = (1/r) ∂v/∂θ and ∂v/∂r = -(1/r) ∂u/∂θ. For analyticity, the four first partial derivatives must exist, be continuous in region D, and satisfy the C-R equations.",
        maxMarks: 4.0,
        referenceMarks: 4.0,
        referenceCriteria: [
          { criterionId: "c1", criterionName: "Polar C-R Equations", maxMarks: 2.0, referenceMarks: 2.0, rationale: "Both polar equations correctly written with proper signs." },
          { criterionId: "c2", criterionName: "Continuity & Existence Conditions", maxMarks: 2.0, referenceMarks: 2.0, rationale: "All 4 first partial derivatives continuity condition explicitly stated." },
        ],
        explanation: "Flawless mathematical demonstration matching reference standard.",
      },
    ],
  },
];
