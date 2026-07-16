/**
 * AssetGrid — bulk select/move, type pills, sort menu, view toggle,
 * selection semantics (cmd-click / selMode), footer label.
 *
 * Direct-mount strategy: AssetGrid receives the whole MediaStateResult as a
 * prop, so no module mocks are needed — a stubbed state object drives it.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import type {
  LibraryItem,
  MediaStateResult,
} from "../../../sidebar/tabs/media/data/mediaTypes";
import { AssetGrid } from "../AssetGrid";

function makeItem(over: Partial<LibraryItem> = {}): LibraryItem {
  return {
    key: "asset-1",
    name: "logo.png",
    type: "img",
    src: "https://example.com/logo.png",
    thumb: "https://example.com/logo-thumb.png",
    size: 2048,
    createdAt: new Date().toISOString(),
    mimeType: "image/png",
    assetSource: "uploaded",
    ...over,
  } as LibraryItem;
}

function makeState(over: Partial<MediaStateResult> = {}): MediaStateResult {
  const noop = vi.fn();
  return {
    activeType: "all",
    setType: vi.fn(),
    currentFolderId: null,
    setCurrentFolderId: noop,
    libraryItems: [],
    folders: [],
    createFolder: vi.fn(),
    deleteFolder: vi.fn(),
    moveAsset: vi.fn(),
    bulkMoveAssets: vi.fn(),
    uploadQueue: [],
    counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 },
    sort: "date",
    sortDir: "desc",
    gridN: 3,
    fmtFilter: "all",
    selMode: false,
    selectedKeys: new Set<string>(),
    setSort: vi.fn(),
    setGridN: noop,
    setFmtFilter: noop,
    toggleSelMode: vi.fn(),
    toggleSelect: vi.fn(),
    selectAll: vi.fn(),
    upload: noop,
    failedUploads: [],
    dismissFailedUploads: noop,
    requestDelete: noop,
    requestBulkDelete: vi.fn(),
    executeDelete: vi.fn(),
    cancelDelete: noop,
    confirmDelete: null,
    insertToCanvas: vi.fn(),
    renameItem: vi.fn(),
    updateItem: vi.fn(),
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
    loadMoreDisc: vi.fn(),
    saveToLibrary: vi.fn(),
    panelDragOver: false,
    handlePanelDragEnter: noop,
    handlePanelDragLeave: noop,
    handlePanelDragOver: noop,
    handlePanelDrop: noop,
    librarySearch: "",
    setLibrarySearch: noop,
    storage: { used: 0, total: 1024 },
    copyUrl: noop,
    ctxMenu: null,
    openCtxMenu: vi.fn(),
    closeCtxMenu: noop,
    detailItem: null,
    openDetail: noop,
    closeDetail: noop,
    selectionContext: null,
    setSelectionContext: noop,
    ...over,
  } as MediaStateResult;
}

function mount(state: MediaStateResult, over: Partial<Parameters<typeof AssetGrid>[0]> = {}) {
  const props = {
    state,
    visibleItems: state.libraryItems,
    usageMap: new Map<string, number>(),
    smartFolder: null,
    breadcrumbPath: [{ id: null, name: "Home" }],
    selectedAssetId: null,
    onSelectAsset: vi.fn(),
    onUploadClick: vi.fn(),
    onOpenStockModal: vi.fn(),
    addToast: vi.fn(),
    ...over,
  };
  const utils = render(<AssetGrid {...props} />);
  return { ...utils, props };
}

describe("AssetGrid — type pills + counts", () => {
  it("renders the 5 type pills and marks the active one", () => {
    const state = makeState({
      activeType: "img",
      counts: { all: 4, img: 3, vid: 1, ico: 0, fnt: 0 },
    });
    const { container } = mount(state);
    for (const label of ["All", "Images", "Videos", "Icons", "Fonts"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    const active = container.querySelector(".mgr-pill.active");
    expect(active?.textContent).toContain("Images");
    // Count badge only for non-zero counts
    expect(active?.textContent).toContain("3");
  });

  it("clicking a pill calls state.setType with the pill id", () => {
    const state = makeState();
    mount(state);
    fireEvent.click(screen.getByText("Videos"));
    expect(state.setType).toHaveBeenCalledWith("vid");
  });
});

describe("AssetGrid — sort menu", () => {
  it("opens the sort menu and selecting an option calls setSort keeping direction", () => {
    const state = makeState({ sort: "date", sortDir: "desc" });
    mount(state);
    fireEvent.click(screen.getByText(/Sort: Recent/));
    fireEvent.click(screen.getByText("Name"));
    expect(state.setSort).toHaveBeenCalledWith("name", "desc");
  });

  it("direction row flips asc/desc without changing the sort key", () => {
    const state = makeState({ sort: "size", sortDir: "asc" });
    mount(state);
    fireEvent.click(screen.getByText(/Sort: Size/));
    fireEvent.click(screen.getByText("Ascending ↑"));
    expect(state.setSort).toHaveBeenCalledWith("size", "desc");
  });
});

describe("AssetGrid — grid/list view toggle", () => {
  it("defaults to grid view and switches to list rows on toggle", () => {
    const state = makeState({
      libraryItems: [makeItem()],
      counts: { all: 1, img: 1, vid: 0, ico: 0, fnt: 0 },
    });
    const { container } = mount(state);
    expect(container.querySelector(".mgr-grid")).toBeInTheDocument();
    expect(container.querySelector(".mgr-list")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("List view"));
    expect(container.querySelector(".mgr-list")).toBeInTheDocument();
    expect(container.querySelector(".mgr-list-row")).toBeInTheDocument();
  });
});

describe("AssetGrid — selection semantics", () => {
  it("plain click selects the asset for the details rail", () => {
    const state = makeState({ libraryItems: [makeItem({ key: "a" })] });
    const { props, container } = mount(state);
    fireEvent.click(container.querySelector(".mgr-asset")!);
    expect(props.onSelectAsset).toHaveBeenCalledWith("a");
    expect(state.toggleSelect).not.toHaveBeenCalled();
  });

  it("cmd/ctrl-click enters multi-select mode and toggles the key", () => {
    const state = makeState({ libraryItems: [makeItem({ key: "a" })] });
    const { container } = mount(state);
    fireEvent.click(container.querySelector(".mgr-asset")!, { metaKey: true });
    expect(state.toggleSelMode).toHaveBeenCalled();
    expect(state.toggleSelect).toHaveBeenCalledWith("a");
  });

  it("in selMode a plain click toggles selection instead of opening details", () => {
    const state = makeState({ libraryItems: [makeItem({ key: "a" })], selMode: true });
    const { props, container } = mount(state);
    fireEvent.click(container.querySelector(".mgr-asset")!);
    expect(state.toggleSelect).toHaveBeenCalledWith("a");
    expect(props.onSelectAsset).not.toHaveBeenCalled();
  });

  it("double-click inserts to canvas; context-menu opens the ctx menu", () => {
    const state = makeState({ libraryItems: [makeItem({ key: "a" })] });
    const { container } = mount(state);
    const card = container.querySelector(".mgr-asset")!;
    fireEvent.doubleClick(card);
    expect(state.insertToCanvas).toHaveBeenCalledWith("a");
    fireEvent.contextMenu(card);
    expect(state.openCtxMenu).toHaveBeenCalled();
  });
});

describe("AssetGrid — bulk toolbar", () => {
  const bulkState = () =>
    makeState({
      selMode: true,
      selectedKeys: new Set(["a", "b"]),
      libraryItems: [makeItem({ key: "a" }), makeItem({ key: "b", name: "hero.jpg" })],
      folders: [
        { id: "f1", name: "Brand", parentId: null },
      ] as MediaStateResult["folders"],
      counts: { all: 2, img: 2, vid: 0, ico: 0, fnt: 0 },
    });

  it("is hidden when selMode is off or nothing is selected", () => {
    const { container } = mount(makeState({ selMode: true, selectedKeys: new Set() }));
    expect(container.querySelector(".mgr-bulk-bar")).not.toBeInTheDocument();
  });

  it("shows the selected count", () => {
    mount(bulkState());
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  it("Move to → folder calls bulkMoveAssets with keys + folder id, toasts, exits selMode", () => {
    const state = bulkState();
    const { props } = mount(state);
    fireEvent.click(screen.getByText(/Move to/));
    fireEvent.click(screen.getByText("Brand"));
    expect(state.bulkMoveAssets).toHaveBeenCalledWith(["a", "b"], "f1");
    expect(props.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Moved 2 to Brand", tone: "success" }),
    );
    expect(state.toggleSelMode).toHaveBeenCalled();
  });

  it("Move to → Root passes folderId=null", () => {
    const state = bulkState();
    mount(state);
    fireEvent.click(screen.getByText(/Move to/));
    fireEvent.click(screen.getByText("Root"));
    expect(state.bulkMoveAssets).toHaveBeenCalledWith(["a", "b"], null);
  });

  it("Delete requests bulk delete with the selected LibraryItems", () => {
    const state = bulkState();
    mount(state);
    fireEvent.click(screen.getByText("Delete"));
    expect(state.requestBulkDelete).toHaveBeenCalledTimes(1);
    const arg = (state.requestBulkDelete as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.map((i: LibraryItem) => i.key)).toEqual(["a", "b"]);
  });

  it("Select all and Cancel wire to state", () => {
    const state = bulkState();
    mount(state);
    fireEvent.click(screen.getByText("Select all"));
    expect(state.selectAll).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Cancel"));
    expect(state.toggleSelMode).toHaveBeenCalled();
  });
});

describe("AssetGrid — badges + footer", () => {
  it("renders the usage chip when usageMap has a count", () => {
    const state = makeState({
      libraryItems: [makeItem({ key: "a" })],
      counts: { all: 1, img: 1, vid: 0, ico: 0, fnt: 0 },
    });
    mount(state, { usageMap: new Map([["a", 3]]) });
    expect(screen.getByText("3×")).toBeInTheDocument();
  });

  it("renders source badges (STOCK / AI / UP)", () => {
    const state = makeState({
      libraryItems: [
        makeItem({ key: "a", assetSource: "stock" }),
        makeItem({ key: "b", name: "gen.png", assetSource: "ai" }),
        makeItem({ key: "c", name: "up.png", assetSource: "uploaded" }),
      ],
    });
    mount(state);
    expect(screen.getByText("STOCK")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("UP")).toBeInTheDocument();
  });

  it("footer shows 'Showing N of M in <smart folder>'", () => {
    const state = makeState({
      libraryItems: [makeItem({ key: "a" })],
      counts: { all: 5, img: 5, vid: 0, ico: 0, fnt: 0 },
    });
    mount(state, { smartFolder: "unused" });
    expect(screen.getByText(/of 5 in Unused/)).toBeInTheDocument();
  });
});
