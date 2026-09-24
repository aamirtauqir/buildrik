/**
 * The client page names its round (board 4418:121903: "Review round 3",
 * "Approve Round 3"), and a revoked or expired link still names the agency and
 * round (4418:121971). An unknown token names nothing.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
const count = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    reviewRequest: { findUnique: (...a: unknown[]) => findUnique(...a), count: (...a: unknown[]) => count(...a) },
    reviewer: { findUnique: vi.fn(() => null) },
  },
}));

import { getReviewByToken, ClientReviewError } from "../client-review.service";

const created = new Date("2026-09-20T00:00:00Z");
const review = (over: Record<string, unknown> = {}) => ({
  id: "r3", siteId: "s1", status: "PENDING", note: null, changeSummary: null,
  expiresAt: new Date(Date.now() + 86_400_000), revokedAt: null,
  reviewerId: null, invitedEmail: "sara@x.test", snapshotPages: null,
  createdAt: created, resolvedAt: null,
  site: { id: "s1", name: "Bella Cucina", workspaceId: "w1", lastEditedAt: null, workspace: { name: "Ali's Studio" } },
  ...over,
});

beforeEach(() => {
  findUnique.mockReset();
  count.mockReset();
});

describe("round number", () => {
  it("counts this site's rounds up to and including this one", async () => {
    findUnique.mockResolvedValue(review());
    count.mockResolvedValue(3);
    expect((await getReviewByToken("t")).roundNumber).toBe(3);
    expect(count).toHaveBeenCalledWith({ where: { siteId: "s1", createdAt: { lte: created } } });
  });

  it("a revoked link still names the agency and its round", async () => {
    findUnique.mockResolvedValue(review({ revokedAt: new Date() }));
    count.mockResolvedValue(3);
    const err = await getReviewByToken("t").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ClientReviewError);
    expect(err).toMatchObject({ code: "REVOKED", context: { agencyName: "Ali's Studio", roundNumber: 3 } });
  });

  it("an expired link does too", async () => {
    findUnique.mockResolvedValue(review({ expiresAt: new Date(Date.now() - 1000) }));
    count.mockResolvedValue(2);
    await expect(getReviewByToken("t")).rejects.toMatchObject({ code: "EXPIRED", context: { roundNumber: 2 } });
  });

  it("an unknown token names nothing", async () => {
    findUnique.mockResolvedValue(null);
    const err = await getReviewByToken("t").catch((e: unknown) => e);
    expect(err).toMatchObject({ code: "INVALID_TOKEN" });
    expect((err as ClientReviewError).context).toBeUndefined();
    expect(count).not.toHaveBeenCalled();
  });
});
