import { z } from "zod";

export const formSubmissionSchema = z.object({
  data: z.record(z.string()),
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
