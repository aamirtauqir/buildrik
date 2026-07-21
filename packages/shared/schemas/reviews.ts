import { z } from "zod";
import { publishPageSchema, MAX_PUBLISH_PAGES } from "./publish";

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
  /** Where to send the review link. Omitted = submit to the internal admin
   *  queue only, without inviting a client. */
  clientEmail: z.string().trim().toLowerCase().email().max(320).optional(),
  /** The site's rendered pages ({ path, html }) frozen at send — the same
   *  ExportEngine payload publish uses. The client review page renders these,
   *  never the live draft (frozen-snapshot contract §1.6). Omitted on an
   *  internal submit with no editor render. */
  snapshotPages: z.array(publishPageSchema).max(MAX_PUBLISH_PAGES).optional(),
});
export type SubmitReviewInput = z.infer<typeof submitReviewInput>;

export const resolveReviewInput = z.object({
  id: z.string().min(1),
  status: z.enum(["APPROVED", "CHANGES_REQUESTED"]),
  note: z.string().max(500).optional(),
});
export type ResolveReviewInput = z.infer<typeof resolveReviewInput>;

/* ------------------------------------------------------------------ *
 * Client sign-off — the token-authenticated half.
 *
 * Every payload below arrives from an UNAUTHENTICATED caller, so these
 * schemas are the first line of defence, not a convenience. The token is
 * the only credential; nothing here may carry a siteId or reviewId, or a
 * token holder could name a different site.
 * ------------------------------------------------------------------ */

/** 32 random bytes, base64url — 43 chars. Bounded so a pathological URL
 *  never reaches the database as a query. */
export const reviewTokenSchema = z.string().min(20).max(200);

export const reviewTokenInput = z.object({ token: reviewTokenSchema });
export type ReviewTokenInput = z.infer<typeof reviewTokenInput>;

/** Name + email captured on first visit. A signature, not a login —
 *  there is deliberately no password field here and never will be. */
export const identifyReviewerInput = z.object({
  token: reviewTokenSchema,
  name: z.string().trim().min(1, "Tell us your name").max(120),
  email: z.string().trim().toLowerCase().email().max(320),
});
export type IdentifyReviewerInput = z.infer<typeof identifyReviewerInput>;

export const clientCommentInput = z.object({
  token: reviewTokenSchema,
  body: z.string().trim().min(1).max(2000),
  pageId: z.string().max(64).optional(),
  /** Pin position as a fraction of the page, not pixels — the client's
   *  viewport is not the designer's. */
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
  targetSelector: z.string().max(500).optional(),
});
export type ClientCommentInput = z.infer<typeof clientCommentInput>;

export const clientResolveInput = z.object({
  token: reviewTokenSchema,
  status: z.enum(["APPROVED", "CHANGES_REQUESTED"]),
});
export type ClientResolveInput = z.infer<typeof clientResolveInput>;
