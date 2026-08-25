import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReviewStatus, ReviewPillState } from "@buildrik/shared/schemas/reviews";
import type { Paginated, PaginationInput } from "@buildrik/shared/schemas/pagination";
import {
  sendReviewRequestedEmail,
  sendReviewResolvedEmail,
  sendReviewInviteEmail,
} from "@/server/services/email.service";
import { issueReviewToken } from "@/server/services/client-review.service";
import { isApprovalStale } from "@/server/services/publish-approval";
import { logAuditEvent } from "@/server/services/audit.service";

/**
 * Invited-client review workflow (E4) — the ONLY layer that reads/writes the
 * review_requests table. Every list/resolve is scoped by workspace (via the
 * site's workspaceId) so a review in one workspace can't be read or resolved
 * through another. The router supplies workspaceId from the session, never input.
 */

export class ReviewError extends Error {
  constructor(
    public code: "NOT_FOUND" | "BAD_REQUEST",
    message: string,
  ) {
    super(message);
    this.name = "ReviewError";
  }
}

/**
 * Submit a site for review. Idempotent on the open request: if one is already
 * PENDING, its note is refreshed and it's returned (no duplicate). Otherwise a
 * new PENDING request is created.
 */
export async function submitReview(
  siteId: string,
  requestedById: string,
  note?: string,
  changeSummary?: string,
  /** Where to send the link. Omit to submit without inviting anyone —
   *  the internal admin queue still works exactly as before. */
  clientEmail?: string,
  /** The site's rendered pages ({ path, html }) frozen at send. Stored on the
   *  request so the client review page shows the version they were sent, not the
   *  live draft (contracts §1.6). Every submit re-renders and overwrites it. */
  snapshotPages?: { path: string; html: string }[],
) {
  // Only overwrite the snapshot when the caller rendered one — an internal
  // submit with no editor render leaves any existing snapshot untouched.
  const snapshot = snapshotPages ? { snapshotPages: snapshotPages as Prisma.InputJsonValue } : {};
  const updateData = { note: note ?? null, changeSummary: changeSummary ?? null, requestedById, ...snapshot };
  const openId = async () =>
    (await prisma.reviewRequest.findFirst({ where: { siteId, status: "PENDING" }, select: { id: true } }))?.id;

  let request;
  let openedNewRound = false;
  const existing = await openId();
  if (existing) {
    request = await prisma.reviewRequest.update({ where: { id: existing }, data: updateData });
  } else {
    openedNewRound = true;
    try {
      request = await prisma.reviewRequest.create({
        data: { siteId, requestedById, note: note ?? null, changeSummary: changeSummary ?? null, status: "PENDING", ...snapshot },
      });
    } catch (err) {
      // Lost a concurrent submit: the partial unique index
      // review_requests_pending_unique rejected the second PENDING row. Re-read
      // the winner and update it instead of erroring, so both callers converge
      // on one review.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const winner = await openId();
        if (!winner) throw err;
        request = await prisma.reviewRequest.update({ where: { id: winner }, data: updateData });
        // We lost the race, so no new round was opened here — the winner's
        // round is the one that exists. Don't supersede anyone's link on a
        // path that only updated a row.
        openedNewRound = false;
      } else {
        throw err;
      }
    }
  }

  // Only rotate the client token when we're actually inviting a client (a
  // clientEmail is present). A rotation mints a fresh token AND kills the
  // previous one — correct on a real re-send (a bookmarked link shouldn't keep
  // approving a moved-on site), but destructive for an INTERNAL submit: the
  // dashboard "Send for review" carries no email, so rotating there silently
  // killed the client's live link and the new token went nowhere.
  let token: string | null | undefined;
  if (clientEmail) {
    ({ token } = await issueReviewToken(request.id, clientEmail));
  }

  // A new ROUND supersedes every earlier link for this site. The schema says so
  // — `token`'s sibling `revokedAt` is documented as "Set when a re-send
  // supersedes this link" — but nothing implemented it across rows.
  // `issueReviewToken` clears `revokedAt` on the row it updates, and a new round
  // is a new row, so round 1's token stayed live forever: measured 2026-08-25,
  // round 1's link still opened its "You approved this" terminal after round 2
  // existed. A bookmarked link from a superseded round must not keep answering.
  if (openedNewRound) {
    await prisma.reviewRequest.updateMany({
      where: { siteId, id: { not: request.id }, token: { not: null }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  const adminsNotified = await notifyReviewSubmitted(siteId, requestedById, note, changeSummary);
  let inviteEmailSent: boolean | null = null;
  if (clientEmail && token) {
    inviteEmailSent = await notifyClientInvited(
      siteId, requestedById, clientEmail, token, note, changeSummary,
    );
  }
  await pruneSupersededSnapshots(siteId);
  /* `inviteEmailSent` is null when no invite was attempted (an internal submit
     with no client), false when it was attempted and failed. `token` rides
     along so a failed send still leaves the designer something to hand over by
     hand — the link is the whole point of the round. */
  return { ...request, inviteEmailSent, adminsNotified, token: token ?? null };
}

/**
 * snapshotPages is full-HTML-per-page — an unbounded row per round would pile up
 * across a site's review history. Retention (G7 perf guard): keep the snapshot
 * on the latest round and on every APPROVED round (the §3 Compare reads the
 * latest approved snapshot, and history should stay auditable), and null it on
 * every superseded, non-approved round. Idempotent — re-nulling an already-null
 * row is a harmless no-op.
 */
async function pruneSupersededSnapshots(siteId: string): Promise<void> {
  const latest = await prisma.reviewRequest.findFirst({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!latest) return;
  await prisma.reviewRequest.updateMany({
    where: { siteId, status: { not: "APPROVED" }, id: { not: latest.id } },
    data: { snapshotPages: Prisma.DbNull },
  });
}

export interface ReviewRow {
  id: string;
  siteId: string;
  siteName: string;
  requestedById: string;
  status: string;
  note: string | null;
  changeSummary: string | null;
  resolvedById: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  /** `updatedAt` as ISO — the revision `revokeReviewRound` compares against, so
      a withdraw from the queue loses a race rather than clobbering a re-send. */
  revision: string;
}

export interface ReviewPillStatus {
  state: ReviewPillState;
  /** The client's name, once they've identified themselves. */
  reviewerName: string | null;
  /** When the review was sent (createdAt) or resolved, depending on state. */
  at: Date | null;
}

/**
 * The editor's review-status pill (S5.2) for one site. Derives the two states
 * the raw ReviewRequest.status can't express:
 *   - `opened-not-acted`: PENDING and the client has identified (reviewerId set)
 *     but not yet approved or asked for changes.
 *   - `approved-edited-since`: APPROVED but the site was edited after (isApprovalStale) —
 *     the approval no longer covers what's on the canvas.
 * Returns `none` when the site has never been sent for review.
 */
export async function getReviewStatusForSite(siteId: string): Promise<ReviewPillStatus> {
  /* Same `revokedAt: null` rule as the publish gate: a revoked round is not the
     site's current review, and showing it as one told the user they were
     waiting on a reply that could never come. */
  const r = await prisma.reviewRequest.findFirst({
    where: { siteId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
      resolvedAt: true,
      reviewerId: true,
      createdAt: true,
      reviewer: { select: { name: true } },
    },
  });
  if (!r) return { state: "none", reviewerName: null, at: null };
  const reviewerName = r.reviewer?.name ?? null;
  if (r.status === "CHANGES_REQUESTED") {
    return { state: "changes-requested", reviewerName, at: r.resolvedAt };
  }
  if (r.status === "APPROVED") {
    const site = await prisma.site.findUnique({ where: { id: siteId }, select: { lastEditedAt: true } });
    const stale = isApprovalStale({
      editsRequireApproval: true,
      role: "EDITOR",
      latestReviewStatus: "APPROVED",
      latestReviewResolvedAt: r.resolvedAt,
      siteLastEditedAt: site?.lastEditedAt ?? null,
    });
    return { state: stale ? "approved-edited-since" : "approved", reviewerName, at: r.resolvedAt };
  }
  // PENDING: opened (identified) vs sent-but-untouched.
  return { state: r.reviewerId ? "opened-not-acted" : "pending", reviewerName, at: r.createdAt };
}

export interface CurrentRound {
  id: string;
  status: string;
  invitedEmail: string | null;
  reviewerName: string | null;
  revoked: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
  /** The round's `updatedAt` as an ISO string — the optimistic-concurrency
   *  token the editor passes back to revokeReviewRound. */
  revision: string;
  roundNumber: number;
  totalRounds: number;
  openCommentCount: number;
}

/**
 * The current (latest) review round for a site — the editor Review panel's
 * data source. Null when the site was never sent for review. Round count is
 * the number of ReviewRequest rows for the site (a re-send reuses the open
 * PENDING row; a new submit after a resolved round adds one), so the current
 * round is always the latest, i.e. roundNumber === totalRounds.
 */
export async function getCurrentRound(siteId: string): Promise<CurrentRound | null> {
  const r = await prisma.reviewRequest.findFirst({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      invitedEmail: true,
      reviewer: { select: { name: true } },
      revokedAt: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!r) return null;
  const [totalRounds, openCommentCount] = await Promise.all([
    prisma.reviewRequest.count({ where: { siteId } }),
    prisma.comment.count({ where: { siteId, status: "OPEN" } }),
  ]);
  return {
    id: r.id,
    status: r.status,
    invitedEmail: r.invitedEmail,
    reviewerName: r.reviewer?.name ?? null,
    revoked: r.revokedAt !== null,
    resolvedAt: r.resolvedAt,
    createdAt: r.createdAt,
    revision: r.updatedAt.toISOString(),
    roundNumber: totalRounds,
    totalRounds,
    openCommentCount,
  };
}

/**
 * The pages frozen at the latest APPROVED round — the "approved side" of the
 * §3 Compare. Null when the site has no approved round, or when an older
 * approval predates snapshot capture (the editor renders that as an explicit
 * "no approved snapshot" state, not an error). Lazy by design: snapshotPages is
 * full-HTML-per-page, so it's fetched only when Compare opens, never in the
 * currentRound/list payloads.
 */
export async function getApprovedSnapshot(
  siteId: string,
): Promise<{ path: string; html: string }[] | null> {
  const r = await prisma.reviewRequest.findFirst({
    where: { siteId, status: "APPROVED", revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { snapshotPages: true },
  });
  const pages = r?.snapshotPages;
  if (!pages || !Array.isArray(pages)) return null;
  return pages as { path: string; html: string }[];
}

/**
 * Revoke the current round, race-safe. The updateMany is guarded on the
 * revision (`updatedAt`) the editor last saw AND on `revokedAt: null`, so it
 * matches exactly one row only when nothing has changed since. On zero matches
 * we disambiguate (workspace-scoped, so a cross-workspace id reads as
 * not-found — IDOR-safe):
 *   - row absent / wrong workspace → "not-found"
 *   - row already revoked          → "already-revoked" (idempotent)
 *   - row live but revision moved   → "token-changed" (a re-send happened)
 */
export async function revokeReviewRound(
  workspaceId: string,
  reviewId: string,
  expectedRevision: string,
): Promise<{ revoked: boolean; reason?: "token-changed" | "already-revoked" | "not-found" }> {
  const { count } = await prisma.reviewRequest.updateMany({
    where: {
      id: reviewId,
      site: { workspaceId },
      revokedAt: null,
      updatedAt: new Date(expectedRevision),
    },
    data: { revokedAt: new Date() },
  });
  if (count === 1) return { revoked: true };
  const row = await prisma.reviewRequest.findFirst({
    where: { id: reviewId, site: { workspaceId } },
    select: { revokedAt: true },
  });
  if (!row) return { revoked: false, reason: "not-found" };
  if (row.revokedAt) return { revoked: false, reason: "already-revoked" };
  return { revoked: false, reason: "token-changed" };
}

/** All review requests across a workspace's sites, newest first. */
const REVIEW_PAGE_SIZE = 50;

export async function listReviews(
  workspaceId: string,
  status?: ReviewStatus,
  page?: PaginationInput,
): Promise<Paginated<ReviewRow>> {
  const take = Math.min(Math.max(page?.limit ?? REVIEW_PAGE_SIZE, 1), 100);
  const rows = await prisma.reviewRequest.findMany({
    where: { site: { workspaceId }, ...(status ? { status } : {}) },
    // Tie-break on id so the cursor is stable when two rows share a createdAt.
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1, // one extra row tells us whether a next page exists
    ...(page?.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      siteId: true,
      requestedById: true,
      status: true,
      note: true,
      changeSummary: true,
      resolvedById: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true,
      site: { select: { name: true } },
    },
  });
  const hasMore = rows.length > take;
  const slice = hasMore ? rows.slice(0, take) : rows;
  return {
    items: slice.map(({ site, updatedAt, ...r }) => ({
      ...r,
      siteName: site.name,
      revision: updatedAt.toISOString(),
    })),
    nextCursor: hasMore ? slice[slice.length - 1].id : null,
  };
}

/** Approve / request-changes on a review. Workspace-scoped; only a PENDING one. */
export async function resolveReview(
  workspaceId: string,
  id: string,
  status: "APPROVED" | "CHANGES_REQUESTED",
  resolverId: string,
) {
  const review = await prisma.reviewRequest.findFirst({
    where: { id, site: { workspaceId } },
    select: { id: true, status: true, requestedById: true },
  });
  if (!review) throw new ReviewError("NOT_FOUND", "Review not found");
  if (review.status !== "PENDING") {
    throw new ReviewError("BAD_REQUEST", "Review is already resolved");
  }
  // You can't approve your own submission — the whole point of the gate is a
  // second pair of eyes. Applies to every role, including an ADMIN who both
  // submitted and holds resolve rights.
  if (review.requestedById === resolverId) {
    throw new ReviewError("BAD_REQUEST", "You can't resolve a review you submitted");
  }
  const resolved = await prisma.reviewRequest.update({
    where: { id },
    data: { status, resolvedById: resolverId, resolvedAt: new Date() },
  });

  await notifyReviewResolved(id, resolverId, status);
  return resolved;
}

/**
 * Best-effort: send the client their review link.
 *
 * This is the email the wedge runs on. It is separate from the admin
 * notification below rather than replacing it: an admin seeing the internal
 * queue and a client getting a link are two different events with two
 * different audiences, and collapsing them was the original mistake — for a
 * long time only the admin one existed, so "send for review" never actually
 * reached a client.
 */
/** Returns false when the invite mail did not go. Sending stays best-effort —
 *  a mail failure must never fail the submit — but REPORTING it must not be
 *  best-effort too. Before 2026-08-26 this swallowed into `console.error`, so a
 *  misconfigured SMTP in production meant the client never got the link, the
 *  round existed, the token existed, and the editor read "Sent". The root
 *  CLAUDE.md records the precedent: `SMTP_PASS` carrying a `$` was eaten by the
 *  cPanel shell — dev worked, prod returned 535. */
async function notifyClientInvited(
  siteId: string,
  requesterId: string,
  clientEmail: string,
  token: string,
  note?: string,
  changeSummary?: string,
): Promise<boolean> {
  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { name: true, workspace: { select: { name: true } } },
    });
    if (!site) return false;
    const designer = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { fullName: true, displayName: true },
    });
    await sendReviewInviteEmail(clientEmail, {
      siteName: site.name,
      agencyName: site.workspace?.name ?? "Your design team",
      designerName: designer?.displayName || designer?.fullName || "Your designer",
      token,
      note,
      changeSummary,
    });
    return true;
  } catch (e) {
    console.error("[review] client invite failed", { siteId, error: e });
    await logAuditEvent("REVIEW_INVITE_EMAIL_FAILED", "failure", {
      userId: requesterId,
      email: clientEmail,
      metadata: { siteId, error: e instanceof Error ? e.message : String(e) },
    });
    return false;
  }
}

/**
 * Best-effort: email workspace admins (OWNER/ADMIN) that a site was submitted
 * for review. A mail failure must never fail the submit — it's logged, not thrown.
 */
async function notifyReviewSubmitted(
  siteId: string,
  requesterId: string,
  note?: string,
  changeSummary?: string,
): Promise<number> {
  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { name: true, workspaceId: true },
    });
    if (!site) return 0;
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { fullName: true, displayName: true, email: true },
    });
    const admins = await prisma.workspaceMember.findMany({
      where: { workspaceId: site.workspaceId, status: "ACTIVE", role: { in: ["OWNER", "ADMIN"] } },
      select: { user: { select: { email: true } } },
    });
    const requesterName =
      requester?.displayName || requester?.fullName || requester?.email || "A teammate";
    const recipients = admins
      .map((m) => m.user.email)
      .filter((e): e is string => !!e && e !== requester?.email);
    /* On a ONE-SEAT workspace — which is what every new workspace is — the
       requester IS the only admin, so this filter leaves `recipients` empty and
       nobody is emailed. The dashboard modal nonetheless toasted "An admin has
       been notified." Return the count so the caller can tell the truth. */
    await Promise.all(
      recipients.map((to) =>
        sendReviewRequestedEmail(to, { siteName: site.name, requesterName, note, changeSummary }),
      ),
    );
    return recipients.length;
  } catch (e) {
    console.error("[review] submit notify failed", { siteId, error: e });
    return 0;
  }
}

/**
 * Best-effort: email the original requester when an admin resolves their review.
 * A mail failure must never fail the resolve — it's logged, not thrown.
 */
async function notifyReviewResolved(
  reviewId: string,
  resolverId: string,
  status: "APPROVED" | "CHANGES_REQUESTED",
) {
  try {
    const review = await prisma.reviewRequest.findUnique({
      where: { id: reviewId },
      select: { note: true, requestedById: true, site: { select: { id: true, name: true } } },
    });
    if (!review) return;
    const requester = await prisma.user.findUnique({
      where: { id: review.requestedById },
      select: { email: true },
    });
    const to = requester?.email;
    if (!to) return;
    const resolver = await prisma.user.findUnique({
      where: { id: resolverId },
      select: { fullName: true, displayName: true },
    });
    const resolverName = resolver?.displayName || resolver?.fullName || "An admin";
    await sendReviewResolvedEmail(to, {
      siteName: review.site.name,
      siteId: review.site.id,
      approved: status === "APPROVED",
      resolverName,
      note: review.note ?? undefined,
    });
  } catch (e) {
    console.error("[review] resolve notify failed", { reviewId, error: e });
  }
}
