// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useMediaState } from "../useMediaState";

vi.mock("@/editor/shared/vibcoder", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const stableMocks = vi.hoisted(() => {
  const libraryItems = [
    { key: "a", name: "a.jpg", type: "img", src: "https://cdn/a.jpg" },
  ];
  return { libraryItems };
});

vi.mock("../useLibraryState", () => ({
  useLibraryState: () => ({
    libraryItems: stableMocks.libraryItems,
    folders: [],
    allFolders: [],
    counts: { all: 1, img: 1, vid: 0, ico: 0, fnt: 0 },
    activeType: "all",
    currentFolderId: null,
    setCurrentFolderId: () => {},
    createFolder: () => {},
    deleteFolder: () => {},
    moveAsset: () => {},
    bulkMoveAssets: () => {},
    renameItem: () => {},
    updateItem: () => {},
    setActiveType: () => {},
    sort: "newest",
    sortDir: "desc",
    gridN: 3,
    fmtFilter: "all",
    librarySearch: "",
    setLibrarySearch: () => {},
    setSort: () => {},
    setGridN: () => {},
    setFmtFilter: () => {},
  }),
}));

vi.mock("../useSelectionState", () => ({
  useSelectionState: () => ({
    selMode: false,
    selectedKeys: new Set(),
    toggleSelMode: vi.fn(),
    toggleSelect: vi.fn(),
    selectAll: vi.fn(),
    requestBulkDelete: vi.fn(),
    requestDelete: vi.fn(),
    executeDelete: vi.fn(),
    cancelDelete: vi.fn(),
    confirmDelete: null,
  }),
}));

vi.mock("../useUploadState", () => ({
  useUploadState: () => ({
    upload: vi.fn(),
    uploadQueue: [],
    failedUploads: [],
    dismissFailedUploads: vi.fn(),
    storageUsed: 0,
    storageTotal: 1024 * 1024 * 1024,
    panelDragOver: false,
    handlePanelDragEnter: vi.fn(),
    handlePanelDragLeave: vi.fn(),
    handlePanelDragOver: vi.fn(),
    handlePanelDrop: vi.fn(),
  }),
}));

vi.mock("../useDiscoveryState", () => ({
  useDiscoveryState: () => ({
    stockPhotos: [],
    stockVideos: [],
    discIcons: [],
    discFonts: [],
    discLoading: { img: false, vid: false, ico: false, fnt: false },
    discoverySearch: "",
    isDiscoveryEmpty: true,
    discSearchAll: vi.fn(),
    discOrientation: "all",
    discColor: "all",
    setDiscOrientation: vi.fn(),
    setDiscColor: vi.fn(),
    loadMoreDisc: vi.fn(),
    saveToLibrary: vi.fn(),
  }),
}));

vi.mock("../useServerStorageQuota", () => ({
  useServerStorageQuota: () => ({ quota: null }),
}));

function makeFakeComposer(pages: unknown[] = []) {
  const mediaListeners: Record<string, Set<(...args: unknown[]) => void>> = {};
  const composerListeners: Record<string, Set<(...args: unknown[]) => void>> = {};
  return {
    emit: vi.fn(),
    on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      composerListeners[event] = composerListeners[event] ?? new Set();
      composerListeners[event].add(fn);
    }),
    off: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      composerListeners[event]?.delete(fn);
    }),
    media: {
      getAsset: vi.fn(),
      emit: vi.fn(),
      emitEvent: vi.fn(),
      on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
        mediaListeners[event] = mediaListeners[event] ?? new Set();
        mediaListeners[event].add(fn);
      }),
      off: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
        mediaListeners[event]?.delete(fn);
      }),
      getFolders: vi.fn(() => []),
    },
    elements: {
      getAllPages: vi.fn(() => pages),
    },
  };
}

describe("useMediaState — usageMap", () => {
  it("surfaces usageMap as Map<key, count>", () => {
    const composer = makeFakeComposer();
    const { result } = renderHook(() => useMediaState(composer as never));
    expect(result.current.usageMap).toBeInstanceOf(Map);
  });

  it("usageMap defaults to 0 for unused assets", () => {
    const composer = makeFakeComposer();
    const { result } = renderHook(() => useMediaState(composer as never));
    expect(result.current.usageMap.get("nonexistent") ?? 0).toBe(0);
  });
});
