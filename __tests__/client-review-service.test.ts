import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reviewRequest: { findUnique: vi.fn() },
    comment: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

/** A live, non-revoked, non-expired review whose reviewer has NOT identified. */
function unidentifiedReview() {
  return {
    id: "rev1",
    siteId: "site1",
    status: "PENDING",
    note: null,
    changeSummary: null,
    expiresAt: new Date(Date.now() + 86_400_000),
    revokedAt: null,
    reviewerId: null,
    invitedEmail: null,
    snapshotPages: null,
    createdAt: new Date(),
    site: {
      id: "site1",
      name: "Site",
      workspaceId: "ws1",
      workspace: { name: "Pixel & Co" },
    },
  };
}

describe("listClientComments — token holders must identify before reading", () => {
  beforeEach(() => vi.clearAllMocks());

  /**
   * Regression for an authorisation hole, not a style preference.
   *
   * The filter used to be `reviewerId: review.reviewerId ?? undefined`. Prisma
   * drops an `undefined` condition rather than matching NULL, so for a token
   * whose reviewer had not identified the `where` collapsed to `{ siteId }`.
   * `comments` stores internal workspace-member notes in the same table
   * (`authorId` set, `reviewerId` null), so anyone holding a live share link
   * could read the team's private discussion of the site without so much as
   * typing a name.
   *
   * Asserting the throw alone would pass against a version that returns a dump
   * some other way, so this also pins that the query never runs.
   */
  it("rejects an unidentified reviewer instead of returning the site's comments", async () => {
    const { listClientComments } = await import("@/server/services/client-review.service");
    vi.mocked(prisma.reviewRequest.findUnique).mockResolvedValue(unidentifiedReview() as never);

    await expect(listClientComments("live-token")).rejects.toMatchObject({
      code: "NOT_IDENTIFIED",
    });
    expect(prisma.comment.findMany).not.toHaveBeenCalled();
  });

  it("scopes an identified reviewer to their own comments with a concrete id", async () => {
    const { listClientComments } = await import("@/server/services/client-review.service");
    vi.mocked(prisma.reviewRequest.findUnique).mockResolvedValue({
      ...unidentifiedReview(),
      reviewerId: "reviewer1",
    } as never);
    vi.mocked(prisma.comment.findMany).mockResolvedValue([] as never);

    await listClientComments("live-token");

    const [args] = vi.mocked(prisma.comment.findMany).mock.calls[0];
    expect(args.where).toEqual({ siteId: "site1", reviewerId: "reviewer1" });
    // The specific shape that caused the leak: an absent or undefined filter.
    expect(args.where).toHaveProperty("reviewerId");
    expect((args.where as { reviewerId?: string }).reviewerId).not.toBeUndefined();
  });
});

describe("getReviewByToken — the client page leads with the AGENCY, not the site", () => {
  beforeEach(() => vi.clearAllMocks());

  /**
   * Regression: the client page header read `siteName`, so a client saw their
   * own site's name ask them for feedback instead of the agency they hired.
   * The agency (workspace) name is what belongs there.
   */
  it("returns agencyName from the workspace, distinct from siteName", async () => {
    const { getReviewByToken } = await import("@/server/services/client-review.service");
    vi.mocked(prisma.reviewRequest.findUnique).mockResolvedValue(unidentifiedReview() as never);

    const result = await getReviewByToken("live-token");

    expect(result.agencyName).toBe("Pixel & Co");
    expect(result.siteName).toBe("Site");
  });

  it("falls back to null agencyName when the workspace has no name", async () => {
    const { getReviewByToken } = await import("@/server/services/client-review.service");
    vi.mocked(prisma.reviewRequest.findUnique).mockResolvedValue({
      ...unidentifiedReview(),
      site: { id: "site1", name: "Site", workspaceId: "ws1", workspace: null },
    } as never);

    const result = await getReviewByToken("live-token");

    expect(result.agencyName).toBeNull();
  });
});
