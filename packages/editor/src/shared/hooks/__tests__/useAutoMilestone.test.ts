/**
 * useAutoMilestone tests — milestone suggestions driven by composer events:
 * element_deleted / page_added triggers, checkpoint-threshold counting,
 * mass-change detection, cooldown, and accept/dismiss/edit flows.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
const suggestMilestone = vi.hoisted(() => vi.fn());
vi.mock("@/services/ai/AiTrpcClient", () => ({ aiTrpcClient: { suggestMilestone } }));

const mockGetSiteId = vi.hoisted(() => vi.fn((): string | null => null));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: mockGetSiteId }));

import { useAutoMilestone } from "../useAutoMilestone";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "@/engine";

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
    /* The hook reads `elements.getAllElements()` for the AI prompt's element
       count. That count used to be hardcoded `0`, so the mock never needed
       this — and the moment it stopped being hardcoded, every suggestion test
       threw here instead of asserting anything. */
    elements: {
      getAllElements: vi.fn(() => [] as unknown[]),
    },
  };
}

const asComposer = (m: ReturnType<typeof createMockComposer>) => m as unknown as Composer;

/* The hook's return value is AiTrpcClient's AIResponse — the parsed data,
   not the `{ result: { data } }` HTTP envelope the old mock invented (and
   that the superjson router never sent). */
function stubSuggest(suggestedName = "Milestone A", reasoning = "big change") {
  suggestMilestone.mockResolvedValue({ data: { suggestedName, reasoning }, cached: false, duration: 1 });
  return suggestMilestone;
}

