/**
 * useAISummary — cached short-circuit, 60s per-version rate limit, fetch
 * success/failure branches, and the cooldown-seconds accessor.
 *
 * Fake timers control both Date.now (rate-limit math) and the deferred
 * cooldown-tick setTimeout so no real 60s timer leaks between tests.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAISummary } from "../useAISummary";
import type { NamedVersion, CompareResult } from "../../../../shared/types/versions";

const BASE = 1_000_000;
const compare = { summary: { added: 1, removed: 0, modified: 0 } } as unknown as CompareResult;

function version(id: string, extra: Partial<NamedVersion> = {}): NamedVersion {
  return { id, name: `Version ${id}`, ...extra } as unknown as NamedVersion;
}

function mockFetchOnce(value: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(value);
  (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(BASE);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useAISummary — cached short-circuit", () => {
  it("surfaces the cached summary without fetching or rate-limiting", async () => {
    const fetchMock = mockFetchOnce({ ok: true, json: async () => ({}) });
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
    expect(fetchMock).not.toHaveBeenCalled();
    // Cached path never records a timestamp → no cooldown incurred.
    expect(result.current.getCooldownSeconds("v1")).toBe(0);
  });
});

describe("useAISummary — fetch branches", () => {
  it("stores the summary and persists it on a successful response", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({ result: { data: { summary: "Concise diff summary" } } }),
    });
    const updateAiSummary = vi.fn().mockResolvedValue(undefined);
    const versions = [version("v1")];

    const { result } = renderHook(() =>
      useAISummary({ versions, compareResults: { v1: compare }, updateAiSummary })
    );

    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });

    expect(updateAiSummary).toHaveBeenCalledWith("v1", "Concise diff summary");
    expect(result.current.aiSummaryStates.v1).toMatchObject({
      loading: false,
      result: "Concise diff summary",
      error: null,
    });
  });

  it("errors when compare data has not loaded yet (no fetch)", async () => {
    const fetchMock = mockFetchOnce({ ok: true, json: async () => ({}) });
    const versions = [version("v1")];

    const { result } = renderHook(() =>
      useAISummary({ versions, compareResults: { v1: null }, updateAiSummary: vi.fn() })
    );

    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.aiSummaryStates.v1.error).toBe("Compare data not loaded yet");
  });

  it("errors when the response is not ok", async () => {
    mockFetchOnce({ ok: false, json: async () => ({}) });
    const versions = [version("v1")];

    const { result } = renderHook(() =>
      useAISummary({ versions, compareResults: { v1: compare }, updateAiSummary: vi.fn() })
    );

    await act(async () => {
      await result.current.handleGetAiSummary("v1");
    });

    expect(result.current.aiSummaryStates.v1.error).toBe("AI summary unavailable");
  });

  it("errors when the response summary is empty", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ result: { data: { summary: "" } } }) });
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
    mockFetchOnce({
      ok: true,
      json: async () => ({ result: { data: { summary: "first" } } }),
    });
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
    mockFetchOnce({
      ok: true,
      json: async () => ({ result: { data: { summary: "x" } } }),
    });
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
