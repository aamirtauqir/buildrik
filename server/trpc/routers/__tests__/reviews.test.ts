/**
 * reviews router. Verifies submit is gated on site EDITOR access, list +
 * resolve are Admin-gated, and a blocked call never reaches the service.
 * Reviews are also gated by the `agency_layer` flag (IA v2 E1) — mirrors the
 * clients.ts pattern; the flag-off regression block is the IRON RULE guard.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkSiteRoleMock = vi.fn();
const checkWorkspaceRoleMock = vi.fn();
const submitMock = vi.fn();
const listMock = vi.fn();
const resolveMock = vi.fn();
const isFeatureEnabledMock = vi.fn();

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
  ReviewError: class ReviewError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.code = code;
    }
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { reviewsRouter } from "@/server/trpc/routers/reviews";
import { PermissionError } from "@/server/services/permission.service";

function makeCtx() {
  return { session: { user: { id: "u_1" } }, prisma: {} as never };
}

beforeEach(() => {
  [checkSiteRoleMock, checkWorkspaceRoleMock, submitMock, listMock, resolveMock, isFeatureEnabledMock].forEach((m) =>
    m.mockReset(),
  );
  // Default: agency layer ON, so the existing role-gate assertions still hold.
  isFeatureEnabledMock.mockResolvedValue(true);
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
    expect(submitMock).toHaveBeenCalledWith("s1", "u_1", "ready", undefined, undefined);
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

    it("list collapses to empty and never queries", async () => {
      const caller = reviewsRouter.createCaller(makeCtx() as never);
      await expect(caller.list()).resolves.toEqual([]);
      expect(checkWorkspaceRoleMock).not.toHaveBeenCalled();
      expect(listMock).not.toHaveBeenCalled();
    });

    it("resolve is denied and never resolves", async () => {
      const caller = reviewsRouter.createCaller(makeCtx() as never);
      await expect(caller.resolve({ id: "r1", status: "APPROVED" })).rejects.toThrow(/agency layer/i);
      expect(resolveMock).not.toHaveBeenCalled();
    });
  });
});
