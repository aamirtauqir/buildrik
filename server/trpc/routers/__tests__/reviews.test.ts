/**
 * reviews router. Verifies submit is gated on site EDITOR access, list +
 * resolve are Admin-gated, and a blocked call never reaches the service.
 * Reviews are also gated by the `agency_layer` flag (IA v2 E1) — mirrors the
 * clients.ts pattern; the flag-off regression block is the IRON RULE guard.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkSiteRoleMock = vi.fn();
const checkWorkspaceRoleMock = vi.fn();
const getSiteWorkspaceMock = vi.fn();
const submitMock = vi.fn();
const listMock = vi.fn();
const resolveMock = vi.fn();
const isFeatureEnabledMock = vi.fn();
const getCurrentRoundMock = vi.fn();
const listRoundsMock = vi.fn();
const getApprovedSnapshotMock = vi.fn();
const revokeReviewRoundMock = vi.fn();
const recordForSiteMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/server/trpc/workspace-ctx", () => ({
  resolveWorkspaceId: vi.fn().mockResolvedValue("ws_1"),
}));
vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
  checkWorkspaceRole: (...a: unknown[]) => checkWorkspaceRoleMock(...a),
  getSiteWorkspace: (...a: unknown[]) => getSiteWorkspaceMock(...a),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.code = code;
    }
  },
}));
vi.mock("@/server/services/feature-flag.service", () => ({
  isFeatureEnabled: (...a: unknown[]) => isFeatureEnabledMock(...a),
}));
vi.mock("@/server/services/review.service", () => ({
  submitReview: (...a: unknown[]) => submitMock(...a),
  listReviews: (...a: unknown[]) => listMock(...a),
  resolveReview: (...a: unknown[]) => resolveMock(...a),
  getCurrentRound: (...a: unknown[]) => getCurrentRoundMock(...a),
  listRounds: (...a: unknown[]) => listRoundsMock(...a),
  getApprovedSnapshot: (...a: unknown[]) => getApprovedSnapshotMock(...a),
  revokeReviewRound: (...a: unknown[]) => revokeReviewRoundMock(...a),
  ReviewError: class ReviewError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.code = code;
    }
  },
}));
vi.mock("@/server/services/activity-log.service", () => ({
  recordForSite: (...a: unknown[]) => recordForSiteMock(...a),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const checkRateLimitMock = vi.fn();
vi.mock("@/server/services/rate-limiter", () => ({
  checkRateLimit: (...a: unknown[]) => checkRateLimitMock(...a),
}));

import { reviewsRouter } from "@/server/trpc/routers/reviews";
import { PermissionError } from "@/server/services/permission.service";

// A-8: submit/status/currentRound/rounds/approvedSnapshot/revoke now
// resolve the workspace from the SITE via getSiteWorkspace, not the
// session — every caller needs this.
function makeCtx() {
  return {
    session: { user: { id: "u_1" } },
    prisma: {} as never,
  };
}

beforeEach(() => {
  [checkSiteRoleMock, checkWorkspaceRoleMock, submitMock, listMock, resolveMock, isFeatureEnabledMock, getCurrentRoundMock, checkRateLimitMock, getSiteWorkspaceMock, listRoundsMock, getApprovedSnapshotMock, revokeReviewRoundMock, recordForSiteMock].forEach((m) =>
    m.mockReset(),
  );
  // Default: agency layer ON, so the existing role-gate assertions still hold.
  isFeatureEnabledMock.mockResolvedValue(true);
  checkRateLimitMock.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 1000 });
  getSiteWorkspaceMock.mockResolvedValue({ workspaceId: "ws_1", plan: "FREE", editsRequireApproval: false });
});

describe("reviews router", () => {
  it("submit requires EDITOR access to the site and never submits if denied", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs EDITOR"));
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(caller.submit({ siteId: "s1" })).rejects.toThrow(/EDITOR/i);
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("submit creates the request for an editor", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    submitMock.mockResolvedValueOnce({ id: "r1", status: "PENDING" });
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(caller.submit({ siteId: "s1", note: "ready" })).resolves.toMatchObject({ id: "r1" });
    // 5 args since 389e2c39 added the optional clientEmail — omitted here, which
    // is the "submit without inviting anyone" path.
    expect(submitMock).toHaveBeenCalledWith("s1", "u_1", "ready", undefined, undefined, undefined);
  });

  it("submit is throttled per user per site (S-10) and never submits when exhausted", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    checkRateLimitMock.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 1000 });
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(caller.submit({ siteId: "s1", note: "ready" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("submit response has no token for an EDITOR who is not an ADMIN (S-7)", async () => {
    checkSiteRoleMock
      .mockResolvedValueOnce(undefined) // EDITOR gate
      .mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs ADMIN")); // token gate
    submitMock.mockResolvedValueOnce({ id: "r1", status: "PENDING", token: "secret-token", inviteEmailSent: true, adminsNotified: 1 });
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(
      caller.submit({ siteId: "s1", clientEmail: "client@example.com" }),
    ).resolves.toMatchObject({ id: "r1", token: null });
  });

  it("submit response includes the token for an ADMIN", async () => {
    checkSiteRoleMock
      .mockResolvedValueOnce(undefined) // EDITOR gate
      .mockResolvedValueOnce(undefined); // token gate — ADMIN
    submitMock.mockResolvedValueOnce({ id: "r1", status: "PENDING", token: "secret-token", inviteEmailSent: true, adminsNotified: 1 });
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(
      caller.submit({ siteId: "s1", clientEmail: "client@example.com" }),
    ).resolves.toMatchObject({ id: "r1", token: "secret-token" });
  });

  it("submit translates a ReviewError from submitReview (self-invite, S-7) into BAD_REQUEST, not a 500", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined); // EDITOR gate
    const { ReviewError } = await import("@/server/services/review.service");
    submitMock.mockRejectedValueOnce(
      new ReviewError("BAD_REQUEST", "You can't invite yourself to review your own submission."),
    );
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(
      caller.submit({ siteId: "s1", clientEmail: "me@example.com" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: /can't invite yourself/i });
  });

  it("list is Admin-gated and never queries if denied", async () => {
    checkWorkspaceRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs ADMIN"));
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(caller.list()).rejects.toThrow(/ADMIN/i);
    expect(listMock).not.toHaveBeenCalled();
  });

  it("resolve runs for an admin", async () => {
    checkWorkspaceRoleMock.mockResolvedValueOnce(undefined);
    resolveMock.mockResolvedValueOnce({ id: "r1", status: "APPROVED" });
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(caller.resolve({ id: "r1", status: "APPROVED" })).resolves.toMatchObject({ status: "APPROVED" });
    expect(resolveMock).toHaveBeenCalledWith("ws_1", "r1", "APPROVED", "u_1");
  });

  /* currentRound carries the live client-link token (post-Oct-1 R4), but the
     token is a live client-review credential — re-opens A19-6/S-7 if handed
     to a non-admin. Only an ADMIN gets it back; any EDITOR still gets the
     round itself, with token forced null. */
  it("currentRound returns token to an ADMIN", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined); // EDITOR gate
    checkSiteRoleMock.mockResolvedValueOnce(undefined); // ADMIN probe passes
    getCurrentRoundMock.mockResolvedValueOnce({ id: "r1", token: "tok_1" });
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(caller.currentRound({ siteId: "s1" })).resolves.toMatchObject({ token: "tok_1" });
    expect(checkSiteRoleMock).toHaveBeenNthCalledWith(1, expect.anything(), "u_1", "s1", "EDITOR");
    expect(checkSiteRoleMock).toHaveBeenNthCalledWith(2, expect.anything(), "u_1", "s1", "ADMIN");
    expect(getCurrentRoundMock).toHaveBeenCalledWith("s1", true);
  });

  it("currentRound returns the round with token null to an EDITOR who is not an ADMIN", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined); // EDITOR gate
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs ADMIN")); // ADMIN probe fails
    getCurrentRoundMock.mockResolvedValueOnce({ id: "r1", token: null });
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(caller.currentRound({ siteId: "s1" })).resolves.toMatchObject({ token: null });
    expect(getCurrentRoundMock).toHaveBeenCalledWith("s1", false);
  });

  it("submit reads agency_layer off the SITE's workspace, not the session's (A-8)", async () => {
    // Session's own resolveWorkspaceId resolves "ws_1"; the site being
    // submitted for belongs to a DIFFERENT workspace whose flag is what
    // actually governs this call.
    getSiteWorkspaceMock.mockResolvedValueOnce({ workspaceId: "ws_site_2", plan: "FREE", editsRequireApproval: false });
    checkSiteRoleMock.mockResolvedValueOnce(undefined) // EDITOR gate
      .mockRejectedValueOnce(new PermissionError("FORBIDDEN")); // token gate (not admin)
    submitMock.mockResolvedValueOnce({ id: "r1", status: "PENDING", token: null, inviteEmailSent: null, adminsNotified: 0 });
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await caller.submit({ siteId: "s2" });
    expect(isFeatureEnabledMock).toHaveBeenCalledWith("ws_site_2", "agency_layer");
    expect(isFeatureEnabledMock).not.toHaveBeenCalledWith("ws_1", "agency_layer");
  });

  it("currentRound reads agency_layer off the SITE's workspace, not the session's (A-8)", async () => {
    getSiteWorkspaceMock.mockResolvedValueOnce({ workspaceId: "ws_site_2", plan: "FREE", editsRequireApproval: false });
    isFeatureEnabledMock.mockResolvedValueOnce(false); // off for the SITE's workspace
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(caller.currentRound({ siteId: "s2" })).resolves.toBeNull();
    expect(isFeatureEnabledMock).toHaveBeenCalledWith("ws_site_2", "agency_layer");
    expect(checkSiteRoleMock).not.toHaveBeenCalled();
  });

  // A-8 (controller review): rounds/approvedSnapshot/revoke also read
  // the caller's SESSION workspace instead of the SITE's — an EDITOR on
  // another workspace's site couldn't see their own round history or revoke
  // their own round.
  it("rounds reads agency_layer off the SITE's workspace, not the session's", async () => {
    getSiteWorkspaceMock.mockResolvedValueOnce({ workspaceId: "ws_site_2", plan: "FREE", editsRequireApproval: false });
    isFeatureEnabledMock.mockResolvedValueOnce(true);
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    listRoundsMock.mockResolvedValueOnce([{ id: "r1" }]);
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(caller.rounds({ siteId: "s2" })).resolves.toEqual([{ id: "r1" }]);
    expect(isFeatureEnabledMock).toHaveBeenCalledWith("ws_site_2", "agency_layer");
  });

  it("approvedSnapshot reads agency_layer off the SITE's workspace, not the session's", async () => {
    getSiteWorkspaceMock.mockResolvedValueOnce({ workspaceId: "ws_site_2", plan: "FREE", editsRequireApproval: false });
    isFeatureEnabledMock.mockResolvedValueOnce(true);
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    getApprovedSnapshotMock.mockResolvedValueOnce({ pages: [] });
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(caller.approvedSnapshot({ siteId: "s2" })).resolves.toEqual({ pages: [] });
    expect(isFeatureEnabledMock).toHaveBeenCalledWith("ws_site_2", "agency_layer");
  });

  it("revoke reads the SITE's workspace, not the session's, and passes it to revokeReviewRound", async () => {
    getSiteWorkspaceMock.mockResolvedValueOnce({ workspaceId: "ws_site_2", plan: "FREE", editsRequireApproval: false });
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    revokeReviewRoundMock.mockResolvedValueOnce({ revoked: true });
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(
      caller.revoke({ siteId: "s2", reviewId: "r1", expectedRevision: "rev-1" }),
    ).resolves.toEqual({ revoked: true });
    expect(revokeReviewRoundMock).toHaveBeenCalledWith("ws_site_2", "r1", "rev-1");
  });

  it("status returns the EFFECTIVE editsRequireApproval (layerOn && raw) — false when the layer is off, even if the raw setting is true (PD-7/8)", async () => {
    // Raw setting is TRUE and the layer is OFF — this must still come back
    // false. Mocking editsRequireApproval: false here could not tell
    // "effective" logic apart from a straight pass-through of the raw
    // value; a leaked raw=true would have passed too.
    getSiteWorkspaceMock.mockResolvedValueOnce({ workspaceId: "ws_site_2", plan: "FREE", editsRequireApproval: true });
    isFeatureEnabledMock.mockResolvedValueOnce(false);
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(caller.status({ siteId: "s2" })).resolves.toMatchObject({
      reviewsEnabled: false,
      // With the layer off, reviews.submit can never produce an APPROVED
      // round, so startPublish's approval gate never enforces here either —
      // the raw setting is no longer the answer to "is approval required".
      editsRequireApproval: false,
    });
  });

  it("currentRound is FORBIDDEN below EDITOR and never reads the round", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs EDITOR"));
    const caller = reviewsRouter.createCaller(makeCtx() as never);
    await expect(caller.currentRound({ siteId: "s1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getCurrentRoundMock).not.toHaveBeenCalled();
  });

  // IRON RULE (IA v2 E1): with agency_layer off, mutations deny and the list
  // collapses to empty — no procedure reaches the service.
  describe("agency_layer gate", () => {
    beforeEach(() => isFeatureEnabledMock.mockResolvedValue(false));

    it("submit is denied and never submits", async () => {
      const caller = reviewsRouter.createCaller(makeCtx() as never);
      await expect(caller.submit({ siteId: "s1" })).rejects.toThrow(/agency layer/i);
      expect(checkSiteRoleMock).not.toHaveBeenCalled();
      expect(submitMock).not.toHaveBeenCalled();
    });

    it("list collapses to an empty page and never queries", async () => {
      const caller = reviewsRouter.createCaller(makeCtx() as never);
      await expect(caller.list()).resolves.toEqual({ items: [], nextCursor: null });
      expect(checkWorkspaceRoleMock).not.toHaveBeenCalled();
      expect(listMock).not.toHaveBeenCalled();
    });

    it("currentRound is null and never reads the round (so no token leaks)", async () => {
      const caller = reviewsRouter.createCaller(makeCtx() as never);
      await expect(caller.currentRound({ siteId: "s1" })).resolves.toBeNull();
      expect(getCurrentRoundMock).not.toHaveBeenCalled();
    });

    it("resolve is denied and never resolves", async () => {
      const caller = reviewsRouter.createCaller(makeCtx() as never);
      await expect(caller.resolve({ id: "r1", status: "APPROVED" })).rejects.toThrow(/agency layer/i);
      expect(resolveMock).not.toHaveBeenCalled();
    });
  });
});
