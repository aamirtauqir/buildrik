/**
 * useAISummary — cached short-circuit, 60s per-version rate limit, the
 * `aiTrpcClient.summarize` success/failure branches, and the cooldown-seconds
 * accessor. (The hook used to hand-roll a plain-JSON fetch the superjson
 * router always refused; the transport itself is proven in
 * services/ai/__tests__/AiTrpcClient.wire.test.ts.)
 *
 * Fake timers control both Date.now (rate-limit math) and the deferred
 * cooldown-tick setTimeout so no real 60s timer leaks between tests.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const summarize = vi.hoisted(() => vi.fn());
vi.mock("@/services/ai/AiTrpcClient", () => ({ aiTrpcClient: { summarize } }));

import { useAISummary } from "../useAISummary";
import type { NamedVersion, CompareResult } from "@/shared/types/versions";

const BASE = 1_000_000;
const compare = {
  elementName: "Page",
  changes: [{ type: "content", property: "Text", before: "", after: "“Hello”" }],
  summary: { added: 1, removed: 0, modified: 0 },
} as unknown as CompareResult;

function version(id: string, extra: Partial<NamedVersion> = {}): NamedVersion {
  return { id, name: `Version ${id}`, ...extra } as unknown as NamedVersion;
}

function summaryResolves(summary: string) {
  summarize.mockResolvedValueOnce({ data: { summary }, cached: false, duration: 1 });
  return summarize;
}

beforeEach(() => {
  summarize.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(BASE);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useAISummary — cached short-circuit", () => {
  it("surfaces the cached summary without fetching or rate-limiting", async () => {
    const updateAiSummary = vi.fn().mockResolvedValue(undefined);
    const versions = [version("v1", { aiSummary: "already summarized" })];

    const { result } = renderHook(() =>
      useAISummary({ versions, compareResults: { v1: compare }, updateAiSummary })
    );

    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });

    expect(result.current.aiSummaryStates.v1).toMatchObject({
      loading: false,
      result: "already summarized",
      error: null,
    });
    expect(summarize).not.toHaveBeenCalled();
    // Cached path never records a timestamp → no cooldown incurred.
    expect(result.current.getCooldownSeconds("v1")).toBe(0);
  });
});

describe("useAISummary — summarize branches", () => {
  it("stores the summary and persists it on a successful response", async () => {
    summaryResolves("Concise diff summary");
    const updateAiSummary = vi.fn().mockResolvedValue(undefined);
    const versions = [version("v1")];

    const { result } = renderHook(() =>
      useAISummary({ versions, compareResults: { v1: compare }, updateAiSummary })
    );

    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });

    expect(summarize).toHaveBeenCalledWith({ versionName: "Version v1", changes: compare });
    expect(updateAiSummary).toHaveBeenCalledWith("v1", "Concise diff summary");
    expect(result.current.aiSummaryStates.v1).toMatchObject({
      loading: false,
      result: "Concise diff summary",
      error: null,
    });
  });

  it("errors when compare data has not loaded yet (no request)", async () => {
    const versions = [version("v1")];

    const { result } = renderHook(() =>
      useAISummary({ versions, compareResults: { v1: null }, updateAiSummary: vi.fn() })
    );

    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });

    expect(summarize).not.toHaveBeenCalled();
    expect(result.current.aiSummaryStates.v1.error).toBe("Compare data not loaded yet");
    /* L5-020: nothing was asked, so nothing is rate-limited — the click used
       to burn the 60-second cooldown before it checked for data. */
    expect(result.current.getCooldownSeconds("v1")).toBe(0);
  });

  it("does not ask the model, or arm the cooldown, when nothing changed", async () => {
    const versions = [version("v1")];
    const empty = { elementName: "x", changes: [], summary: { style: 0, text: 0, layout: 0, content: 0, other: 0, pagesAdded: 0, pagesDeleted: 0 } };
    const { result } = renderHook(() =>
      useAISummary({ versions, compareResults: { v1: empty as never }, updateAiSummary: vi.fn() })
    );
    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });
    expect(summarize).not.toHaveBeenCalled();
    expect(result.current.getCooldownSeconds("v1")).toBe(0);
    expect(result.current.aiSummaryStates.v1.error).toBe("Nothing to summarise: no changes");
  });

  it("errors when the request is refused", async () => {
    summarize.mockRejectedValueOnce(new Error("INTERNAL_SERVER_ERROR"));
    const versions = [version("v1")];

    const { result } = renderHook(() =>
      useAISummary({ versions, compareResults: { v1: compare }, updateAiSummary: vi.fn() })
    );

    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });

    expect(result.current.aiSummaryStates.v1.error).toBe("AI summary unavailable");
  });

  /* versionName is `.min(1)` on the server — "" was a 400 before any model
     call. An unnamed version is summarised as "Untitled". */
  it("sends a name the server accepts for an unnamed version", async () => {
    summaryResolves("ok");
    const versions = [version("v1", { name: "" })];

    const { result } = renderHook(() =>
      useAISummary({ versions, compareResults: { v1: compare }, updateAiSummary: vi.fn().mockResolvedValue(undefined) })
    );
    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });

    expect(summarize).toHaveBeenCalledWith(expect.objectContaining({ versionName: "Untitled" }));
  });

  it("errors when the response summary is empty", async () => {
    summaryResolves("");
    const versions = [version("v1")];

    const { result } = renderHook(() =>
      useAISummary({ versions, compareResults: { v1: compare }, updateAiSummary: vi.fn() })
    );

    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });

    expect(result.current.aiSummaryStates.v1.error).toBe("Empty summary returned");
  });
});

