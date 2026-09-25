import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  checkQuota, reserveQuota, releaseQuota, resolveModelForUser, streamContent,
  summarizeChanges, suggestMilestone, generateContent, generatePage, generateLayout,
  generatePlan, generateEditCommands, assertProviderConfigured,
} = vi.hoisted(() => ({
  checkQuota: vi.fn(),
  reserveQuota: vi.fn(),
  releaseQuota: vi.fn(),
  resolveModelForUser: vi.fn(),
  streamContent: vi.fn(),
  summarizeChanges: vi.fn(),
  suggestMilestone: vi.fn(),
  generateContent: vi.fn(),
  generatePage: vi.fn(),
  generateLayout: vi.fn(),
  generatePlan: vi.fn(),
  generateEditCommands: vi.fn(),
  assertProviderConfigured: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/rate-limiter", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
}));
vi.mock("@/server/services/quota.service", () => ({
  checkQuota,
  reserveQuota,
  releaseQuota,
  resolveModelForUser,
}));
vi.mock("@/server/services/ai.service", () => ({
  streamContent,
  generateContent,
  generatePage,
  generateLayout,
  generatePlan,
  generateEditCommands,
  generatePageEditCommands: vi.fn(),
  generateComponentSchema: vi.fn(),
  summarizeChanges,
  suggestMilestone,
  editCommandToRow: (c: unknown) => c,
  // W3 provider-key guard — defaults to a no-op; individual tests override.
  assertProviderConfigured,
}));

import { aiRouter } from "@server/trpc/routers/ai";
import { TRPCError } from "@trpc/server";

const callerCtx = { session: { user: { id: "user-1" } } } as never;

