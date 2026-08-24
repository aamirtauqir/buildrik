/**
 * `loadMoreAssets` — the drawer walking the rest of the server library.
 *
 * The guards here are the ones a disabled button cannot provide: `loadingMore`
 * is React state, so two clicks in the same tick both read it as false and both
 * fire. And a response that comes back after a newer one must not write its own
 * older cursor back over the edge that has already moved.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const loadServerMediaMock = vi.fn();
vi.mock("../../../../../../services/BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: () => "s1",
  loadServerMedia: (...a: unknown[]) => loadServerMediaMock(...a),
}));

import { useLibraryState } from "../useLibraryState";
import type { Composer } from "../../../../../../engine/Composer";

function makeComposer(page: { nextCursor: string | null; total: number; loaded: number } | null) {
  let current = page;
  const media = {
    getAssets: vi.fn(() => []),
    getFolders: vi.fn(() => []),
    getAllFolders: vi.fn(() => []),
    getServerPage: vi.fn(() => current),
    setServerPage: vi.fn((p: { nextCursor: string | null; total: number; loaded: number }) => {
      current = p;
    }),
    importServerAssets: vi.fn(async () => {}),
    createFolder: vi.fn(async () => {}),
    deleteFolder: vi.fn(async () => {}),
    renameFolder: vi.fn(async () => {}),
    updateAsset: vi.fn(async () => {}),
    on: vi.fn(),
    off: vi.fn(),
    isInitialized: true,
    initFailure: null,
  };
  return { media } as unknown as Composer;
}

const page = (ids: string[], nextCursor: string | null, total: number | null) => ({
  assets: ids.map((id) => ({ id })),
  folders: [],
  nextCursor,
  total,
});

describe("loadMoreAssets", () => {
  beforeEach(() => {
    loadServerMediaMock.mockReset();
    localStorage.clear();
  });

  it("sends the cursor it holds and advances the edge", async () => {
    const composer = makeComposer({ nextCursor: "c1", total: 412, loaded: 200 });
    loadServerMediaMock.mockResolvedValue(page(["a1"], "c2", null));
    const { result } = renderHook(() => useLibraryState(composer));

    await act(async () => {
      await result.current.loadMoreAssets();
    });

    expect(loadServerMediaMock).toHaveBeenCalledWith("s1", "c1");
    const media = (composer as unknown as { media: { setServerPage: ReturnType<typeof vi.fn> } }).media;
    /* The total carries over: the server counts once per pull, so a later page
       says nothing about how big the library is. */
    expect(media.setServerPage).toHaveBeenCalledWith({ nextCursor: "c2", total: 412, loaded: 201 });
  });

  /* The lock is a ref for exactly this: both calls happen before React can
     re-render with `loadingMore === true`. */
  it("fires ONE request for two presses in the same tick", async () => {
    const composer = makeComposer({ nextCursor: "c1", total: 412, loaded: 200 });
    loadServerMediaMock.mockResolvedValue(page(["a1"], "c2", null));
    const { result } = renderHook(() => useLibraryState(composer));

    await act(async () => {
      await Promise.all([result.current.loadMoreAssets(), result.current.loadMoreAssets()]);
    });

    expect(loadServerMediaMock).toHaveBeenCalledTimes(1);
  });

  /* A response that lands after the edge has already moved still imports its
     assets — they are real — but must not rewind the cursor. */
  it("imports a late response without rewinding the cursor", async () => {
    const composer = makeComposer({ nextCursor: "c1", total: 412, loaded: 200 });
    const media = (composer as unknown as {
      media: {
        setServerPage: ReturnType<typeof vi.fn> & ((p: { nextCursor: string | null; total: number; loaded: number }) => void);
        importServerAssets: ReturnType<typeof vi.fn>;
      };
    }).media;
    loadServerMediaMock.mockImplementation(async () => {
      // Something else advances the edge while this request is in flight.
      media.setServerPage({ nextCursor: "c9", total: 412, loaded: 200 });
      return page(["a1"], "c2", null);
    });
    const { result } = renderHook(() => useLibraryState(composer));

    await act(async () => {
      await result.current.loadMoreAssets();
    });

    expect(media.importServerAssets).toHaveBeenCalled();
    expect(media.setServerPage).toHaveBeenCalledTimes(1); // only the interloper's
    expect(media.setServerPage).not.toHaveBeenCalledWith({ nextCursor: "c2", total: 412, loaded: 201 });
  });

  it("does nothing when there is no cursor left", async () => {
    const composer = makeComposer({ nextCursor: null, total: 200, loaded: 200 });
    const { result } = renderHook(() => useLibraryState(composer));
    await act(async () => {
      await result.current.loadMoreAssets();
    });
    expect(loadServerMediaMock).not.toHaveBeenCalled();
  });

  it("reports a refused page as a retry rather than swallowing it", async () => {
    const composer = makeComposer({ nextCursor: "c1", total: 412, loaded: 200 });
    loadServerMediaMock.mockResolvedValue(null);
    const { result } = renderHook(() => useLibraryState(composer));
    await act(async () => {
      await result.current.loadMoreAssets();
    });
    expect(result.current.loadMoreError).toBe(true);
    expect(result.current.loadingMore).toBe(false);
  });
});

