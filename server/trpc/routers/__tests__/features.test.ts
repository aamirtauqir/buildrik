/**
 * features router. Verifies: list is readable by any member, set is Admin-gated
 * (the runtime kill-switch), and a non-member is IDOR-blocked before any flag op.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const listFeaturesMock = vi.fn();
const setFeatureMock = vi.fn();
const checkRoleMock = vi.fn();
const memberFindFirstMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/server/services/feature-flag.service", () => ({
  listWorkspaceFeatures: (...a: unknown[]) => listFeaturesMock(...a),
  setFeature: (...a: unknown[]) => setFeatureMock(...a),
}));
vi.mock("@/server/services/permission.service", () => ({
  checkWorkspaceRole: (...a: unknown[]) => checkRoleMock(...a),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.name = "PermissionError";
      this.code = code;
    }
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { workspaceMember: { findFirst: (...a: unknown[]) => memberFindFirstMock(...a) } },
}));

import { featuresRouter } from "@/server/trpc/routers/features";
import { PermissionError } from "@/server/services/permission.service";

function makeCtx(userId: string | null) {
  return { session: userId ? { user: { id: userId } } : null, prisma: {} as never };
}

describe("features router", () => {
  beforeEach(() => {
    listFeaturesMock.mockReset();
    setFeatureMock.mockReset();
    checkRoleMock.mockReset();
    memberFindFirstMock.mockReset();
    memberFindFirstMock.mockResolvedValue({ workspaceId: "ws_1" });
  });

  it("list returns the flag map for a member", async () => {
    listFeaturesMock.mockResolvedValueOnce({ agency_layer: true, client_mode: false });
    const caller = featuresRouter.createCaller(makeCtx("u_1") as never);
    await expect(caller.list()).resolves.toEqual({ agency_layer: true, client_mode: false });
  });

  it("list rejects a user with no workspace (NOT_FOUND)", async () => {
    memberFindFirstMock.mockResolvedValueOnce(null);
    const caller = featuresRouter.createCaller(makeCtx("u_1") as never);
    await expect(caller.list()).rejects.toThrow(/workspace/i);
  });

  it("set is blocked for a non-admin and never writes the flag", async () => {
    checkRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs ADMIN"));
    const caller = featuresRouter.createCaller(makeCtx("u_1") as never);
    await expect(
      caller.set({ key: "agency_layer", enabled: true }),
    ).rejects.toThrow(/ADMIN/i);
    expect(setFeatureMock).not.toHaveBeenCalled();
  });

  it("set writes the flag for an admin", async () => {
    checkRoleMock.mockResolvedValueOnce(undefined);
    setFeatureMock.mockResolvedValueOnce(undefined);
    const caller = featuresRouter.createCaller(makeCtx("u_1") as never);
    await expect(caller.set({ key: "client_mode", enabled: true })).resolves.toEqual({ ok: true });
    expect(setFeatureMock).toHaveBeenCalledWith("ws_1", "client_mode", true);
  });
});
