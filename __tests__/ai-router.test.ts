import { describe, it, expect, vi, beforeEach } from "vitest";

const { checkQuota, reserveQuota, resolveModelForUser, recordUsage, streamContent } = vi.hoisted(() => ({
  checkQuota: vi.fn(),
  reserveQuota: vi.fn(),
  resolveModelForUser: vi.fn(),
  recordUsage: vi.fn(),
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
  recordUsage,
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
    recordUsage.mockReset();
    streamContent.mockReset();
    // Server resolves the model from the user's tier; the client model is a
    // hint. Default to echoing the requested model for these tests.
    resolveModelForUser.mockResolvedValue("claude-sonnet-4-6");
  });

  it("getQuotaStatus returns current quota", async () => {
    checkQuota.mockResolvedValueOnce({ ok: true, used: 3, limit: 200, resetsAt: new Date() });
    const caller = aiRouter.createCaller(callerCtx);
    const result = await caller.getQuotaStatus();
    expect(result.used).toBe(3);
    expect(result.limit).toBe(200);
  });

  it("streamPrompt throws TOO_MANY_REQUESTS when quota exhausted", async () => {
    reserveQuota.mockResolvedValueOnce({ ok: false, used: 10, limit: 10, resetsAt: new Date() });
    const caller = aiRouter.createCaller(callerCtx);
    let caught: TRPCError | null = null;
    try {
      const sub = await caller.streamPrompt({
        prompt: "hi",
        scope: { kind: "element", id: "el-1" },
        model: "claude-sonnet-4-6",
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
    recordUsage.mockResolvedValueOnce(undefined);

    const caller = aiRouter.createCaller(callerCtx);
    const sub = await caller.streamPrompt({
      prompt: "hi",
      scope: { kind: "element", id: "el-1" },
      model: "claude-sonnet-4-6",
    });
    const collected: unknown[] = [];
    for await (const chunk of sub) collected.push(chunk);
    expect(collected.length).toBe(2);
    // Usage is now accounted by reserveQuota (reserve-then-stream), not a
    // separate recordUsage call — the router resolves the model server-side
    // and reserves against it.
    expect(reserveQuota).toHaveBeenCalledWith("user-1", "claude-sonnet-4-6");
  });
});
