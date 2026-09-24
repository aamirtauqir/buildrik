import { describe, it, expect, vi, beforeEach } from "vitest";

const { checkQuota, reserveQuota, resolveModelForUser, streamContent } = vi.hoisted(() => ({
  checkQuota: vi.fn(),
  reserveQuota: vi.fn(),
  resolveModelForUser: vi.fn(),
  streamContent: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/rate-limiter", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
}));
vi.mock("@/server/services/quota.service", () => ({
  checkQuota,
  reserveQuota,
  resolveModelForUser,
}));
vi.mock("@/server/services/ai.service", () => ({
  streamContent,
  generateContent: vi.fn(),
  generatePage: vi.fn(),
  generateLayout: vi.fn(),
  summarizeChanges: vi.fn(),
  suggestMilestone: vi.fn(),
  // W3 provider-key guard — no-op in tests (no real API keys configured).
  assertProviderConfigured: vi.fn(),
}));

import { aiRouter } from "@server/trpc/routers/ai";
import { TRPCError } from "@trpc/server";

const callerCtx = { session: { user: { id: "user-1" } } } as never;

describe("ai router", () => {
  beforeEach(() => {
    checkQuota.mockReset();
    reserveQuota.mockReset();
    resolveModelForUser.mockReset();
    streamContent.mockReset();
    // Server resolves the model from the user's tier; the client model is a
    // hint. Default to echoing the requested model for these tests.
    resolveModelForUser.mockResolvedValue("gpt-4o-mini");
  });

  /* G2-129: the panel counter reads the SAME check the daily limit enforces. */
  it("quota returns { used, limit, resetsAt } from the enforcing check, for the caller", async () => {
    const resetsAt = new Date("2026-09-25T00:00:00Z");
    checkQuota.mockResolvedValueOnce({ ok: true, used: 3, limit: 200, resetsAt });
    const caller = aiRouter.createCaller(callerCtx);
    await expect(caller.quota()).resolves.toEqual({ used: 3, limit: 200, resetsAt });
    expect(checkQuota).toHaveBeenCalledWith(callerCtx.session.user.id);
  });

  it("quota passes an unlimited plan through as limit -1", async () => {
    checkQuota.mockResolvedValueOnce({ ok: true, used: 41, limit: -1, resetsAt: new Date() });
    const caller = aiRouter.createCaller(callerCtx);
    await expect(caller.quota()).resolves.toMatchObject({ used: 41, limit: -1 });
  });

  it("quota at the limit still reads (the counter shows 'N of N')", async () => {
    checkQuota.mockResolvedValueOnce({ ok: false, used: 10, limit: 10, resetsAt: new Date() });
    const caller = aiRouter.createCaller(callerCtx);
    await expect(caller.quota()).resolves.toMatchObject({ used: 10, limit: 10 });
  });

  it("content endpoint reserves quota and refuses when exhausted (G5)", async () => {
    reserveQuota.mockResolvedValueOnce({ ok: false, used: 10, limit: 10, resetsAt: new Date() });
    const caller = aiRouter.createCaller(callerCtx);
    await expect(
      caller.content({ prompt: "write copy", type: "content" }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(reserveQuota).toHaveBeenCalled();
  });

  it("streamPrompt throws TOO_MANY_REQUESTS when quota exhausted", async () => {
    reserveQuota.mockResolvedValueOnce({ ok: false, used: 10, limit: 10, resetsAt: new Date() });
    const caller = aiRouter.createCaller(callerCtx);
    let caught: TRPCError | null = null;
    try {
      const sub = await caller.streamPrompt({
        prompt: "hi",
        scope: { kind: "element", id: "el-1" },
        model: "gpt-4o-mini",
      });
      const iter = sub[Symbol.asyncIterator]();
      await iter.next();
    } catch (err) {
      caught = err as TRPCError;
    }
    expect(caught).not.toBeNull();
    expect(caught!.code).toBe("TOO_MANY_REQUESTS");
  });

  it("streamPrompt records usage on success", async () => {
    reserveQuota.mockResolvedValueOnce({ ok: true, used: 0, limit: 200, resetsAt: new Date() });
    streamContent.mockImplementationOnce(async function* () {
      yield { type: "text", text: "hi" };
      yield { type: "done" };
    });

    const caller = aiRouter.createCaller(callerCtx);
    const sub = await caller.streamPrompt({
      prompt: "hi",
      scope: { kind: "element", id: "el-1" },
      model: "gpt-4o-mini",
    });
    const collected: unknown[] = [];
    for await (const chunk of sub) collected.push(chunk);
    expect(collected.length).toBe(2);
    // Usage is now accounted by reserveQuota (reserve-then-stream), not a
    // separate recordUsage call — the router resolves the model server-side
    // and reserves against it.
    expect(reserveQuota).toHaveBeenCalledWith("user-1", "gpt-4o-mini");
  });
});
