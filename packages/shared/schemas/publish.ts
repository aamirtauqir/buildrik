import { z } from "zod";

export const prePublishCheckSchema = z.object({
  siteId: z.string(),
});

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