describe("useAISummary — rate limiting", () => {
  it("blocks a second request within the 60s window", async () => {
    summaryResolves("first");
    const versions = [version("v1")];

    const { result } = renderHook(() =>
      useAISummary({ versions, compareResults: { v1: compare }, updateAiSummary: vi.fn().mockResolvedValue(undefined) })
    );

    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });
    // Same fake instant → elapsed 0 < 60_000 → rate-limited.
    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });

    expect(result.current.aiSummaryStates.v1.error).toMatch(/Please wait \d+s/);
  });

  it("getCooldownSeconds counts down from 60 as time passes", async () => {
    summaryResolves("x");
    const versions = [version("v1")];

    const { result } = renderHook(() =>
      useAISummary({ versions, compareResults: { v1: compare }, updateAiSummary: vi.fn().mockResolvedValue(undefined) })
    );

    expect(result.current.getCooldownSeconds("v1")).toBe(0); // never called

    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });
    expect(result.current.getCooldownSeconds("v1")).toBe(60);

    act(() => {
      vi.setSystemTime(BASE + 30_000);
    });
    expect(result.current.getCooldownSeconds("v1")).toBe(30);
  });
});

/* `ai.summarize` refuses more than 200 changes or a before/after over 2000
   characters, and compareVersions caps neither — so any big version came back
   "AI summary unavailable". The hook trims to the server's limits instead. */
describe("useAISummary — server limits", () => {
  it("sends at most 200 changes, each value within 2000 characters", async () => {
    summaryResolves("Big diff");
    const updateAiSummary = vi.fn().mockResolvedValue(undefined);
    const big = {
      elementName: "e".repeat(500),
      summary: { style: 500, text: 0, layout: 0, content: 0, other: 0 },
      changes: Array.from({ length: 500 }, (_, i) => ({
        type: "style",
        property: `p${i}`.padEnd(300, "x"),
        before: "b".repeat(5000),
        after: "a".repeat(5000),
      })),
    } as unknown as CompareResult;
    const { result } = renderHook(() =>
      useAISummary({ versions: [version("v1", { name: "n".repeat(500) })], compareResults: { v1: big }, updateAiSummary })
    );
    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });
    const sent = summarize.mock.calls[0][0] as { versionName: string; changes: CompareResult };
    expect(sent.versionName.length).toBeLessThanOrEqual(200);
    expect(sent.changes.elementName.length).toBeLessThanOrEqual(200);
    expect(sent.changes.changes).toHaveLength(200);
    for (const c of sent.changes.changes) {
      expect(c.before.length).toBeLessThanOrEqual(2000);
      expect(c.after.length).toBeLessThanOrEqual(2000);
      expect(c.property.length).toBeLessThanOrEqual(100);
    }
    // The counts the model reads are untouched.
    expect(sent.changes.summary).toEqual(big.summary);
    expect(result.current.aiSummaryStates.v1).toMatchObject({ result: "Big diff", error: null });
  });
});