describe("server-backed search", () => {
  beforeEach(() => {
    loadServerMediaMock.mockReset();
    localStorage.clear();
  });

  /* Every filter in this drawer runs on the client over what has been pulled.
     On a 412-asset library that meant a search reached 200 of them and reported
     "Nothing matches" about a file that exists. `listAssets` has always accepted
     a `search`; nothing ever sent it. */
  it("asks the server when the library is not fully loaded", async () => {
    vi.useFakeTimers();
    const composer = makeComposer({ nextCursor: "c1", total: 412, loaded: 200 });
    loadServerMediaMock.mockResolvedValue(page(["hit1"], null, null));
    const { result } = renderHook(() => useLibraryState(composer));

    act(() => result.current.setLibrarySearch("logo"));
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(loadServerMediaMock).toHaveBeenCalledWith("s1", undefined, "logo");
    vi.useRealTimers();
  });

  /* When everything is already local the client filter is the whole truth, and
     a round trip could only return what is already on screen. */
  it("stays local when the whole library is loaded", async () => {
    vi.useFakeTimers();
    const composer = makeComposer({ nextCursor: null, total: 0, loaded: 0 });
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setLibrarySearch("logo"));
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(loadServerMediaMock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("does not go to the server for a single character", async () => {
    vi.useFakeTimers();
    const composer = makeComposer({ nextCursor: "c1", total: 412, loaded: 200 });
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setLibrarySearch("l"));
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(loadServerMediaMock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  /* Typing is a stream of keystrokes; one request per keystroke would be a
     request per letter of every filename anyone ever looks for. */
  it("debounces a burst of typing into one request", async () => {
    vi.useFakeTimers();
    const composer = makeComposer({ nextCursor: "c1", total: 412, loaded: 200 });
    loadServerMediaMock.mockResolvedValue(page(["hit1"], null, null));
    const { result } = renderHook(() => useLibraryState(composer));

    act(() => result.current.setLibrarySearch("lo"));
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.setLibrarySearch("log"));
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.setLibrarySearch("logo"));
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(loadServerMediaMock).toHaveBeenCalledTimes(1);
    expect(loadServerMediaMock).toHaveBeenCalledWith("s1", undefined, "logo");
    vi.useRealTimers();
  });
});

describe("server-backed search — the states it can honestly report", () => {
  beforeEach(() => {
    loadServerMediaMock.mockReset();
    localStorage.clear();
  });

  /* Reading `serverPage` inside the effect while depending only on the query
     meant a search typed BEFORE the boot page landed bailed on `!page` and
     never ran again — "Nothing matches" under a line promising the whole
     library. */
  it("runs the pending query once the page finally arrives", async () => {
    vi.useFakeTimers();
    const composer = makeComposer(null);
    loadServerMediaMock.mockResolvedValue(page(["hit"], null, null));
    const media = (composer as unknown as {
      media: { getServerPage: ReturnType<typeof vi.fn>; on: ReturnType<typeof vi.fn> };
    }).media;
    const { result } = renderHook(() => useLibraryState(composer));

    act(() => result.current.setLibrarySearch("logo"));
    await act(async () => { vi.advanceTimersByTime(400); });
    expect(loadServerMediaMock).not.toHaveBeenCalled();

    // the boot page lands: the manager emits and the hook re-evaluates
    media.getServerPage.mockReturnValue({ nextCursor: "c1", total: 412, loaded: 200 });
    const emit = media.on.mock.calls.find((c: unknown[]) => c[0] === "media:server-page")?.[1] as (p: unknown) => void;
    act(() => emit({ nextCursor: "c1", total: 412, loaded: 200 }));
    await act(async () => { vi.advanceTimersByTime(400); });

    expect(loadServerMediaMock).toHaveBeenCalledWith("s1", undefined, "logo");
    vi.useRealTimers();
  });

  /* The SEARCH is paged too. "Searching all 412 items" while holding the first
     200 MATCHES is the same overstatement one level down. */
  it("reports a paged search result as truncated", async () => {
    vi.useFakeTimers();
    const composer = makeComposer({ nextCursor: "c1", total: 412, loaded: 200 });
    loadServerMediaMock.mockResolvedValue(page(["hit"], "search-cursor", null));
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setLibrarySearch("logo"));
    await act(async () => { vi.advanceTimersByTime(400); });
    expect(result.current.searchState).toBe("truncated");
    vi.useRealTimers();
  });

  it("reports a complete search result as whole", async () => {
    vi.useFakeTimers();
    const composer = makeComposer({ nextCursor: "c1", total: 412, loaded: 200 });
    loadServerMediaMock.mockResolvedValue(page(["hit"], null, null));
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setLibrarySearch("logo"));
    await act(async () => { vi.advanceTimersByTime(400); });
    expect(result.current.searchState).toBe("whole");
    vi.useRealTimers();
  });

  /* `loadServerMedia` turns offline / signed-out / RPC failure into null.
     Swallowing that puts the original false negative straight back. */
  it("reports a refused leg as failed, never as silence", async () => {
    vi.useFakeTimers();
    const composer = makeComposer({ nextCursor: "c1", total: 412, loaded: 200 });
    loadServerMediaMock.mockResolvedValue(null);
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setLibrarySearch("logo"));
    await act(async () => { vi.advanceTimersByTime(400); });
    expect(result.current.searchState).toBe("failed");
    vi.useRealTimers();
  });

  /* Search imports are real assets, but they are not PAGING progress. Counting
     them would climb the footer toward the total while the cursor stood still,
     and then "Load more" would appear to do nothing. */
  it("does not move the paging position when a search imports assets", async () => {
    vi.useFakeTimers();
    const composer = makeComposer({ nextCursor: "c1", total: 412, loaded: 200 });
    loadServerMediaMock.mockResolvedValue(page(["hit1", "hit2"], null, null));
    const media = (composer as unknown as { media: { setServerPage: ReturnType<typeof vi.fn> } }).media;
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setLibrarySearch("logo"));
    await act(async () => { vi.advanceTimersByTime(400); });
    expect(media.setServerPage).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
