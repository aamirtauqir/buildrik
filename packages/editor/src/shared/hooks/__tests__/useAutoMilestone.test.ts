/**
 * useAutoMilestone tests — milestone suggestions driven by composer events:
 * element_deleted / page_added triggers, checkpoint-threshold counting,
 * mass-change detection, cooldown, and accept/dismiss/edit flows.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAutoMilestone } from "../useAutoMilestone";
import { EVENTS } from "../../constants/events";
import type { Composer } from "../../../engine";

type Handler = (payload?: unknown) => void;

interface HistoryEntry {
  id: string;
  label: string;
  timestamp: number;
  type: string;
  changes: { property: string; operation: string; description?: string }[];
}

function createMockComposer() {
  const listeners = new Map<string, Set<Handler>>();
  return {
    on: vi.fn((event: string, cb: Handler) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: Handler) => {
      listeners.get(event)?.delete(cb);
    }),
    emit: (event: string, payload?: unknown) => {
      listeners.get(event)?.forEach((cb) => cb(payload));
    },
    history: {
      getHistoryStack: vi.fn((): HistoryEntry[] => []),
    },
    versions: {
      isAvailable: vi.fn(() => true),
      createVersion: vi.fn().mockResolvedValue(undefined),
    },
    exportProject: vi.fn(() => ({ pages: [] as { root: { id: string } }[] })),
  };
}

const asComposer = (m: ReturnType<typeof createMockComposer>) => m as unknown as Composer;

function stubSuggestFetch(suggestedName = "Milestone A", reasoning = "big change") {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ result: { data: { suggestedName, reasoning } } }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useAutoMilestone — availability", () => {
  it("null composer → unavailable, no suggestion", () => {
    const { result } = renderHook(() => useAutoMilestone(null));
    expect(result.current.isAvailable).toBe(false);
    expect(result.current.suggestion).toBeNull();
  });

  it("mirrors versions.isAvailable()", () => {
    const composer = createMockComposer();
    composer.versions.isAvailable.mockReturnValue(false);
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));
    expect(result.current.isAvailable).toBe(false);
  });
});

describe("useAutoMilestone — triggers", () => {
  it("ELEMENT_DELETED requests a suggestion (trigger element_deleted)", async () => {
    const fetchMock = stubSuggestFetch("Removed old hero");
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "el-1" }));

    await waitFor(() => expect(result.current.suggestion).not.toBeNull());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trpc/ai.milestoneSuggest",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.current.suggestion).toEqual({
      suggestedName: "Removed old hero",
      reasoning: "big change",
      trigger: "element_deleted",
    });
  });

  it("PAGE_CREATED requests a suggestion (trigger page_added)", async () => {
    stubSuggestFetch();
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await act(async () => composer.emit(EVENTS.PAGE_CREATED, { pageId: "p1" }));
    await waitFor(() => expect(result.current.suggestion?.trigger).toBe("page_added"));
  });

  it("enforces the 30s cooldown between suggestions", async () => {
    const fetchMock = stubSuggestFetch();
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "a" }));
    await waitFor(() => expect(result.current.suggestion).not.toBeNull());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "b" }));
    expect(fetchMock).toHaveBeenCalledTimes(1); // suppressed by cooldown
  });

  it("fires checkpoint_threshold after 10 consecutive 'Auto:' records", async () => {
    const fetchMock = stubSuggestFetch();
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await act(async () => {
      for (let i = 0; i < 9; i++) {
        composer.emit(EVENTS.HISTORY_RECORDED, { label: `Auto: checkpoint ${i}` });
      }
    });
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => composer.emit(EVENTS.HISTORY_RECORDED, { label: "Auto: checkpoint 9" }));
    await waitFor(() => expect(result.current.suggestion?.trigger).toBe("checkpoint_threshold"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("a manual (non-Auto) record resets the checkpoint counter", async () => {
    const fetchMock = stubSuggestFetch();
    const composer = createMockComposer();
    renderHook(() => useAutoMilestone(asComposer(composer)));

    await act(async () => {
      for (let i = 0; i < 5; i++) {
        composer.emit(EVENTS.HISTORY_RECORDED, { label: `Auto: checkpoint ${i}` });
      }
      composer.emit(EVENTS.HISTORY_RECORDED, { label: "Moved hero" }); // reset
      for (let i = 0; i < 5; i++) {
        composer.emit(EVENTS.HISTORY_RECORDED, { label: `Auto: checkpoint ${i}` });
      }
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fires mass_change when a patch flips >=50% of the fallback schema", async () => {
    const fetchMock = stubSuggestFetch();
    const composer = createMockComposer();
    // 8 distinct properties >= 15 * 0.5 (fallback schema size)
    composer.history.getHistoryStack.mockReturnValue([
      {
        id: "h1",
        label: "Restyle card",
        timestamp: Date.now(),
        type: "patch",
        changes: Array.from({ length: 8 }, (_, i) => ({
          property: `styles.prop${i}`,
          operation: "update",
        })),
      },
    ]);

    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await act(async () => composer.emit(EVENTS.HISTORY_RECORDED, { label: "Restyle card" }));
    await waitFor(() => expect(result.current.suggestion?.trigger).toBe("mass_change"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("small patches do NOT fire mass_change", async () => {
    const fetchMock = stubSuggestFetch();
    const composer = createMockComposer();
    composer.history.getHistoryStack.mockReturnValue([
      {
        id: "h1",
        label: "Tweak color",
        timestamp: Date.now(),
        type: "patch",
        changes: [{ property: "styles.color", operation: "update" }],
      },
    ]);

    renderHook(() => useAutoMilestone(asComposer(composer)));
    await act(async () => composer.emit(EVENTS.HISTORY_RECORDED, { label: "Tweak color" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails silently when the AI endpoint errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "a" }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.suggestion).toBeNull();
  });
});

describe("useAutoMilestone — suggestion actions", () => {
  async function withSuggestion() {
    stubSuggestFetch("Suggested name");
    const composer = createMockComposer();
    const rendered = renderHook(() => useAutoMilestone(asComposer(composer)));
    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "x" }));
    await waitFor(() => expect(rendered.result.current.suggestion).not.toBeNull());
    return { composer, ...rendered };
  }

  it("dismiss clears the suggestion without saving", async () => {
    const { result, composer } = await withSuggestion();
    act(() => result.current.dismiss());
    expect(result.current.suggestion).toBeNull();
    expect(composer.versions.createVersion).not.toHaveBeenCalled();
  });

  it("accept(null) saves under the suggested name and clears", async () => {
    const { result, composer } = await withSuggestion();
    await act(async () => result.current.accept(null));
    expect(composer.versions.createVersion).toHaveBeenCalledWith("Suggested name");
    expect(result.current.suggestion).toBeNull();
  });

  it("accept('Custom') overrides the name", async () => {
    const { result, composer } = await withSuggestion();
    await act(async () => result.current.accept("Custom"));
    expect(composer.versions.createVersion).toHaveBeenCalledWith("Custom");
  });

  it("edit renames the pending suggestion in place", async () => {
    const { result } = await withSuggestion();
    act(() => result.current.edit("Renamed"));
    expect(result.current.suggestion?.suggestedName).toBe("Renamed");
    expect(result.current.suggestion?.trigger).toBe("element_deleted");
  });
});
