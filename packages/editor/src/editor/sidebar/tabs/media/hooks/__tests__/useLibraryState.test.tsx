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
    tags: over.tags ?? [],
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
    /* Server paging edges. Null here: this stub has no server, which is also
       the standalone demo's situation — the drawer must simply not offer a
       page it cannot fetch. */
    getServerPage: vi.fn(() => null),
    setServerPage: vi.fn(),
    importServerAssets: vi.fn(async () => {}),
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
  /* Clone 3698:20337 — "All assets 24" is the whole library: In use 14 +
     Unused 10, and Products 8 + Hero shots 5 + Icons 6 sit inside it. The
     root scope lists every file; a folder is a narrower view of the same
     set, never a sibling of "unfiled". (This read "only root assets" until
     the first live move put two files in a folder and made "23 files · All
     assets" list 21.) */
  it("the root scope is every asset, foldered or not", () => {
    const composer = makeComposer([
      asset({ id: "root1" }),
      asset({ id: "nested1", folderId: "f1" }),
    ]);
    const { result } = renderHook(() => useLibraryState(composer));
    const keys = result.current.libraryItems.map((i) => i.key);
    expect(keys).toEqual(["root1", "nested1"]);
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

/* Clone 3721:43697 / 43902 / 44107 — a TAGS chip is a FILTER of its own, not
   a search string: it narrows to the files carrying the tag, combines with
   the folder scope and with typed search, and clears on its own. */
describe("useLibraryState — tag filter (Clone 3721:43697)", () => {
  const tagged = () => [
    asset({ id: "menu", name: "menu-cover", tags: ["menu"] }),
    asset({ id: "team", name: "team-photo", tags: ["team"] }),
    asset({ id: "pasta", name: "pasta-closeup", tags: ["food", "menu"], folderId: "f1" }),
    asset({ id: "plain", name: "plain" }),
  ];

  it("is off by default and narrows to the files carrying the tag", () => {
    const composer = makeComposer(tagged());
    const { result } = renderHook(() => useLibraryState(composer));
    expect(result.current.tagFilter).toBeNull();
    act(() => result.current.setTagFilter("menu"));
    expect(result.current.tagFilter).toBe("menu");
    expect(result.current.libraryItems.map((i) => i.key).sort()).toEqual(["menu", "pasta"]);
  });

  it("combines with the folder scope and with typed search", () => {
    const composer = makeComposer(tagged());
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setTagFilter("menu"));
    act(() => result.current.setCurrentFolderId("f1"));
    expect(result.current.libraryItems.map((i) => i.key)).toEqual(["pasta"]);
    act(() => result.current.setCurrentFolderId(null));
    act(() => result.current.setLibrarySearch("cover"));
    expect(result.current.libraryItems.map((i) => i.key)).toEqual(["menu"]);
  });

  it("swaps to another tag and clears back to everything", () => {
    const composer = makeComposer(tagged());
    const { result } = renderHook(() => useLibraryState(composer));
    act(() => result.current.setTagFilter("menu"));
    act(() => result.current.setTagFilter("team"));
    expect(result.current.libraryItems.map((i) => i.key)).toEqual(["team"]);
    act(() => result.current.setTagFilter(null));
    expect(result.current.libraryItems).toHaveLength(4);
  });

  it("carries each asset's tags onto its library item, and updateItem writes them back", async () => {
    const composer = makeComposer(tagged());
    const { result } = renderHook(() => useLibraryState(composer));
    expect(result.current.allLibraryItems.find((i) => i.key === "pasta")?.tags).toEqual(["food", "menu"]);
    await act(() => result.current.updateItem("pasta", { tags: ["food"] }));
    expect((composer as unknown as { media: { updateAsset: ReturnType<typeof vi.fn> } }).media.updateAsset).toHaveBeenCalledWith(
      "pasta",
      { tags: ["food"] },
    );
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

  // Clone 3698:20337 — every FOLDERS row carries its own count ("Products 8"),
  // and 3700:20353 draws a just-created folder at 0. Direct children only: the
  // same set the grid shows when that folder is the scope.
  it("folderCounts counts the direct children of each folder, whatever the scope", () => {
    const composer = makeComposer([
      asset({ id: "root1" }),
      asset({ id: "p1", folderId: "f1" }),
      asset({ id: "p2", folderId: "f1" }),
      asset({ id: "h1", folderId: "f2" }),
    ]);
    const { result } = renderHook(() => useLibraryState(composer));
    expect(result.current.folderCounts.get("f1")).toBe(2);
    expect(result.current.folderCounts.get("f2")).toBe(1);
    expect(result.current.folderCounts.get("f9")).toBeUndefined();
    act(() => result.current.setCurrentFolderId("f2"));
    expect(result.current.folderCounts.get("f1")).toBe(2);
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
