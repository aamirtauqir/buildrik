/**
 * actions router — propose/confirm behaviour (codex flagged the absence of
 * router-level tests). Service deps are mocked so this exercises the router's
 * own wiring: the propose-time role gate, the single-use confirm path, and the
 * unknown-action / replay rejections.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ../trpc imports `auth` from @/server/auth → NextAuth → next/server, which fails
// to resolve under vitest. Stub it so the router (+ its real protectedProcedure)
// can be imported.
vi.mock("@/server/auth", () => ({ auth: vi.fn() }));

// Hoisted so the (hoisted) vi.mock factories can reference them without a TDZ.
const h = vi.hoisted(() => {
  class PermissionError extends Error {
    code: "FORBIDDEN" | "NOT_FOUND";
    constructor(code: "FORBIDDEN" | "NOT_FOUND", msg?: string) {
      super(msg ?? code);
      this.code = code;
    }
  }
  return {
    PermissionError,
    checkSiteRole: vi.fn(),
    createConfirmation: vi.fn(() => Promise.resolve("tok-1")),
    consumeConfirmation: vi.fn(),
    execute: vi.fn(() => Promise.resolve({ id: "job-1" })),
  };
});

vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: h.checkSiteRole,
  PermissionError: h.PermissionError,
}));
vi.mock("@/server/services/action-confirmation.service", () => ({
  createConfirmation: h.createConfirmation,
  consumeConfirmation: h.consumeConfirmation,
}));
vi.mock("@/server/services/ai-actions.service", () => ({
  getAction: (id: string) =>
    id === "site.publish"
      ? {
          minRole: "ADMIN",
          schema: { safeParse: (d: unknown) => ({ success: true, data: d }) },
          payloadSchema: { safeParse: (d: unknown) => ({ success: true, data: d }) },
          describe: () => ({ title: "Publish site", consequence: "No undo.", undoable: false }),
          execute: h.execute,
        }
      : undefined,
}));
vi.mock("@/server/services/rate-limiter", () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 19, resetAt: Date.now() + 60000 }),
}));

import { actionsRouter } from "../actions";

const ctx = { session: { user: { id: "u1" } }, prisma: {}, bearer: null, headers: undefined } as never;
const caller = () => actionsRouter.createCaller(ctx);

describe("actions router", () => {
  beforeEach(() => {
    h.checkSiteRole.mockReset();
    h.createConfirmation.mockClear();
    h.consumeConfirmation.mockReset();
    h.execute.mockClear();
  });

  it("propose checks the action's role (ADMIN) and issues a token", async () => {
    h.checkSiteRole.mockResolvedValueOnce(undefined);
    const r = await caller().propose({ siteId: "s1", actionId: "site.publish" });
    expect(h.checkSiteRole).toHaveBeenCalledWith({}, "u1", "s1", "ADMIN");
    expect(r.token).toBe("tok-1");
    expect(r.confirm.undoable).toBe(false);
  });

  it("propose rejects a non-admin at propose time (not after confirm)", async () => {
    h.checkSiteRole.mockRejectedValueOnce(new h.PermissionError("FORBIDDEN", "Insufficient permissions"));
    await expect(caller().propose({ siteId: "s1", actionId: "site.publish" })).rejects.toThrow(/Insufficient/);
    expect(h.createConfirmation).not.toHaveBeenCalled();
  });

  it("propose rejects an unknown action", async () => {
    await expect(caller().propose({ siteId: "s1", actionId: "site.delete" })).rejects.toThrow(/Unknown action/);
  });

  it("confirm consumes the grant and executes through the domain path", async () => {
    h.consumeConfirmation.mockResolvedValueOnce({ ok: true, claims: { siteId: "s1", actionId: "site.publish", argsHash: "x" } });
    const r = (await caller().confirm({ token: "tok-1", payload: { pages: [] } })) as { id: string };
    expect(h.consumeConfirmation).toHaveBeenCalledWith("tok-1", "u1");
    expect(h.execute).toHaveBeenCalled();
    expect(r.id).toBe("job-1");
  });

  it("confirm REJECTS a replayed/invalid grant (consume not-ok) and never executes", async () => {
    h.consumeConfirmation.mockResolvedValueOnce({ ok: false, reason: "invalid-used-or-expired" });
    await expect(caller().confirm({ token: "tok-1" })).rejects.toThrow(/Invalid confirmation/);
    expect(h.execute).not.toHaveBeenCalled();
  });
});
