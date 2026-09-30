import { z } from "zod";

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
});

export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "Page must be greater than 0"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type UuidParam = z.infer<typeof uuidParamSchema>;
