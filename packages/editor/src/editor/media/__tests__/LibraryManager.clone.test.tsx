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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import type { MediaStateResult } from "../../sidebar/tabs/media/data/mediaTypes";
import type { UploadResult } from "../../../shared/types/media";
import { TEN, makeAsset, makeComposer, makeFile, makeFolder, makeItem, makeMediaState, makeSitePages } from "./libraryFixture";

const mocks = vi.hoisted(() => ({
  state: { mediaState: null as unknown as import("../../sidebar/tabs/media/data/mediaTypes").MediaStateResult },
}));

vi.mock("../../sidebar/tabs/media/hooks/useMediaState", () => ({
  useMediaState: () => mocks.state.mediaState,
}));

/* The save path's best-effort server history (3695:45529) — a network call
   the test only wants to see, never make. */
const versionServiceStub = vi.hoisted(() => ({ createAssetVersion: vi.fn(async () => ({})) }));
vi.mock("../../../services/MediaVersionService", () => ({
  createAssetVersion: versionServiceStub.createAssetVersion,
}));
beforeEach(() => versionServiceStub.createAssetVersion.mockClear());

vi.mock("@/editor/chrome-ui", async () => {
  const actual: Record<string, unknown> = await vi.importActual("@/editor/chrome-ui");
  return { ...actual, useToast: () => ({ addToast: vi.fn() }) };
});

/* A stub with a door: the wiring tests below need to drive `onSave` and to
   see which props the orchestrator hands the stock dialog. */
const stockStub = vi.hoisted(() => ({ props: null as null | Record<string, unknown> }));
vi.mock("../../sidebar/tabs/media/components/StockSourceModal", () => ({
  StockSourceModal: (props: { open: boolean; onSave: (t: string, item: unknown) => unknown }) => {
    stockStub.props = props;
    return props.open ? (
      <button
        type="button"
        data-testid="stub-stock-save"
        onClick={() => void props.onSave("img", { id: "p1", alt: "Restaurant interior", url: "https://images.example.com/p1.jpg" })}
      >
        stub save
      </button>
    ) : null;
  },
}));
vi.mock("../../sidebar/tabs/media/components/ConfirmDeleteModal", () => ({ ConfirmDeleteModal: () => null }));
vi.mock("../../sidebar/tabs/media/components/MediaContextMenu", () => ({ MediaContextMenu: () => null }));
vi.mock("../../sidebar/tabs/media/components/AssetDetailOverlay", () => ({ AssetDetailOverlay: () => null }));

async function mountLibrary(
  over: Partial<MediaStateResult> = {},
  usages: Record<string, number> = {},
  media: Parameters<typeof makeComposer>[1] = {},
  elements?: Parameters<typeof makeComposer>[2],
) {
  mocks.state.mediaState = makeMediaState({
    libraryItems: TEN,
    counts: { all: TEN.length, img: 5, vid: 2, ico: 2, fnt: 1 },
    ...over,
  });
  const { LibraryManager } = await import("../LibraryManager");
  const onClose = vi.fn();
  const composer = makeComposer(usages, media, elements);
  const utils = render(
    <LibraryManager composer={composer} onClose={onClose} onOpenImageEditor={vi.fn()} onOpenIconPicker={vi.fn()} />
  );
  return { ...utils, onClose, composer };
}

/** The header's ▾ — Import from URL and Add from stock live in its menu (4418:58292). */
const openAddMenu = () => fireEvent.click(screen.getByTestId("mgr-btn-upload-menu"));

