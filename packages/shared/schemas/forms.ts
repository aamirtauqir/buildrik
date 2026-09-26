import { z } from "zod";
import { absoluteRedirectUrlSchema } from "./element-markup";

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

// Inspector AFTER SUBMIT + PROTECTION write path (board 4428:141878).
// `blockId` is the form element's own id — the same id `wireForms` (publish
// time) uses as the FormBlock row id, so an editor edit before the form's
// first publish still lands on the right row once it does.
export const getFormBlockSchema = z.object({
  siteId: z.string(),
  blockId: z.string(),
});

export const updateFormBlockSchema = z
  .object({
    siteId: z.string(),
    blockId: z.string(),
    successMessage: z.string().max(500).optional(),
    successAction: z.enum(["MESSAGE", "REDIRECT"]).optional(),
    redirectUrl: absoluteRedirectUrlSchema.optional(),
    notifyEmail: z.string().email().max(320).or(z.literal("")).optional(),
    spamProtection: z.boolean().optional(),
  })
  .refine(
    (v) => v.successAction !== "REDIRECT" || !!v.redirectUrl,
    { message: "Redirect URL is required when the after-submit action is Redirect", path: ["redirectUrl"] },
  );

export type FormSubmissionInput = z.infer<typeof formSubmissionSchema>;
export type ListSubmissionsInput = z.infer<typeof listSubmissionsSchema>;
export type GetFormBlockInput = z.infer<typeof getFormBlockSchema>;
export type UpdateFormBlockInput = z.infer<typeof updateFormBlockSchema>;
