import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { TRPCError } from "@trpc/server";

const checkRoleMock = vi.fn();
const findFirstIntegMock = vi.fn();
const upsertIntegMock = vi.fn();
const deleteIntegMock = vi.fn();
const auditLogCreateMock = vi.fn((_arg: unknown) => Promise.resolve());

// Prevent transitive next-auth → next/server import error in test env
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));

vi.mock("@/server/services/permission.service", () => ({
  checkWorkspaceRole: (...args: unknown[]) => checkRoleMock(...args),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.name = "PermissionError";
      this.code = code;
    }
  },
}));

const memberFindFirstMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceIntegration: {
      findFirst: (...args: unknown[]) => findFirstIntegMock(...args),
      upsert: (...args: unknown[]) => upsertIntegMock(...args),
      delete: (...args: unknown[]) => deleteIntegMock(...args),
    },
    workspaceMember: {
      findFirst: (...args: unknown[]) => memberFindFirstMock(...args),
    },
    auditLog: { create: (arg: unknown) => auditLogCreateMock(arg) },
  },
}));

interface TestCookie { name: string; value: string }
const g = globalThis as typeof globalThis & { __testCookie?: TestCookie };

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        g.__testCookie?.name === name ? { value: g.__testCookie.value } : undefined,
      delete: vi.fn(),
    }),
}));

// Set ENCRYPTION_KEY before importing the router (which imports encryption)
const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;
process.env.ENCRYPTION_KEY = "0".repeat(64);

import { vercelIntegrationsRouter } from "@/server/trpc/routers/integrations";
import { encrypt } from "@/lib/encryption";

afterAll(() => {
  process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
});

function makeCtx(userId: string | null) {
  return { session: userId ? { user: { id: userId } } : null, prisma: {} as never };
}

describe("integrations.vercel.getConnection", () => {
  beforeEach(() => {
    findFirstIntegMock.mockReset();
    memberFindFirstMock.mockReset();
    // Default: caller is an active member of the workspace.
    memberFindFirstMock.mockResolvedValue({ id: "m_1" });
  });

  it("returns connected:false when no row exists", async () => {
    findFirstIntegMock.mockResolvedValueOnce(null);
    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    const result = await caller.getConnection({ workspaceId: "ws_1" });
    expect(result).toEqual({ connected: false });
  });

  it("forbids a non-member from reading connection status (IDOR guard)", async () => {
    memberFindFirstMock.mockResolvedValueOnce(null);
    const caller = vercelIntegrationsRouter.createCaller(makeCtx("intruder") as never);
    await expect(caller.getConnection({ workspaceId: "ws_1" })).rejects.toThrow(/member/i);
    // never reaches the integration lookup
    expect(findFirstIntegMock).not.toHaveBeenCalled();
  });

  it("returns connected:true with team + vercelUserId (never token)", async () => {
    findFirstIntegMock.mockResolvedValueOnce({
      id: "i_1",
      isActive: true,
      config: { encryptedToken: "v1:aaa:bbb:ccc", teamId: "team_x", vercelUserId: "vu_1" },
    });
    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    const result = await caller.getConnection({ workspaceId: "ws_1" });
    expect(result).toEqual({ connected: true, teamId: "team_x", vercelUserId: "vu_1", isActive: true });
    expect(JSON.stringify(result)).not.toContain("v1:");
  });
});

describe("integrations.vercel.finishConnect", () => {
  beforeEach(() => {
    checkRoleMock.mockReset();
    upsertIntegMock.mockReset();
    auditLogCreateMock.mockReset();
    g.__testCookie = undefined;
  });

  it("throws FORBIDDEN when caller not OWNER/ADMIN", async () => {
    const { PermissionError } = await import("@/server/services/permission.service");
    checkRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    await expect(caller.finishConnect({ workspaceId: "ws_1", teamId: null })).rejects.toThrow(
      /FORBIDDEN/,
    );
  });

  it("throws BAD_REQUEST when no pending cookie", async () => {
    checkRoleMock.mockResolvedValueOnce(undefined);
    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    await expect(caller.finishConnect({ workspaceId: "ws_1", teamId: null })).rejects.toThrow(
      /PENDING/,
    );
  });

  it("upserts integration row with encrypted token on success", async () => {
    checkRoleMock.mockResolvedValueOnce(undefined);
    const payload = JSON.stringify({
      workspaceId: "ws_1",
      userId: "u_1",
      accessToken: "vt_real",
      vercelUserId: "vu_1",
      teamId: null,
      configurationId: "icfg_1",
      candidateTeams: [{ id: "team_x", name: "X", slug: "x" }],
      exp: Date.now() + 60000,
    });
    g.__testCookie = { name: "buildrik_vercel_pending", value: encrypt(payload) };
    upsertIntegMock.mockResolvedValueOnce({ id: "i_new" });
    auditLogCreateMock.mockResolvedValueOnce(undefined);

    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    await caller.finishConnect({ workspaceId: "ws_1", teamId: "team_x" });

    expect(upsertIntegMock).toHaveBeenCalled();
    const arg = upsertIntegMock.mock.calls[0][0];
    expect(arg.where).toEqual({
      workspaceId_provider: { workspaceId: "ws_1", provider: "vercel" },
    });
    expect(arg.create.workspaceId).toBe("ws_1");
    expect(arg.create.provider).toBe("vercel");
    expect(arg.create.config.teamId).toBe("team_x");
    // Token must be encrypted — no plain "vt_real"
    expect(JSON.stringify(arg.create.config)).not.toContain("vt_real");
  });
});

describe("integrations.vercel.disconnect", () => {
  beforeEach(() => {
    checkRoleMock.mockReset();
    findFirstIntegMock.mockReset();
    deleteIntegMock.mockReset();
    auditLogCreateMock.mockReset();
  });

  it("deletes row + 410 Vercel revoke is treated as success", async () => {
    checkRoleMock.mockResolvedValueOnce(undefined);
    findFirstIntegMock.mockResolvedValueOnce({
      id: "i_1",
      config: { encryptedToken: encrypt("vt_x"), configurationId: "icfg_1" },
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 410 }),
    );
    deleteIntegMock.mockResolvedValueOnce(undefined);
    auditLogCreateMock.mockResolvedValueOnce(undefined);

    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    const result = await caller.disconnect({ workspaceId: "ws_1" });

    // OAuth walk sprint (2026-05-20) added `vercelStillInstalled` to surface
    // the Vercel-side "still installed?" hint to the disconnect UI — a 410
    // means the token was revoked locally but the install may persist on
    // Vercel until the user removes it from their org's integration list.
    expect(result).toEqual({ success: true, vercelStillInstalled: true });
    expect(deleteIntegMock).toHaveBeenCalledWith({ where: { id: "i_1" } });
    fetchSpy.mockRestore();
  });
});
