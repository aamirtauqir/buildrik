/**
 * Editor → dashboard "Send for review" (redesign E4). A content editor (the
 * ?view=readonly experience) submits the current site for an admin to approve,
 * instead of publishing. Calls the dashboard `reviews.submit` tRPC endpoint.
 *
 * @license BSD-3-Clause
 */
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import type { PublishPage } from "../editor/shell/exportPublishPages";
import type { ReviewPillState } from "@buildrik/shared/schemas/reviews";

/** The site being edited, read from the unified-editor URL (/edit/<siteId>) or
 *  the legacy ?siteId param. */
export function currentSiteId(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname.match(/\/edit\/([^/?#]+)/);
  if (path) return decodeURIComponent(path[1]);
  return new URLSearchParams(window.location.search).get("siteId");
}

export interface ReviewStatus {
  state: ReviewPillState;
  reviewerName: string | null;
  at: string | Date | null;
}

/**
 * The current review status for the pill (S5.2). Returns `none` when there is no
 * site, the agency layer is off, or the site was never sent for review — the
 * editor then shows no pill. Never throws; a failed fetch is treated as `none`.
 */
export async function fetchReviewStatus(): Promise<ReviewStatus> {
  const siteId = currentSiteId();
  if (!siteId) return { state: "none", reviewerName: null, at: null };
  try {
    return await getBuildrikClient(DASHBOARD_URL).reviews.status.query({ siteId });
  } catch {
    return { state: "none", reviewerName: null, at: null };
  }
}

/**
 * Refetch variant that tells the truth about transport failure (F3, 6A).
 * `null` = "couldn't reach the dashboard — keep what you had"; a real
 * `state: "none"` still means "no review". The mount path keeps the
 * fail-closed `fetchReviewStatus` above; only periodic refreshes use this,
 * so a flaky request can never erase an "Approved by X" pill mid-session.
 */
export async function fetchReviewStatusOrNull(): Promise<ReviewStatus | null> {
  const siteId = currentSiteId();
  if (!siteId) return { state: "none", reviewerName: null, at: null };
  try {
    return await getBuildrikClient(DASHBOARD_URL).reviews.status.query({ siteId });
  } catch {
    return null;
  }
}

/**
 * Submit the current site for review.
 *
 * `clientEmail` is what turns this from an internal request into a client
 * sign-off. `submitReview` always mints (or, on re-send, replaces) a review
 * token; supplying `clientEmail` additionally records the invited address and
 * emails the client the `/review/<token>` link. Omitted, a token is still
 * created but no invite is sent and the review page rejects unidentified
 * visitors — effectively internal, though a tokenised record exists.
 *
 * `snapshotPages` is the site rendered to HTML at send time (same ExportEngine
 * payload publish uses). Stored frozen so the client reviews the version they
 * were sent, never the live draft (frozen-snapshot contract §1.6).
 */
/** What the submit tells the caller about the INVITE, separately from whether
 *  the round was created. `null` = no invite was attempted (an internal submit
 *  with no client). `false` = it was attempted and the mail did not go, which
 *  used to be swallowed into a server-side `console.error` — the round existed,
 *  the token existed, and the editor said "Sent". */
export interface SubmitOutcome {
  inviteEmailSent: boolean | null;
  /** The round's client link, fully formed. Present so a failed send still
   *  leaves the designer something to hand over by hand. Built here because
   *  this module owns `DASHBOARD_URL`; the UI should not assemble origins. */
  reviewUrl: string | null;
}

export async function submitForReview(
  note?: string,
  changeSummary?: string,
  clientEmail?: string,
  snapshotPages?: PublishPage[],
): Promise<SubmitOutcome> {
  const siteId = currentSiteId();
  if (!siteId) throw new Error("No site to send for review");
  const r = (await getBuildrikClient(DASHBOARD_URL).reviews.submit.mutate({
    siteId,
    note,
    changeSummary,
    clientEmail,
    snapshotPages,
  })) as { inviteEmailSent?: boolean | null; token?: string | null };
  return {
    inviteEmailSent: r?.inviteEmailSent ?? null,
    reviewUrl: r?.token ? `${DASHBOARD_URL}/review/${r.token}` : null,
  };
}

/* ── P0 review panel — data + actions ─────────────────────────────────────── */

/** One comment in the editor Review thread list. `authorKind` is derived: a
 *  comment with a reviewerId is the CLIENT's, otherwise it's an INTERNAL reply. */
export interface ReviewComment {
  id: string;
  body: string;
  pageId: string | null;
  x: number | null;
  y: number | null;
  /** Element anchor (engine element id selector). null = unpinned/general. */
  targetSelector: string | null;
  status: "OPEN" | "RESOLVED";
  authorKind: "client" | "internal";
  authorName: string | null;
  createdAt: string | Date;
}

/** The current review round for the panel header (status, invited email, round
 *  count, open-comment count, revision for a race-safe revoke). */
export interface CurrentRound {
  id: string;
  status: string;
  invitedEmail: string | null;
  reviewerName: string | null;
  revoked: boolean;
  resolvedAt: string | Date | null;
  createdAt: string | Date;
  revision: string;
  roundNumber: number;
  totalRounds: number;
  openCommentCount: number;
}

/**
 * The comments on the current site for the Review panel thread list.
 *
 * Throws on a fetch error — deliberately NOT fail-closed. The panel must tell
 * "no feedback yet" (empty, success) apart from "couldn't load" (error+retry);
 * rendering a failed fetch as the empty state is the fake-empty anti-pattern
 * (design review DF5). Returns [] only when there is genuinely no site.
 */
export async function fetchReviewComments(status?: "OPEN" | "RESOLVED"): Promise<ReviewComment[]> {
  const siteId = currentSiteId();
  if (!siteId) return [];
  const rows = await getBuildrikClient(DASHBOARD_URL).comments.list.query({ siteId, status });
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    pageId: r.pageId,
    x: r.x,
    y: r.y,
    targetSelector: r.targetSelector,
    status: r.status as "OPEN" | "RESOLVED",
    authorKind: r.reviewerId ? "client" : "internal",
    authorName: r.reviewer?.name ?? null,
    createdAt: r.createdAt,
  }));
}

