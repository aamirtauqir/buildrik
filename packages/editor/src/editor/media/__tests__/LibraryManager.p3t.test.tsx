/**
 * Clone Phase-3 P3-T wiring for the fullpage library — the card menu, the
 * menu move, the tag filter and the tag writer (Figma page "Editor v1
 * Clone", section 3721:43517 "Media · Menu and tag completion"). The
 * components have their own contract tests; this file proves the
 * orchestrator wires them together:
 *
 *   3721:43552  card `···` → the context menu; the Unused note band
 *   3721:45952  menu `Move to folder…` → the Phase-2 Move modal for ONE file
 *   3721:45960  after the move the count line reads `<Scope> · <file> moved`
 *               until the next scope / filter change; no bulk selection, no
 *               result rail
 *   3721:43697  a TAGS chip is a FILTER: the search field carries the token
 *               `Tag: menu · Clear filter ×`, the count line `N matching
 *               assets · Tag: menu`, the chip is pressed; TAGS is library-wide
 *   3721:44843  Insert to canvas from a tag scope inserts and returns
 *   BLOCKERS C3 the rail's TAGS block writes through `updateItem`
 *
 * Mounted with the REAL `MediaContextMenu` (LibraryManager.clone.test.tsx
 * mocks it away), which is why the menu journeys live here.
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

const PRODUCTS = makeFolder({ id: "f1", name: "Products" });
const HERO_SHOTS = makeFolder({ id: "f2", name: "Hero shots" });
/* The prototype's tags: menu-cover.png is `menu`, team-photo.jpg `team`,
   pasta-closeup.jpg and terrace-night.jpg `food`. */
const TAGGED = TEN.map((i) =>
  i.key === "menu"
    ? { ...i, tags: ["menu"] }
    : i.key === "team"
      ? { ...i, tags: ["team"] }
      : i.key === "pasta" || i.key === "terrace"
        ? { ...i, tags: ["food"] }
        : i,
);
const TEAM = TAGGED.find((i) => i.key === "team")!;

async function mountLibrary(over: Partial<MediaStateResult> = {}, usages: Record<string, number> = {}) {
  mocks.state.mediaState = makeMediaState({
    libraryItems: TAGGED,
    allFolders: [PRODUCTS, HERO_SHOTS],
    folders: [PRODUCTS, HERO_SHOTS],
    counts: { all: TEN.length, img: 5, vid: 2, ico: 2, fnt: 1 },
    ...over,
  });
  const { LibraryManager } = await import("../LibraryManager");
  const onClose = vi.fn();
  const utils = render(
    <LibraryManager composer={makeComposer(usages)} onClose={onClose} onOpenImageEditor={vi.fn()} onOpenIconPicker={vi.fn()} />,
  );
  return { ...utils, onClose };
}

async function rerenderWith(utils: { rerender: (ui: React.ReactElement) => void }, over: Partial<MediaStateResult>) {
  mocks.state.mediaState = { ...mocks.state.mediaState, ...over };
  const { LibraryManager } = await import("../LibraryManager");
  utils.rerender(
    <LibraryManager composer={makeComposer()} onClose={vi.fn()} onOpenImageEditor={vi.fn()} onOpenIconPicker={vi.fn()} />,
  );
}

const rail = () => within(screen.getByTestId("mgr-details"));
/* The menu is the orchestrator's `state.ctxMenu`; the ··· button and a
   right-click both call `openCtxMenu`, which the mocked state cannot run, so
   the journeys below mount with the menu already open on team-photo.jpg. */
const menuOpenOn = (item = TEAM) => ({ ctxMenu: { x: 40, y: 40, item } });

