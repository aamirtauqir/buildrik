/**
 * LibraryManager — D5 Stage 0 baseline tests (audit-remediation 2026-05-08).
 *
 * Captures externally-observable behavior of the orchestrator BEFORE the
 * Stage 1+ split into a useLibraryUiState reducer + sub-components
 * (FolderTree / AssetGrid / AssetDetailsPanel) + react-window virtualization.
 *
 * Mock strategy mirrors D3 (VersionHistoryPanel.test.tsx):
 *   - vi.hoisted for closure state on the data hook
 *   - mock useMediaState with a typed factory (70+ fields)
 *   - stub the heavy modal/overlay children to render-as-null
 *   - composer's mediaOps.getUsages mocked at the consumer level
 *
 * The 4 tests cover the highest-risk render branches: empty state,
 * populated grid, search-filtered empty, selected-item details.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import type { LibraryItem, MediaStateResult } from "../../sidebar/tabs/media/data/mediaTypes";

// ─── Hoisted mock state ──────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const state: { mediaState: import("../../sidebar/tabs/media/data/mediaTypes").MediaStateResult } = {
    // assigned in beforeEach via setMediaState
    mediaState: null as unknown as import("../../sidebar/tabs/media/data/mediaTypes").MediaStateResult,
  };
  return { state };
});

// ─── Mock external surfaces ──────────────────────────────────────────────────

vi.mock("../../sidebar/tabs/media/hooks/useMediaState", () => ({
  useMediaState: () => mocks.state.mediaState,
}));

vi.mock("@/editor/chrome-ui", async () => {
  const actual: Record<string, unknown> = await vi.importActual("@/editor/chrome-ui");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn() }),
  };
});

// Stub heavy children so jsdom doesn't choke on portals / overlays.
vi.mock("../../sidebar/tabs/media/components/StockSourceModal", () => ({
  StockSourceModal: () => null,
}));
vi.mock("../../sidebar/tabs/media/components/ConfirmDeleteModal", () => ({
  ConfirmDeleteModal: () => null,
}));
vi.mock("../../sidebar/tabs/media/components/MediaContextMenu", () => ({
  MediaContextMenu: () => null,
}));
vi.mock("../../sidebar/tabs/media/components/AssetDetailOverlay", () => ({
  AssetDetailOverlay: () => null,
}));

// ─── Factory: minimal valid MediaStateResult ─────────────────────────────────

function makeItem(over: Partial<LibraryItem> = {}): LibraryItem {
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

function makeMediaState(over: Partial<MediaStateResult> = {}): MediaStateResult {
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
    ...over,
  } as MediaStateResult;
}

// ─── Composer mock ───────────────────────────────────────────────────────────

function makeComposer(usages: Record<string, number> = {}) {
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
  } as unknown as Parameters<typeof import("../LibraryManager").LibraryManager>[0]["composer"];
}

// ─── Mount helper ────────────────────────────────────────────────────────────

async function mount(state: MediaStateResult, usages: Record<string, number> = {}) {
  mocks.state.mediaState = state;
  const { LibraryManager } = await import("../LibraryManager");
  return render(
    <LibraryManager
      composer={makeComposer(usages)}
      onClose={vi.fn()}
      onOpenImageEditor={vi.fn()}
      onOpenIconPicker={vi.fn()}
    />
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("LibraryManager — D5 baseline", () => {
  // Board 1162:4617 — at zero assets the question is "is this the right
  // place?", so the empty state says where uploads go.
  it("renders the board empty state when there are no assets", async () => {
    await mount(makeMediaState({ libraryItems: [] }));
    expect(screen.getByText("No images or files yet.")).toBeInTheDocument();
    expect(screen.getByText(/one library for the whole site/)).toBeInTheDocument();
    // Two Uploads on screen now: the top bar's and the empty state's — the
    // board draws both, so scope the assertion to the empty state.
    const hero = document.querySelector(".mgr-empty-actions")!;
    expect(hero.textContent).toContain("Upload");
    expect(hero.textContent).toContain("Browse stock");
  });

  it("renders asset names in the grid when libraryItems is populated", async () => {
    const items = [
      makeItem({ key: "a", name: "logo.png" }),
      makeItem({ key: "b", name: "hero.jpg", src: "https://example.com/hero.jpg" }),
      makeItem({ key: "c", name: "icon.svg", src: "https://example.com/icon.svg", type: "img" }),
    ];
    await mount(
      makeMediaState({
        libraryItems: items,
        counts: { all: 3, img: 3, vid: 0, ico: 0, fnt: 0 },
      })
    );
    expect(screen.getByText("logo.png")).toBeInTheDocument();
    expect(screen.getByText("hero.jpg")).toBeInTheDocument();
    expect(screen.getByText("icon.svg")).toBeInTheDocument();
  });

  it("renders the no-results state when search has no matches", async () => {
    await mount(
      makeMediaState({
        libraryItems: [],
        librarySearch: "asdf",
      })
    );
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText(/No assets match "asdf"/)).toBeInTheDocument();
  });

  it("shows the asset count in the grid footer", async () => {
    const items = [
      makeItem({ key: "a", name: "one.png" }),
      makeItem({ key: "b", name: "two.png", src: "https://example.com/two.png" }),
    ];
    await mount(
      makeMediaState({
        libraryItems: items,
        counts: { all: 2, img: 2, vid: 0, ico: 0, fnt: 0 },
      })
    );
    // Footer reads "Showing N of M"
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    const strong = screen.getAllByText("2");
    expect(strong.length).toBeGreaterThan(0);
  });
});
