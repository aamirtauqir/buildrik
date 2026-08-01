// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMediaState } from "../useMediaState";
import { MEDIA_EVENTS } from "@/shared/constants/media";

vi.mock("@/editor/chrome-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/editor/chrome-ui")>()),
  ...{
  useToast: () => ({ addToast: vi.fn() }),
},
}));

vi.mock("../useLibraryState", () => ({
  useLibraryState: () => ({
    libraryItems: [],
    counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 },
    activeType: "all",
    setActiveType: vi.fn(),
    sort: "newest",
    sortDir: "desc",
    gridN: 3,
    fmtFilter: "all",
    librarySearch: "",
    setLibrarySearch: vi.fn(),
    setSort: vi.fn(),
    setGridN: vi.fn(),
    setFmtFilter: vi.fn(),
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
    confirmDelete: { open: false, items: [] },
    setConfirmDelete: vi.fn(),
    onCommitDelete: vi.fn(),
  }),
}));

vi.mock("../useUploadState", () => ({
  useUploadState: () => ({
    upload: vi.fn(),
    uploadQueue: [],
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
    discIcons: [],
    discFonts: [],
    discLoading: false,
    discoverySearch: "",
    isDiscoveryEmpty: true,
    discSearchAll: vi.fn(),
    discOrientation: "all",
    discColor: "all",
    setDiscOrientation: vi.fn(),
    setDiscColor: vi.fn(),
    loadMoreDisc: vi.fn(),
    saveToLibrary: vi.fn(),
    stockPhotos: [],
  }),
}));

vi.mock("../useServerStorageQuota", () => ({
  useServerStorageQuota: () => ({ quota: null }),
}));

function makeFakeComposer() {
  const mediaListeners: Record<string, Set<(...args: unknown[]) => void>> = {};
  const composerListeners: Record<string, Set<(...args: unknown[]) => void>> = {};
  return {
    emit: vi.fn((event: string, payload?: unknown) => {
      composerListeners[event]?.forEach((fn) => fn(payload));
    }),
    on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      composerListeners[event] = composerListeners[event] ?? new Set();
      composerListeners[event].add(fn);
    }),
    off: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      composerListeners[event]?.delete(fn);
    }),
    media: {
      getAsset: vi.fn(),
      emitEvent: vi.fn((event: string, payload?: unknown) => {
        mediaListeners[event]?.forEach((fn) => fn(payload));
      }),
      emit: vi.fn((event: string, payload?: unknown) => {
        mediaListeners[event]?.forEach((fn) => fn(payload));
      }),
      on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
        mediaListeners[event] = mediaListeners[event] ?? new Set();
        mediaListeners[event].add(fn);
      }),
      off: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
        mediaListeners[event]?.delete(fn);
      }),
      getFolders: vi.fn(() => []),
    },
  };
}

describe("useMediaState — §12 panelExpanded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts collapsed (panelExpanded === false)", () => {
    const composer = makeFakeComposer();
    const { result } = renderHook(() => useMediaState(composer as never));
    expect(result.current.panelExpanded).toBe(false);
  });

  it("setPanelExpanded(true) emits ui:media-panel-width with width 560", () => {
    const composer = makeFakeComposer();
    const { result } = renderHook(() => useMediaState(composer as never));
    act(() => result.current.setPanelExpanded(true));
    expect(result.current.panelExpanded).toBe(true);
    expect(composer.emit).toHaveBeenCalledWith("ui:media-panel-width", { width: 560, expanded: true });
  });

  it("setPanelExpanded(false) emits width 320", () => {
    const composer = makeFakeComposer();
    const { result } = renderHook(() => useMediaState(composer as never));
    act(() => result.current.setPanelExpanded(true));
    act(() => result.current.setPanelExpanded(false));
    expect(composer.emit).toHaveBeenLastCalledWith("ui:media-panel-width", { width: 320, expanded: false });
  });

  it("auto-expands on UPLOAD_COMPLETE event", () => {
    const composer = makeFakeComposer();
    const { result } = renderHook(() => useMediaState(composer as never));
    expect(result.current.panelExpanded).toBe(false);
    act(() => {
      composer.media.emit(MEDIA_EVENTS.UPLOAD_COMPLETE, { fileName: "x.png" });
    });
    expect(result.current.panelExpanded).toBe(true);
  });

  it("does NOT re-expand after user manually collapsed", () => {
    const composer = makeFakeComposer();
    const { result } = renderHook(() => useMediaState(composer as never));
    // User expands then collapses
    act(() => result.current.setPanelExpanded(true));
    act(() => result.current.setPanelExpanded(false));
    expect(result.current.panelExpanded).toBe(false);
    // Now upload completes — should respect manual collapse
    act(() => {
      composer.media.emit(MEDIA_EVENTS.UPLOAD_COMPLETE, { fileName: "y.png" });
    });
    expect(result.current.panelExpanded).toBe(false);
  });

  it("re-expands after manual re-expand resets the collapse guard", () => {
    const composer = makeFakeComposer();
    const { result } = renderHook(() => useMediaState(composer as never));
    act(() => result.current.setPanelExpanded(true));
    act(() => result.current.setPanelExpanded(false));
    // User manually re-expands — explicit opt-in resets guard
    act(() => result.current.setPanelExpanded(true));
    act(() => result.current.setPanelExpanded(false));
    // After last collapse, guard is set again
    act(() => {
      composer.media.emit(MEDIA_EVENTS.UPLOAD_COMPLETE, { fileName: "z.png" });
    });
    expect(result.current.panelExpanded).toBe(false);
    // But manual expand should still work
    act(() => result.current.setPanelExpanded(true));
    expect(result.current.panelExpanded).toBe(true);
  });

  it("does NOT auto-expand when selection context is active (§11 snap-back mode)", () => {
    const composer = makeFakeComposer();
    const { result } = renderHook(() => useMediaState(composer as never));
    act(() => result.current.setSelectionContext({ elementId: "el-1", label: "Hero image" }));
    act(() => {
      composer.media.emit(MEDIA_EVENTS.UPLOAD_COMPLETE, { fileName: "x.png" });
    });
    expect(result.current.panelExpanded).toBe(false);
  });
});

describe("useMediaState — §21 replaceAcrossPair", () => {
  it("starts null", () => {
    const composer = makeFakeComposer();
    const { result } = renderHook(() => useMediaState(composer as never));
    expect(result.current.replaceAcrossPair).toBeNull();
  });

  it("setReplaceAcrossPair stores + clears", () => {
    const composer = makeFakeComposer();
    const { result } = renderHook(() => useMediaState(composer as never));
    const pair = { oldSrc: "data:old", newSrc: "data:new", oldLabel: "logo-v1", newLabel: "logo-v2" };
    act(() => result.current.setReplaceAcrossPair(pair));
    expect(result.current.replaceAcrossPair).toEqual(pair);
    act(() => result.current.setReplaceAcrossPair(null));
    expect(result.current.replaceAcrossPair).toBeNull();
  });
});
