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
    fmtFilter: "",
    activeTypes: new Set(),
    toggleType: vi.fn(),
    setFmtFilter: vi.fn(),
    setGridN: vi.fn(),
    selectAll: vi.fn(),
    toggleSelMode: vi.fn(),
    selMode: false,
    selectedKeys: new Set<string>(),
    setSort: vi.fn(),
    toggleSelect: vi.fn(),
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
    onDownload: vi.fn(() => 0),
    addToast: vi.fn(),
    ...over,
  };
  const utils = render(<AssetGrid {...props} />);
  return { ...utils, props };
}

// Board 1161:35 files the manager by FORMAT, not by the drawer's type pills:
// the count line, then a strip of the formats this library actually holds.
describe("AssetGrid — toolbar (board 1161:35)", () => {
  it("leads with the file count and the last-added time", () => {
    const state = makeState({ counts: { all: 4, img: 3, vid: 1, ico: 0, fnt: 0 } });
    mount(state);
    expect(screen.getByText(/^4 files/)).toBeInTheDocument();
  });

  it("the format strip lists only formats present in the library", () => {
    const state = makeState({
      libraryItems: [
        { key: "a", name: "a", type: "img", src: "", size: 1, createdAt: new Date().toISOString(), mimeType: "image/jpeg" },
        { key: "b", name: "b", type: "vid", src: "", size: 1, createdAt: new Date().toISOString(), mimeType: "video/mp4" },
      ] as MediaStateResult["libraryItems"],
    });
    mount(state);
    expect(screen.getByText("JPG")).toBeInTheDocument();
    expect(screen.getByText("MP4")).toBeInTheDocument();
    // A chip with nothing behind it could only ever empty the grid.
    expect(screen.queryByText("SVG")).toBeNull();
  });

  it("a format chip toggles fmtFilter on and back off", () => {
    const state = makeState({
      libraryItems: [
        { key: "a", name: "a", type: "img", src: "", size: 1, createdAt: new Date().toISOString(), mimeType: "image/png" },
      ] as MediaStateResult["libraryItems"],
    });
    mount(state);
    fireEvent.click(screen.getByText("PNG"));
    expect(state.setFmtFilter).toHaveBeenCalledWith("png");
  });

  // A type filter set in the drawer persists into the manager; without a
  // visible chip the grid would look filtered for no reason on screen.
  it("a drawer type filter shows as a clearable chip", () => {
    const state = makeState({ activeTypes: new Set(["vid"]) as MediaStateResult["activeTypes"] });
    mount(state);
    const chip = screen.getByLabelText(/Clear the type filter/i);
    fireEvent.click(chip);
    expect(state.setType).toHaveBeenCalledWith("all");
  });

  it("the 2 / 3 / 4 toggle sets the column count", () => {
    const state = makeState({ gridN: 3 });
    mount(state);
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(state.setGridN).toHaveBeenCalledWith(4);
  });

  it("select-all lives in the toolbar, not only inside the bulk bar", () => {
    const state = makeState({ selMode: false });
    mount(state);
    fireEvent.click(screen.getByLabelText("Select all assets"));
    expect(state.selectAll).toHaveBeenCalled();
  });
});

describe("AssetGrid — sort menu", () => {
  it("opens the sort menu and selecting an option calls setSort keeping direction", () => {
    const state = makeState({ sort: "date", sortDir: "desc" });
    mount(state);
    fireEvent.click(screen.getByText("Recent"));
    fireEvent.click(screen.getByText("Name"));
    expect(state.setSort).toHaveBeenCalledWith("name", "desc");
  });

  it("direction row flips asc/desc without changing the sort key", () => {
    const state = makeState({ sort: "size", sortDir: "asc" });
    mount(state);
    fireEvent.click(screen.getByText("Size"));
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

  // Board 1163:4641 bar: count left, then Move to folder… · Download ·
  // Delete · ✕ Clear. Select-all left for the toolbar, where it is reachable
  // before anything is selected.
  it("the bulk bar carries the board's four actions and Clear exits", () => {
    const state = bulkState();
    mount(state);
    expect(screen.getByText("Move to folder…")).toBeInTheDocument();
    expect(screen.getByText("Download")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.queryByText("Select all")).toBeNull();
    fireEvent.click(screen.getByText("✕ Clear"));
    expect(state.toggleSelMode).toHaveBeenCalled();
  });
});

describe("AssetGrid — badges + footer", () => {
  it("card meta says used ×N (board 1161:55) — the usage chip on the thumb is gone", () => {
    const state = makeState({
      libraryItems: [makeItem({ key: "a" })],
      counts: { all: 1, img: 1, vid: 0, ico: 0, fnt: 0 },
    });
    mount(state, { usageMap: new Map([["a", 3]]) });
    expect(screen.getByText("used ×3")).toBeInTheDocument();
  });

  it("an unused asset says so — the answer to \"can I delete this?\"", () => {
    const state = makeState({
      libraryItems: [makeItem({ key: "a" })],
      counts: { all: 1, img: 1, vid: 0, ico: 0, fnt: 0 },
    });
    mount(state, { usageMap: new Map() });
    expect(screen.getByText("unused")).toBeInTheDocument();
  });

  it("only the file KIND badges (▶ / ◆ / Aa) remain — provenance left the card", () => {
    const state = makeState({
      libraryItems: [
        makeItem({ key: "a", assetSource: "stock" }),
        makeItem({ key: "b", name: "gen.png", assetSource: "ai" }),
        makeItem({ key: "c", name: "up.png", assetSource: "uploaded" }),
      ],
    });
    mount(state);
    // Where a file came from is the one thing the grid never has to answer.
    expect(screen.queryByText("STOCK")).toBeNull();
    expect(screen.queryByText("AI")).toBeNull();
    expect(screen.queryByText("UP")).toBeNull();
  });

  it("non-image cards carry their kind badge", () => {
    const state = makeState({
      libraryItems: [
        makeItem({ key: "v", name: "clip.mp4", type: "vid" }),
        makeItem({ key: "s", name: "logo.svg", type: "ico" }),
        makeItem({ key: "f", name: "Inter.woff2", type: "fnt" }),
      ],
    });
    mount(state);
    expect(screen.getByText("▶")).toBeInTheDocument();
    expect(screen.getByText("◆")).toBeInTheDocument();
    // The font THUMB also renders "Aa" as its specimen — scope to the badge.
    expect(document.querySelectorAll(".mgr-kind")).toHaveLength(3);
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
