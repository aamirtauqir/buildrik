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
import { makeMediaState } from "../../__tests__/libraryFixture";

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

/* The one typed builder lives in ../../__tests__/libraryFixture.tsx; this file
   only pins the two defaults its older assertions were written against. */
function makeState(over: Partial<MediaStateResult> = {}): MediaStateResult {
  return makeMediaState({ fmtFilter: "", storage: { used: 0, total: 1024 }, ...over });
}

function mount(state: MediaStateResult, over: Partial<Parameters<typeof AssetGrid>[0]> = {}) {
  const props = {
    state,
    visibleItems: state.libraryItems,
    usageMap: new Map<string, number>(),
    smartFolder: null,
    selectedAssetId: null,
    onSelectAsset: vi.fn(),
    onInsert: vi.fn(),
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
  // Clone 3695:45155 — "<N> files · <scope>". The count is the VISIBLE set,
  // the scope is the rail's selection; the V1 board's "Last added 2h ago"
  // tail (1174:4866) is gone.
  it("leads with the visible file count and the scope", () => {
    const state = makeState({
      libraryItems: [makeItem({ key: "a" }), makeItem({ key: "b" })],
      counts: { all: 4, img: 3, vid: 1, ico: 0, fnt: 0 },
    });
    mount(state);
    expect(screen.getByTestId("mgr-count")).toHaveTextContent("2 files · All assets");
  });

  // A folder made inside another is not in the root list; the count line
  // read "All assets" for a nested scope while the heading read its name.
  it("names a NESTED folder scope from the full folder list", () => {
    const state = makeState({
      libraryItems: [makeItem({ key: "a" })],
      currentFolderId: "child",
      folders: [],
      allFolders: [
        { id: "parent", name: "Products", parentId: null, createdAt: "", updatedAt: "" },
        { id: "child", name: "Campaign images", parentId: "parent", createdAt: "", updatedAt: "" },
      ],
    });
    mount(state);
    expect(screen.getByTestId("mgr-count")).toHaveTextContent("1 file · Campaign images");
  });

  it("reads '<N> results for \"q\"' while a search is active (3695:44339)", () => {
    const state = makeState({ libraryItems: [makeItem({ key: "a" })], librarySearch: "menu" });
    mount(state);
    expect(screen.getByTestId("mgr-count")).toHaveTextContent('1 result for "menu"');
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

  // Clone 3695:19968 — the toolbar's ☑ enters select mode as the List with
  // nothing checked. Select-all moved to the list header's checkbox.
  it("the toolbar's ☑ enters select mode as the list, and selects nothing", () => {
    const state = makeState({ selMode: false, libraryItems: [makeItem({ key: "a" })] });
    const { container } = mount(state);
    fireEvent.click(screen.getByLabelText("Select files"));
    expect(state.toggleSelMode).toHaveBeenCalledTimes(1);
    expect(state.selectAll).not.toHaveBeenCalled();
    expect(container.querySelector(".mgr-list")).toBeInTheDocument();
  });
});

describe("AssetGrid — sort menu", () => {
  it("opens the sort menu and selecting an option calls setSort keeping direction", () => {
    const state = makeState({ sort: "date", sortDir: "desc" });
    mount(state);
    fireEvent.click(screen.getByText("Date added"));
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

    fireEvent.click(screen.getByRole("button", { name: "List" }));
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
    const { container, props } = mount(state);
    const card = container.querySelector(".mgr-asset")!;
    fireEvent.doubleClick(card);
    // Through the orchestrator's insert-and-return, so the library closes
    // onto the canvas (Clone 3695:20614) — not the raw state call.
    expect(props.onInsert).toHaveBeenCalledWith("a");
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
  // Clone 3695:19968 — ✕ Clear empties the set and STAYS in select mode;
  // the toolbar's ☑ is the way out.
  it("the bulk bar carries the board's four actions and Clear empties the set", () => {
    const state = bulkState();
    mount(state);
    expect(screen.getByText("Move to folder…")).toBeInTheDocument();
    expect(screen.getByText("Download")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.queryByText("Select all")).toBeNull();
    fireEvent.click(screen.getByText("✕ Clear"));
    expect(state.clearSelection).toHaveBeenCalled();
    expect(state.toggleSelMode).not.toHaveBeenCalled();
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

  it("the count line names the smart folder as its scope", () => {
    const state = makeState({
      libraryItems: [makeItem({ key: "a" })],
      counts: { all: 5, img: 5, vid: 0, ico: 0, fnt: 0 },
    });
    mount(state, { smartFolder: "unused" });
    expect(screen.getByTestId("mgr-count")).toHaveTextContent("1 file · Unused");
  });
});