describe("Clone 3695:45155 · Assets · No selection — J-A library chrome", () => {
  it("titles the overlay 'Asset library' with no MANAGE tag and no breadcrumb", async () => {
    await mountLibrary();
    expect(screen.getByRole("heading", { name: "Asset library" })).toBeInTheDocument();
    expect(screen.queryByText("MANAGE")).toBeNull();
    expect(screen.queryByText("All Media")).toBeNull();
  });

  /* Board 4418:58292 "mgr-top" (v3): Upload | ▾ is one dark split control —
     the ▾ holds Import from URL and Add from stock — then ‹ Back to canvas.
     This pinned the Clone's four loose buttons (Import URL · Upload · Add
     from stock · Close). */
  it("draws Upload | ▾ then ‹ Back to canvas; the ▾ holds Import from URL and Add from stock", async () => {
    const { onClose } = await mountLibrary();
    const top = screen.getByTestId("mgr-top");
    const names = within(top).getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? b.textContent?.trim());
    expect(names).toEqual(["Upload", "More ways to add", "‹ Back to canvas"]);
    openAddMenu();
    expect(screen.getByTestId("mgr-btn-import")).toHaveTextContent("Import from URL…");
    expect(screen.getByTestId("mgr-btn-stock")).toHaveTextContent("Add from stock…");
    fireEvent.click(within(top).getByRole("button", { name: "‹ Back to canvas" }));
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
    fireEvent.change(screen.getByPlaceholderText("Search all assets…"), { target: { value: "menu" } });
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
    expect(actions.getByRole("button", { name: "Insert to canvas" })).toHaveClass("mgr-btn-ink");
    fireEvent.click(actions.getByRole("button", { name: "Delete" }));
    expect(requestDelete).toHaveBeenCalledWith("chef");
  });

  /* Phase 5 (3686:42317) opened the door this row was left drift-open for:
     Manage font opens the Site fonts dialog on THIS file, through the one
     composer event the dialog listens for. */
  it("3705:21059 · one checked font: Manage font · Rename · Delete, no Insert, no Replace — and Manage font names the file", async () => {
    const emit = vi.fn();
    await mountLibrary({ selMode: true, selectedKeys: new Set(["inter"]) }, {}, { emit });
    const actions = within(screen.getByTestId("mgr-det-actions"));
    expect(actions.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Manage font", "Rename", "Delete"]);
    fireEvent.click(actions.getByRole("button", { name: "Manage font" }));
    expect(emit).toHaveBeenCalledWith("ui:site-fonts", { assetId: "inter" });
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

  /* 3698:20337 draws SMART with the library's own counts while Products is
     the scope — Recent · In use · Unused are library-wide rows, never a
     folder's. `libraryItems` is the scoped list; the counts read the full
     one. */
  it("SMART counts stay library-wide while a folder is the scope", async () => {
    const inFolder = TEN.slice(0, 2);
    await mountLibrary(
      {
        currentFolderId: "f1",
        allFolders: [makeFolder({ id: "f1", name: "Products" })],
        libraryItems: inFolder,
        allLibraryItems: TEN,
      },
      { [TEN[0].src]: 1, [TEN[5].src]: 2, [TEN[7].src]: 1 },
    );
    const smart = within(screen.getByTestId("mgr-folders"));
    expect(smart.getByTestId("mgr-row-in-use").querySelector(".mgr-node-count")).toHaveTextContent("3");
    expect(smart.getByTestId("mgr-row-unused").querySelector(".mgr-node-count")).toHaveTextContent(String(TEN.length - 3));
  });
});

describe("Clone 3700:20347 / 3700:20350 · New folder — P2-A", () => {
  it("'+ New folder' opens the Create folder modal; Cancel returns with scope and selection unchanged (A06)", async () => {
    const setCurrentFolderId = vi.fn();
    await mountLibrary({ setCurrentFolderId });
    fireEvent.click(screen.getByTestId("mgr-asset-menu"));
    fireEvent.click(screen.getByTestId("mgr-new-folder-open"));
    expect(screen.getByTestId("mgr-create-folder")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "New folder" })).toBeInTheDocument();
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
    expect(screen.getByRole("dialog", { name: "Folder name already exists" })).toBeInTheDocument();
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

  /* "files picked while a folder is the scope land IN that folder" moved to
     the P3-U block below: Clone 3724:20828 puts the Upload files confirm
     between the picker and `state.upload`, so the picker no longer uploads
     on change. */

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

/* ─── P3-U Upload ───────────────────────────────────────────────────────── */

const MB = 1024 * 1024;
const fileTransfer = (files: File[]) => ({ types: ["Files"], files, dropEffect: "" });
const pickFiles = (files: File[]) =>
  fireEvent.change(document.querySelector<HTMLInputElement>("input[type='file'][multiple]")!, { target: { files } });
const landedResult = (asset: ReturnType<typeof makeAsset>) => [{ success: true, asset, fileName: asset.originalName }];

describe("Clone 3397:18137 · fullpage · drag-over (re-draws V1 1163:13948)", () => {
  it("files over the library turn the grid column into the drop zone; the rail and the top bar stay", async () => {
    await mountLibrary();
    const root = screen.getByTestId("mgr-root");
    fireEvent.dragEnter(root, { dataTransfer: fileTransfer([]) });
    const zone = screen.getByTestId("mgr-dropzone");
    expect(screen.getByTestId("mgr-grid-col")).toContainElement(zone);
    expect(screen.getByTestId("mgr-dropzone-title")).toHaveTextContent("Drop files to upload");
    // The code's formats and the code's limits — not the board's "50 MB per file".
    expect(screen.getByTestId("mgr-dropzone-sub")).toHaveTextContent(
      "JPG · PNG · GIF · WebP · AVIF · SVG · MP4 · WebM · OGV · MOV · WOFF2 · WOFF · TTF · OTF — up to 10 MB per image · 1 MB per SVG · 100 MB per video · 5 MB per font",
    );
    expect(screen.getByTestId("mgr-top")).toBeInTheDocument();
    expect(screen.getByTestId("mgr-details")).toBeInTheDocument();
    expect(screen.getByTestId("mgr-row-all-assets")).toBeInTheDocument();
    fireEvent.dragLeave(root);
    expect(screen.queryByTestId("mgr-dropzone")).toBeNull();
  });

  it("a drop uploads straight into the current scope — no confirm on the way (edge AFTE → 3397:17505)", async () => {
    const upload = vi.fn(() => Promise.resolve([]));
    await mountLibrary({ upload, currentFolderId: "f1", allFolders: [makeFolder({ id: "f1", name: "Products" })] });
    const root = screen.getByTestId("mgr-root");
    const file = makeFile("pasta-2-small.jpg", 8 * MB);
    fireEvent.dragEnter(root, { dataTransfer: fileTransfer([file]) });
    fireEvent.drop(root, { dataTransfer: fileTransfer([file]) });
    expect(upload).toHaveBeenCalledWith([file], { folderId: "f1" });
    expect(screen.queryByTestId("mgr-upload-files")).toBeNull();
    expect(screen.queryByTestId("mgr-dropzone")).toBeNull();
  });
});

describe("Clone 3724:20828 / 3724:20832 · Upload files → Upload complete", () => {
  it("the header Upload's picker opens the confirm; Cancel uploads nothing", async () => {
    const upload = vi.fn(() => Promise.resolve([]));
    await mountLibrary({ upload });
    pickFiles([makeFile("pasta-2-small.jpg", 8 * MB)]);
    expect(screen.getByTestId("mgr-upload-files")).toBeInTheDocument();
    expect(screen.getByTestId("mgr-upload-files-line-0")).toHaveTextContent("pasta-2-small.jpg · JPG · 8 MB");
    expect(upload).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("mgr-upload-files-cancel"));
    expect(screen.queryByTestId("mgr-upload-files")).toBeNull();
    expect(upload).not.toHaveBeenCalled();
  });

  it("files picked while a folder is the scope land IN that folder, the way a drop already did (3700:20353)", async () => {
    const upload = vi.fn(() => Promise.resolve([]));
    await mountLibrary({
      upload,
      libraryItems: [],
      currentFolderId: "f-new",
      allFolders: [makeFolder({ id: "f-new", name: "Campaign images" })],
    });
    const file = makeFile("campaign.png", MB, "image/png");
    pickFiles([file]);
    fireEvent.click(screen.getByTestId("mgr-upload-files-confirm"));
    expect(upload).toHaveBeenCalledWith([file], { folderId: "f-new" });
  });

  it("Upload file → the modal waits on the queue, then Upload complete; View asset selects it in the rail and closes", async () => {
    let finish: (v: UploadResult[]) => void = () => {};
    const upload = vi.fn(() => new Promise<UploadResult[]>((resolve) => { finish = resolve; }));
    await mountLibrary({
      upload,
      uploadQueue: [{ fileName: "hero-dark.jpg", progress: 62, status: "uploading" }],
    });
    const file = makeFile("hero-dark.jpg", 8 * MB);
    pickFiles([file]);
    fireEvent.click(screen.getByTestId("mgr-upload-files-confirm"));
    expect(upload).toHaveBeenCalledWith([file], { folderId: null });
    // Still the Upload files modal, now reading the queue.
    expect(screen.getByTestId("mgr-upload-files-pct-0")).toHaveTextContent("62%");
    expect(screen.queryByTestId("mgr-upload-complete")).toBeNull();
    finish(landedResult(makeAsset({ id: "hero", name: "hero-dark", originalName: "hero-dark.jpg", mimeType: "image/jpeg" })));
    const done = await screen.findByTestId("mgr-upload-complete");
    expect(screen.queryByTestId("mgr-upload-files")).toBeNull();
    expect(within(done).getByTestId("mgr-upload-complete-body")).toHaveTextContent("hero-dark.jpg is now in your library.");
    fireEvent.click(screen.getByTestId("mgr-upload-complete-view"));
    expect(screen.queryByTestId("mgr-upload-complete")).toBeNull();
    expect(within(screen.getByTestId("mgr-details")).getByText("hero-dark.jpg")).toBeInTheDocument();
  });

  it("Done closes the result and selects nothing", async () => {
    const upload = vi.fn(() => Promise.resolve(landedResult(makeAsset({ id: "hero", originalName: "hero-dark.jpg" }))));
    await mountLibrary({ upload });
    pickFiles([makeFile("hero-dark.jpg", 8 * MB)]);
    fireEvent.click(screen.getByTestId("mgr-upload-files-confirm"));
    fireEvent.click(await screen.findByTestId("mgr-upload-complete-done"));
    expect(screen.queryByTestId("mgr-upload-complete")).toBeNull();
    expect(within(screen.getByTestId("mgr-details")).queryByText("hero-dark.jpg")).toBeNull();
  });

  it("a batch where nothing landed closes without a result — the grid's failed rows are the door", async () => {
    const upload = vi.fn(() =>
      Promise.resolve([{ success: false, error: "Server rejected", fileName: "hero-dark.jpg" }]),
    );
    await mountLibrary({ upload });
    pickFiles([makeFile("hero-dark.jpg", 8 * MB)]);
    fireEvent.click(screen.getByTestId("mgr-upload-files-confirm"));
    await vi.waitFor(() => expect(screen.queryByTestId("mgr-upload-files")).toBeNull());
    expect(screen.queryByTestId("mgr-upload-complete")).toBeNull();
  });

  it("the empty-library hero's Upload goes through the same confirm", async () => {
    const upload = vi.fn(() => Promise.resolve([]));
    await mountLibrary({ upload, libraryItems: [], counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 } });
    const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByTestId("mgr-empty-upload"));
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
    pickFiles([makeFile("first.png", MB, "image/png")]);
    expect(screen.getByTestId("mgr-upload-files")).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });
});

describe("Clone 3585:23337 · Manage in full library — the drawer hands the file over", () => {
  it("a file the drawer selected through the engine opens selected in the rail, and the handoff is consumed", async () => {
    const selectAssets = vi.fn();
    await mountLibrary({}, {}, { getSelectedAssets: () => [makeAsset({ id: "menu", originalName: "menu-cover.png" })], selectAssets });
    expect(within(screen.getByTestId("mgr-details")).getByText("menu-cover.png")).toBeInTheDocument();
    expect(selectAssets).toHaveBeenCalledWith([]);
  });
});

/* ─── P3-I Import URL · Stock ───────────────────────────────────────────── */

const IMPORTED = makeItem({ key: "imported", name: "hero-imported.jpg", src: "blob:imported", mimeType: "image/jpeg" });
const STOCK = makeItem({ key: "stock1", name: "restaurant-interior.jpg", src: "blob:stock1", mimeType: "image/jpeg", assetSource: "stock" });

type UploadCall = [File, { folderId?: string } | undefined];

async function mountWithUpload(over: Partial<MediaStateResult>, uploadFile: ReturnType<typeof vi.fn>) {
  const composer = makeComposer();
  composer.media.uploadFile = uploadFile as unknown as typeof composer.media.uploadFile;
  mocks.state.mediaState = makeMediaState({ libraryItems: TEN, counts: { all: TEN.length, img: 5, vid: 2, ico: 2, fnt: 1 }, ...over });
  const { LibraryManager } = await import("../LibraryManager");
  render(<LibraryManager composer={composer} onClose={vi.fn()} onOpenImageEditor={vi.fn()} onOpenIconPicker={vi.fn()} />);
  return { composer };
}

/* The engine stores the stem and the MIME; the dialog prints the library's name. */
const landsAs = (id: string) =>
  vi.fn(async (file: File) => ({
    success: true,
    asset: { id, name: file.name.replace(/\.[a-z0-9]+$/i, ""), mimeType: file.type },
    fileName: file.name,
  }));

const importUrl = (url: string) => {
  openAddMenu();
  fireEvent.click(screen.getByTestId("mgr-btn-import"));
  fireEvent.change(screen.getByTestId("import-url-input"), { target: { value: url } });
  fireEvent.click(screen.getByTestId("import-url-go"));
};

describe("Clone 3397:18835 → 3695:43873 / 3695:43876 · Import image from URL, from the library", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("Import URL opens the Clone dialog; an image URL lands through the engine into the current scope and reads `Image imported`", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["x"], { type: "image/jpeg" }) }));
    const uploadFile = landsAs("imported");
    await mountWithUpload({ libraryItems: [...TEN, IMPORTED], currentFolderId: "f1", allFolders: [makeFolder()] }, uploadFile);

    openAddMenu();
    fireEvent.click(screen.getByTestId("mgr-btn-import"));
    expect(screen.getByRole("heading", { name: "Import image from URL" })).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("import-url-input"), { target: { value: "https://cdn.example.com/hero-imported.jpg" } });
    fireEvent.click(screen.getByTestId("import-url-go"));

    await screen.findByRole("heading", { name: "Image imported" });
    expect(uploadFile).toHaveBeenCalledTimes(1);
    const [file, opts] = uploadFile.mock.calls[0] as unknown as UploadCall;
    expect(file.name).toBe("hero-imported.jpg");
    expect(opts).toEqual({ folderId: "f1" });
    expect(screen.getByTestId("import-result-body")).toHaveTextContent("hero-imported.jpg · Image");
    expect(screen.queryByRole("heading", { name: "Import image from URL" })).toBeNull();
  });

  it("View asset selects the imported file in the details rail and closes the dialog", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["x"], { type: "image/jpeg" }) }));
    await mountWithUpload({ libraryItems: [...TEN, IMPORTED] }, landsAs("imported"));
    importUrl("https://cdn.example.com/hero-imported.jpg");
    await screen.findByRole("heading", { name: "Image imported" });
    fireEvent.click(screen.getByTestId("import-result-view"));
    expect(screen.queryByRole("heading", { name: "Image imported" })).toBeNull();
    expect(rail().getByText("hero-imported.jpg")).toBeInTheDocument();
  });

  it("a URL that is not a file the library takes reads `Image could not be imported`; Edit URL reopens the dialog with the URL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["<html>"], { type: "text/html" }) }));
    const uploadFile = vi.fn();
    await mountWithUpload({}, uploadFile);
    importUrl("https://cdn.example.com/page.html");
    await screen.findByRole("heading", { name: "Image could not be imported" });
    expect(uploadFile).not.toHaveBeenCalled();
    expect(screen.getByTestId("import-result-body")).toHaveTextContent(/does not return a supported file/);
    fireEvent.click(screen.getByTestId("import-result-edit"));
    await screen.findByRole("heading", { name: "Import image from URL" });
    expect(screen.getByTestId("import-url-input")).toHaveValue("https://cdn.example.com/page.html");
  });

  it("a file the engine refused reads the engine's reason, not the type sentence", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["x"], { type: "image/jpeg" }) }));
    const uploadFile = vi.fn(async (file: File) => ({ success: false, error: "Upload failed — file is 24 MB, limit is 10 MB", fileName: file.name }));
    await mountWithUpload({}, uploadFile);
    importUrl("https://cdn.example.com/huge.jpg");
    await screen.findByRole("heading", { name: "Image could not be imported" });
    expect(screen.getByTestId("import-result-body")).toHaveTextContent("Upload failed — file is 24 MB, limit is 10 MB");
  });
});