describe("ai router", () => {
  beforeEach(() => {
    checkQuota.mockReset();
    reserveQuota.mockReset();
    releaseQuota.mockReset();
    resolveModelForUser.mockReset();
    streamContent.mockReset();
    summarizeChanges.mockReset();
    suggestMilestone.mockReset();
    generateContent.mockReset();
    generatePage.mockReset();
    generateLayout.mockReset();
    generatePlan.mockReset();
    generateEditCommands.mockReset();
    assertProviderConfigured.mockReset();
    // Server resolves the model from the user's tier; the client model is a
    // hint. Default to echoing the requested model for these tests.
    resolveModelForUser.mockResolvedValue("gpt-4o-mini");
    reserveQuota.mockResolvedValue({ ok: true, used: 0, limit: 200, resetsAt: new Date() });
  });

  const validChanges = {
    elementName: "hero",
    summary: { style: 1, text: 0, layout: 0, content: 0, other: 0 },
    changes: [{ type: "style" as const, property: "color", before: "#000", after: "#fff" }],
  };

  it("summarize reserves quota and refuses when exhausted (S-8)", async () => {
    reserveQuota.mockResolvedValueOnce({ ok: false, used: 10, limit: 10, resetsAt: new Date() });
    const caller = aiRouter.createCaller(callerCtx);
    await expect(
      caller.summarize({ versionName: "v1", changes: validChanges }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(reserveQuota).toHaveBeenCalled();
    expect(summarizeChanges).not.toHaveBeenCalled();
  });

  it("summarize rejects an oversized property/before/after string (S-8)", async () => {
    const caller = aiRouter.createCaller(callerCtx);
    await expect(
      caller.summarize({
        versionName: "v1",
        changes: {
          ...validChanges,
          changes: [{ type: "style", property: "x".repeat(101), before: "a", after: "b" }],
        },
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("summarize never echoes the provider's raw error message (S-8)", async () => {
    summarizeChanges.mockRejectedValueOnce(new Error("sk-super-secret-provider-detail"));
    const caller = aiRouter.createCaller(callerCtx);
    await expect(
      caller.summarize({ versionName: "v1", changes: validChanges }),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Summary generation failed",
    });
    expect(releaseQuota).toHaveBeenCalledWith("user-1");
  });

  it("milestoneSuggest reserves quota and refuses when exhausted (S-8)", async () => {
    reserveQuota.mockResolvedValueOnce({ ok: false, used: 10, limit: 10, resetsAt: new Date() });
    const caller = aiRouter.createCaller(callerCtx);
    await expect(
      caller.milestoneSuggest({ recentChanges: [] }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(suggestMilestone).not.toHaveBeenCalled();
  });

  it("milestoneSuggest never echoes the provider's raw error message (S-8)", async () => {
    suggestMilestone.mockRejectedValueOnce(new Error("sk-super-secret-provider-detail"));
    const caller = aiRouter.createCaller(callerCtx);
    await expect(
      caller.milestoneSuggest({ recentChanges: [] }),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Milestone suggestion failed",
    });
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

  // S-8 round 2 (controller review): content/page/layout still echoed
  // e.message, and never released quota on failure — only summarize/
  // milestoneSuggest/componentSchema did.
  it.each([
    ["content", () => generateContent, () => ({ prompt: "write copy", type: "content" as const })],
    ["page", () => generatePage, () => ({ pageType: "landing" as const, description: "d", style: "modern" as const })],
    ["layout", () => generateLayout, () => ({ prompt: "hero section" })],
  ] as const)("%s never echoes the provider's raw error message and releases quota on failure", async (name, getMock, input) => {
    getMock().mockRejectedValueOnce(new Error("sk-super-secret-provider-detail"));
    const caller = aiRouter.createCaller(callerCtx);
    let caught: TRPCError | null = null;
    try {
      await (caller[name] as (i: unknown) => Promise<unknown>)(input());
    } catch (err) {
      caught = err as TRPCError;
    }
    expect(caught?.code).toBe("INTERNAL_SERVER_ERROR");
    expect(caught?.message).not.toContain("secret");
    expect(releaseQuota).toHaveBeenCalledWith("user-1");
  });

  it("streamPrompt masks assertProviderConfigured's message behind a fixed string", async () => {
    assertProviderConfigured.mockImplementationOnce(() => {
      throw new Error("AI is not configured: no OpenAI API key on the server.");
    });
    const caller = aiRouter.createCaller(callerCtx);
    let caught: TRPCError | null = null;
    try {
      const sub = await caller.streamPrompt({
        prompt: "hi",
        scope: { kind: "element", id: "el-1" },
        model: "gpt-4o-mini",
      });
      await sub[Symbol.asyncIterator]().next();
    } catch (err) {
      caught = err as TRPCError;
    }
    expect(caught?.code).toBe("PRECONDITION_FAILED");
    expect(caught?.message).toBe("AI provider not configured");
  });

  it("streamPrompt (plan intent) never echoes a raw provider error and releases quota", async () => {
    reserveQuota.mockResolvedValueOnce({ ok: true, used: 0, limit: 200, resetsAt: new Date() });
    generatePlan.mockRejectedValueOnce(new Error("sk-super-secret-provider-detail"));
    const caller = aiRouter.createCaller(callerCtx);
    let caught: TRPCError | null = null;
    try {
      const sub = await caller.streamPrompt({
        prompt: "build a page",
        scope: { kind: "page", elements: [{ id: "el-1", type: "text" }] },
        model: "gpt-4o-mini",
        intent: "plan",
      });
      await sub[Symbol.asyncIterator]().next();
    } catch (err) {
      caught = err as TRPCError;
    }
    expect(caught?.code).toBe("INTERNAL_SERVER_ERROR");
    expect(caught?.message).not.toContain("secret");
    expect(releaseQuota).toHaveBeenCalledWith("user-1");
  });

  it("streamPrompt (style-command intent) never echoes a raw provider error and releases quota", async () => {
    reserveQuota.mockResolvedValueOnce({ ok: true, used: 0, limit: 200, resetsAt: new Date() });
    generateEditCommands.mockRejectedValueOnce(new Error("sk-super-secret-provider-detail"));
    const caller = aiRouter.createCaller(callerCtx);
    let caught: TRPCError | null = null;
    try {
      const sub = await caller.streamPrompt({
        prompt: "make it bold",
        scope: { kind: "element", id: "el-1" },
        model: "gpt-4o-mini",
        intent: "style-command",
      });
      await sub[Symbol.asyncIterator]().next();
    } catch (err) {
      caught = err as TRPCError;
    }
    expect(caught?.code).toBe("INTERNAL_SERVER_ERROR");
    expect(caught?.message).not.toContain("secret");
    expect(releaseQuota).toHaveBeenCalledWith("user-1");
  });

  it("streamPrompt (text stream) never echoes a raw provider error", async () => {
    reserveQuota.mockResolvedValueOnce({ ok: true, used: 0, limit: 200, resetsAt: new Date() });
    streamContent.mockImplementationOnce(async function* () {
      throw new Error("sk-super-secret-provider-detail");
    });
    const caller = aiRouter.createCaller(callerCtx);
    let caught: TRPCError | null = null;
    try {
      const sub = await caller.streamPrompt({
        prompt: "hi",
        scope: { kind: "element", id: "el-1" },
        model: "gpt-4o-mini",
      });
      await sub[Symbol.asyncIterator]().next();
    } catch (err) {
      caught = err as TRPCError;
    }
    expect(caught?.code).toBe("INTERNAL_SERVER_ERROR");
    expect(caught?.message).not.toContain("secret");
  });

  it("rejects an oversized options.tone/length on content (S-8 .max())", async () => {
    const caller = aiRouter.createCaller(callerCtx);
    await expect(
      caller.content({ prompt: "x", type: "content", options: { tone: "y".repeat(101) } }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an oversized sectionType on layout (S-8 .max())", async () => {
    const caller = aiRouter.createCaller(callerCtx);
    await expect(
      caller.layout({ prompt: "x", sectionType: "y".repeat(101) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an oversized milestone recentChanges[].id (S-8 .max())", async () => {
    const caller = aiRouter.createCaller(callerCtx);
    await expect(
      caller.milestoneSuggest({
        recentChanges: [{ id: "x".repeat(101), label: "y", timestamp: 0, type: "patch" }],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an oversized element-scope id on streamPrompt (S-8 .max())", async () => {
    const caller = aiRouter.createCaller(callerCtx);
    await expect(
      caller.streamPrompt({
        prompt: "hi",
        scope: { kind: "element", id: "x".repeat(101) },
        model: "gpt-4o-mini",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
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
