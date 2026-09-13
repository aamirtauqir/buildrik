/**
 * Shared builders for the fullpage library tests.
 *
 * `makeMediaState` is the one typed factory for the 70+ field
 * `MediaStateResult`; every LibraryManager / AssetGrid / AssetDetailsPanel
 * test mounts against it so a new field lands in one place. `TEN` is the
 * prototype's own fixture set (Figma page "Editor v1 Clone", section
 * 3695:19967) — the filenames are on screen in the details rail, the list
 * rows and the delete confirms, so the tests use them verbatim.
 *
 * The `useMediaState` mock itself stays in each test file: `vi.mock` is
 * hoisted per file and cannot be shared from here.
 *
 * @license BSD-3-Clause
 */

import { vi } from "vitest";
import type { LibraryItem, MediaStateResult } from "../../sidebar/tabs/media/data/mediaTypes";
import type { LibraryManager } from "../LibraryManager";

export function makeItem(over: Partial<LibraryItem> = {}): LibraryItem {
  return {
    key: "asset-1",
    name: "logo.png",
    type: "img",
    src: "https://example.com/logo.png",
    size: 1024,
    createdAt: new Date().toISOString(),
    mimeType: "image/png",
    assetSource: "uploaded",
    ...over,
  };
}

/** The Clone prototype's ten assets — five raster, two svg, two mp4, one font. */
export const TEN: LibraryItem[] = [
  makeItem({ key: "hero", name: "hero-dark.jpg", src: "blob:hero", mimeType: "image/jpeg", width: 2400, height: 1600, size: 840_000 }),
  makeItem({ key: "menu", name: "menu-cover.png", src: "blob:menu", mimeType: "image/png", width: 1600, height: 1000, size: 220_000 }),
  makeItem({ key: "team", name: "team-photo.jpg", src: "blob:team", mimeType: "image/jpeg" }),
  makeItem({ key: "pasta", name: "pasta-closeup.jpg", src: "blob:pasta", mimeType: "image/jpeg" }),
  makeItem({ key: "terrace", name: "terrace-night.jpg", src: "blob:terrace", mimeType: "image/jpeg", size: 1_100_000 }),
  makeItem({ key: "logo", name: "logo-mark.svg", src: "blob:logo", type: "ico", mimeType: "image/svg+xml", size: 6_000 }),
  makeItem({ key: "star", name: "star-icon.svg", src: "blob:star", type: "ico", mimeType: "image/svg+xml" }),
  makeItem({ key: "chef", name: "chef-intro.mp4", src: "blob:chef", type: "vid", mimeType: "video/mp4", size: 8_400_000, duration: 2 }),
  makeItem({ key: "opening", name: "grand-opening.mp4", src: "blob:opening", type: "vid", mimeType: "video/mp4", duration: 2 }),
  makeItem({ key: "inter", name: "Inter-Var.woff2", src: "blob:inter", type: "fnt", mimeType: "font/woff2", size: 310_000 }),
];

export function makeMediaState(over: Partial<MediaStateResult> = {}): MediaStateResult {
  const noop = vi.fn();
  const noopAsync = vi.fn(() => Promise.resolve());
  return {
    activeType: "all",
    activeTypes: new Set(),
    toggleType: vi.fn(),
    setFmtFilter: vi.fn(),
    setGridN: vi.fn(),
    setType: noop,
    currentFolderId: null,
    setCurrentFolderId: noop,
    libraryItems: [],
    folders: [],
    createFolder: noopAsync,
    deleteFolder: noopAsync,
    moveAsset: noopAsync,
    bulkMoveAssets: noopAsync,
    uploadQueue: [],
    counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 },
    sort: "date",
    sortDir: "desc",
    gridN: 3,
    fmtFilter: "all",
    selMode: false,
    selectedKeys: new Set<string>(),
    setSort: noop,
    toggleSelMode: noop,
    toggleSelect: noop,
    selectAll: noop,
    upload: noop,
    failedUploads: [],
    dismissFailedUploads: noop,
    requestDelete: noop,
    requestBulkDelete: noop,
    executeDelete: noopAsync,
    cancelDelete: noop,
    confirmDelete: null,
    insertToCanvas: noop,
    renameItem: noopAsync,
    updateItem: noopAsync,
    stockPhotos: [],
    stockVideos: [],
    discIcons: [],
    discFonts: [],
    discLoading: { img: false, vid: false, ico: false, fnt: false },
    discoverySearch: "",
    isDiscoveryEmpty: true,
    discOrientation: "all",
    discColor: "all",
    discSearchAll: noop,
    setDiscOrientation: noop,
    setDiscColor: noop,
    loadMoreDisc: noopAsync,
    saveToLibrary: noopAsync,
    panelDragOver: false,
    handlePanelDragEnter: noop,
    handlePanelDragLeave: noop,
    handlePanelDragOver: noop,
    handlePanelDrop: noop,
    librarySearch: "",
    setLibrarySearch: noop,
    storage: { used: 0, total: 1024 * 1024 * 1024 },
    copyUrl: noop,
    ctxMenu: null,
    openCtxMenu: noop,
    closeCtxMenu: noop,
    detailItem: null,
    openDetail: noop,
    closeDetail: noop,
    selectionContext: null,
    setSelectionContext: noop,
    checkInUse: vi.fn(() => []),
    ...over,
  } as MediaStateResult;
}

export function makeComposer(usages: Record<string, number> = {}) {
  return {
    mediaOps: {
      getUsages: (src: string) => ({ count: usages[src] ?? 0, usages: [] }),
      insertMedia: vi.fn(),
      // Real shape: `{ replaced: ElementId[]; failed: ElementId[] }`.
      // The replace-all picker reads `result.replaced.length` and
      // `result.failed.length` — returning a number here would crash the
      // first test that exercises the picker click path.
      replaceAcross: vi.fn(() => ({ replaced: [], failed: [] })),
    },
    media: {
      getAssets: () => [] as Array<{ key: string; tags?: string[] }>,
      getAssetSrc: vi.fn(() => Promise.resolve(null)),
    },
  } as unknown as Parameters<typeof LibraryManager>[0]["composer"];
}
