/**
 * Review workflow service (E4). Verifies the idempotent submit (one PENDING per
 * site), workspace-scoped list shape, the resolve guards (NOT_FOUND for an
 * out-of-workspace review / IDOR, BAD_REQUEST when already resolved), AND the
 * sign-off notifications: submit emails the workspace admins, resolve emails the
 * original requester, and a mail failure never fails the core mutation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
const create = vi.fn();
const update = vi.fn();
const findMany = vi.fn();
const reviewFindUnique = vi.fn();
const siteFindUnique = vi.fn();
const userFindUnique = vi.fn();
const memberFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reviewRequest: {
      findFirst: (...a: unknown[]) => findFirst(...a),
      create: (...a: unknown[]) => create(...a),
      update: (...a: unknown[]) => update(...a),
      findMany: (...a: unknown[]) => findMany(...a),
      findUnique: (...a: unknown[]) => reviewFindUnique(...a),
    },
    site: { findUnique: (...a: unknown[]) => siteFindUnique(...a) },
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    workspaceMember: { findMany: (...a: unknown[]) => memberFindMany(...a) },
  },
}));

const sendReviewRequestedEmail = vi.fn();
const sendReviewResolvedEmail = vi.fn();
const sendReviewInviteEmail = vi.fn();
vi.mock("@/server/services/email.service", () => ({
  sendReviewRequestedEmail: (...a: unknown[]) => sendReviewRequestedEmail(...a),
  sendReviewResolvedEmail: (...a: unknown[]) => sendReviewResolvedEmail(...a),
  sendReviewInviteEmail: (...a: unknown[]) => sendReviewInviteEmail(...a),
}));

const issueReviewToken = vi.fn();
vi.mock("@/server/services/client-review.service", () => ({
  issueReviewToken: (...a: unknown[]) => issueReviewToken(...a),
}));

import {
  submitReview,
  listReviews,
  resolveReview,
  ReviewError,
} from "@server/services/review.service";

const allMocks = [
  findFirst, create, update, findMany, reviewFindUnique,
  siteFindUnique, userFindUnique, memberFindMany,
  sendReviewRequestedEmail, sendReviewResolvedEmail, sendReviewInviteEmail,
  issueReviewToken,
];

beforeEach(() => {
  allMocks.forEach((m) => m.mockReset());
  // Happy defaults so the notify path resolves cleanly in non-notify tests.
  siteFindUnique.mockResolvedValue({ id: "s1", name: "Acme", workspaceId: "ws-1" });
  userFindUnique.mockResolvedValue({ fullName: "Edie Editor", displayName: null, email: "edie@x.com" });
  memberFindMany.mockResolvedValue([{ user: { email: "admin@x.com" } }]);
  reviewFindUnique.mockResolvedValue({ note: "looks good", requestedById: "u1", site: { id: "s1", name: "Acme" } });
  update.mockResolvedValue({ id: "r1" });
  // A client invite (clientEmail present) rotates the token; an internal submit
  // (no email) must NOT call this at all — see the M23 test.
  issueReviewToken.mockResolvedValue({ token: "tok-default" });
});

describe("submitReview", () => {
  it("creates a PENDING request when none is open", async () => {
    findFirst.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({ id: "r1" });
    await submitReview("s1", "u1", "ready");
    expect(create).toHaveBeenCalledWith({
      data: { siteId: "s1", requestedById: "u1", note: "ready", changeSummary: null, status: "PENDING" },
    });
  });

  it("is idempotent — refreshes the open PENDING request instead of duplicating", async () => {
    findFirst.mockResolvedValueOnce({ id: "r-open" });
    update.mockResolvedValueOnce({ id: "r-open" });
    await submitReview("s1", "u1", "again");
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({ where: { id: "r-open" }, data: { note: "again", changeSummary: null, requestedById: "u1" } });
  });

  it("M23: an internal submit (no client email) does NOT rotate the client token", async () => {
    findFirst.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({ id: "r1" });
    await submitReview("s1", "u1", "ready");
    expect(issueReviewToken).not.toHaveBeenCalled();
    expect(sendReviewInviteEmail).not.toHaveBeenCalled();
  });

  it("a client invite (email present) rotates the token and emails the client", async () => {
    findFirst.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({ id: "r1" });
    await submitReview("s1", "u1", "ready", undefined, "client@acme.com");
    expect(issueReviewToken).toHaveBeenCalledWith("r1", "client@acme.com");
    expect(sendReviewInviteEmail).toHaveBeenCalledOnce();
  });

  it("emails workspace admins (not the requester) on submit", async () => {
    findFirst.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({ id: "r1" });
    memberFindMany.mockResolvedValueOnce([
      { user: { email: "edie@x.com" } }, // the requester — must be excluded
      { user: { email: "admin@x.com" } },
    ]);
    await submitReview("s1", "u1", "ready", "hero copy");
    expect(sendReviewRequestedEmail).toHaveBeenCalledTimes(1);
    expect(sendReviewRequestedEmail).toHaveBeenCalledWith("admin@x.com", {
      siteName: "Acme",
      requesterName: "Edie Editor",
      note: "ready",
      changeSummary: "hero copy",
    });
  });

  it("a mail failure does not fail the submit", async () => {
    findFirst.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({ id: "r1" });
    sendReviewRequestedEmail.mockRejectedValueOnce(new Error("smtp down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(submitReview("s1", "u1", "ready")).resolves.toMatchObject({ id: "r1" });
    spy.mockRestore();
  });
});

describe("listReviews", () => {
  it("flattens site.name into siteName, scoped to the workspace", async () => {
    findMany.mockResolvedValueOnce([
      { id: "r1", siteId: "s1", requestedById: "u1", status: "PENDING", note: null, changeSummary: null, resolvedById: null, resolvedAt: null, createdAt: new Date(0), site: { name: "Acme" } },
    ]);
    const out = await listReviews("ws-1", "PENDING");
    expect(out[0]).toMatchObject({ id: "r1", siteName: "Acme" });
    expect(findMany.mock.calls[0][0].where).toEqual({ site: { workspaceId: "ws-1" }, status: "PENDING" });
  });
});

describe("resolveReview", () => {
  it("approves a PENDING review in the workspace", async () => {
    findFirst.mockResolvedValueOnce({ id: "r1", status: "PENDING", requestedById: "u1" });
    update.mockResolvedValueOnce({ id: "r1", status: "APPROVED" });
    await resolveReview("ws-1", "r1", "APPROVED", "admin");
    expect(findFirst).toHaveBeenCalledWith({ where: { id: "r1", site: { workspaceId: "ws-1" } }, select: { id: true, status: true, requestedById: true } });
    expect(update.mock.calls[0][0].data).toMatchObject({ status: "APPROVED", resolvedById: "admin" });
  });

  it("M12: refuses to resolve a review you submitted (no update)", async () => {
    findFirst.mockResolvedValueOnce({ id: "r1", status: "PENDING", requestedById: "admin" });
    await expect(resolveReview("ws-1", "r1", "APPROVED", "admin")).rejects.toBeInstanceOf(ReviewError);
    expect(update).not.toHaveBeenCalled();
    expect(sendReviewResolvedEmail).not.toHaveBeenCalled();
  });

  it("emails the original requester when resolved", async () => {
    findFirst.mockResolvedValueOnce({ id: "r1", status: "PENDING", requestedById: "u1" });
    update.mockResolvedValueOnce({ id: "r1", status: "APPROVED" });
    await resolveReview("ws-1", "r1", "APPROVED", "admin");
    expect(sendReviewResolvedEmail).toHaveBeenCalledWith("edie@x.com", {
      siteName: "Acme",
      siteId: "s1",
      approved: true,
      resolverName: "Edie Editor",
      note: "looks good",
    });
  });

  it("refuses a review from another workspace (NOT_FOUND, no update)", async () => {
    findFirst.mockResolvedValueOnce(null);
    await expect(resolveReview("ws-1", "other", "APPROVED", "admin")).rejects.toBeInstanceOf(ReviewError);
    expect(update).not.toHaveBeenCalled();
    expect(sendReviewResolvedEmail).not.toHaveBeenCalled();
  });

  it("refuses to re-resolve an already-resolved review (BAD_REQUEST)", async () => {
    findFirst.mockResolvedValueOnce({ id: "r1", status: "APPROVED" });
    await expect(resolveReview("ws-1", "r1", "CHANGES_REQUESTED", "admin")).rejects.toBeInstanceOf(ReviewError);
    expect(update).not.toHaveBeenCalled();
  });
});