describe("Clone 3695:45569 → 3695:45573 · Stock assets, from the library", () => {
  it("Add from stock opens the dialog with no Insert door; Save to library resolves into `Stock image saved`, and View asset selects it in the rail", async () => {
    const saveToLibrary = vi.fn(() => Promise.resolve({ key: "stock1", name: "restaurant-interior.jpg" }));
    await mountLibrary({ libraryItems: [...TEN, STOCK], saveToLibrary });
    openAddMenu();
    fireEvent.click(screen.getByTestId("mgr-btn-stock"));
    expect(stockStub.props?.open).toBe(true);
    expect(stockStub.props).not.toHaveProperty("onInsert");
    fireEvent.click(screen.getByTestId("stub-stock-save"));
    expect(saveToLibrary).toHaveBeenCalledWith("img", expect.objectContaining({ id: "p1" }));
    await screen.findByRole("heading", { name: "Stock image saved" });
    expect(stockStub.props?.open).toBe(false);
    expect(screen.getByTestId("stock-saved-body")).toHaveTextContent("restaurant-interior.jpg is now in your asset library.");
    fireEvent.click(screen.getByTestId("stock-saved-view"));
    expect(screen.queryByRole("heading", { name: "Stock image saved" })).toBeNull();
    expect(rail().getByText("restaurant-interior.jpg")).toBeInTheDocument();
  });

  it("a save the engine refused keeps the stock dialog open and shows no result", async () => {
    const saveToLibrary = vi.fn(() => Promise.resolve(null));
    await mountLibrary({ saveToLibrary });
    openAddMenu();
    fireEvent.click(screen.getByTestId("mgr-btn-stock"));
    fireEvent.click(screen.getByTestId("stub-stock-save"));
    await vi.waitFor(() => expect(saveToLibrary).toHaveBeenCalledTimes(1));
    expect(stockStub.props?.open).toBe(true);
    expect(screen.queryByRole("heading", { name: "Stock image saved" })).toBeNull();
  });
});

