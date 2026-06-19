/**
 * Review workflow service (E4). Verifies the idempotent submit (one PENDING per
 * site), workspace-scoped list shape, and the resolve guards: NOT_FOUND for a
 * review outside the workspace (IDOR), BAD_REQUEST when already resolved.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
const create = vi.fn();
const update = vi.fn();
const findMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reviewRequest: {
      findFirst: (...a: unknown[]) => findFirst(...a),
      create: (...a: unknown[]) => create(...a),
      update: (...a: unknown[]) => update(...a),
      findMany: (...a: unknown[]) => findMany(...a),
    },
  },
}));

import {
  submitReview,
  listReviews,
  resolveReview,
  ReviewError,
} from "@server/services/review.service";

beforeEach(() => {
  [findFirst, create, update, findMany].forEach((m) => m.mockReset());
});

describe("submitReview", () => {
  it("creates a PENDING request when none is open", async () => {
    findFirst.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({ id: "r1" });
    await submitReview("s1", "u1", "ready");
    expect(create).toHaveBeenCalledWith({
      data: { siteId: "s1", requestedById: "u1", note: "ready", status: "PENDING" },
    });
  });

  it("is idempotent — refreshes the open PENDING request instead of duplicating", async () => {
    findFirst.mockResolvedValueOnce({ id: "r-open" });
    update.mockResolvedValueOnce({ id: "r-open" });
    await submitReview("s1", "u1", "again");
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({ where: { id: "r-open" }, data: { note: "again", requestedById: "u1" } });
  });
});

describe("listReviews", () => {
  it("flattens site.name into siteName, scoped to the workspace", async () => {
    findMany.mockResolvedValueOnce([
      { id: "r1", siteId: "s1", requestedById: "u1", status: "PENDING", note: null, resolvedById: null, resolvedAt: null, createdAt: new Date(0), site: { name: "Acme" } },
    ]);
    const out = await listReviews("ws-1", "PENDING");
    expect(out[0]).toMatchObject({ id: "r1", siteName: "Acme" });
    expect(findMany.mock.calls[0][0].where).toEqual({ site: { workspaceId: "ws-1" }, status: "PENDING" });
  });
});

describe("resolveReview", () => {
  it("approves a PENDING review in the workspace", async () => {
    findFirst.mockResolvedValueOnce({ id: "r1", status: "PENDING" });
    update.mockResolvedValueOnce({ id: "r1", status: "APPROVED" });
    await resolveReview("ws-1", "r1", "APPROVED", "admin");
    expect(findFirst).toHaveBeenCalledWith({ where: { id: "r1", site: { workspaceId: "ws-1" } }, select: { id: true, status: true } });
    expect(update.mock.calls[0][0].data).toMatchObject({ status: "APPROVED", resolvedById: "admin" });
  });

  it("refuses a review from another workspace (NOT_FOUND, no update)", async () => {
    findFirst.mockResolvedValueOnce(null);
    await expect(resolveReview("ws-1", "other", "APPROVED", "admin")).rejects.toBeInstanceOf(ReviewError);
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses to re-resolve an already-resolved review (BAD_REQUEST)", async () => {
    findFirst.mockResolvedValueOnce({ id: "r1", status: "APPROVED" });
    await expect(resolveReview("ws-1", "r1", "CHANGES_REQUESTED", "admin")).rejects.toBeInstanceOf(ReviewError);
    expect(update).not.toHaveBeenCalled();
  });
});
