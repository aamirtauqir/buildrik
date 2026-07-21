import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReviewStatus } from "@buildrik/shared/schemas/reviews";
import {
  sendReviewRequestedEmail,
  sendReviewResolvedEmail,
  sendReviewInviteEmail,
} from "@/server/services/email.service";
import { issueReviewToken } from "@/server/services/client-review.service";

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

  // Every submit — first send OR re-send — mints a fresh token and kills the
  // previous one. Without this, round 1's link stays live forever and a client
  // who bookmarked it keeps approving a site that has moved on.
  const { token } = await issueReviewToken(request.id, clientEmail);

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
    select: { id: true, status: true },
  });
  if (!review) throw new ReviewError("NOT_FOUND", "Review not found");
  if (review.status !== "PENDING") {
    throw new ReviewError("BAD_REQUEST", "Review is already resolved");
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
