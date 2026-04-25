import { describe, it, expect, vi, beforeEach } from "vitest";

const { checkQuota, recordUsage, streamContent } = vi.hoisted(() => ({
  checkQuota: vi.fn(),
  recordUsage: vi.fn(),
  streamContent: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/rate-limiter", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
}));
vi.mock("@/server/services/quota.service", () => ({ checkQuota, recordUsage }));
vi.mock("@/server/services/ai.service", () => ({
  streamContent,
  generateContent: vi.fn(),
  generatePage: vi.fn(),
  generateLayout: vi.fn(),
  summarizeChanges: vi.fn(),
  suggestMilestone: vi.fn(),
}));

import { aiRouter } from "@server/trpc/routers/ai";
import { TRPCError } from "@trpc/server";

const callerCtx = { session: { user: { id: "user-1" } } } as never;

describe("ai router", () => {
  beforeEach(() => {
    checkQuota.mockReset();
    recordUsage.mockReset();
    streamContent.mockReset();
  });

  it("getQuotaStatus returns current quota", async () => {
    checkQuota.mockResolvedValueOnce({ ok: true, used: 3, limit: 200, resetsAt: new Date() });
    const caller = aiRouter.createCaller(callerCtx);
    const result = await caller.getQuotaStatus();
    expect(result.used).toBe(3);
    expect(result.limit).toBe(200);
  });

  it("streamPrompt throws TOO_MANY_REQUESTS when quota exhausted", async () => {
    checkQuota.mockResolvedValueOnce({ ok: false, used: 10, limit: 10, resetsAt: new Date() });
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
    checkQuota.mockResolvedValueOnce({ ok: true, used: 0, limit: 200, resetsAt: new Date() });
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
    expect(recordUsage).toHaveBeenCalledWith("user-1", "claude-sonnet-4-6");
  });
});
