import { z } from "zod";

// Public endpoint input — bounds matter: data lands verbatim in a JSON
// column, so unbounded keys/values are a storage-DoS vector.
export const formSubmissionSchema = z.object({
  data: z
    .record(z.string().max(10_000))
    .refine((d) => Object.keys(d).length <= 100, { message: "Too many fields" })
    .refine((d) => Object.keys(d).every((k) => k.length <= 200), { message: "Field name too long" }),
  honeypot: z.string().optional(),
});

export const listSubmissionsSchema = z.object({
  siteId: z.string(),
  formBlockId: z.string().optional(),
  isRead: z.boolean().optional(),
  isSpam: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(50).default(20),
});

export const updateSubmissionSchema = z.object({
  id: z.string(),
  isRead: z.boolean().optional(),
  isSpam: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export type FormSubmissionInput = z.infer<typeof formSubmissionSchema>;
export type ListSubmissionsInput = z.infer<typeof listSubmissionsSchema>;
