import { z } from "zod";

export const createCalibrationSetSchema = z.object({
  code: z.string().min(3, "Code is required"),
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  examId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  items: z.array(
    z.object({
      questionId: z.string().uuid().optional(),
      sampleQuestionText: z.string().min(3, "Question text is required"),
      sampleAnswerText: z.string().min(3, "Answer text is required"),
      maxMarks: z.number().positive("Maximum marks must be positive"),
      referenceMarks: z.number().min(0, "Reference marks must be non-negative"),
      referenceCriteria: z.array(
        z.object({
          criterionId: z.string(),
          criterionName: z.string(),
          maxMarks: z.number().positive(),
          referenceMarks: z.number().min(0),
          rationale: z.string(),
        })
      ),
      referenceEvidence: z.string().optional(),
      explanation: z.string().min(3, "Explanation is required"),
      orderIndex: z.number().int().optional(),
    })
  ).min(1, "At least one calibration item is required"),
});

export const startCalibrationSessionSchema = z.object({
  calibrationSetId: z.string().uuid("Invalid calibration set ID"),
});

export const submitCalibrationItemSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
  awardedMarks: z.number().min(0, "Awarded marks must be non-negative"),
  criteriaScores: z.record(z.number().min(0)),
});
