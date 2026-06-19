import { prisma } from "@/lib/prisma";
import type { ReviewStatus } from "@buildrik/shared/schemas/reviews";

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
) {
  const open = await prisma.reviewRequest.findFirst({
    where: { siteId, status: "PENDING" },
    select: { id: true },
  });
  if (open) {
    return prisma.reviewRequest.update({
      where: { id: open.id },
      data: { note: note ?? null, requestedById },
    });
  }
  return prisma.reviewRequest.create({
    data: { siteId, requestedById, note: note ?? null, status: "PENDING" },
  });
}

export interface ReviewRow {
  id: string;
  siteId: string;
  siteName: string;
  requestedById: string;
  status: string;
  note: string | null;
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
  return prisma.reviewRequest.update({
    where: { id },
    data: { status, resolvedById: resolverId, resolvedAt: new Date() },
  });
}
