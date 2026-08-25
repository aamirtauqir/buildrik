/**
 * A new review ROUND supersedes every earlier link for the site.
 *
 * `prisma/schema.prisma` documents `revokedAt` as "Set when a re-send
 * supersedes this link", but nothing implemented it ACROSS rows:
 * `issueReviewToken` clears `revokedAt` on the row it updates, and a new round
 * is a new row, so round 1's token stayed live forever. Measured 2026-08-25 —
 * round 1's link still opened its "You approved this" terminal after round 2
 * existed, and the product's own "There's a newer version" screen was
 * unreachable as a result.
 *
 * The supersede must fire ONLY when a new round row is created. A re-send that
 * updates an already-open PENDING round is the same round, and killing links
 * there would revoke the client's working link mid-round.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const rrFindFirst = vi.fn();
const rrCreate = vi.fn();
const rrUpdate = vi.fn();
const rrUpdateMany = vi.fn();
const rrFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reviewRequest: {
      findFirst: (...a: unknown[]) => rrFindFirst(...a),
      create: (...a: unknown[]) => rrCreate(...a),
      update: (...a: unknown[]) => rrUpdate(...a),
      updateMany: (...a: unknown[]) => rrUpdateMany(...a),
      findMany: (...a: unknown[]) => rrFindMany(...a),
      count: vi.fn().mockResolvedValue(1),
    },
    site: { findUnique: vi.fn().mockResolvedValue(null) },
    user: { findUnique: vi.fn().mockResolvedValue(null) },
    workspaceMember: { findMany: vi.fn().mockResolvedValue([]) },
    comment: { count: vi.fn().mockResolvedValue(0) },
  },
}));

const issueReviewToken = vi.fn().mockResolvedValue({ token: "fresh-token" });
vi.mock("@/server/services/client-review.service", () => ({
  issueReviewToken: (...a: unknown[]) => issueReviewToken(...a),
}));

import { submitReview } from "@server/services/review.service";

beforeEach(() => {
  [rrFindFirst, rrCreate, rrUpdate, rrUpdateMany, rrFindMany, issueReviewToken].forEach((m) => m.mockReset());
  rrFindMany.mockResolvedValue([]);
  rrUpdateMany.mockResolvedValue({ count: 0 });
  issueReviewToken.mockResolvedValue({ token: "fresh-token" });
});

/** Only the supersede call has a `revokedAt` payload — the snapshot pruner also
 *  uses updateMany, so the assertions filter for the one under test. */
const supersedeCalls = () =>
  rrUpdateMany.mock.calls.filter((c) => (c[0] as { data?: Record<string, unknown> })?.data?.revokedAt !== undefined);

describe("submitReview — a new round supersedes earlier links", () => {
  it("revokes every other live token for the site when a NEW round is created", async () => {
    rrFindFirst.mockResolvedValue(null);                       // no open PENDING round
    rrCreate.mockResolvedValue({ id: "round-4", siteId: "s1" });

    await submitReview("s1", "u1");

    const calls = supersedeCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toMatchObject({
      where: { siteId: "s1", id: { not: "round-4" }, token: { not: null }, revokedAt: null },
    });
  });

  it("does NOT supersede when a re-send updates the already-open round", async () => {
    rrFindFirst.mockResolvedValue({ id: "round-4" });           // the open PENDING round
    rrUpdate.mockResolvedValue({ id: "round-4", siteId: "s1" });

    await submitReview("s1", "u1");

    expect(rrCreate).not.toHaveBeenCalled();
    expect(supersedeCalls()).toHaveLength(0);
  });

  it("mints a token when a client email is supplied, and none when it is not", async () => {
    rrFindFirst.mockResolvedValue(null);
    rrCreate.mockResolvedValue({ id: "round-4", siteId: "s1" });

    await submitReview("s1", "u1", undefined, undefined, "client@example.com");
    expect(issueReviewToken).toHaveBeenCalledWith("round-4", "client@example.com");

    issueReviewToken.mockClear();
    rrCreate.mockResolvedValue({ id: "round-5", siteId: "s1" });
    await submitReview("s1", "u1");
    expect(issueReviewToken).not.toHaveBeenCalled();
  });
});
