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
import { TEN, makeComposer, makeMediaState } from "./libraryFixture";

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

  it("with one file checked the bar and the rail both count it, and the rail offers Delete", async () => {
    const requestBulkDelete = vi.fn();
    await mountLibrary({ selMode: true, selectedKeys: new Set(["hero"]), requestBulkDelete });
    expect(screen.getByTestId("mgr-bulk-count")).toHaveTextContent("1 selected");
    const rail = within(screen.getByTestId("mgr-details"));
    expect(rail.getByRole("heading", { name: "1 asset selected" })).toBeInTheDocument();
    expect(rail.getByText("hero-dark.jpg · Select another file to use bulk actions.")).toBeInTheDocument();
    fireEvent.click(rail.getByRole("button", { name: "Delete" }));
    expect(requestBulkDelete).toHaveBeenCalledTimes(1);
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
