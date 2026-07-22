import { z } from "zod";
import { publishPageSchema, MAX_PUBLISH_PAGES } from "./publish";

/**
 * Invited-client review workflow (redesign E4). SSOT for the submit/resolve
 * payloads. A content editor submits a site for review; an admin resolves it
 * (approve = clear to publish, or ask for changes).
 */
export const REVIEW_STATUSES = ["PENDING", "APPROVED", "CHANGES_REQUESTED"] as const;
export const reviewStatusSchema = z.enum(REVIEW_STATUSES);

/**
 * The editor's review-status pill (S5.2). Richer than the raw ReviewRequest
 * status because two of these ("opened-not-acted", "approved-edited-since") are
 * derived — one from whether the client identified themselves on a PENDING
 * review, the other from whether the site was edited after approval. "she hasn't
 * opened it" and "she opened it and said nothing" are different conversations.
 */
export const REVIEW_PILL_STATES = [
  "none",
  "pending",
  "opened-not-acted",
  "changes-requested",
  "approved",
  "approved-edited-since",
] as const;
export type ReviewPillState = (typeof REVIEW_PILL_STATES)[number];

export const reviewStatusForSiteInput = z.object({ siteId: z.string().min(1) });
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

/** The editor Review panel's data source — the current (latest) round for a site. */
export const currentRoundInput = z.object({ siteId: z.string().min(1) });
export type CurrentRoundInput = z.infer<typeof currentRoundInput>;

/**
 * Revoke the current round from the editor. `expectedRevision` is the round's
 * `updatedAt` ISO string the editor last read — the revoke only lands if it
 * still matches, so a revoke can never kill a link a concurrent re-send just
 * minted (the re-send bumps updatedAt → revision mismatch → "token-changed").
 */
export const revokeReviewInput = z.object({
  siteId: z.string().min(1),
  reviewId: z.string().min(1),
  expectedRevision: z.string().min(1),
});
export type RevokeReviewInput = z.infer<typeof revokeReviewInput>;

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
