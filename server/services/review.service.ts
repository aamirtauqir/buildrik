import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReviewStatus, ReviewPillState } from "@buildrik/shared/schemas/reviews";
import {
  sendReviewRequestedEmail,
  sendReviewResolvedEmail,
  sendReviewInviteEmail,
} from "@/server/services/email.service";
import { issueReviewToken } from "@/server/services/client-review.service";
import { isApprovalStale } from "@/server/services/publish-approval";

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
  const existing = await openId();
  if (existing) {
    request = await prisma.reviewRequest.update({ where: { id: existing }, data: updateData });
  } else {
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

  await notifyReviewSubmitted(siteId, requestedById, note, changeSummary);
  if (clientEmail && token) {
    await notifyClientInvited(siteId, requestedById, clientEmail, token, note, changeSummary);
  }
  return request;
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
  const r = await prisma.reviewRequest.findFirst({
    where: { siteId },
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

/** All review requests across a workspace's sites, newest first. */
export async function listReviews(
  workspaceId: string,
  status?: ReviewStatus,
): Promise<ReviewRow[]> {
  const rows = await prisma.reviewRequest.findMany({
    where: { site: { workspaceId }, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
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
      site: { select: { name: true } },
    },
  });
  return rows.map(({ site, ...r }) => ({ ...r, siteName: site.name }));
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
async function notifyClientInvited(
  siteId: string,
  requesterId: string,
  clientEmail: string,
  token: string,
  note?: string,
  changeSummary?: string,
) {
  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { name: true, workspace: { select: { name: true } } },
    });
    if (!site) return;
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
  } catch (e) {
    console.error("[review] client invite failed", { siteId, error: e });
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
) {
  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { name: true, workspaceId: true },
    });
    if (!site) return;
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
    await Promise.all(
      recipients.map((to) =>
        sendReviewRequestedEmail(to, { siteName: site.name, requesterName, note, changeSummary }),
      ),
    );
  } catch (e) {
    console.error("[review] submit notify failed", { siteId, error: e });
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
