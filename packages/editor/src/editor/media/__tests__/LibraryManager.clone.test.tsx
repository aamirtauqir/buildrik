/**
 * Clone Phase-1 contracts for the fullpage library — Figma page
 * "Editor v1 Clone", section 3695:19967 ("CURRENT · Assets selection and
 * browsing"). One `it` per prototype fact a DOM assertion can prove; the
 * visual half is the shot pair in docs/design-jobs/CLONE-ASSETS/shots/.
 *
 * Plan: docs/plans/2026-09-13-assets-clone-phase1.md (Tasks 4–9).
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import type { MediaStateResult } from "../../sidebar/tabs/media/data/mediaTypes";
import { TEN, makeComposer, makeFolder, makeMediaState } from "./libraryFixture";

const mocks = vi.hoisted(() => ({
  state: { mediaState: null as unknown as import("../../sidebar/tabs/media/data/mediaTypes").MediaStateResult },
}));

vi.mock("../../sidebar/tabs/media/hooks/useMediaState", () => ({
  useMediaState: () => mocks.state.mediaState,
}));

vi.mock("@/editor/chrome-ui", async () => {
  const actual: Record<string, unknown> = await vi.importActual("@/editor/chrome-ui");
  return { ...actual, useToast: () => ({ addToast: vi.fn() }) };
});

vi.mock("../../sidebar/tabs/media/components/StockSourceModal", () => ({ StockSourceModal: () => null }));
vi.mock("../../sidebar/tabs/media/components/ConfirmDeleteModal", () => ({ ConfirmDeleteModal: () => null }));
vi.mock("../../sidebar/tabs/media/components/MediaContextMenu", () => ({ MediaContextMenu: () => null }));
vi.mock("../../sidebar/tabs/media/components/AssetDetailOverlay", () => ({ AssetDetailOverlay: () => null }));

async function mountLibrary(over: Partial<MediaStateResult> = {}, usages: Record<string, number> = {}) {
  mocks.state.mediaState = makeMediaState({
    libraryItems: TEN,
    counts: { all: TEN.length, img: 5, vid: 2, ico: 2, fnt: 1 },
    ...over,
  });
  const { LibraryManager } = await import("../LibraryManager");
  const onClose = vi.fn();
  const utils = render(
    <LibraryManager composer={makeComposer(usages)} onClose={onClose} onOpenImageEditor={vi.fn()} onOpenIconPicker={vi.fn()} />
  );
  return { ...utils, onClose };
}

describe("Clone 3695:45155 · Assets · No selection — J-A library chrome", () => {
  it("titles the overlay 'Asset library' with no MANAGE tag and no breadcrumb", async () => {
    await mountLibrary();
    expect(screen.getByRole("heading", { name: "Asset library" })).toBeInTheDocument();
    expect(screen.queryByText("MANAGE")).toBeNull();
    expect(screen.queryByText("All Media")).toBeNull();
  });

  it("orders the header Import URL · Upload (primary) · Add from stock · Close, and Close is a labelled text button", async () => {
    const { onClose } = await mountLibrary();
    const top = screen.getByTestId("mgr-top");
    const names = within(top).getAllByRole("button").map((b) => b.textContent?.trim());
    expect(names).toEqual(["Import URL", "Upload", "Add from stock", "Close"]);
    expect(screen.getByTestId("mgr-btn-upload").className).toContain("mgr-btn-primary");
    expect(screen.getByTestId("mgr-btn-stock").className).not.toContain("mgr-btn-primary");
    fireEvent.click(within(top).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("reads the toolbar count as '<N> files · <scope>' and moves the scope out of the grid foot", async () => {
    await mountLibrary();
    expect(screen.getByTestId("mgr-count")).toHaveTextContent("10 files · All assets");
    expect(screen.queryByText(/^Showing/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Unused/ }));
    expect(screen.getByTestId("mgr-count")).toHaveTextContent(/files · Unused$/);
  });

  it("labels the view controls 'Grid · 3 columns' and 'List' as text, not icons", async () => {
    await mountLibrary();
    expect(screen.getByText("Grid · 3 columns")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "List" })).toBeInTheDocument();
  });

  it("names the sort 'Date added' by default and 'Name A–Z' when sorted by name ascending", async () => {
    await mountLibrary();
    expect(screen.getByTestId("mgr-sort")).toHaveTextContent("Date added");
  });

  it("names the sort 'Name A–Z' when sorted by name ascending", async () => {
    await mountLibrary({ sort: "name", sortDir: "asc" });
    expect(screen.getByTestId("mgr-sort")).toHaveTextContent("Name A–Z");
  });

  it("draws a video without a poster as a neutral tile, never a broken <img>", async () => {
    await mountLibrary();
    const chef = screen.getByTestId("mgr-thumb-chef");
    expect(chef.querySelector("img")).toBeNull();
  });
});

describe("Clone 3695:44543 / 44747 / 20154 · view switch preserves selection (audit A01)", () => {
  it("keeps menu-cover.png in the rail across a List switch and back, and creates no bulk selection", async () => {
    await mountLibrary();
    fireEvent.click(screen.getByTestId("mgr-asset-menu"));
    const rail = () => within(screen.getByTestId("mgr-details"));
    expect(rail().getByText("menu-cover.png")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "List" }));
    expect(rail().getByText("menu-cover.png")).toBeInTheDocument();
    expect(screen.queryByTestId("mgr-bulk-bar")).toBeNull();
    fireEvent.click(within(screen.getByTestId("mgr-gridn")).getByRole("button", { name: "3" }));
    expect(rail().getByText("menu-cover.png")).toBeInTheDocument();
  });
});

describe("Clone 3695:44339 · Assets · Search menu", () => {
  it("counts the results for the query and keeps the matching selection", async () => {
    await mountLibrary({ librarySearch: "menu", libraryItems: TEN.filter((i) => i.name.includes("menu")) });
    expect(screen.getByTestId("mgr-count")).toHaveTextContent('1 result for "menu"');
    fireEvent.click(screen.getByTestId("mgr-asset-menu"));
    expect(within(screen.getByTestId("mgr-details")).getByText("menu-cover.png")).toBeInTheDocument();
  });

  it("routes the field to the library-only query, never the stock discovery search", async () => {
    const setLibraryQuery = vi.fn();
    const setLibrarySearch = vi.fn();
    await mountLibrary({ setLibraryQuery, setLibrarySearch });
    fireEvent.change(screen.getByPlaceholderText("Search across all folders…"), { target: { value: "menu" } });
    expect(setLibraryQuery).toHaveBeenCalledWith("menu");
    expect(setLibrarySearch).not.toHaveBeenCalled();
  });
});

describe("Clone 3695:19968 / 20154 · bulk mode", () => {
  it("the toolbar's ☑ enters select mode as the List with nothing checked, and the rail says so", async () => {
    const toggleSelMode = vi.fn();
    await mountLibrary({ toggleSelMode });
    fireEvent.click(screen.getByRole("button", { name: "Select files" }));
    expect(toggleSelMode).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("mgr-list-head")).toBeInTheDocument();
    expect(screen.getByTestId("mgr-assets").dataset.view).toBe("list");
  });

  it("in select mode with nothing checked the rail reads 'No assets selected' and its hint", async () => {
    await mountLibrary({ selMode: true });
    expect(screen.queryByTestId("mgr-bulk-bar")).toBeNull();
    const rail = within(screen.getByTestId("mgr-details"));
    expect(rail.getByRole("heading", { name: "No assets selected" })).toBeInTheDocument();
    expect(rail.getByText("Select a file to inspect it. Select checkboxes to manage multiple assets.")).toBeInTheDocument();
  });

  /* Clone 3705:21059 / 3705:20396 (section 3695:45625, LATER than 3695:20154):
     with exactly one file checked the rail is that file's FULL details —
     preview, meta, USED IN, its own actions — with Insert to canvas as the
     primary. Phase 1's "1 asset selected · Select another file to use bulk
     actions." hint and its lone Delete are displaced. */
  it("with one file checked the bar counts it and the rail is that file's full details", async () => {
    const requestDelete = vi.fn();
    await mountLibrary({ selMode: true, selectedKeys: new Set(["chef"]), requestDelete }, { "blob:chef": 1 });
    expect(screen.getByTestId("mgr-bulk-count")).toHaveTextContent("1 selected");
    const rail = within(screen.getByTestId("mgr-details"));
    expect(rail.queryByRole("heading", { name: "1 asset selected" })).toBeNull();
    expect(rail.getByText("chef-intro.mp4")).toBeInTheDocument();
    expect(screen.getByTestId("mgr-det-meta")).toHaveTextContent("Selected asset · MP4");
    expect(screen.getByTestId("mgr-det-used")).toHaveTextContent("Used in 1 place");
    const actions = within(screen.getByTestId("mgr-det-actions"));
    expect(actions.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual([
      "Insert to canvas",
      "Rename",
      "Replace across site…",
      "Delete",
    ]);
    expect(actions.getByRole("button", { name: "Insert to canvas" })).toHaveClass("mgr-btn-primary");
    fireEvent.click(actions.getByRole("button", { name: "Delete" }));
    expect(requestDelete).toHaveBeenCalledWith("chef");
  });

  it("3705:21059 · one checked font: Rename · Delete, no Insert, no Replace", async () => {
    await mountLibrary({ selMode: true, selectedKeys: new Set(["inter"]) });
    const actions = within(screen.getByTestId("mgr-det-actions"));
    expect(actions.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Rename", "Delete"]);
  });

  it("the checked file's rail wins over a card the person clicked before entering select mode", async () => {
    await mountLibrary({ selMode: true, selectedKeys: new Set(["chef"]) });
    const rail = within(screen.getByTestId("mgr-details"));
    expect(rail.getByText("chef-intro.mp4")).toBeInTheDocument();
    expect(rail.queryByText("menu-cover.png")).toBeNull();
  });

  /* Clone 4215:26635 — two checked: the rail is about the set. */
  it("with two files checked the rail counts them and offers Move to folder · Clear selection", async () => {
    const clearSelection = vi.fn();
    await mountLibrary({ selMode: true, selectedKeys: new Set(["hero", "chef"]), clearSelection });
    expect(screen.getByTestId("mgr-bulk-count")).toHaveTextContent("2 selected");
    const rail = within(screen.getByTestId("mgr-details"));
    expect(rail.getByRole("heading", { name: "2 assets selected" })).toBeInTheDocument();
    expect(within(screen.getByTestId("mgr-det-files")).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "hero-dark.jpg",
      "chef-intro.mp4",
    ]);
    fireEvent.click(screen.getByTestId("mgr-det-clear-selection"));
    expect(clearSelection).toHaveBeenCalledTimes(1);
  });

  it("✕ Clear empties the checked set but stays in select mode", async () => {
    const clearSelection = vi.fn();
    const toggleSelMode = vi.fn();
    await mountLibrary({ selMode: true, selectedKeys: new Set(["hero"]), clearSelection, toggleSelMode });
    fireEvent.click(within(screen.getByTestId("mgr-bulk-bar")).getByRole("button", { name: /Clear/ }));
    expect(clearSelection).toHaveBeenCalledTimes(1);
    expect(toggleSelMode).not.toHaveBeenCalled();
  });

  it("the list header's checkbox selects every file", async () => {
    const selectAll = vi.fn();
    await mountLibrary({ selMode: true, selectAll });
    fireEvent.click(screen.getByRole("button", { name: "List" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all files" }));
    expect(selectAll).toHaveBeenCalledTimes(1);
  });
});

describe("Clone 3698:20337 · Assets · Products · folder scope — P2-A", () => {
  it("draws every folder in FOLDERS with its own count, a nested one under its parent", async () => {
    await mountLibrary({
      folders: [makeFolder({ id: "f1", name: "Products" })],
      allFolders: [
        makeFolder({ id: "f1", name: "Products" }),
        makeFolder({ id: "f2", name: "Campaign images", parentId: "f1" }),
      ],
      folderCounts: new Map([["f1", 8]]),
    });
    const rail = within(screen.getByTestId("mgr-folders"));
    expect(rail.getByTestId("mgr-row-folder-f1").querySelector(".mgr-node-count")).toHaveTextContent("8");
    // The nested folder used to be invisible here: the tree was handed the
    // root-only list, so a folder created inside a scope had no row at all.
    const nested = rail.getByTestId("mgr-row-folder-f2");
    expect(nested).toHaveClass("depth-2");
    expect(nested.querySelector(".mgr-node-count")).toHaveTextContent("0");
  });

  it("clicking a folder row scopes the grid to it and clears the smart folder", async () => {
    const setCurrentFolderId = vi.fn();
    await mountLibrary({ allFolders: [makeFolder({ id: "f1", name: "Products" })], setCurrentFolderId });
    fireEvent.click(screen.getByTestId("mgr-row-folder-f1"));
    expect(setCurrentFolderId).toHaveBeenCalledWith("f1");
  });
});

describe("Clone 3700:20347 / 3700:20350 · New folder — P2-A", () => {
  it("'+ New folder' opens the Create folder modal; Cancel returns with scope and selection unchanged (A06)", async () => {
    const setCurrentFolderId = vi.fn();
    await mountLibrary({ setCurrentFolderId });
    fireEvent.click(screen.getByTestId("mgr-asset-menu"));
    fireEvent.click(screen.getByTestId("mgr-new-folder-open"));
    expect(screen.getByTestId("mgr-create-folder")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "New folder" })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mgr-create-folder-cancel"));
    expect(screen.queryByTestId("mgr-create-folder")).toBeNull();
    expect(within(screen.getByTestId("mgr-details")).getByText("menu-cover.png")).toBeInTheDocument();
    expect(setCurrentFolderId).not.toHaveBeenCalled();
  });

  it("Create folder files the name at the current level and the new folder becomes the scope", async () => {
    const setCurrentFolderId = vi.fn();
    const createFolder = vi.fn((name: string) => Promise.resolve(makeFolder({ id: "f-new", name })));
    await mountLibrary({ createFolder, setCurrentFolderId });
    fireEvent.click(screen.getByRole("button", { name: /^Unused/ }));
    fireEvent.click(screen.getByTestId("mgr-new-folder-open"));
    fireEvent.change(screen.getByTestId("mgr-create-folder-input"), { target: { value: "Campaign images" } });
    fireEvent.click(screen.getByTestId("mgr-create-folder-go"));
    expect(createFolder).toHaveBeenCalledWith("Campaign images");
    await vi.waitFor(() => expect(setCurrentFolderId).toHaveBeenLastCalledWith("f-new"));
    // The smart-folder scope it was opened from is released with it.
    expect(screen.getByTestId("mgr-count")).not.toHaveTextContent(/Unused$/);
    expect(screen.queryByTestId("mgr-create-folder")).toBeNull();
  });

  it("a name already at this level is refused with the next free name, which creates that folder", async () => {
    const createFolder = vi.fn((name: string) => Promise.resolve(makeFolder({ id: "f-new", name })));
    await mountLibrary({
      createFolder,
      allFolders: [makeFolder({ id: "f1", name: "Products" }), makeFolder({ id: "f2", name: "Nested", parentId: "f1" })],
    });
    fireEvent.click(screen.getByTestId("mgr-new-folder-open"));
    fireEvent.change(screen.getByTestId("mgr-create-folder-input"), { target: { value: "products" } });
    fireEvent.click(screen.getByTestId("mgr-create-folder-go"));
    expect(createFolder).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Folder name already exists" })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mgr-create-folder-use"));
    expect(createFolder).toHaveBeenCalledWith("Products 2");
  });

  it("the duplicate check is against the CURRENT level: a root name is free inside a folder", async () => {
    const createFolder = vi.fn((name: string) => Promise.resolve(makeFolder({ id: "f-new", name })));
    await mountLibrary({
      createFolder,
      currentFolderId: "f1",
      allFolders: [makeFolder({ id: "f1", name: "Products" }), makeFolder({ id: "f2", name: "Nested", parentId: "f1" })],
    });
    fireEvent.click(screen.getByTestId("mgr-new-folder-open"));
    fireEvent.change(screen.getByTestId("mgr-create-folder-input"), { target: { value: "Products" } });
    fireEvent.click(screen.getByTestId("mgr-create-folder-go"));
    expect(createFolder).toHaveBeenCalledWith("Products");
  });
});

