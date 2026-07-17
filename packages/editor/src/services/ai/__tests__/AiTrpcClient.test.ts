/**
 * AiTrpcClient tests — retry policy (408/429/5xx/network only), backoff,
 * rate-limit gate, queue concurrency (3) + priority, cache integration.
 *
 * Encodes audit P1-3 as CURRENT BEHAVIOR: canMakeRequest() is checked at
 * execute() time, but recordRequest() only fires inside the queued task, so
 * a synchronous burst of 31 calls all pass the 30/60s gate.
 *
 * The tRPC boundary is mocked at the @trpc/client module level (the module
 * builds its client internally via createTRPCClient). TRPCClientError stays
 * real so `instanceof` checks in isRetryable() exercise production code.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TRPCClientError } from "@trpc/client";

// Factory only closes over these; dereferenced lazily at call time (TDZ-safe —
// same pattern as buildrik-sync-provider.test.ts).
const mutateMock = {
  content: vi.fn(),
  page: vi.fn(),
  layout: vi.fn(),
};

vi.mock("@trpc/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@trpc/client")>();
  return {
    ...actual,
    createTRPCClient: () => ({
      ai: {
        content: { mutate: (input: unknown) => mutateMock.content(input) },
        page: { mutate: (input: unknown) => mutateMock.page(input) },
        layout: { mutate: (input: unknown) => mutateMock.layout(input) },
      },
    }),
  };
});

/** Build a structurally-real TRPCClientError carrying data.httpStatus. */
function trpcError(httpStatus: number, message = `http ${httpStatus}`) {
  const err: TRPCClientError<never> = Object.create(TRPCClientError.prototype);
  Object.assign(err, { message, name: "TRPCClientError", data: { httpStatus } });
  return err;
}

const contentInput = { prompt: "hello", type: "content" as const };

// Fresh module per test: resets the singleton's RateLimiter window, queue
// state, and the aiCache instance it closes over.
let client: typeof import("../AiTrpcClient").aiTrpcClient;

beforeEach(async () => {
  mutateMock.content.mockReset();
  mutateMock.page.mockReset();
  mutateMock.layout.mockReset();
  vi.resetModules();
  client = (await import("../AiTrpcClient")).aiTrpcClient;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AiTrpcClient success paths", () => {
  it("generateContent resolves through ai.content.mutate and surfaces tokensUsed", async () => {
    mutateMock.content.mockResolvedValue({ content: "generated", tokensUsed: 42 });

    const res = await client.generateContent(contentInput);

    expect(mutateMock.content).toHaveBeenCalledExactlyOnceWith(contentInput);
    expect(res.data).toEqual({ content: "generated", tokensUsed: 42 });
    expect(res.cached).toBe(false);
    expect(res.tokensUsed).toBe(42);
    expect(typeof res.duration).toBe("number");
  });

  it("generatePage and generateLayout route to their own mutations", async () => {
    mutateMock.page.mockResolvedValue({ sections: [{ type: "hero", html: "<div/>" }] });
    mutateMock.layout.mockResolvedValue({ html: "<section/>" });

    const pageInput = {
      pageType: "landing" as const,
      description: "d",
      style: "modern" as const,
    };
    const layoutInput = { prompt: "grid" };

    const page = await client.generatePage(pageInput);
    const layout = await client.generateLayout(layoutInput);

    expect(mutateMock.page).toHaveBeenCalledExactlyOnceWith(pageInput);
    expect(mutateMock.layout).toHaveBeenCalledExactlyOnceWith(layoutInput);
    expect(page.data.sections).toHaveLength(1);
    expect(layout.data.html).toBe("<section/>");
  });

  it("serves the second identical request from cache without re-calling the mutation", async () => {
    mutateMock.content.mockResolvedValue({ content: "v1", tokensUsed: 1 });

    const first = await client.generateContent(contentInput);
    const second = await client.generateContent(contentInput);

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(second.data).toEqual({ content: "v1", tokensUsed: 1 });
    expect(mutateMock.content).toHaveBeenCalledTimes(1);
  });

  it("skipCache: true bypasses the cache read", async () => {
    mutateMock.content.mockResolvedValue({ content: "v1", tokensUsed: 1 });

    await client.generateContent(contentInput);
    const second = await client.generateContent(contentInput, { skipCache: true });

    expect(second.cached).toBe(false);
    expect(mutateMock.content).toHaveBeenCalledTimes(2);
  });
});

