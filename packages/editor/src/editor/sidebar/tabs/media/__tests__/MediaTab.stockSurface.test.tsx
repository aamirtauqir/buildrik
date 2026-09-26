/**
 * MediaTab — FC-6 (fix-all 2026-09-25): the drawer's "Add from stock" opens
 * the same full-page StockSourceModal the manager uses, not the deleted
 * StockBrowserOverlay. Every sibling overlay is stubbed away (irrelevant to
 * this wiring); StockSourceModal is the one real, unmocked component, so a
 * regression that swaps it back for something else — or that breaks the
 * open={stockBrowserOpen} contract — fails here.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import type { Composer } from "../../../../../engine";

vi.mock("../components/SlimLauncher", () => ({ SlimLauncher: () => null }));
vi.mock("../components/AssetDetailOverlay", () => ({ AssetDetailOverlay: () => null }));
vi.mock("../components/ConfirmDeleteModal", () => ({ ConfirmDeleteModal: () => null }));
vi.mock("../components/ReplaceAcrossDialog", () => ({ ReplaceAcrossDialog: () => null }));
vi.mock("../components/IconBrowserOverlay", () => ({ IconBrowserOverlay: () => null }));
vi.mock("../components/PickModePanel", () => ({ PickModePanel: () => null }));
vi.mock("@/editor/media/components/RenameAssetModal", () => ({ RenameAssetModal: () => null }));
vi.mock("../hooks/useMediaWriteAccess", () => ({
  useMediaWriteAccess: () => ({ canWrite: true, reason: () => undefined }),
}));

const discSearchAll = vi.fn();
const saveToLibrary = vi.fn();
const mediaState = vi.hoisted(() => ({
  searchFailed: null as string | null,
  discoverySearch: "",
}));
vi.mock("../hooks/useMediaState", () => ({
  useMediaState: () => ({
    activeType: "all",
    activeTypes: new Set(),
    currentFolderId: null,
    setCurrentFolderId: vi.fn(),
    serverPage: undefined,
    searchState: "idle",
    loadingMore: false,
    loadMoreError: null,
    loadMoreAssets: vi.fn(),
    libraryItems: [],
    allLibraryItems: [],
    versionsOf: () => [],
    folders: [],
    allFolders: [],
    folderCounts: new Map(),
    createFolder: vi.fn(),
    inspectFolder: vi.fn(),
    deleteFolder: vi.fn(),
    moveAsset: vi.fn(),
    bulkMoveAssets: vi.fn(),
    uploadQueue: [],
    counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 },
    sort: "recent",
    sortDir: "desc",
    gridN: 3,
    fmtFilter: null,
    selMode: false,
    selectedKeys: new Set(),
    setSort: vi.fn(),
    setGridN: vi.fn(),
    setFmtFilter: vi.fn(),
    setType: vi.fn(),
    toggleType: vi.fn(),
    toggleSelMode: vi.fn(),
    toggleSelect: vi.fn(),
    selectAll: vi.fn(),
    shiftSelect: vi.fn(),
    enterSelectModeWith: vi.fn(),
    checkInUse: vi.fn(),
    clearSelection: vi.fn(),
    failedUploads: [],
    dismissFailedUploads: vi.fn(),
    upload: vi.fn(),
    libraryLoading: false,
    libraryError: null,
    retryLibraryLoad: vi.fn(),
    retryUpload: vi.fn(),
    dismissUpload: vi.fn(),
    requestDelete: vi.fn(),
    requestBulkDelete: vi.fn(),
    executeDelete: vi.fn(),
    cancelDelete: vi.fn(),
    confirmDelete: null,
    insertToCanvas: vi.fn(),
    renameItem: vi.fn(),
    renameFolder: vi.fn(),
    updateItem: vi.fn(),

    // Discovery / stock — the piece under test.
    stockPhotos: [],
    stockVideos: [],
    discIcons: [],
    discFonts: [],
    discLoading: { img: false, vid: false, ico: false, fnt: false },
    discoverySearch: mediaState.discoverySearch,
    searchFailed: mediaState.searchFailed,
    isDiscoveryEmpty: true,
    discSearchAll,
    discOrientation: "all",
    discColor: "all",
    setDiscOrientation: vi.fn(),
    setDiscColor: vi.fn(),
    loadMoreDisc: vi.fn(),
    saveToLibrary,

    panelDragOver: false,
    handlePanelDragEnter: vi.fn(),
    handlePanelDragLeave: vi.fn(),
    handlePanelDragOver: vi.fn(),
    handlePanelDrop: vi.fn(),

    librarySearch: "",
    setLibrarySearch: vi.fn(),
    setLibraryQuery: vi.fn(),
    tagFilter: null,
    setTagFilter: vi.fn(),
    storage: { used: 0, total: 100 },

    copyUrl: vi.fn(),

    ctxMenu: null,
    openCtxMenu: vi.fn(),
    closeCtxMenu: vi.fn(),
    detailItem: null,
    openDetail: vi.fn(),
    closeDetail: vi.fn(),
    selectionContext: null,
    setSelectionContext: vi.fn(),
    applyPick: vi.fn(),

    replaceAcrossPair: null,
    setReplaceAcrossPair: vi.fn(),

    usageMap: new Map(),
  }),
}));

import { MediaTab } from "../MediaTab";

function fakeComposer(): Composer {
  return { on: vi.fn(), off: vi.fn(), emit: vi.fn() } as unknown as Composer;
}

describe("MediaTab — FC-6: the drawer's stock door opens StockSourceModal", () => {
  it("initialStockQuery force-opens StockSourceModal (not the deleted StockBrowserOverlay)", () => {
    render(
      <ToastProvider>
        <MediaTab composer={fakeComposer()} initialStockQuery="restaurant interior" />
      </ToastProvider>,
    );
    // StockSourceModal's own testid — StockBrowserOverlay never had this DOM.
    expect(screen.getByTestId("stock-modal")).toBeInTheDocument();
    expect(discSearchAll).toHaveBeenCalledWith("restaurant interior");
  });

  it("does not mount the stock modal when it is not opened", () => {
    render(
      <ToastProvider>
        <MediaTab composer={fakeComposer()} />
      </ToastProvider>,
    );
    expect(screen.queryByTestId("stock-modal")).not.toBeInTheDocument();
  });

  it("the search-failure copy renders inside the drawer's StockSourceModal", () => {
    mediaState.searchFailed = "not-configured";
    mediaState.discoverySearch = "cats";
    render(
      <ToastProvider>
        <MediaTab composer={fakeComposer()} initialStockQuery="cats" />
      </ToastProvider>,
    );
    expect(screen.getByRole("alert").textContent).toMatch(/not set up|isn't configured|not configured/i);
    mediaState.searchFailed = null;
    mediaState.discoverySearch = "";
  });
});
