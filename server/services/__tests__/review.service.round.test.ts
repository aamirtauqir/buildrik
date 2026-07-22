/**
 * P0 wedge loop — the editor's review-round data + race-safe revoke.
 *
 * getCurrentRound feeds the editor Review panel (status, invited email, round
 * count, open-comment count). revokeReviewRound is optimistic-concurrency
 * guarded on `updatedAt` so a revoke can never kill a link a concurrent
 * re-send just minted (the re-send bumps updatedAt, so the guarded updateMany
 * matches zero rows → "token-changed", not a silent kill).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const rrFindFirst = vi.fn();
const rrCount = vi.fn();
const rrUpdateMany = vi.fn();
const rrFindUnique = vi.fn();
const commentCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reviewRequest: {
      findFirst: (...a: unknown[]) => rrFindFirst(...a),
      count: (...a: unknown[]) => rrCount(...a),
      updateMany: (...a: unknown[]) => rrUpdateMany(...a),
      findUnique: (...a: unknown[]) => rrFindUnique(...a),
    },
    comment: { count: (...a: unknown[]) => commentCount(...a) },
  },
}));

import { getCurrentRound, revokeReviewRound } from "@server/services/review.service";

beforeEach(() => {
  [rrFindFirst, rrCount, rrUpdateMany, rrFindUnique, commentCount].forEach((m) => m.mockReset());
});

describe("getCurrentRound", () => {
  it("returns null when the site was never sent for review", async () => {
    rrFindFirst.mockResolvedValue(null);
    expect(await getCurrentRound("s1")).toBeNull();
  });

  it("maps a pending, opened round with counts + revision", async () => {
    const created = new Date("2026-07-20T10:00:00Z");
    const updated = new Date("2026-07-21T09:00:00Z");
    rrFindFirst.mockResolvedValue({
      id: "r1",
      status: "PENDING",
      invitedEmail: "sara@client.com",
      reviewer: { name: "Sara Khan" },
      revokedAt: null,
      resolvedAt: null,
      createdAt: created,
      updatedAt: updated,
    });
    rrCount.mockResolvedValue(2);
    commentCount.mockResolvedValue(3);

    const round = await getCurrentRound("s1");
    expect(round).toEqual({
      id: "r1",
      status: "PENDING",
      invitedEmail: "sara@client.com",
      reviewerName: "Sara Khan",
      revoked: false,
      resolvedAt: null,
      createdAt: created,
      revision: updated.toISOString(),
      roundNumber: 2,
      totalRounds: 2,
      openCommentCount: 3,
    });
    // open-comment count is scoped to the site + OPEN
    expect(commentCount).toHaveBeenCalledWith({ where: { siteId: "s1", status: "OPEN" } });
  });

  it("marks a revoked round", async () => {
    rrFindFirst.mockResolvedValue({
      id: "r1", status: "PENDING", invitedEmail: null, reviewer: null,
      revokedAt: new Date(), resolvedAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    });
    rrCount.mockResolvedValue(1);
    commentCount.mockResolvedValue(0);
    const round = await getCurrentRound("s1");
    expect(round?.revoked).toBe(true);
    expect(round?.reviewerName).toBeNull();
  });
});

describe("revokeReviewRound", () => {
  const rev = "2026-07-21T09:00:00.000Z";

  it("revokes when the revision matches (no concurrent re-send)", async () => {
    rrUpdateMany.mockResolvedValue({ count: 1 });
    const res = await revokeReviewRound("ws-1", "r1", rev);
    expect(res).toEqual({ revoked: true });
    expect(rrUpdateMany).toHaveBeenCalledWith({
      where: { id: "r1", site: { workspaceId: "ws-1" }, revokedAt: null, updatedAt: new Date(rev) },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it("reports token-changed when a re-send bumped the revision", async () => {
    rrUpdateMany.mockResolvedValue({ count: 0 });
    // row exists in the workspace, live, but updatedAt moved on → stale revision
    rrFindFirst.mockResolvedValue({ revokedAt: null });
    const res = await revokeReviewRound("ws-1", "r1", rev);
    expect(res).toEqual({ revoked: false, reason: "token-changed" });
    // disambiguation is workspace-scoped (IDOR guard)
    expect(rrFindFirst).toHaveBeenCalledWith({
      where: { id: "r1", site: { workspaceId: "ws-1" } },
      select: { revokedAt: true },
    });
  });

  it("reports already-revoked idempotently", async () => {
    rrUpdateMany.mockResolvedValue({ count: 0 });
    rrFindFirst.mockResolvedValue({ revokedAt: new Date() });
    const res = await revokeReviewRound("ws-1", "r1", rev);
    expect(res).toEqual({ revoked: false, reason: "already-revoked" });
  });

  it("reports not-found for a review outside the workspace (IDOR guard)", async () => {
    rrUpdateMany.mockResolvedValue({ count: 0 });
    rrFindFirst.mockResolvedValue(null);
    const res = await revokeReviewRound("ws-1", "rX", rev);
    expect(res).toEqual({ revoked: false, reason: "not-found" });
  });
});