describe("Clone 3700:20353 · Assets · Campaign images · empty folder created — P2-A", () => {
  const emptyFolder = () => ({
    libraryItems: [],
    currentFolderId: "f-new",
    allFolders: [makeFolder({ id: "f1", name: "Products" }), makeFolder({ id: "f-new", name: "Campaign images" })],
    folderCounts: new Map([["f1", 8]]),
  });

  it("an empty FOLDER scope reads the folder's own state, not the library's empty hero", async () => {
    await mountLibrary(emptyFolder());
    const empty = within(screen.getByTestId("mgr-empty-folder"));
    expect(empty.getByRole("heading", { name: "Campaign images" })).toBeInTheDocument();
    expect(empty.getByText("Folder created · No assets yet")).toBeInTheDocument();
    expect(empty.getByText("Upload files or move existing assets into this folder.")).toBeInTheDocument();
    expect(empty.getByRole("button", { name: "Upload files" })).toBeInTheDocument();
    expect(screen.queryByText("No images or files yet.")).toBeNull();
    expect(screen.queryByTestId("mgr-empty")).toBeNull();
    // Its row lights in FOLDERS at 0 while the folder it was made beside keeps its count.
    expect(screen.getByTestId("mgr-row-folder-f-new")).toHaveClass("active");
    expect(screen.getByTestId("mgr-row-folder-f-new").querySelector(".mgr-node-count")).toHaveTextContent("0");
  });

  it("'Upload files' is the library's own upload picker", async () => {
    const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    await mountLibrary(emptyFolder());
    fireEvent.click(within(screen.getByTestId("mgr-empty-folder")).getByRole("button", { name: "Upload files" }));
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it("files picked while a folder is the scope land IN that folder, the way a drop already did", async () => {
    const upload = vi.fn(() => Promise.resolve(true));
    await mountLibrary({ ...emptyFolder(), upload });
    const input = document.querySelector<HTMLInputElement>("input[type='file']")!;
    const file = new File(["x"], "campaign.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(upload).toHaveBeenCalledWith([file], { folderId: "f-new" });
  });

  it("the library-empty hero stays for the root and for smart scopes", async () => {
    await mountLibrary({ libraryItems: [], currentFolderId: null });
    expect(screen.getByText("No images or files yet.")).toBeInTheDocument();
    expect(screen.queryByTestId("mgr-empty-folder")).toBeNull();
  });

  it("a search or a format filter that empties a folder is 'No results', not 'Folder created'", async () => {
    await mountLibrary({ ...emptyFolder(), folderCounts: new Map([["f-new", 3]]), librarySearch: "zzz" });
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.queryByTestId("mgr-empty-folder")).toBeNull();
  });

  it("a folder that holds assets the filters hide is not 'empty'", async () => {
    await mountLibrary({ ...emptyFolder(), folderCounts: new Map([["f-new", 3]]), fmtFilter: "png" });
    expect(screen.queryByTestId("mgr-empty-folder")).toBeNull();
    expect(screen.getByTestId("mgr-empty")).toBeInTheDocument();
  });
});

describe("Clone 3695:20614 / 44165 · Insert to canvas returns to the canvas", () => {
  it("inserts, then closes the library", async () => {
    const insertToCanvas = vi.fn(() => Promise.resolve());
    const { onClose } = await mountLibrary({ insertToCanvas });
    fireEvent.click(screen.getByTestId("mgr-asset-menu"));
    fireEvent.click(within(screen.getByTestId("mgr-det-actions")).getByRole("button", { name: "Insert to canvas" }));
    await screen.findByTestId("mgr-details");
    expect(insertToCanvas).toHaveBeenCalledWith("menu");
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});

/* ─── P2-B Move & drag ──────────────────────────────────────────────────── */

const PRODUCTS = makeFolder({ id: "f1", name: "Products" });
const HERO_SHOTS = makeFolder({ id: "f2", name: "Hero shots" });
/* hero-dark.jpg already filed in Hero shots; chef-intro.mp4 unfiled — the
   pair 3683:19950 and 3699:20381 are drawn with. */
const FILED = TEN.map((i) => (i.key === "hero" ? { ...i, folderId: "f2" } : i));

const twoChecked = (over: Partial<MediaStateResult> = {}) => ({
  libraryItems: FILED,
  selMode: true,
  selectedKeys: new Set(["hero", "chef"]),
  folders: [PRODUCTS, HERO_SHOTS],
  allFolders: [PRODUCTS, HERO_SHOTS],
  folderCounts: new Map([["f2", 1]]),
  ...over,
});

const rail = () => within(screen.getByTestId("mgr-details"));
/* The list is where the checked rows live (4215:26635); the grid is the mount default. */
const toList = () => fireEvent.click(screen.getByRole("button", { name: "List" }));
const openMoveModal = () =>
  fireEvent.click(within(screen.getByTestId("mgr-bulk-bar")).getByRole("button", { name: "Move to folder…" }));

describe("Clone 3683:19950 · Move 2 assets — from the bulk bar", () => {
  it("Move to folder… opens the modal, which names where each file is and every folder", async () => {
    await mountLibrary(twoChecked());
    openMoveModal();
    expect(screen.getByTestId("mgr-move-title")).toHaveTextContent("Move 2 assets");
    expect(screen.getByTestId("mgr-move-body")).toHaveTextContent(
      "hero-dark.jpg is in Hero shots; chef-intro.mp4 is unfiled. Choose a destination.",
    );
    expect(screen.getByTestId("mgr-move-folder-f1")).toHaveTextContent("Products");
    expect(screen.getByTestId("mgr-move-folder-f2")).toHaveTextContent("Hero shots");
  });

  it("the rail's Move to folder opens the same modal", async () => {
    await mountLibrary(twoChecked());
    fireEvent.click(screen.getByTestId("mgr-det-move-to-folder"));
    expect(screen.getByTestId("mgr-move-title")).toHaveTextContent("Move 2 assets");
  });

  it("Cancel returns to the library with the selection intact (A06)", async () => {
    const bulkMoveAssets = vi.fn(() => Promise.resolve());
    const clearSelection = vi.fn();
    await mountLibrary(twoChecked({ bulkMoveAssets, clearSelection }));
    openMoveModal();
    fireEvent.click(screen.getByTestId("mgr-move-cancel"));
    expect(screen.queryByTestId("mgr-move")).toBeNull();
    expect(bulkMoveAssets).not.toHaveBeenCalled();
    expect(clearSelection).not.toHaveBeenCalled();
    expect(rail().getByRole("heading", { name: "2 assets selected" })).toBeInTheDocument();
  });
});

describe("Clone 3683:19964 / 3699:20381 · Moved to <Folder> — the result in the rail", () => {
  it("3683:19964 · a clean move to Products: the rail reports it, the bar still counts 2, the selection is kept", async () => {
    const bulkMoveAssets = vi.fn(() => Promise.resolve());
    const clearSelection = vi.fn();
    const toggleSelMode = vi.fn();
    await mountLibrary(twoChecked({ bulkMoveAssets, clearSelection, toggleSelMode }));
    openMoveModal();
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    expect(bulkMoveAssets).toHaveBeenCalledWith(["hero", "chef"], "f1");
    await screen.findByTestId("mgr-det-move-result");
    expect(rail().getByRole("heading", { name: "Moved to Products" })).toBeInTheDocument();
    expect(screen.getByTestId("mgr-det-move-result-body")).toHaveTextContent(
      "2 assets moved successfully. Their existing site placements are unchanged.",
    );
    expect(within(screen.getByTestId("mgr-det-files")).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "hero-dark.jpg",
      "chef-intro.mp4",
    ]);
    expect(screen.getByTestId("mgr-bulk-count")).toHaveTextContent("2 selected");
    expect(clearSelection).not.toHaveBeenCalled();
    expect(toggleSelMode).not.toHaveBeenCalled();
    expect(screen.queryByTestId("mgr-move")).toBeNull();
  });

  it("3699:20381 · a move to Hero shots, where hero-dark.jpg already was, says so", async () => {
    await mountLibrary(twoChecked({ bulkMoveAssets: vi.fn(() => Promise.resolve()) }));
    openMoveModal();
    fireEvent.click(screen.getByTestId("mgr-move-folder-f2"));
    await screen.findByTestId("mgr-det-move-result");
    expect(rail().getByRole("heading", { name: "Moved to Hero shots" })).toBeInTheDocument();
    expect(screen.getByTestId("mgr-det-move-result-body")).toHaveTextContent(
      "chef-intro.mp4 moved; hero-dark.jpg was already here. Site placements are unchanged.",
    );
  });

  it("View destination scopes the library to that folder and keeps the selection (edge `Action / Move to folder`)", async () => {
    const setCurrentFolderId = vi.fn();
    const clearSelection = vi.fn();
    await mountLibrary(twoChecked({ bulkMoveAssets: vi.fn(() => Promise.resolve()), setCurrentFolderId, clearSelection }));
    openMoveModal();
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    await screen.findByTestId("mgr-det-move-result");
    fireEvent.click(screen.getByTestId("mgr-det-view-destination"));
    expect(setCurrentFolderId).toHaveBeenCalledWith("f1");
    expect(clearSelection).not.toHaveBeenCalled();
  });

  it("Clear selection empties the checked set (edge `Action / Clear selection`)", async () => {
    const clearSelection = vi.fn();
    await mountLibrary(twoChecked({ bulkMoveAssets: vi.fn(() => Promise.resolve()), clearSelection }));
    openMoveModal();
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    await screen.findByTestId("mgr-det-move-result");
    fireEvent.click(screen.getByTestId("mgr-det-clear-selection"));
    expect(clearSelection).toHaveBeenCalledTimes(1);
  });

  it("the result clears once the selection changes", async () => {
    const { rerender } = await mountLibrary(twoChecked({ bulkMoveAssets: vi.fn(() => Promise.resolve()) }));
    openMoveModal();
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    await screen.findByTestId("mgr-det-move-result");
    mocks.state.mediaState = { ...mocks.state.mediaState, selectedKeys: new Set(["hero"]) };
    const { LibraryManager } = await import("../LibraryManager");
    rerender(<LibraryManager composer={makeComposer()} onClose={vi.fn()} onOpenImageEditor={vi.fn()} onOpenIconPicker={vi.fn()} />);
    expect(screen.queryByTestId("mgr-det-move-result")).toBeNull();
    expect(rail().getByText("hero-dark.jpg")).toBeInTheDocument();
  });

  it("the result clears once the scope changes", async () => {
    const { rerender } = await mountLibrary(twoChecked({ bulkMoveAssets: vi.fn(() => Promise.resolve()) }));
    openMoveModal();
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    await screen.findByTestId("mgr-det-move-result");
    mocks.state.mediaState = { ...mocks.state.mediaState, currentFolderId: "f1" };
    const { LibraryManager } = await import("../LibraryManager");
    rerender(<LibraryManager composer={makeComposer()} onClose={vi.fn()} onOpenImageEditor={vi.fn()} onOpenIconPicker={vi.fn()} />);
    expect(screen.queryByTestId("mgr-det-move-result")).toBeNull();
    expect(rail().getByRole("heading", { name: "2 assets selected" })).toBeInTheDocument();
  });
});

describe("Clone 3699:20347 · Files could not be moved", () => {
  it("a rejected move shows the failure; Retry runs the same move again and then reports it", async () => {
    const bulkMoveAssets = vi
      .fn<(keys: string[], folderId: string | null) => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined);
    await mountLibrary(twoChecked({ bulkMoveAssets }));
    openMoveModal();
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    await screen.findByTestId("mgr-move-failed");
    expect(screen.getByTestId("mgr-move-failed-title")).toHaveTextContent("Files could not be moved");
    expect(screen.queryByTestId("mgr-det-move-result")).toBeNull();
    expect(rail().getByRole("heading", { name: "2 assets selected" })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mgr-move-failed-retry"));
    expect(bulkMoveAssets).toHaveBeenLastCalledWith(["hero", "chef"], "f1");
    expect(bulkMoveAssets).toHaveBeenCalledTimes(2);
    await screen.findByTestId("mgr-det-move-result");
    expect(screen.queryByTestId("mgr-move-failed")).toBeNull();
  });

  it("Cancel leaves the selection and the folders as they were", async () => {
    const bulkMoveAssets = vi.fn(() => Promise.reject(new Error("offline")));
    const clearSelection = vi.fn();
    await mountLibrary(twoChecked({ bulkMoveAssets, clearSelection }));
    openMoveModal();
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    await screen.findByTestId("mgr-move-failed");
    fireEvent.click(screen.getByTestId("mgr-move-failed-cancel"));
    expect(screen.queryByTestId("mgr-move-failed")).toBeNull();
    expect(bulkMoveAssets).toHaveBeenCalledTimes(1);
    expect(clearSelection).not.toHaveBeenCalled();
    expect(rail().getByRole("heading", { name: "2 assets selected" })).toBeInTheDocument();
  });
});

/** The drag payload jsdom hands React; `types` is empty so the file-drop zone stays out of it. */
const dragTransfer = (key: string) => ({
  setData: vi.fn(),
  setDragImage: vi.fn(),
  getData: (type: string) => (type === "application/x-buildrik-media-asset-key" ? key : ""),
  effectAllowed: "",
  dropEffect: "",
  types: [] as string[],
});

describe("Clone 4215:26635 / 4207:26629 / 4220:26643 · dragging assets over the folders", () => {
  it("two checked rows in flight: every folder is a target, the rail dims, the footer says what a drop does", async () => {
    await mountLibrary(twoChecked());
    toList();
    fireEvent.dragStart(screen.getByTestId("mgr-list-row-chef"), { dataTransfer: dragTransfer("chef") });
    expect(screen.getByTestId("mgr-row-all-assets")).toHaveAttribute("data-drop-target", "true");
    expect(screen.getByTestId("mgr-row-folder-f1")).toHaveAttribute("data-drop-target", "true");
    expect(screen.getByTestId("mgr-row-folder-f2")).toHaveAttribute("data-drop-target", "true");
    expect(screen.getByTestId("mgr-new-folder-open")).not.toHaveAttribute("data-drop-target");
    expect(screen.getByTestId("mgr-details")).toHaveAttribute("data-dimmed", "true");
    expect(screen.getByTestId("mgr-status-drag-hint")).toHaveTextContent(
      "Drop 2 files on a folder to move them · release outside to cancel",
    );
    // The board keeps the count line after the hint.
    expect(screen.getByTestId("mgr-status")).toHaveTextContent(/10 assets/);
    expect(screen.getByTestId("mgr-drag-ghost-badge")).toHaveTextContent("2 items");
    // Nothing moved yet, and the file-upload drop zone did not wake.
    expect(screen.queryByTestId("mgr-dropzone")).toBeNull();
  });

  it("releasing outside restores everything", async () => {
    await mountLibrary(twoChecked());
    toList();
    fireEvent.dragStart(screen.getByTestId("mgr-list-row-chef"), { dataTransfer: dragTransfer("chef") });
    fireEvent.dragEnd(screen.getByTestId("mgr-list-row-chef"));
    expect(screen.getByTestId("mgr-row-folder-f1")).not.toHaveAttribute("data-drop-target");
    expect(screen.getByTestId("mgr-details")).not.toHaveAttribute("data-dimmed");
    expect(screen.queryByTestId("mgr-status-drag-hint")).toBeNull();
    expect(screen.queryByTestId("mgr-drag-ghost")).toBeNull();
  });

  it("4207:26629 · one grid card in flight reads the singular hint", async () => {
    await mountLibrary({ libraryItems: FILED, allFolders: [PRODUCTS, HERO_SHOTS] });
    fireEvent.dragStart(screen.getByTestId("mgr-asset-hero"), { dataTransfer: dragTransfer("hero") });
    expect(screen.getByTestId("mgr-status-drag-hint")).toHaveTextContent(
      "Drop on a folder to move · release outside to cancel",
    );
    expect(screen.getByTestId("mgr-drag-ghost-badge")).toHaveTextContent("1 item");
  });

  it("dropping the checked pair on Products moves both and the rail reports it", async () => {
    const bulkMoveAssets = vi.fn(() => Promise.resolve());
    await mountLibrary(twoChecked({ bulkMoveAssets }));
    toList();
    fireEvent.dragStart(screen.getByTestId("mgr-list-row-chef"), { dataTransfer: dragTransfer("chef") });
    const target = screen.getByTestId("mgr-row-folder-f1");
    fireEvent.dragOver(target, { dataTransfer: dragTransfer("chef") });
    expect(target).toHaveClass("dragover");
    fireEvent.drop(target, { dataTransfer: dragTransfer("chef") });
    expect(bulkMoveAssets).toHaveBeenCalledWith(["hero", "chef"], "f1");
    await screen.findByTestId("mgr-det-move-result");
    expect(rail().getByRole("heading", { name: "Moved to Products" })).toBeInTheDocument();
    // The drop ends the drag even before dragend reaches the source row.
    expect(screen.queryByTestId("mgr-status-drag-hint")).toBeNull();
    expect(screen.getByTestId("mgr-details")).not.toHaveAttribute("data-dimmed");
  });

  it("dropping an unchecked card moves only that card, even while others are checked", async () => {
    const bulkMoveAssets = vi.fn(() => Promise.resolve());
    await mountLibrary(twoChecked({ bulkMoveAssets }));
    toList();
    fireEvent.dragStart(screen.getByTestId("mgr-list-row-menu"), { dataTransfer: dragTransfer("menu") });
    expect(screen.getByTestId("mgr-status-drag-hint")).toHaveTextContent("Drop on a folder to move");
    fireEvent.drop(screen.getByTestId("mgr-row-folder-f2"), { dataTransfer: dragTransfer("menu") });
    expect(bulkMoveAssets).toHaveBeenCalledWith(["menu"], "f2");
  });

  it("a drop on All assets unfiles, and the rail names the destination", async () => {
    const bulkMoveAssets = vi.fn(() => Promise.resolve());
    await mountLibrary(twoChecked({ bulkMoveAssets }));
    toList();
    fireEvent.dragStart(screen.getByTestId("mgr-list-row-hero"), { dataTransfer: dragTransfer("hero") });
    fireEvent.drop(screen.getByTestId("mgr-row-all-assets"), { dataTransfer: dragTransfer("hero") });
    expect(bulkMoveAssets).toHaveBeenCalledWith(["hero", "chef"], null);
    await screen.findByTestId("mgr-det-move-result");
    expect(rail().getByRole("heading", { name: "Moved to All assets" })).toBeInTheDocument();
  });
});
