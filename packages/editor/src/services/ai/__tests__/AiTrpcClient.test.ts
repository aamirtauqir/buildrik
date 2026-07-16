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

  it("CURRENT BEHAVIOR: options.timeout / DEFAULT_TIMEOUT are never enforced — request hangs past 30s", async () => {
    vi.useFakeTimers();
    mutateMock.content.mockImplementation(() => new Promise(() => {})); // never settles

    let settled = false;
    const pending = client.generateContent(contentInput, { timeout: 30_000 });
    pending.then(
      () => (settled = true),
      () => (settled = true)
    );

    await vi.advanceTimersByTimeAsync(31_000);
    expect(settled).toBe(false); // no abort, no TIMEOUT error — option is dead
  });

  it.todo(
    "BUG: AIRequestOptions.timeout and DEFAULT_TIMEOUT (30s) are accepted but never wired — execute() ignores timeout and signal, so a hung mutation blocks a concurrency slot forever"
  );
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

  it("CURRENT BEHAVIOR (audit P1-3): a sync burst of 31 calls ALL pass the gate — cap bypassed", async () => {
    mutateMock.content.mockResolvedValue({ content: "ok", tokensUsed: 1 });

    // canMakeRequest() runs at execute() time, but recordRequest() only fires
    // inside the queued task. With concurrency 3, at most 3 requests are
    // recorded during a synchronous burst, so the gate never sees >3.
    const burst = Array.from({ length: 31 }, (_, i) =>
      client.generateContent({ ...contentInput, prompt: `burst-${i}` }, { skipCache: true })
    );

    const results = await Promise.all(burst); // nothing rejects
    expect(results).toHaveLength(31);
    expect(mutateMock.content).toHaveBeenCalledTimes(31); // all 31 hit the API
    expect(client.getRateLimitCount()).toBe(31); // window now OVER the 30 cap
  });

  it.todo(
    "BUG P1-3: rate limiter canMakeRequest() checked at execute-time but recordRequest() only inside queued task — sync burst of 31 calls bypasses the 30/60s cap; record (or reserve) at execute-time"
  );

  it("CURRENT BEHAVIOR: recordRequest() fires per RETRY attempt — one logical request burns multiple slots", async () => {
    vi.useFakeTimers();
    mutateMock.content
      .mockRejectedValueOnce(trpcError(500))
      .mockResolvedValueOnce({ content: "ok", tokensUsed: 1 });

    const pending = client.generateContent(contentInput);
    await vi.advanceTimersByTimeAsync(1000);
    await pending;

    expect(mutateMock.content).toHaveBeenCalledTimes(2);
    expect(client.getRateLimitCount()).toBe(2); // 1 logical request, 2 slots
  });

  it.todo(
    "BUG: recordRequest() inside the attempt loop double-counts retries against the client-side cap — a request that retries twice consumes 3 of the 30 slots"
  );

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
