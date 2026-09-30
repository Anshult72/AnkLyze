import { z } from "zod";

export const loginBodySchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Please provide a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginBodySchema>;