describe("AiTrpcClient retry policy", () => {
  it.each([400, 401, 403, 422])(
    "does NOT retry a %i — non-idempotent AI mutation would just re-spend credits",
    async (status) => {
      mutateMock.content.mockRejectedValue(trpcError(status, "client fault"));

      await expect(client.generateContent(contentInput)).rejects.toMatchObject({
        code: "API_ERROR",
        message: "client fault",
      });
      expect(mutateMock.content).toHaveBeenCalledTimes(1);
    }
  );

  it("retries a 500 with exponential backoff (1s, then 2s)", async () => {
    vi.useFakeTimers();
    mutateMock.content
      .mockRejectedValueOnce(trpcError(500))
      .mockRejectedValueOnce(trpcError(503))
      .mockResolvedValueOnce({ content: "recovered", tokensUsed: 3 });

    const pending = client.generateContent(contentInput);

    await vi.advanceTimersByTimeAsync(0);
    expect(mutateMock.content).toHaveBeenCalledTimes(1);

    // Backoff attempt 1: RETRY_DELAY * 2^0 = 1000ms — not a tick earlier.
    await vi.advanceTimersByTimeAsync(999);
    expect(mutateMock.content).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(mutateMock.content).toHaveBeenCalledTimes(2);

    // Backoff attempt 2: RETRY_DELAY * 2^1 = 2000ms.
    await vi.advanceTimersByTimeAsync(2000);
    expect(mutateMock.content).toHaveBeenCalledTimes(3);

    await expect(pending).resolves.toMatchObject({
      data: { content: "recovered" },
      cached: false,
    });
  });

  it("retries a 408 request-timeout", async () => {
    vi.useFakeTimers();
    mutateMock.content
      .mockRejectedValueOnce(trpcError(408))
      .mockResolvedValueOnce({ content: "ok", tokensUsed: 1 });

    const pending = client.generateContent(contentInput);
    await vi.advanceTimersByTimeAsync(1000);

    expect(mutateMock.content).toHaveBeenCalledTimes(2);
    await expect(pending).resolves.toMatchObject({ data: { content: "ok" } });
  });

  it("retries a 429 by structured httpStatus", async () => {
    vi.useFakeTimers();
    mutateMock.content
      .mockRejectedValueOnce(trpcError(429, "slow down"))
      .mockResolvedValueOnce({ content: "ok", tokensUsed: 1 });

    const pending = client.generateContent(contentInput);
    await vi.advanceTimersByTimeAsync(1000);

    expect(mutateMock.content).toHaveBeenCalledTimes(2);
    await expect(pending).resolves.toMatchObject({ data: { content: "ok" } });
  });

  it("a TOO_MANY_REQUESTS message maps to RATE_LIMITED and waits its retryAfter (60s)", async () => {
    vi.useFakeTimers();
    mutateMock.content
      .mockRejectedValueOnce(new Error("TOO_MANY_REQUESTS"))
      .mockResolvedValueOnce({ content: "ok", tokensUsed: 1 });

    const pending = client.generateContent(contentInput);

    await vi.advanceTimersByTimeAsync(59_999);
    expect(mutateMock.content).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(mutateMock.content).toHaveBeenCalledTimes(2);

    await expect(pending).resolves.toMatchObject({ data: { content: "ok" } });
  });

  it("retries a plain network error (no structured status)", async () => {
    vi.useFakeTimers();
    mutateMock.content
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce({ content: "ok", tokensUsed: 1 });

    const pending = client.generateContent(contentInput);
    await vi.advanceTimersByTimeAsync(1000);

    expect(mutateMock.content).toHaveBeenCalledTimes(2);
    await expect(pending).resolves.toMatchObject({ data: { content: "ok" } });
  });

  it("gives up after MAX_RETRIES=2 (3 attempts) and rejects with the last error", async () => {
    vi.useFakeTimers();
    mutateMock.content.mockRejectedValue(trpcError(500, "server down"));

    const pending = client.generateContent(contentInput);
    const rejection = expect(pending).rejects.toMatchObject({
      code: "API_ERROR",
      message: "server down",
    });

    await vi.advanceTimersByTimeAsync(1000 + 2000);
    await rejection;
    expect(mutateMock.content).toHaveBeenCalledTimes(3);
  });

  it("honors a retries override of 0 (single attempt)", async () => {
    mutateMock.content.mockRejectedValue(trpcError(500));

    await expect(
      client.generateContent(contentInput, { retries: 0 })
    ).rejects.toMatchObject({ code: "API_ERROR" });
    expect(mutateMock.content).toHaveBeenCalledTimes(1);
  });

  it("BUG FIXED: a hung mutation rejects at its timeout with a TIMEOUT error (not a permanent hang)", async () => {
    vi.useFakeTimers();
    mutateMock.content.mockImplementation(() => new Promise(() => {})); // never settles

    const pending = client.generateContent(contentInput, { timeout: 30_000 });
    const rejection = expect(pending).rejects.toMatchObject({
      code: "TIMEOUT",
      isTimeout: true,
    });

    await vi.advanceTimersByTimeAsync(29_999);
    expect(mutateMock.content).toHaveBeenCalledTimes(1); // one attempt, still pending

    await vi.advanceTimersByTimeAsync(1); // crosses 30s → the timeout fires
    await rejection;
    // Timeout is treated as non-retryable (a hung non-idempotent AI mutation may
    // already have spent credits server-side), so it does NOT re-fire.
    expect(mutateMock.content).toHaveBeenCalledTimes(1);
  });

  it("BUG FIXED: DEFAULT_TIMEOUT (30s) applies when no timeout option is given, freeing the slot", async () => {
    vi.useFakeTimers();
    mutateMock.content.mockImplementation(() => new Promise(() => {})); // never settles

    const first = client.generateContent(contentInput, { skipCache: true });
    const firstRejection = expect(first).rejects.toMatchObject({ code: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(30_000);
    await firstRejection;

    // Slot freed: a follow-up request can now run (mock resolves this time).
    mutateMock.content.mockResolvedValueOnce({ content: "ok", tokensUsed: 1 });
    const second = client.generateContent({ ...contentInput, prompt: "after" }, { skipCache: true });
    await vi.advanceTimersByTimeAsync(0);
    await expect(second).resolves.toMatchObject({ data: { content: "ok" } });
  });
});

describe("AiTrpcClient rate limiter", () => {
  it("rejects the 31st SEQUENTIAL request with RATE_LIMITED before enqueueing", async () => {
    mutateMock.content.mockResolvedValue({ content: "ok", tokensUsed: 1 });

    for (let i = 0; i < 30; i++) {
      await client.generateContent({ ...contentInput, prompt: `p${i}` }, { skipCache: true });
    }
    expect(client.getRateLimitCount()).toBe(30);

    await expect(
      client.generateContent({ ...contentInput, prompt: "p30" }, { skipCache: true })
    ).rejects.toMatchObject({
      code: "RATE_LIMITED",
      isRateLimited: true,
    });
    expect(mutateMock.content).toHaveBeenCalledTimes(30); // 31st never reached the queue
    expect(client.getRetryAfter()).toBeGreaterThan(0);
  });

  it("BUG P1-3 FIXED: a sync burst of 31 calls rejects the 31st — cap holds at admission", async () => {
    mutateMock.content.mockResolvedValue({ content: "ok", tokensUsed: 1 });

    // recordRequest() now fires at execute() time (atomically with the gate
    // check), so a synchronous burst can't slip past the 30/60s cap.
    const burst = Array.from({ length: 31 }, (_, i) =>
      client
        .generateContent({ ...contentInput, prompt: `burst-${i}` }, { skipCache: true })
        .catch((e) => e as { code?: string })
    );

    const results = await Promise.all(burst);
    const rateLimited = results.filter((r) => (r as { code?: string })?.code === "RATE_LIMITED");
    expect(rateLimited).toHaveLength(1); // exactly the 31st is capped
    expect(mutateMock.content).toHaveBeenCalledTimes(30); // only 30 reached the API
    expect(client.getRateLimitCount()).toBe(30); // window holds AT the cap, not over
  });

  it("BUG FIXED: one logical request counts once against the cap even across retries", async () => {
    vi.useFakeTimers();
    mutateMock.content
      .mockRejectedValueOnce(trpcError(500))
      .mockResolvedValueOnce({ content: "ok", tokensUsed: 1 });

    const pending = client.generateContent(contentInput);
    await vi.advanceTimersByTimeAsync(1000);
    await pending;

    expect(mutateMock.content).toHaveBeenCalledTimes(2); // fired twice (one retry)
    expect(client.getRateLimitCount()).toBe(1); // recorded once at admission, not per attempt
  });

  it("getRetryAfter() is 0 when nothing has been recorded", () => {
    expect(client.getRetryAfter()).toBe(0);
  });
});

describe("AiTrpcClient request queue", () => {
  it("runs at most 3 mutations in-flight (concurrency 3)", async () => {
    let inFlight = 0;
    let peak = 0;
    const release: Array<() => void> = [];
    mutateMock.content.mockImplementation(() => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      return new Promise((resolve) => {
        release.push(() => {
          inFlight--;
          resolve({ content: "done", tokensUsed: 0 });
        });
      });
    });

    const all = Array.from({ length: 6 }, (_, i) =>
      client.generateContent({ ...contentInput, prompt: `q${i}` }, { skipCache: true })
    );

    expect(mutateMock.content).toHaveBeenCalledTimes(3);
    expect(client.getQueueLength()).toBe(3);

    release[0]();
    await vi.waitFor(() => expect(mutateMock.content).toHaveBeenCalledTimes(4));
    expect(peak).toBe(3);

    while (release.length > 0) {
      release.shift()!();
      await Promise.resolve();
    }
    await vi.waitFor(() => expect(mutateMock.content).toHaveBeenCalledTimes(6));
    while (release.length > 0) release.shift()!();
    await Promise.all(all);
    expect(peak).toBe(3);
  });

  it("dequeues higher-priority requests first once a slot frees", async () => {
    const started: string[] = [];
    const release = new Map<string, () => void>();
    mutateMock.content.mockImplementation((input) => {
      const { prompt } = input as { prompt: string };
      started.push(prompt);
      // Hold EVERY mutation open so a released slot dequeues exactly one task.
      return new Promise((resolve) => {
        release.set(prompt, () => resolve({ content: "x", tokensUsed: 0 }));
      });
    });

    // Saturate all 3 slots.
    const blockers = Array.from({ length: 3 }, (_, i) =>
      client.generateContent({ ...contentInput, prompt: `blocker-${i}` }, { skipCache: true })
    );
    // Enqueue low first, high second — high must jump the line.
    const low = client.generateContent(
      { ...contentInput, prompt: "low" },
      { skipCache: true, priority: 0 }
    );
    const high = client.generateContent(
      { ...contentInput, prompt: "high" },
      { skipCache: true, priority: 10 }
    );
    expect(client.getQueueLength()).toBe(2);

    release.get("blocker-0")!();
    await vi.waitFor(() => expect(started).toContain("high"));
    expect(started).not.toContain("low"); // low is still queued behind high

    release.get("blocker-1")!();
    await vi.waitFor(() => expect(started).toContain("low"));
    expect(started.indexOf("high")).toBeLessThan(started.indexOf("low"));

    release.get("blocker-2")!();
    release.get("high")!();
    release.get("low")!();
    await Promise.all([...blockers, low, high]);
  });

  it("clearQueue() drops queued (not yet started) requests", async () => {
    mutateMock.content.mockImplementation(() => new Promise(() => {})); // hold slots

    for (let i = 0; i < 5; i++) {
      void client
        .generateContent({ ...contentInput, prompt: `held-${i}` }, { skipCache: true })
        .catch(() => {});
    }
    expect(client.getQueueLength()).toBe(2);

    client.clearQueue();
    expect(client.getQueueLength()).toBe(0);
  });
});