/**
 * The current round for the panel header. Returns null for a never-sent site
 * (the server returns null) — but THROWS on a fetch error, so the panel can
 * tell "never sent" apart from "couldn't load" (DF5). Returns null only when
 * there is genuinely no site.
 */
export async function fetchCurrentRound(): Promise<CurrentRound | null> {
  const siteId = currentSiteId();
  if (!siteId) return null;
  return getBuildrikClient(DASHBOARD_URL).reviews.currentRound.query({ siteId });
}

/**
 * The pages frozen at the last approval — the "approved side" of the §3
 * Compare. Throws on transport failure (DF5: a dropped read must surface as a
 * retryable error, never a fake-empty diff). A real `null` means the round has
 * no stored snapshot — a state the Compare view renders explicitly.
 */
export async function fetchApprovedSnapshot(): Promise<PublishPage[] | null> {
  const siteId = currentSiteId();
  if (!siteId) return null;
  return getBuildrikClient(DASHBOARD_URL).reviews.approvedSnapshot.query({ siteId });
}

/**
 * Revoke the current round. Passes the revision the panel last read so a revoke
 * can't kill a link a concurrent re-send just minted. Never throws — a failure
 * comes back as `{ revoked: false, reason: "error" }` for the panel to show.
 */
export async function revokeReview(
  reviewId: string,
  expectedRevision: string,
): Promise<{ revoked: boolean; reason?: string }> {
  const siteId = currentSiteId();
  if (!siteId) return { revoked: false, reason: "error" };
  try {
    return await getBuildrikClient(DASHBOARD_URL).reviews.revoke.mutate({
      siteId,
      reviewId,
      expectedRevision,
    });
  } catch {
    return { revoked: false, reason: "error" };
  }
}

/**
 * Post an internal reply to the thread. Throws on failure so the composer can
 * show a retry — unlike the reads, a dropped write must not look like success.
 * Internal replies are NOT review-gated: comments outlive review rounds
 * (contracts §6.4), so the designer can always answer feedback before re-sending.
 */
export async function postReply(body: string, pageId?: string): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) throw new Error("No site to reply on");
  await getBuildrikClient(DASHBOARD_URL).comments.create.mutate({ siteId, body, pageId });
}

/** Create a pinned comment from canvas comment mode (S5 shell state 6).
 *  x/y are page-relative fractions (0..1); targetSelector anchors the pin to
 *  an engine element so it survives layout shifts. Throws for a retry toast. */
export async function createPinnedComment(input: {
  body: string;
  pageId: string | null;
  x: number | null;
  y: number | null;
  targetSelector: string | null;
}): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) throw new Error("No site to comment on");
  await getBuildrikClient(DASHBOARD_URL).comments.create.mutate({ siteId, ...input });
}

/** Re-anchor an orphaned pin to a new element (orphan-comment recovery). */
export async function reattachReviewComment(
  id: string,
  input: { targetSelector: string; pageId?: string | null; x?: number | null; y?: number | null },
): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) throw new Error("No site to reattach on");
  await getBuildrikClient(DASHBOARD_URL).comments.reattach.mutate({ id, siteId, ...input });
}

/** Resolve / reopen a comment. Throws on failure for a retry. */
export async function resolveReviewComment(id: string, status: "OPEN" | "RESOLVED"): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) throw new Error("No site to resolve on");
  await getBuildrikClient(DASHBOARD_URL).comments.resolve.mutate({ id, siteId, status });
}
