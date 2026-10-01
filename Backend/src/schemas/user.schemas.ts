import { z } from "zod";

export const createExaminerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  department: z.string().trim().max(120).optional(),
  institution: z.string().trim().max(160).optional(),
});

export type CreateExaminerInput = z.infer<typeof createExaminerSchema>;
