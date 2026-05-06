import { z } from "zod";

export const prePublishCheckSchema = z.object({
  siteId: z.string(),
});

/** Payload sent by editor when publishing — one entry per page. */
export const publishPageSchema = z.object({
  /** Path inside deployment, e.g. "index.html", "about/index.html". */
  path: z.string().min(1).max(500),
  /** Rendered HTML for this page. */
  html: z.string().min(1),
});

/** Editor → dashboard publish input. `pages` is optional so existing
 *  callers (without HTML render) still work — worker falls back to
 *  simulation when pages absent or Vercel unconfigured. */
export const publishInputSchema = z.object({
  siteId: z.string(),
  pages: z.array(publishPageSchema).optional(),
});

export type PublishPage = z.infer<typeof publishPageSchema>;
export type PublishInput = z.infer<typeof publishInputSchema>;

export const publishResultSchema = z.object({
  jobId: z.string(),
  status: z.string(),
  progress: z.number(),
  steps: z.array(z.object({ step: z.string(), status: z.string(), duration: z.number().optional() })),
  publicUrl: z.string().nullable(),
  error: z.string().nullable(),
  lighthouseScore: z.number().nullable(),
});

export const prePublishChecksResultSchema = z.object({
  ready: z.boolean(),
  checks: z.array(z.object({
    label: z.string(),
    status: z.enum(["pass", "warning", "fail"]),
    detail: z.string(),
  })),
});

export type PublishResult = z.infer<typeof publishResultSchema>;
export type PrePublishChecksResult = z.infer<typeof prePublishChecksResultSchema>;
