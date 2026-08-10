// @vitest-environment jsdom
/**
 * useLibraryState.test.tsx — the library reducer surface: folder scoping,
 * type/format/search filtering, sort direction, count derivation (total vs
 * filtered), localStorage-persisted preferences, and the folder-delete guard.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { MediaAsset } from "@/shared/types/media";
import { STORAGE_KEYS } from "@/shared/constants/storageKeys";
import { MEDIA_EVENTS } from "@/shared/constants/media";
import { useLibraryState } from "../useLibraryState";

let idc = 0;
function asset(over: Partial<MediaAsset> = {}): MediaAsset {
  idc += 1;
  return {
    id: over.id ?? `a${idc}`,
    type: over.type ?? "image",
    name: over.name ?? `asset-${idc}`,
    originalName: over.name ?? `asset-${idc}`,
    src: "blob:x",
    mimeType: over.mimeType ?? "image/png",
    size: over.size ?? 100,
    createdAt: over.createdAt ?? "2026-01-01T00:00:00.000Z",
    folderId: over.folderId,
  } as MediaAsset;
}

function makeComposer(assets: MediaAsset[], folders: Array<{ id: string }> = []) {
  const listeners = new Map<string, Set<() => void>>();
  let store = [...assets];
  const media = {
    getAssets: vi.fn((opts?: { folderId?: string }) =>
      opts?.folderId !== undefined
        ? store.filter((a) => (a.folderId ?? null) === opts.folderId)
        : [...store],
    ),
    getFolders: vi.fn((_parent?: string) => folders),
    getAllFolders: vi.fn(() => folders),
    createFolder: vi.fn(async () => {}),
    deleteFolder: vi.fn(async () => {}),
    renameFolder: vi.fn(async () => {}),
    updateAsset: vi.fn(async () => {}),
    on: vi.fn((event: string, cb: () => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: () => void) => {
      listeners.get(event)?.delete(cb);
    }),
    emit: (event: string) => listeners.get(event)?.forEach((cb) => cb()),
    _setStore: (next: MediaAsset[]) => {
      store = next;
    },
  };
  return { media } as never;
}

beforeEach(() => {
  localStorage.clear();
  idc = 0;
});

describe("useLibraryState — folder scoping", () => {
  it("shows only root assets by default (folderId null)", () => {
    const composer = makeComposer([
      asset({ id: "root1" }),
      asset({ id: "nested1", folderId: "f1" }),
    ]);
    const { result } = renderHook(() => useLibraryState(composer));
    const keys = result.current.libraryItems.map((i) => i.key);
    expect(keys).toEqual(["root1"]);
  });

  it("scopes to a folder when currentFolderId is set", () => {
    const composer = makeComposer([
      asset({ id: "root1" }),
      asset({ id: "nested1", folderId: "f1" }),
    ]);
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setCurrentFolderId("f1"));
    expect(result.current.libraryItems.map((i) => i.key)).toEqual(["nested1"]);
  });
});

describe("useLibraryState — filters", () => {
  it("filters by type pill", () => {
    const composer = makeComposer([
      asset({ id: "img", type: "image" }),
      asset({ id: "vid", type: "video", mimeType: "video/mp4" }),
    ]);
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setActiveType("vid"));
    expect(result.current.libraryItems.map((i) => i.key)).toEqual(["vid"]);
  });

  it("setActiveType clears the format filter and persists the pill", () => {
    const composer = makeComposer([asset()]);
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setFmtFilter("png"));
    expect(result.current.fmtFilter).toBe("png");
    act(() => result.current.setActiveType("img"));
    expect(result.current.fmtFilter).toBe("");
    expect(localStorage.getItem(STORAGE_KEYS.MEDIA_ACTIVE_TYPES)).toBe("img");
  });

  // Board 145:2 caption: multi-select filter. toggleType accumulates and
  // persists the set; deselecting the last member restores "everything".
  it("toggleType multi-selects, persists the csv, and empty set means all", () => {
    const composer = makeComposer([
      asset({ id: "i1" }),
      asset({ id: "v1", mimeType: "video/mp4" }),
    ]);
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.toggleType("img"));
    act(() => result.current.toggleType("vid"));
    expect(result.current.activeTypes.has("img")).toBe(true);
    expect(result.current.activeTypes.has("vid")).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.MEDIA_ACTIVE_TYPES)).toBe("img,vid");
    expect(result.current.activeType).toBe("all");
    act(() => result.current.toggleType("img"));
    expect(result.current.activeType).toBe("vid");
    act(() => result.current.toggleType("vid"));
    expect(result.current.activeTypes.size).toBe(0);
    expect(result.current.libraryItems.length).toBe(2);
  });

  it("filters by MIME format substring", () => {
    const composer = makeComposer([
      asset({ id: "png", mimeType: "image/png" }),
      asset({ id: "jpg", mimeType: "image/jpeg" }),
    ]);
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setFmtFilter("jpeg"));
    expect(result.current.libraryItems.map((i) => i.key)).toEqual(["jpg"]);
  });

  it("filters by name search (case-insensitive)", () => {
    const composer = makeComposer([
      asset({ id: "hero", name: "Hero Banner" }),
      asset({ id: "logo", name: "Logo" }),
    ]);
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setLibrarySearch("hero"));
    expect(result.current.libraryItems.map((i) => i.key)).toEqual(["hero"]);
  });
});

describe("useLibraryState — sort", () => {
  it("sorts by name ascending", () => {
    const composer = makeComposer([
      asset({ id: "b", name: "Beta" }),
      asset({ id: "a", name: "Alpha" }),
    ]);
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setSort("name", "asc"));
    expect(result.current.libraryItems.map((i) => i.key)).toEqual(["a", "b"]);
  });

  it("sorts by size and honours the direction flag", () => {
    const composer = makeComposer([
      asset({ id: "small", size: 10 }),
      asset({ id: "big", size: 900 }),
    ]);
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setSort("size", "desc"));
    expect(result.current.libraryItems.map((i) => i.key)).toEqual(["big", "small"]);
    act(() => result.current.setSort("size", "asc"));
    expect(result.current.libraryItems.map((i) => i.key)).toEqual(["small", "big"]);
  });

  it("persists sort + direction to localStorage", () => {
    const composer = makeComposer([asset()]);
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setSort("name", "asc"));
    expect(localStorage.getItem(STORAGE_KEYS.MEDIA_SORT)).toBe("name");
    expect(localStorage.getItem(STORAGE_KEYS.MEDIA_SORT_DIR)).toBe("asc");
  });
});

describe("useLibraryState — grid preference", () => {
  it("persists a clamped grid column count", () => {
    const composer = makeComposer([asset()]);
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setGridN(4));
    expect(result.current.gridN).toBe(4);
    expect(localStorage.getItem(STORAGE_KEYS.MEDIA_GRID_N)).toBe("4");
  });

  it("reads the persisted grid count on init (fallback = 3)", () => {
    localStorage.setItem(STORAGE_KEYS.MEDIA_GRID_N, "2");
    const composer = makeComposer([asset()]);
    const { result } = renderHook(() => useLibraryState(composer));
    expect(result.current.gridN).toBe(2);
  });
});

describe("useLibraryState — counts", () => {
  it("uses total counts when no search/format filter is active", () => {
    const composer = makeComposer([
      asset({ type: "image" }),
      asset({ type: "video", mimeType: "video/mp4" }),
    ]);
    const { result } = renderHook(() => useLibraryState(composer));
    expect(result.current.counts).toMatchObject({ all: 2, img: 1, vid: 1 });
  });

  // Boards 145:2 / 145:49 / 782:4353 all draw the LIBRARY totals in the pills,
  // including while a search matches nothing. Switching to counts-of-the-
  // filtered-list zeroed every pill mid-search and left the drawer with no
  // truthful "is the library empty" signal.
  it("keeps the library totals while a search is active", () => {
    const composer = makeComposer([
      asset({ id: "hero", name: "Hero", type: "image" }),
      asset({ id: "clip", name: "Clip", type: "video", mimeType: "video/mp4" }),
    ]);
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setLibrarySearch("hero"));
    expect(result.current.counts).toMatchObject({ all: 2, img: 1, vid: 1 });
  });
});

describe("useLibraryState — folder delete guard", () => {
  it("inspectFolder returns asset + subfolder counts", () => {
    const composer = makeComposer(
      [asset({ folderId: "f1" }), asset({ folderId: "f1" })],
      [{ id: "sub" }],
    );
    const { result } = renderHook(() => useLibraryState(composer));
    expect(result.current.inspectFolder("f1")).toEqual({
      assetCount: 2,
      subFolderCount: 1,
    });
  });

  it("rejects deleting a non-empty folder without force", async () => {
    const composer = makeComposer([asset({ folderId: "f1" })]);
    const { result } = renderHook(() => useLibraryState(composer));
    await expect(result.current.deleteFolder("f1")).rejects.toThrow(/FOLDER_NOT_EMPTY/);
    expect((composer as never as { media: { deleteFolder: ReturnType<typeof vi.fn> } }).media.deleteFolder)
      .not.toHaveBeenCalled();
  });

  it("deletes an empty folder without force", async () => {
    const composer = makeComposer([], []);
    const media = (composer as never as { media: { deleteFolder: ReturnType<typeof vi.fn> } }).media;
    const { result } = renderHook(() => useLibraryState(composer));
    await act(async () => {
      await result.current.deleteFolder("empty");
    });
    expect(media.deleteFolder).toHaveBeenCalledWith("empty");
  });

  it("force-deletes a non-empty folder", async () => {
    const composer = makeComposer([asset({ folderId: "f1" })]);
    const media = (composer as never as { media: { deleteFolder: ReturnType<typeof vi.fn> } }).media;
    const { result } = renderHook(() => useLibraryState(composer));
    await act(async () => {
      await result.current.deleteFolder("f1", { force: true });
    });
    expect(media.deleteFolder).toHaveBeenCalledWith("f1");
  });
});

describe("useLibraryState — engine event sync", () => {
  it("reloads assets when MEDIA_ADDED fires", () => {
    const composer = makeComposer([asset({ id: "one" })]);
    const media = (composer as never as {
      media: { _setStore: (n: MediaAsset[]) => void; emit: (e: string) => void };
    }).media;
    const { result } = renderHook(() => useLibraryState(composer));
    expect(result.current.libraryItems).toHaveLength(1);

    act(() => {
      media._setStore([asset({ id: "one" }), asset({ id: "two" })]);
      media.emit(MEDIA_EVENTS.MEDIA_ADDED);
    });
    expect(result.current.libraryItems.map((i) => i.key).sort()).toEqual(["one", "two"]);
  });
});
