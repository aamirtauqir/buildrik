/**
 * S-7: identifyReviewer's invitedEmail match, and
 * normalizeReviewEmail itself, must treat plus-tagged and (for gmail) dotted
 * variants of an address as the SAME address — most providers deliver them to
 * the same mailbox, so a naive trim+lowercase comparison let a token holder
 * dodge the "is this you" check with `edie+client@x.com` vs `edie@x.com`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const reviewRequestFindUnique = vi.fn();
const reviewerUpsert = vi.fn();
const reviewRequestUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reviewRequest: {
      findUnique: (...a: unknown[]) => reviewRequestFindUnique(...a),
      update: (...a: unknown[]) => reviewRequestUpdate(...a),
    },
    reviewer: { upsert: (...a: unknown[]) => reviewerUpsert(...a) },
  },
}));
vi.mock("@/server/services/notification.trigger", () => ({ notifyWorkspaceOwner: vi.fn() }));

import { identifyReviewer, normalizeReviewEmail, ClientReviewError } from "@/server/services/client-review.service";

const liveReview = (invitedEmail: string | null) => ({
  id: "r1",
  siteId: "s1",
  status: "PENDING",
  note: null,
  changeSummary: null,
  expiresAt: null,
  revokedAt: null,
  reviewerId: null,
  invitedEmail,
  requestedById: "u1",
  snapshotPages: null,
  createdAt: new Date(),
  site: { id: "s1", name: "Acme", workspaceId: "ws1", lastEditedAt: new Date(), workspace: { name: "Acme Agency" } },
});

beforeEach(() => {
  [reviewRequestFindUnique, reviewerUpsert, reviewRequestUpdate].forEach((m) => m.mockReset());
  reviewerUpsert.mockResolvedValue({ id: "rev1", name: "Client", email: "edie@x.com" });
  reviewRequestUpdate.mockResolvedValue({});
});

describe("normalizeReviewEmail", () => {
  it("drops a +tag", () => {
    expect(normalizeReviewEmail("edie+client@x.com")).toBe("edie@x.com");
  });

  it("is case-insensitive and trims", () => {
    expect(normalizeReviewEmail("  Edie@X.com  ")).toBe("edie@x.com");
  });

  it("drops dots in the local part for gmail.com and googlemail.com only", () => {
    expect(normalizeReviewEmail("e.d.ie@gmail.com")).toBe("edie@gmail.com");
    expect(normalizeReviewEmail("e.d.ie@googlemail.com")).toBe("edie@googlemail.com");
    expect(normalizeReviewEmail("e.d.ie@x.com")).toBe("e.d.ie@x.com"); // non-gmail: dots kept
  });

  it("combines +tag and gmail dot-dropping", () => {
    expect(normalizeReviewEmail("E.Die+client@Gmail.com")).toBe("edie@gmail.com");
  });
});

describe("identifyReviewer — plus-tag / gmail-dot bypass (S-7)", () => {
  it("matches a +tagged variant of the invited address", async () => {
    reviewRequestFindUnique.mockResolvedValue(liveReview("edie@x.com"));
    await expect(identifyReviewer("tok", "Edie", "edie+client@x.com")).resolves.toMatchObject({ id: "rev1" });
  });

  it("matches a dotted gmail variant of the invited address", async () => {
    reviewRequestFindUnique.mockResolvedValue(liveReview("edie@gmail.com"));
    await expect(identifyReviewer("tok", "Edie", "e.d.ie@gmail.com")).resolves.toMatchObject({ id: "rev1" });
  });

  it("still refuses a genuinely different address", async () => {
    reviewRequestFindUnique.mockResolvedValue(liveReview("edie@x.com"));
    await expect(identifyReviewer("tok", "Someone", "other@x.com")).rejects.toBeInstanceOf(ClientReviewError);
    await expect(identifyReviewer("tok", "Someone", "other@x.com")).rejects.toMatchObject({ code: "EMAIL_MISMATCH" });
  });

  it("matches even when the STORED invitedEmail itself carries a +tag (both sides normalized)", async () => {
    reviewRequestFindUnique.mockResolvedValue(liveReview("edie+invite@x.com"));
    await expect(identifyReviewer("tok", "Edie", "edie@x.com")).resolves.toMatchObject({ id: "rev1" });
  });
});