describe("Clone 3721:43552 · Assets · Unused · browse — the card menu", () => {
  it("the card's ··· asks the state for the menu on that file", async () => {
    const openCtxMenu = vi.fn();
    await mountLibrary({ openCtxMenu });
    fireEvent.click(screen.getByTestId("mgr-asset-menu-team"));
    expect(openCtxMenu).toHaveBeenCalledTimes(1);
    expect(openCtxMenu.mock.calls[0][1].key).toBe("team");
  });

  it("the open menu lists the Clone's items and Select enters select mode with that file", async () => {
    const enterSelectModeWith = vi.fn();
    await mountLibrary({ ...menuOpenOn(), enterSelectModeWith });
    const menu = within(screen.getByTestId("media-ctx-menu"));
    for (const name of ["Select", "Rename…", "Edit image…", "Move to folder…", "Delete"]) {
      expect(menu.getByRole("menuitem", { name })).toBeInTheDocument();
    }
    fireEvent.click(menu.getByRole("menuitem", { name: "Select" }));
    expect(enterSelectModeWith).toHaveBeenCalledWith("team");
  });

  it("the Unused scope draws the note band with its count", async () => {
    await mountLibrary({}, { "blob:hero": 3, "blob:menu": 1 });
    fireEvent.click(screen.getByTestId("mgr-row-unused"));
    expect(screen.getByTestId("mgr-scope-note")).toHaveTextContent("8 unused assets · No current site references.");
    fireEvent.click(screen.getByTestId("mgr-row-in-use"));
    expect(screen.queryByTestId("mgr-scope-note")).toBeNull();
  });
});

describe("Clone 3721:45952 → 3721:45960 · Move team-photo.jpg from the menu", () => {
  it("Move to folder… opens the Move modal for that one file, and choosing a folder moves just it", async () => {
    const bulkMoveAssets = vi.fn(() => Promise.resolve());
    const moveAsset = vi.fn(() => Promise.resolve());
    const enterSelectModeWith = vi.fn();
    const toggleSelMode = vi.fn();
    await mountLibrary({ ...menuOpenOn(), bulkMoveAssets, moveAsset, enterSelectModeWith, toggleSelMode });
    fireEvent.click(screen.getByTestId("media-ctx-move"));
    expect(screen.getByTestId("mgr-move-title")).toHaveTextContent("Move 1 asset");
    expect(screen.getByTestId("mgr-move-body")).toHaveTextContent("team-photo.jpg is unfiled. Choose a destination.");
    // The folder submenu is gone with the modal.
    expect(screen.queryByRole("menuitem", { name: "(Root)" })).toBeNull();
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    expect(bulkMoveAssets).toHaveBeenCalledWith(["team"], "f1");
    expect(moveAsset).not.toHaveBeenCalled();
    // No bulk selection is created by a menu move.
    expect(enterSelectModeWith).not.toHaveBeenCalled();
    expect(toggleSelMode).not.toHaveBeenCalled();
    expect(screen.queryByTestId("mgr-move")).toBeNull();
  });

  it("3721:45960 · afterwards the count line reads '<Scope> · <file> moved' and the rail is untouched", async () => {
    await mountLibrary({ ...menuOpenOn(), bulkMoveAssets: vi.fn(() => Promise.resolve()) });
    fireEvent.click(screen.getByTestId("media-ctx-move"));
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    await vi.waitFor(() => expect(screen.getByTestId("mgr-count")).toHaveTextContent("All assets · team-photo.jpg moved"));
    // The Phase-2 result rail is for the checked set; a menu move keeps
    // whatever the rail showed.
    expect(screen.queryByTestId("mgr-det-move-result")).toBeNull();
    expect(rail().getByText("Select an asset to see details.")).toBeInTheDocument();
    expect(screen.queryByTestId("mgr-bulk-bar")).toBeNull();
  });

  it("the moved line names the folder scope it was run from", async () => {
    await mountLibrary({
      ...menuOpenOn(),
      currentFolderId: "f2",
      libraryItems: TAGGED.filter((i) => i.key === "team"),
      allLibraryItems: TAGGED,
      bulkMoveAssets: vi.fn(() => Promise.resolve()),
    });
    fireEvent.click(screen.getByTestId("media-ctx-move"));
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    await vi.waitFor(() => expect(screen.getByTestId("mgr-count")).toHaveTextContent("Hero shots · team-photo.jpg moved"));
  });

  it("the moved line clears on the next scope change", async () => {
    const utils = await mountLibrary({ ...menuOpenOn(), bulkMoveAssets: vi.fn(() => Promise.resolve()) });
    fireEvent.click(screen.getByTestId("media-ctx-move"));
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    await vi.waitFor(() => expect(screen.getByTestId("mgr-count")).toHaveTextContent(/moved$/));
    await rerenderWith(utils, { ctxMenu: null, currentFolderId: "f1" });
    expect(screen.getByTestId("mgr-count")).toHaveTextContent("10 files · Products");
  });

  it("the moved line clears on the next filter change", async () => {
    const utils = await mountLibrary({ ...menuOpenOn(), bulkMoveAssets: vi.fn(() => Promise.resolve()) });
    fireEvent.click(screen.getByTestId("media-ctx-move"));
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    await vi.waitFor(() => expect(screen.getByTestId("mgr-count")).toHaveTextContent(/moved$/));
    await rerenderWith(utils, { ctxMenu: null, fmtFilter: "png" });
    expect(screen.getByTestId("mgr-count")).toHaveTextContent("10 files · All assets");
  });

  it("a refused menu move reports 'Files could not be moved' and Retry runs the same single move", async () => {
    const bulkMoveAssets = vi
      .fn<(keys: string[], folderId: string | null) => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined);
    await mountLibrary({ ...menuOpenOn(), bulkMoveAssets });
    fireEvent.click(screen.getByTestId("media-ctx-move"));
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    await screen.findByTestId("mgr-move-failed");
    expect(screen.getByTestId("mgr-count")).not.toHaveTextContent(/moved/);
    fireEvent.click(screen.getByTestId("mgr-move-failed-retry"));
    expect(bulkMoveAssets).toHaveBeenLastCalledWith(["team"], "f1");
    await vi.waitFor(() => expect(screen.getByTestId("mgr-count")).toHaveTextContent("All assets · team-photo.jpg moved"));
    expect(screen.queryByTestId("mgr-det-move-result")).toBeNull();
  });

  it("Cancel on the modal moves nothing and leaves the count line alone", async () => {
    const bulkMoveAssets = vi.fn(() => Promise.resolve());
    await mountLibrary({ ...menuOpenOn(), bulkMoveAssets });
    fireEvent.click(screen.getByTestId("media-ctx-move"));
    fireEvent.click(screen.getByTestId("mgr-move-cancel"));
    expect(bulkMoveAssets).not.toHaveBeenCalled();
    expect(screen.queryByTestId("mgr-move")).toBeNull();
    expect(screen.getByTestId("mgr-count")).toHaveTextContent("10 files · All assets");
  });
});