/* hero-dark.jpg sits on Home twice and on Menu once — the prototype's "3 uses
   on Home and Menu". */
const heroSite = () =>
  makeSitePages([
    {
      id: "home",
      name: "Home",
      elements: [
        { id: "e1", src: "blob:hero", name: "Hero" },
        { id: "e2", src: "blob:hero", name: "Gallery" },
      ],
    },
    { id: "menu", name: "Menu", elements: [{ id: "e3", src: "blob:hero", name: "Hero image" }] },
  ]);

const ok = (...ids: string[]) => ids.map((elementId) => ({ elementId, previousSrc: "blob:hero" }));
const bad = (...ids: string[]) => ids.map((elementId) => ({ elementId, error: "locked" }));

/** Rail → Replace across site… → the picker → menu-cover.png. */
const pickMenuCover = () => {
  fireEvent.click(screen.getByTestId("mgr-asset-hero"));
  fireEvent.click(rail().getByRole("button", { name: "Replace across site…" }));
  const picker = screen.getByText(/across 3 uses/).closest('[role="dialog"]') as HTMLElement;
  fireEvent.click(within(picker).getByText("menu-cover.png"));
};

describe("Clone 3695:43897 → 3695:43900 / 3695:43903 → 3695:43906 · Replace across site…, from the library", () => {
  it("choosing the replacement closes the picker, shows Replacing image while the engine runs, then Replacement complete per page; Done closes it", async () => {
    const { composer } = await mountLibrary({}, { "blob:hero": 3 }, {}, heroSite());
    vi.mocked(composer.mediaOps.replaceAcross).mockReturnValueOnce({ replaced: ok("e1", "e2", "e3"), failed: [], clean: true });
    pickMenuCover();
    expect(screen.queryByText(/across 3 uses/)).toBeNull();
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Replacing image");
    expect(screen.getByTestId("rx-result-busy")).toHaveTextContent("Updating 3 uses across Home and Menu. Please wait.");
    await screen.findByText("Replacement complete");
    expect(composer.mediaOps.replaceAcross).toHaveBeenCalledWith("blob:hero", "blob:menu");
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("3 of 3 uses updated");
    expect(screen.getByTestId("rx-result-pages")).toHaveTextContent("Home: 2 updated · Menu: 1 updated");
    expect(screen.getByTestId("rx-result-note")).toHaveTextContent("Other elements are unchanged.");
    fireEvent.click(screen.getByTestId("rx-result-done"));
    expect(screen.queryByTestId("rx-result")).toBeNull();
    /* The rail is still the asset's details — nothing else moved. */
    expect(rail().getByText("hero-dark.jpg")).toBeInTheDocument();
  });

  it("a placement the engine could not update is named; Retry failed use runs the engine again and completes", async () => {
    const { composer } = await mountLibrary({}, { "blob:hero": 3 }, {}, heroSite());
    vi.mocked(composer.mediaOps.replaceAcross)
      .mockReturnValueOnce({ replaced: ok("e1", "e2"), failed: bad("e3"), clean: false })
      .mockReturnValueOnce({ replaced: ok("e3"), failed: [], clean: true });
    pickMenuCover();
    await screen.findByText("Some uses could not update");
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("2 updated · 1 failed");
    expect(screen.getByTestId("rx-result-pages")).toHaveTextContent("Home: 2 updated");
    expect(screen.getByTestId("rx-result-failed-0")).toHaveTextContent(
      "Menu / Hero image: update could not be saved. The previous image remains.",
    );
    fireEvent.click(screen.getByTestId("rx-result-retry"));
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Retrying failed use");
    expect(screen.getByTestId("rx-result-busy")).toHaveTextContent(
      "Retrying Menu / Hero image only. The 2 successful updates will not be repeated.",
    );
    await screen.findByText("Replacement complete");
    expect(composer.mediaOps.replaceAcross).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("3 of 3 uses updated");
    expect(screen.getByTestId("rx-result-pages")).toHaveTextContent("Home: 2 updated · Menu: 1 updated");
  });

  it("a run the engine rolled back (it threw) is every placement failed, with Retry — never a busy card with no door", async () => {
    const { composer } = await mountLibrary({}, { "blob:hero": 3 }, {}, heroSite());
    vi.mocked(composer.mediaOps.replaceAcross).mockImplementationOnce(() => {
      throw new Error("transaction failed");
    });
    pickMenuCover();
    await screen.findByText("Some uses could not update");
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("0 updated · 3 failed");
    expect(screen.getByTestId("rx-result-failed-0")).toHaveTextContent("Home / Hero: update could not be saved.");
    expect(screen.getByTestId("rx-result-failed-2")).toHaveTextContent("Menu / Hero image: update could not be saved.");
    expect(screen.getByTestId("rx-result-retry")).toBeInTheDocument();
  });

  it("Close on the partial card leaves the engine's partial result standing", async () => {
    const { composer } = await mountLibrary({}, { "blob:hero": 3 }, {}, heroSite());
    vi.mocked(composer.mediaOps.replaceAcross).mockReturnValueOnce({ replaced: ok("e1", "e2"), failed: bad("e3"), clean: false });
    pickMenuCover();
    await screen.findByText("Some uses could not update");
    fireEvent.click(screen.getByTestId("rx-result-close"));
    expect(screen.queryByTestId("rx-result")).toBeNull();
    expect(composer.mediaOps.replaceAcross).toHaveBeenCalledTimes(1);
  });
});

