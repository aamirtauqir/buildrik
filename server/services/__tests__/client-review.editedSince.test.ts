/**
 * State E of the sign-off wireframes: approved, then edited.
 *
 * The client page's own doc comment has claimed this state since it shipped
 * ("E post-approval-edited"), and the token payload never carried it — a client
 * revisiting their link after the designer edited was congratulated about a
 * version that no longer exists. `editedSinceApproval` is the flag the page
 * turns on, computed with the same timestamp comparison as `isApprovalStale`,
 * the server's one definition of "edited after sign-off".
 *
 * Live smoke against the real DB confirmed both directions on 2026-08-28
 * (edited-since → true, later-approval → false); these pin the branch logic.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { reviewRequest: { findUnique: (...a: unknown[]) => findUnique(...a) }, reviewer: { findUnique: vi.fn(() => null) } },
}));

import { getReviewByToken } from "../client-review.service";

const review = (over: Record<string, unknown> = {}) => ({
  id: "r1", siteId: "s1", status: "APPROVED", note: null, changeSummary: null,
  expiresAt: new Date(Date.now() + 86_400_000), revokedAt: null,
  reviewerId: null, invitedEmail: null, snapshotPages: null,
  createdAt: new Date("2026-08-01T00:00:00Z"),
  resolvedAt: new Date("2026-08-20T10:00:00Z"),
  site: {
    id: "s1", name: "Site", workspaceId: "w1",
    lastEditedAt: new Date("2026-08-26T15:59:00Z"),
    workspace: { name: "Agency" },
  },
  ...over,
});

beforeEach(() => findUnique.mockReset());

describe("editedSinceApproval", () => {
  it("true when the site changed after the approval", async () => {
    findUnique.mockResolvedValue(review());
    expect((await getReviewByToken("t")).editedSinceApproval).toBe(true);
  });

  it("false when the approval is the newer of the two", async () => {
    findUnique.mockResolvedValue(review({ resolvedAt: new Date("2026-08-28T12:00:00Z") }));
    expect((await getReviewByToken("t")).editedSinceApproval).toBe(false);
  });

  it("never true for a round that is not APPROVED", async () => {
    // CHANGES_REQUESTED has its own screen; staleness is a fact about approvals.
    findUnique.mockResolvedValue(review({ status: "CHANGES_REQUESTED" }));
    expect((await getReviewByToken("t")).editedSinceApproval).toBe(false);
  });

  it("missing timestamps mean unknown, and unknown is not 'edited'", async () => {
    // Frightening a client with a warning nothing can substantiate is worse
    // than staying quiet.
    findUnique.mockResolvedValue(review({ resolvedAt: null }));
    expect((await getReviewByToken("t")).editedSinceApproval).toBe(false);
    findUnique.mockResolvedValue(review({ site: { id: "s1", name: "Site", workspaceId: "w1", lastEditedAt: null, workspace: { name: "A" } } }));
    expect((await getReviewByToken("t")).editedSinceApproval).toBe(false);
  });
});
