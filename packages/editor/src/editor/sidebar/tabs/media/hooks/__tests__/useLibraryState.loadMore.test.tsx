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

function makeComposer(page: { nextCursor: string | null; total: number } | null) {
  let current = page;
  const media = {
    getAssets: vi.fn(() => []),
    getFolders: vi.fn(() => []),
    getAllFolders: vi.fn(() => []),
    getServerPage: vi.fn(() => current),
    setServerPage: vi.fn((p: { nextCursor: string | null; total: number }) => {
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
    const composer = makeComposer({ nextCursor: "c1", total: 412 });
    loadServerMediaMock.mockResolvedValue(page(["a1"], "c2", null));
    const { result } = renderHook(() => useLibraryState(composer));

    await act(async () => {
      await result.current.loadMoreAssets();
    });

    expect(loadServerMediaMock).toHaveBeenCalledWith("s1", "c1");
    const media = (composer as unknown as { media: { setServerPage: ReturnType<typeof vi.fn> } }).media;
    /* The total carries over: the server counts once per pull, so a later page
       says nothing about how big the library is. */
    expect(media.setServerPage).toHaveBeenCalledWith({ nextCursor: "c2", total: 412 });
  });

  /* The lock is a ref for exactly this: both calls happen before React can
     re-render with `loadingMore === true`. */
  it("fires ONE request for two presses in the same tick", async () => {
    const composer = makeComposer({ nextCursor: "c1", total: 412 });
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
    const composer = makeComposer({ nextCursor: "c1", total: 412 });
    const media = (composer as unknown as {
      media: {
        setServerPage: ReturnType<typeof vi.fn> & ((p: { nextCursor: string | null; total: number }) => void);
        importServerAssets: ReturnType<typeof vi.fn>;
      };
    }).media;
    loadServerMediaMock.mockImplementation(async () => {
      // Something else advances the edge while this request is in flight.
      media.setServerPage({ nextCursor: "c9", total: 412 });
      return page(["a1"], "c2", null);
    });
    const { result } = renderHook(() => useLibraryState(composer));

    await act(async () => {
      await result.current.loadMoreAssets();
    });

    expect(media.importServerAssets).toHaveBeenCalled();
    expect(media.setServerPage).toHaveBeenCalledTimes(1); // only the interloper's
    expect(media.setServerPage).not.toHaveBeenCalledWith({ nextCursor: "c2", total: 412 });
  });

  it("does nothing when there is no cursor left", async () => {
    const composer = makeComposer({ nextCursor: null, total: 200 });
    const { result } = renderHook(() => useLibraryState(composer));
    await act(async () => {
      await result.current.loadMoreAssets();
    });
    expect(loadServerMediaMock).not.toHaveBeenCalled();
  });

  it("reports a refused page as a retry rather than swallowing it", async () => {
    const composer = makeComposer({ nextCursor: "c1", total: 412 });
    loadServerMediaMock.mockResolvedValue(null);
    const { result } = renderHook(() => useLibraryState(composer));
    await act(async () => {
      await result.current.loadMoreAssets();
    });
    expect(result.current.loadMoreError).toBe(true);
    expect(result.current.loadingMore).toBe(false);
  });
});
