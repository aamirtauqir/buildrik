/**
 * resolveReviewByToken — S-7 defense in depth. submitReview already refuses
 * to invite the submitter's own address (review.service.ts), but this is the
 * second gate: even if a row's invitedEmail somehow equals the requester's
 * current email (a pre-existing row, an email change after invite), the
 * client-side approve path must still refuse to let that person sign off
 * their own round as APPROVED.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const reviewRequestFindUnique = vi.fn();
const reviewRequestUpdate = vi.fn();
const userFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reviewRequest: {
      findUnique: (...a: unknown[]) => reviewRequestFindUnique(...a),
      update: (...a: unknown[]) => reviewRequestUpdate(...a),
    },
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
  },
}));
vi.mock("@/server/services/notification.trigger", () => ({
  notifyWorkspaceOwner: vi.fn(),
}));

import { resolveReviewByToken, ClientReviewError } from "@/server/services/client-review.service";

const liveReview = {
  id: "r1",
  siteId: "s1",
  status: "PENDING",
  note: null,
  changeSummary: null,
  expiresAt: null,
  revokedAt: null,
  reviewerId: "reviewer1",
  invitedEmail: "shared@example.com",
  requestedById: "u1",
  snapshotPages: null,
  createdAt: new Date(),
  resolvedAt: null,
  site: { id: "s1", name: "Acme", workspaceId: "ws1", lastEditedAt: new Date(), workspace: { name: "Acme Agency" } },
};

beforeEach(() => {
  [reviewRequestFindUnique, reviewRequestUpdate, userFindUnique].forEach((m) => m.mockReset());
  reviewRequestFindUnique.mockResolvedValue(liveReview);
});

describe("resolveReviewByToken — self-approval block (S-7)", () => {
  it("refuses APPROVED when the invited (signed-in) email equals the requester's own email", async () => {
    userFindUnique.mockResolvedValueOnce({ email: "Shared@Example.com" });
    await expect(resolveReviewByToken("tok", "APPROVED")).rejects.toMatchObject({
      code: "SELF_APPROVAL_BLOCKED",
    });
    expect(reviewRequestUpdate).not.toHaveBeenCalled();
  });

  it("allows APPROVED when the requester's email differs from the invited email", async () => {
    userFindUnique.mockResolvedValueOnce({ email: "designer@agency.com" });
    reviewRequestUpdate.mockResolvedValueOnce({ id: "r1", status: "APPROVED", resolvedAt: new Date(), siteId: "s1" });
    await expect(resolveReviewByToken("tok", "APPROVED")).resolves.toMatchObject({ status: "APPROVED" });
  });

  it("never blocks CHANGES_REQUESTED even for a matching email (only APPROVED is a signature)", async () => {
    reviewRequestUpdate.mockResolvedValueOnce({ id: "r1", status: "CHANGES_REQUESTED", resolvedAt: new Date(), siteId: "s1" });
    await expect(resolveReviewByToken("tok", "CHANGES_REQUESTED")).resolves.toMatchObject({
      status: "CHANGES_REQUESTED",
    });
    expect(userFindUnique).not.toHaveBeenCalled();
  });
});

// Sanity: ClientReviewError carries the new code as a valid member of its union.
describe("ClientReviewError", () => {
  it("accepts SELF_APPROVAL_BLOCKED", () => {
    const err = new ClientReviewError("SELF_APPROVAL_BLOCKED", "x");
    expect(err.code).toBe("SELF_APPROVAL_BLOCKED");
  });
});