describe("Clone 3721:43697 / 43902 / 44107 · Tag menu · team · food — the tag filter", () => {
  it("TAGS lists every tag in the LIBRARY, not the scoped list, and a chip sets the tag filter", async () => {
    const setTagFilter = vi.fn();
    const setLibrarySearch = vi.fn();
    const setLibraryQuery = vi.fn();
    await mountLibrary({
      currentFolderId: "f1",
      libraryItems: TAGGED.filter((i) => i.key === "hero"),
      allLibraryItems: TAGGED,
      setTagFilter,
      setLibrarySearch,
      setLibraryQuery,
    });
    const tags = within(screen.getByTestId("mgr-tags"));
    expect(tags.getAllByRole("button").map((b) => b.textContent)).toEqual(["food", "menu", "team"]);
    fireEvent.click(screen.getByTestId("mgr-tag-menu"));
    expect(setTagFilter).toHaveBeenCalledWith("menu");
    // A tag is a filter, never a search string.
    expect(setLibrarySearch).not.toHaveBeenCalled();
    expect(setLibraryQuery).not.toHaveBeenCalled();
  });

  it("with a tag active: the chip is pressed, the search field carries the token, the count line names the tag", async () => {
    const setTagFilter = vi.fn();
    await mountLibrary({ tagFilter: "menu", libraryItems: TAGGED.filter((i) => i.key === "menu"), allLibraryItems: TAGGED, setTagFilter });
    expect(screen.getByTestId("mgr-tag-menu")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("mgr-tag-team")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("mgr-search-tag-token")).toHaveTextContent("Tag: menu · Clear filter");
    expect(screen.getByTestId("mgr-count")).toHaveTextContent("1 matching asset · Tag: menu");
    fireEvent.click(screen.getByRole("button", { name: "Clear the tag filter" }));
    expect(setTagFilter).toHaveBeenCalledWith(null);
  });

  it("clicking another chip swaps the tag; the folder scope stays", async () => {
    const setTagFilter = vi.fn();
    const setCurrentFolderId = vi.fn();
    await mountLibrary({ tagFilter: "menu", currentFolderId: "f1", allLibraryItems: TAGGED, setTagFilter, setCurrentFolderId });
    fireEvent.click(screen.getByTestId("mgr-tag-team"));
    expect(setTagFilter).toHaveBeenCalledWith("team");
    expect(setCurrentFolderId).not.toHaveBeenCalled();
    expect(screen.getByTestId("mgr-row-folder-f1")).toHaveClass("active");
    expect(screen.getByTestId("mgr-count")).toHaveTextContent(/· Tag: menu$/);
  });

  it("typing while a tag is active searches within the tag and keeps the token", async () => {
    const setLibraryQuery = vi.fn();
    const setTagFilter = vi.fn();
    await mountLibrary({ tagFilter: "food", allLibraryItems: TAGGED, setLibraryQuery, setTagFilter });
    fireEvent.change(screen.getByTestId("mgr-search-input"), { target: { value: "pasta" } });
    expect(setLibraryQuery).toHaveBeenCalledWith("pasta");
    expect(setTagFilter).not.toHaveBeenCalled();
    expect(screen.getByTestId("mgr-search-tag-token")).toHaveTextContent("Tag: food");
  });

  it("no tag active: no token, the placeholder is the library's, and no TAGS group without tags", async () => {
    await mountLibrary({ libraryItems: TEN, allLibraryItems: TEN });
    expect(screen.queryByTestId("mgr-search-tag-token")).toBeNull();
    expect(screen.getByPlaceholderText("Search across all folders…")).toBeInTheDocument();
    expect(screen.queryByTestId("mgr-tags")).toBeNull();
  });
});

