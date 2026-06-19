import { z } from "zod";

/**
 * Invited-client review workflow (redesign E4). SSOT for the submit/resolve
 * payloads. A content editor submits a site for review; an admin resolves it
 * (approve = clear to publish, or ask for changes).
 */
export const REVIEW_STATUSES = ["PENDING", "APPROVED", "CHANGES_REQUESTED"] as const;
export const reviewStatusSchema = z.enum(REVIEW_STATUSES);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

export const submitReviewInput = z.object({
  siteId: z.string().min(1),
  note: z.string().max(500).optional(),
  // Lightweight human summary of what changed (e.g. "hero copy, 2 images"),
  // supplied by the editor when sending for review. Rendered as a mini-diff.
  changeSummary: z.string().max(500).optional(),
});
export type SubmitReviewInput = z.infer<typeof submitReviewInput>;

export const resolveReviewInput = z.object({
  id: z.string().min(1),
  status: z.enum(["APPROVED", "CHANGES_REQUESTED"]),
  note: z.string().max(500).optional(),
});
export type ResolveReviewInput = z.infer<typeof resolveReviewInput>;