/* ─── P6-V Versions ─────────────────────────────────────────────────────── */

/* Clone 3695:45529 (Asset versions), 3697:20326 / 3697:20341 (a card
   selected / v2 applied), 3695:45615 (Apply saved version across site),
   3720:43313 (Applying), 3720:43316 (Saved version applied), and the editor's
   Saved → Done door (3681:20026). The model: Save creates a version of the
   SAME asset — a library row flagged with its parent, hidden from the grid —
   and applying it to the site is a separate, explicit `replaceAcross`. */

const EDITS = {
  width: 2400,
  height: 1600,
  crop: "Free",
  preset: "None",
  format: "Original",
  transform: "Original",
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
};

const HERO = makeItem({
  key: "hero",
  name: "hero-dark",
  displayName: "hero-dark.jpg",
  src: "blob:hero",
  mimeType: "image/jpeg",
  width: 2400,
  height: 1600,
  size: 840_000,
  folderId: "f1",
  assetId: "srv-hero",
});
const HERO_V2 = makeItem({
  key: "hero-v2",
  name: "hero-dark-v2",
  displayName: "hero-dark-v2.jpg",
  src: "blob:hero-v2",
  mimeType: "image/jpeg",
  width: 2400,
  height: 1600,
  versionOf: "hero",
  edits: EDITS,
  createdAt: "2026-09-13T12:00:00.000Z",
});
const PAGES = ["Home", "Menu"];