describe("Clone 3721:44843 · Canvas · New image inserted into Home — Insert from a tag scope", () => {
  it("inserts the file and closes the library, the way Phase 1 does", async () => {
    const insertToCanvas = vi.fn(() => Promise.resolve());
    const { onClose } = await mountLibrary({
      tagFilter: "team",
      libraryItems: TAGGED.filter((i) => i.key === "team"),
      allLibraryItems: TAGGED,
      insertToCanvas,
    });
    fireEvent.click(screen.getByTestId("mgr-asset-team"));
    fireEvent.click(within(screen.getByTestId("mgr-det-actions")).getByRole("button", { name: "Insert to canvas" }));
    expect(insertToCanvas).toHaveBeenCalledWith("team");
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});

describe("BLOCKERS C3 · the rail's TAGS block writes through the state (authority code:tag-writer)", () => {
  it("Enter in Add tag appends the lower-cased, trimmed tag to the file's tags", async () => {
    const updateItem = vi.fn(() => Promise.resolve());
    await mountLibrary({ updateItem });
    fireEvent.click(screen.getByTestId("mgr-asset-team"));
    const input = screen.getByTestId("mgr-det-tag-input");
    fireEvent.change(input, { target: { value: "  Staff " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(updateItem).toHaveBeenCalledWith("team", { tags: ["team", "staff"] });
  });

  it("a chip's × removes that tag", async () => {
    const updateItem = vi.fn(() => Promise.resolve());
    await mountLibrary({ updateItem });
    fireEvent.click(screen.getByTestId("mgr-asset-team"));
    fireEvent.click(screen.getByRole("button", { name: "Remove tag team" }));
    expect(updateItem).toHaveBeenCalledWith("team", { tags: [] });
  });
});
