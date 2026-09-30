import { z } from "zod";
import { ExamStatus } from "@prisma/client";

// ==============================================================================
// Exam Validation Schemas
// ==============================================================================

export const createExamBodySchema = z.object({
  title: z.string({ required_error: "Exam title is required" }).trim().min(3, "Title must be at least 3 characters"),
  code: z.string({ required_error: "Exam code is required" }).trim().min(2, "Exam code must be at least 2 characters").toUpperCase(),
  academicTerm: z.string().trim().default("Academic Session 2025-26"),
  academicYear: z.string().trim().optional(),
  semester: z.string().trim().optional(),
  description: z.string().trim().optional(),
  institution: z.string().trim().default("MP State Board of Technical Examinations"),
  status: z.nativeEnum(ExamStatus).default(ExamStatus.DRAFT),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  totalMarks: z.number().int().positive("Total marks must be a positive integer").default(100),
  partialMarking: z.boolean().default(true),
  negativeMarking: z.boolean().default(false),
  anonymityEnabled: z.boolean().default(true),
});

export const updateExamBodySchema = createExamBodySchema.partial();

// ==============================================================================
// Subject Validation Schemas
// ==============================================================================

export const createSubjectBodySchema = z.object({
  name: z.string({ required_error: "Subject name is required" }).trim().min(2, "Subject name must be at least 2 characters"),
  code: z.string({ required_error: "Subject code is required" }).trim().min(2, "Subject code must be at least 2 characters").toUpperCase(),
  description: z.string().trim().optional(),
  maxMarks: z.number().int().positive("Maximum marks must be a positive integer").default(100),
});

export const updateSubjectBodySchema = createSubjectBodySchema.partial();

// ==============================================================================
// Question Validation Schemas
// ==============================================================================

export const createQuestionBodySchema = z.object({
  questionNumber: z.string({ required_error: "Question number is required" }).trim().min(1, "Question number is required"),
  questionText: z.string({ required_error: "Question text is required" }).trim().min(3, "Question text must be at least 3 characters"),
  maximumMarks: z.number().positive("Maximum marks must be greater than 0"),
  orderIndex: z.number().int().min(1).default(1),
  section: z.string().trim().optional(),
});

export const updateQuestionBodySchema = createQuestionBodySchema.partial();

export const reorderQuestionsBodySchema = z.object({
  questionOrders: z.array(
    z.object({
      id: z.string().uuid("Invalid question ID format"),
      orderIndex: z.number().int().min(1),
    })
  ).min(1, "At least one question order must be provided"),
});

// ==============================================================================
// Marking Scheme Validation Schemas
// ==============================================================================

export const createMarkingSchemeBodySchema = z.object({
  title: z.string({ required_error: "Title is required" }).trim().min(2, "Title must be at least 2 characters"),
  instructions: z.string().trim().optional(),
  status: z.enum(["DRAFT", "APPROVED", "SUPERSEDED"]).default("DRAFT"),
  version: z.number().int().min(1).default(1),
});

export const updateMarkingSchemeBodySchema = createMarkingSchemeBodySchema.partial();

// ==============================================================================
// Marking Criterion Validation Schemas
// ==============================================================================

export const createCriterionBodySchema = z.object({
  name: z.string({ required_error: "Criterion name is required" }).trim().min(2, "Criterion name must be at least 2 characters"),
  description: z.string().trim().optional(),
  maximumMarks: z.number().positive("Maximum marks must be greater than 0"),
  orderIndex: z.number().int().min(1).default(1),
  partialCreditAllowed: z.boolean().default(true),
  alternateMethodAccepted: z.boolean().default(false),
});

export const updateCriterionBodySchema = createCriterionBodySchema.partial();

// ==============================================================================
// Examiner Assignment Validation Schemas
// ==============================================================================

export const assignExaminerBodySchema = z.object({
  examinerId: z.string().uuid("Valid examiner user ID is required"),
  examId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "REVOKED", "COMPLETED"]).default("ACTIVE"),
});