/* A two-page site: two placements on Home, one on Menu — the board's shape. */
type Node = { id: string; parent: Node | null; getId(): string; getParent(): Node | null; getAttribute(n: string): string | undefined; getType(): string };
function node(id: string, parent: Node | null): Node {
  return { id, parent, getId: () => id, getParent: () => parent, getAttribute: () => undefined, getType: () => "image" };
}
const HOME_ROOT = node("home-root", null);
const MENU_ROOT = node("menu-root", null);
const PLACEMENTS = new Map([
  ["el-1", node("el-1", HOME_ROOT)],
  ["el-2", node("el-2", HOME_ROOT)],
  ["el-3", node("el-3", MENU_ROOT)],
]);
const SITE = {
  getAllPages: () => [
    { id: "p-home", name: "Home", root: { id: "home-root" } },
    { id: "p-menu", name: "Menu", root: { id: "menu-root" } },
  ],
  getElement: (id: string) => PLACEMENTS.get(id),
  /* The placements carry no src of their own here — `mountVersions` moves
     them through the mocked replaceAcross, and usage reads `getUsages`. */
  findByMediaSrc: () => [],
} as unknown as ReturnType<typeof import("./libraryFixture").makeSitePages>;

type EditorDoor = [string, (dataUrl: string, edits?: typeof EDITS) => Promise<void>, { fileName: string; initialTab?: string; onDone?(): void } | undefined];

/** Mounts the library with hero's family and the site's placements on `on`. */
async function mountVersions(opts: { family?: typeof HERO[]; on?: string; uploadFile?: (file: File, options?: unknown) => Promise<unknown> } = {}) {
  const family = opts.family ?? [HERO];
  /* Which src the three placements carry — mutable, so a replace moves them. */
  const placements = { src: opts.on ?? "blob:hero" };
  const usages = new Proxy({} as Record<string, number>, { get: (_t, src) => (src === placements.src ? 3 : 0) });
  const replaceAcross = (oldSrc: string, newSrc: string) => {
    if (oldSrc !== placements.src) return { replaced: [], failed: [], clean: true };
    placements.src = newSrc;
    return {
      replaced: [...PLACEMENTS.keys()].map((elementId) => ({ elementId, previousSrc: oldSrc })),
      failed: [],
      clean: true,
    };
  };
  const composer = makeComposer(usages, { uploadFile: opts.uploadFile }, SITE, replaceAcross);
  const srcOf = (key: string) => family.find((i) => i.key === key)?.src;
  mocks.state.mediaState = makeMediaState({
    libraryItems: TEN.map((i) => (i.key === "hero" ? HERO : i)),
    counts: { all: TEN.length, img: 5, vid: 2, ico: 2, fnt: 1 },
    versionsOf: vi.fn((key: string) => (family.some((i) => i.key === key) ? family : [])),
    checkInUse: vi.fn((keys: string[]) =>
      keys.flatMap((key) => (srcOf(key) === placements.src ? [{ key, name: key, count: 3, pages: PAGES }] : [])),
    ),
  });
  const { LibraryManager } = await import("../LibraryManager");
  const onOpenImageEditor = vi.fn();
  render(<LibraryManager composer={composer} onClose={vi.fn()} onOpenImageEditor={onOpenImageEditor} onOpenIconPicker={vi.fn()} />);
  const door = () => onOpenImageEditor.mock.calls.at(-1) as EditorDoor;
  return { composer, onOpenImageEditor, door, placements };
}

const selectHero = () => fireEvent.click(screen.getByTestId("mgr-asset-hero"));
const openVersions = () => fireEvent.click(screen.getByTestId("mgr-det-version-hero-v2"));

