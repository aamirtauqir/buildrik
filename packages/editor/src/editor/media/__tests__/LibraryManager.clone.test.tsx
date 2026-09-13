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