beforeEach(() => {
  suggestMilestone.mockReset();
  mockGetSiteId.mockReset();
  mockGetSiteId.mockReturnValue(null);
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/* Carries the significance threshold (MIN_CHANGES_SINCE_LAST_SUGGESTION = 5
   in the hook) — no exemption applies to a first attempt any more, so every
   test that expects a suggestion to fire on the very first qualifying event
   has to earn that with real recorded activity first, same as production
   would require. Emits a bare HISTORY_RECORDED with no label so it neither
   resets nor advances the checkpoint counter — only the significance ref. */
async function armSignificance(composer: ReturnType<typeof createMockComposer>, n = 5) {
  for (let i = 0; i < n; i++) {
    await act(async () => composer.emit(EVENTS.HISTORY_RECORDED, {}));
  }
}

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
    const suggestMock = stubSuggest("Removed old hero");
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await armSignificance(composer);
    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "el-1" }));

    await waitFor(() => expect(result.current.suggestion).not.toBeNull());
    expect(suggestMilestone).toHaveBeenCalledWith(
      { recentChanges: [], pageStructure: { pageCount: 0, elementCount: 0 } },
      { retries: 0 },
    );
    expect(result.current.suggestion).toEqual({
      suggestedName: "Removed old hero",
      reasoning: "big change",
      trigger: "element_deleted",
    });
  });

  /* The engine has no bare PAGE_CREATED — a new page arrives as
     PROJECT_CHANGED { type: "page:created" }, so this trigger never fired. */
  it("a created page requests a suggestion (trigger page_added)", async () => {
    stubSuggest("Added pricing page");
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await armSignificance(composer);
    await act(async () => composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:created" }));

    await waitFor(() => expect(result.current.suggestion?.trigger).toBe("page_added"));
  });

  it("ignores PROJECT_CHANGED for anything that is not a page create", async () => {
    const suggestMock = stubSuggest();
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await act(async () => composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:activated" }));

    expect(suggestMock).not.toHaveBeenCalled();
    expect(result.current.suggestion).toBeNull();
  });


  it("enforces the 10-minute cooldown between suggestions (carry-over 15: raised from 30s)", async () => {
    const suggestMock = stubSuggest();
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await armSignificance(composer);
    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "a" }));
    await waitFor(() => expect(result.current.suggestion).not.toBeNull());
    expect(suggestMock).toHaveBeenCalledTimes(1);

    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "b" }));
    expect(suggestMock).toHaveBeenCalledTimes(1); // suppressed by cooldown
  });

  it("carry-over 15: a run of failed attempts still arms the cooldown — a flaky/quota-exhausted endpoint can't disable the gate", async () => {
    suggestMilestone.mockRejectedValue(new Error("quota exceeded"));
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await armSignificance(composer);
    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "a" }));
    await waitFor(() => expect(suggestMilestone).toHaveBeenCalledTimes(1));
    expect(result.current.suggestion).toBeNull();

    // A second qualifying event immediately after the failed attempt must
    // NOT retry — the old code only armed the cooldown on success, so a
    // failure left it retrying on every subsequent qualifying event.
    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "b" }));
    expect(suggestMilestone).toHaveBeenCalledTimes(1);
  });

  it("carry-over 15: never requests a suggestion while the tab is hidden", async () => {
    const suggestMock = stubSuggest();
    const composer = createMockComposer();
    const visibilitySpy = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    renderHook(() => useAutoMilestone(asComposer(composer)));

    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "a" }));
    expect(suggestMock).not.toHaveBeenCalled();

    visibilitySpy.mockRestore();
  });

  it("carry-over 15: requires the significance threshold on the FIRST attempt too — no exemption", async () => {
    // Fake ONLY Date — real setTimeout/setInterval stay so `waitFor`'s
    // internal polling keeps working (faking the whole clock leaves
    // `waitFor` polling a clock that never advances, which hangs the test
    // for its full real-time timeout and corrupts every test after it,
    // since the timeout races past this function's `finally`).
    vi.useFakeTimers({ toFake: ["Date"] });
    const suggestMock = stubSuggest();
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    // A remount reset lastSuggestionTime to 0 before, and an exempted first
    // attempt made that indistinguishable from "the gate never armed" — the
    // exact bypass carry-over 15 closes. With no exemption, a
    // qualifying event with NO recorded activity yet must be withheld.
    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "a" }));
    expect(suggestMock).not.toHaveBeenCalled();

    // Once real activity accumulates, the (still-first) attempt goes through.
    await armSignificance(composer);
    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "b" }));
    await waitFor(() => expect(result.current.suggestion).not.toBeNull());
    expect(suggestMock).toHaveBeenCalledTimes(1);

    // Cooldown elapses, but nothing was recorded in between — the next
    // attempt must still be withheld on significance, not just cooldown.
    vi.setSystemTime(Date.now() + 11 * 60_000);
    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "c" }));
    expect(suggestMock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("carry-over 15: lastSuggestionTime survives a remount (persisted per site) — cooldown still holds", async () => {
    mockGetSiteId.mockReturnValue("site-remount-1");
    vi.useFakeTimers({ toFake: ["Date"] });
    const suggestMock = stubSuggest();
    const composer = createMockComposer();
    const first = renderHook(() => useAutoMilestone(asComposer(composer)));

    await armSignificance(composer);
    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "a" }));
    await waitFor(() => expect(first.result.current.suggestion).not.toBeNull());
    expect(suggestMock).toHaveBeenCalledTimes(1);

    // Remount the hook (new component instance — state and refs reset, as a
    // real panel remount does) shortly after, well inside the cooldown.
    first.unmount();
    const second = renderHook(() => useAutoMilestone(asComposer(composer)));

    // Even with fresh in-memory state, the persisted timestamp still blocks
    // — this is the bug: before the fix, a remount read lastSuggestionTime
    // back as 0 and let this straight through.
    await armSignificance(composer);
    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "b" }));
    expect(suggestMock).toHaveBeenCalledTimes(1);

    // Once the real cooldown elapses, the persisted timestamp still allows
    // a legitimate later attempt through.
    vi.setSystemTime(Date.now() + 11 * 60_000);
    await armSignificance(composer);
    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "c" }));
    await waitFor(() => expect(second.result.current.suggestion).not.toBeNull());
    expect(suggestMock).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("fires checkpoint_threshold after 10 consecutive 'Auto:' records", async () => {
    const suggestMock = stubSuggest();
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await act(async () => {
      for (let i = 0; i < 9; i++) {
        composer.emit(EVENTS.HISTORY_RECORDED, { label: `Auto: checkpoint ${i}` });
      }
    });
    expect(suggestMock).not.toHaveBeenCalled();

    await act(async () => composer.emit(EVENTS.HISTORY_RECORDED, { label: "Auto: checkpoint 9" }));
    await waitFor(() => expect(result.current.suggestion?.trigger).toBe("checkpoint_threshold"));
    expect(suggestMock).toHaveBeenCalledTimes(1);
  });

  it("a manual (non-Auto) record resets the checkpoint counter", async () => {
    const suggestMock = stubSuggest();
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

    expect(suggestMock).not.toHaveBeenCalled();
  });

  it("fires mass_change when a patch flips >=50% of the fallback schema", async () => {
    const suggestMock = stubSuggest();
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

    // The mock's history stack is a fixed >=50% patch, so every emit
    // qualifies as mass_change — but the significance threshold still gates
    // each attempt; the 5th of these (each also +1 toward significance) is
    // the one that finally clears it and fires.
    for (let i = 0; i < 5; i++) {
      await act(async () => composer.emit(EVENTS.HISTORY_RECORDED, { label: "Restyle card" }));
    }
    await waitFor(() => expect(result.current.suggestion?.trigger).toBe("mass_change"));
    expect(suggestMock).toHaveBeenCalledTimes(1);
  });

  it("small patches do NOT fire mass_change", async () => {
    const suggestMock = stubSuggest();
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
    expect(suggestMock).not.toHaveBeenCalled();
  });

  it("stays quiet in the UI but warns in the console when the AI call fails", async () => {
    suggestMilestone.mockRejectedValue(new Error("INTERNAL_SERVER_ERROR"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const composer = createMockComposer();
    const { result } = renderHook(() => useAutoMilestone(asComposer(composer)));

    await armSignificance(composer);
    await act(async () => composer.emit(EVENTS.ELEMENT_DELETED, { id: "a" }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.suggestion).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      "[useAutoMilestone] milestone suggestion failed:",
      expect.any(Error),
    );
  });
});

describe("useAutoMilestone — suggestion actions", () => {
  async function withSuggestion() {
    stubSuggest("Suggested name");
    const composer = createMockComposer();
    const rendered = renderHook(() => useAutoMilestone(asComposer(composer)));
    await armSignificance(composer);
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