describe("Clone 3681:20026 → 3695:45529 · Edit image → Save version → Done — the save path", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("Edit image opens the editor on the file, named, with a Done that leads to Asset versions", async () => {
    const { onOpenImageEditor, door } = await mountVersions({ family: [HERO, HERO_V2] });
    selectHero();
    fireEvent.click(rail().getByRole("button", { name: "Edit image" }));
    await vi.waitFor(() => expect(onOpenImageEditor).toHaveBeenCalledTimes(1));
    expect(door()[0]).toBe("blob:hero");
    expect(door()[2]).toEqual(expect.objectContaining({ fileName: "hero-dark.jpg" }));
    expect(door()[2]?.initialTab).toBeUndefined();
    expect(screen.queryByTestId("versions-modal")).toBeNull();
    act(() => door()[2]?.onDone?.());
    expect(screen.getByTestId("versions-title")).toHaveTextContent("Asset versions");
    expect(screen.getByTestId("versions-subtitle")).toHaveTextContent("hero-dark.jpg · Original retained");
  });

  it("Save lands the edited file as hero-dark-v2.<ext> in the parent's folder, born a version of hero with its edits, and records the server history", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ blob: async () => new Blob(["x"], { type: "image/jpeg" }) }));
    const uploadFile = vi.fn(async (file: File, _options?: unknown) => ({
      success: true,
      asset: { id: "hero-v2", serverId: "hero-v2", src: "https://cdn/hero-dark-v2.jpg", size: 512_000, localOnly: false, name: file.name },
      fileName: file.name,
    }));
    const { door } = await mountVersions({ uploadFile });
    selectHero();
    fireEvent.click(rail().getByRole("button", { name: "Edit image" }));
    await vi.waitFor(() => expect(door()).toBeDefined());
    await door()[1]("data:image/jpeg;base64,AAAA", EDITS);
    expect(uploadFile).toHaveBeenCalledTimes(1);
    const [file, options] = uploadFile.mock.calls[0];
    expect(file.name).toBe("hero-dark-v2.jpg");
    expect(options).toEqual({ folderId: "f1", versionOf: "hero", edits: EDITS });
    expect(versionServiceStub.createAssetVersion).toHaveBeenCalledWith({
      assetId: "srv-hero",
      url: "https://cdn/hero-dark-v2.jpg",
      bytes: 512_000,
      edits: EDITS,
    });
  });

  it("a second save numbers itself after the versions that exist by then", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ blob: async () => new Blob(["x"], { type: "image/webp" }) }));
    const uploadFile = vi.fn(async (file: File, _options?: unknown) => ({ success: true, asset: { id: "hero-v3", src: "blob:hero-v3", size: 1 }, fileName: file.name }));
    const { door } = await mountVersions({ family: [HERO, HERO_V2], uploadFile });
    selectHero();
    fireEvent.click(rail().getByRole("button", { name: "Edit image" }));
    await vi.waitFor(() => expect(door()).toBeDefined());
    await door()[1]("data:image/webp;base64,AAAA", EDITS);
    expect(uploadFile.mock.calls[0][0].name).toBe("hero-dark-v3.webp");
    /* The parent never synced — no server history to write. */
    expect(versionServiceStub.createAssetVersion).not.toHaveBeenCalled();
  });

  it("a refused upload rejects the save — the editor shows its failure dialog and keeps the draft; nothing opens", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ blob: async () => new Blob(["x"], { type: "image/jpeg" }) }));
    const uploadFile = vi.fn(async (file: File, _options?: unknown) => ({ success: false, error: "Not enough storage", fileName: file.name }));
    const { door } = await mountVersions({ uploadFile });
    selectHero();
    fireEvent.click(rail().getByRole("button", { name: "Edit image" }));
    await vi.waitFor(() => expect(door()).toBeDefined());
    await expect(door()[1]("data:image/jpeg;base64,AAAA", EDITS)).rejects.toThrow("Not enough storage");
    expect(screen.queryByTestId("versions-modal")).toBeNull();
    expect(versionServiceStub.createAssetVersion).not.toHaveBeenCalled();
  });

  it("Optimize opens the same editor on its Optimise tab — the standalone optimiser is gone", async () => {
    const { door } = await mountVersions();
    selectHero();
    fireEvent.click(rail().getByRole("button", { name: "Optimize" }));
    await vi.waitFor(() => expect(door()).toBeDefined());
    expect(door()[2]).toEqual(expect.objectContaining({ fileName: "hero-dark.jpg", initialTab: "optimise" }));
    expect(screen.queryByText(/Optimize image/i)).toBeNull();
  });
});

describe("Clone 3697:20326 · the rail's VERSIONS block", () => {
  it("lists v2 · Latest saved over v1 · Original once a version exists, marks the applied one, and a row opens Asset versions", async () => {
    await mountVersions({ family: [HERO, HERO_V2] });
    selectHero();
    const block = within(screen.getByTestId("mgr-det-versions"));
    expect(block.getByTestId("mgr-det-version-hero-v2")).toHaveTextContent("v2 · Latest saved");
    expect(block.getByTestId("mgr-det-version-hero")).toHaveTextContent("v1 · Original");
    expect(within(block.getByTestId("mgr-det-version-hero")).getByText("APPLIED")).toBeInTheDocument();
    openVersions();
    expect(screen.getByTestId("versions-title")).toHaveTextContent("Asset versions");
    expect(screen.getByTestId("versions-card-state-hero")).toHaveTextContent("Currently used on Home and Menu · 3 placements");
    expect(screen.getByTestId("versions-card-state-hero-v2")).toHaveTextContent("Not applied to site");
  });

  it("is absent while only the original exists, and USED IN still reads the placements", async () => {
    await mountVersions();
    selectHero();
    expect(screen.queryByTestId("mgr-det-versions")).toBeNull();
    expect(screen.getByTestId("mgr-det-used")).toHaveTextContent("3 places — Home, Menu");
  });

  it("USED IN follows the placements to the applied version", async () => {
    await mountVersions({ family: [HERO, HERO_V2], on: "blob:hero-v2" });
    selectHero();
    expect(screen.getByTestId("mgr-det-used")).toHaveTextContent("3 places — Home, Menu");
    expect(screen.getByTestId("mgr-use-hero")).toHaveTextContent("used ×3");
  });

  it("Edit latest saved version opens the editor on v2's file; its save becomes v3 of hero", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ blob: async () => new Blob(["x"], { type: "image/jpeg" }) }));
    const uploadFile = vi.fn(async (file: File, _options?: unknown) => ({ success: true, asset: { id: "hero-v3", src: "blob:hero-v3", size: 1 }, fileName: file.name }));
    const { door } = await mountVersions({ family: [HERO, HERO_V2], uploadFile });
    selectHero();
    openVersions();
    fireEvent.click(screen.getByTestId("versions-edit-latest"));
    await vi.waitFor(() => expect(door()).toBeDefined());
    expect(door()[0]).toBe("blob:hero-v2");
    expect(door()[2]).toEqual(expect.objectContaining({ fileName: "hero-dark-v2.jpg" }));
    expect(screen.queryByTestId("versions-modal")).toBeNull();
    await door()[1]("data:image/jpeg;base64,AAAA", EDITS);
    const [file, options] = uploadFile.mock.calls[0];
    expect(file.name).toBe("hero-dark-v3.jpg");
    expect(options).toEqual({ folderId: "f1", versionOf: "hero", edits: EDITS });
    vi.unstubAllGlobals();
  });
});

