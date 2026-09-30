/**
 * ANKLYZE Phase 10 - AI-Assisted Evaluation Prompt
 * "Analyse the marks, not just the paper."
 * 
 * Version-controlled evaluation prompt template.
 * Strictly rubric-grounded, evidence-driven, no fabricated data.
 */

export const EVALUATION_PROMPT_VERSION = 'evaluation-v1';

export interface EvaluationPromptInput {
  questionAttemptId?: string;
  examTitle?: string;
  subjectName?: string;
  subjectCode?: string;
  questionNumber: string;
  questionLabel?: string;
  questionText: string;
  maximumMarks?: number;
  maxMarks?: number;
  criteria?: Array<{
    id: string;
    name: string;
    description?: string;
    maxMarks?: number;
    maximumMarks?: number;
    partialCreditAllowed?: boolean;
    alternateMethodAccepted?: boolean;
  }>;
  rubricCriteria?: Array<{
    id: string;
    name: string;
    description?: string;
    maxMarks?: number;
    maximumMarks?: number;
    partialCreditAllowed?: boolean;
    alternateMethodAccepted?: boolean;
  }>;
  answerText?: string;
  reconstructedAnswerText?: string;
  pageReferences?: Array<{
    pageId: string;
    pageNumber: number;
    regionIds?: string[];
  }>;
  answerRegions?: Array<{
    id: string;
    pageId?: string;
    pageNumber?: number;
    extractedText?: string;
  }>;
  attemptState?: string;
  startPageNumber?: number;
  endPageNumber?: number;
  specialInstructions?: string[];
}

export function buildEvaluationSystemPrompt(): string {
  return `You are ANKLYZE's Answer Evaluation Engine.
"Analyse the marks, not just the paper."

You evaluate a student's handwritten answer against an APPROVED marking rubric.

CRITICAL RULES:
1. RUBRIC-ONLY: Evaluate ONLY against the provided marking criteria. Do NOT invent additional criteria.
2. EVIDENCE-REQUIRED: Every criterion assessment MUST reference observable evidence from the student's answer. Do NOT fabricate evidence or quote text not present in the answer.
3. MARKS LIMITS: suggestedMarks for each criterion MUST be between 0 and its maxMarks (inclusive). Total suggestedMarks MUST NOT exceed the question's maximum marks.
4. PARTIAL CREDIT: When partialCreditAllowed is true, award proportionate marks for partially correct work. When false, award either 0 or maxMarks.
5. ALTERNATE METHODS: When alternateMethodAccepted is true and the student uses a valid alternative approach, evaluate the work fairly. When false, mark only the expected method.
6. DO NOT GUESS: If the answer is blank, unreadable, or cancelled, report it. Do NOT invent content.
7. PAGE/REGION REFERENCES: Use ONLY the provided pageId and regionId values. Do NOT invent page or region IDs.
8. CONFIDENCE: Set confidence honestly based on how clearly you can assess the answer. Lower confidence for unclear handwriting, ambiguous content, or borderline cases.
9. CONCISE OUTPUT: Return structured JSON only. No prose, no chain-of-thought, no markdown decoration.

CONFIDENCE BANDS:
- 0.85-1.0 = HIGH: Strong agreement between rubric, evidence, and answer
- 0.65-0.84 = MEDIUM: Some uncertainty
- 0.0-0.64 = LOW: Meaningful ambiguity, requires human review

OUTPUT SCHEMA (return ONLY this JSON):
{
  "overallAssessment": {
    "summary": "1-2 sentence assessment",
    "suggestedMarks": <number>,
    "maxMarks": <number>,
    "confidenceScore": <0.0-1.0>,
    "confidenceBand": "HIGH" | "MEDIUM" | "LOW",
    "alternateMethodDetected": false
  },
  "criteria": [
    {
      "criterionId": "<exact ID from input>",
      "status": "SATISFIED" | "PARTIALLY_SATISFIED" | "NOT_SATISFIED" | "NOT_ASSESSABLE" | "REQUIRES_REVIEW",
      "suggestedMarks": <number>,
      "maxMarks": <number>,
      "confidenceScore": <0.0-1.0>,
      "reasoning": "Why this mark was given",
      "evidence": [
        {
          "pageId": "<exact pageId from input>",
          "pageNumber": <page number>,
          "answerRegionId": "<exact regionId from input or null>",
          "extractedText": "Quoted relevant text from answer",
          "reason": "How this evidence relates to the criterion"
        }
      ]
    }
  ],
  "issues": [],
  "requiresReview": false
}`;
}

export function buildEvaluationUserPrompt(input: EvaluationPromptInput): string {
  const criteriaList = input.rubricCriteria || input.criteria || [];
  const maxMarksVal = input.maxMarks ?? input.maximumMarks ?? 0;
  const answerContent = input.reconstructedAnswerText || input.answerText || 'No OCR text available';

  const criteriaFormatted = criteriaList.map((c, idx) => 
    `  ${idx + 1}. Criterion ID: ${c.id}
     Name: ${c.name}
     Description: ${c.description || 'Standard assessment'}
     Max Marks: ${c.maxMarks ?? c.maximumMarks ?? 0}
     Partial Credit: ${c.partialCreditAllowed !== false ? 'Allowed' : 'Not allowed'}
     Alternate Method: ${c.alternateMethodAccepted ? 'Accepted' : 'Not accepted'}`
  ).join('\n');

  let regionsFormatted = '';
  if (input.answerRegions && input.answerRegions.length > 0) {
    regionsFormatted = input.answerRegions.map(r =>
      `  Region ID: ${r.id}, Page: ${r.pageNumber || 'unknown'}, Text: "${r.extractedText || ''}"`
    ).join('\n');
  } else if (input.pageReferences && input.pageReferences.length > 0) {
    regionsFormatted = input.pageReferences.map(p =>
      `  Page ${p.pageNumber} (ID: ${p.pageId}), Regions: [${p.regionIds?.join(', ') || 'none'}]`
    ).join('\n');
  } else {
    regionsFormatted = '  Pages: ' + (input.startPageNumber || 1) + ' to ' + (input.endPageNumber || 1);
  }

  const specialInstr = input.specialInstructions?.length
    ? `\nSpecial Instructions:\n${input.specialInstructions.map(s => `  - ${s}`).join('\n')}`
    : '';

  return `QUESTION ATTEMPT ID: ${input.questionAttemptId || 'N/A'}
QUESTION: ${input.questionLabel || input.questionNumber} (Number: ${input.questionNumber})
MAXIMUM MARKS: ${maxMarksVal}
QUESTION TEXT:
"${input.questionText}"

APPROVED RUBRIC CRITERIA:
${criteriaFormatted || '  No explicit criteria provided. Evaluate overall correctness.'}
${specialInstr}

STUDENT ANSWER CONTENT (OCR & Reconstructed):
${answerContent}

AVAILABLE ANSWER REGIONS & PAGES:
${regionsFormatted}

Evaluate this student answer strictly against the rubric criteria above. Return ONLY the structured JSON.`;
}