describe("Clone 3695:45615 → 3720:43313 → 3720:43316 · Apply latest saved version across site", () => {
  it("confirms with the real count and pages, applies through replaceAcross, reports per page, and View versions shows v2 applied", async () => {
    const { composer, placements } = await mountVersions({ family: [HERO, HERO_V2] });
    selectHero();
    openVersions();
    fireEvent.click(screen.getByTestId("versions-apply-latest"));
    expect(screen.getByTestId("apply-version-title")).toHaveTextContent("Apply saved version across site");
    expect(screen.getByTestId("apply-version-body")).toHaveTextContent(
      "Update 3 uses on Home and Menu to the latest saved version. The original and prior saved version remain available.",
    );
    fireEvent.click(screen.getByTestId("apply-version-confirm"));
    expect(screen.getByTestId("apply-version-applying-line")).toHaveTextContent("Updating 3 uses across Home and Menu. Please wait.");
    expect(screen.queryByTestId("versions-modal")).toBeNull();
    const result = await screen.findByTestId("rx-result");
    expect(composer.mediaOps.replaceAcross).toHaveBeenCalledWith("blob:hero", "blob:hero-v2");
    expect(placements.src).toBe("blob:hero-v2");
    expect(within(result).getByTestId("rx-result-title")).toHaveTextContent("Saved version applied");
    expect(within(result).getByTestId("rx-result-count")).toHaveTextContent("3 of 3 uses updated");
    expect(within(result).getByTestId("rx-result-pages")).toHaveTextContent("Home: 2 updated · Menu: 1 updated");
    expect(within(result).getByTestId("rx-result-note")).toHaveTextContent("Other elements are unchanged.");
    fireEvent.click(screen.getByTestId("rx-result-versions"));
    expect(screen.queryByTestId("rx-result")).toBeNull();
    expect(screen.getByTestId("versions-card-state-hero-v2")).toHaveTextContent("Applied to site · 3 placements");
    expect(screen.getByTestId("versions-card-state-hero")).toHaveTextContent("Not on site");
    expect(screen.getByTestId("versions-apply-latest")).toBeDisabled();
    /* And the rail's marker moved with the placements. */
    fireEvent.click(screen.getByTestId("versions-close"));
    expect(within(screen.getByTestId("mgr-det-version-hero-v2")).getByText("APPLIED")).toBeInTheDocument();
  });

  it("Done closes the result and the library stands as it was", async () => {
    await mountVersions({ family: [HERO, HERO_V2] });
    selectHero();
    openVersions();
    fireEvent.click(screen.getByTestId("versions-apply-latest"));
    fireEvent.click(screen.getByTestId("apply-version-confirm"));
    fireEvent.click(within(await screen.findByTestId("rx-result")).getByTestId("rx-result-done"));
    expect(screen.queryByTestId("rx-result")).toBeNull();
    expect(screen.queryByTestId("versions-modal")).toBeNull();
    expect(rail().getByText("hero-dark.jpg")).toBeInTheDocument();
  });

  it("Cancel on the confirm returns to Asset versions", async () => {
    await mountVersions({ family: [HERO, HERO_V2] });
    selectHero();
    openVersions();
    fireEvent.click(screen.getByTestId("versions-apply-latest"));
    fireEvent.click(screen.getByTestId("apply-version-cancel"));
    expect(screen.queryByTestId("apply-version-modal")).toBeNull();
    expect(screen.getByTestId("versions-modal")).toBeInTheDocument();
  });

  it("nothing on the site: the confirm's primary is disabled with the reason, and nothing is replaced", async () => {
    const { composer } = await mountVersions({ family: [HERO, HERO_V2], on: "blob:elsewhere" });
    selectHero();
    openVersions();
    fireEvent.click(screen.getByTestId("versions-apply-latest"));
    expect(screen.getByTestId("apply-version-confirm")).toBeDisabled();
    expect(screen.getByTestId("apply-version-body")).toHaveTextContent("Nothing on the site uses hero-dark.jpg yet");
    expect(composer.mediaOps.replaceAcross).not.toHaveBeenCalled();
  });

  /* Walked live 2026-09-14: the placements sat on the applied v2, the rail's
     picker counted them ("across 3 uses"), and the run replaced only the
     original's src — "0 of 0 uses updated", the canvas kept v2. */
  it("Replace across site… on a family whose placements sit on an applied version reaches that version's src", async () => {
    const { composer, placements } = await mountVersions({ family: [HERO, HERO_V2], on: "blob:hero-v2" });
    selectHero();
    fireEvent.click(rail().getByRole("button", { name: "Replace across site…" }));
    const picker = screen.getByText(/across 3 uses/).closest('[role="dialog"]') as HTMLElement;
    fireEvent.click(within(picker).getByText("menu-cover.png"));
    await screen.findByText("Replacement complete");
    expect(composer.mediaOps.replaceAcross).toHaveBeenCalledWith("blob:hero", "blob:menu");
    expect(composer.mediaOps.replaceAcross).toHaveBeenCalledWith("blob:hero-v2", "blob:menu");
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("3 of 3 uses updated");
    expect(placements.src).toBe("blob:menu");
  });
});
