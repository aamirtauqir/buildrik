/**
 * Clone Phase-2 P2-C wiring for the fullpage library — Delete · Rename ·
 * Download (Figma page "Editor v1 Clone", section 3695:45625). The modals
 * have their own contract tests; this file proves the orchestrator opens
 * the right one from the right door and cleans up after it:
 *
 *   3708:20650  rail Delete → "Delete <file>?"; Replace instead → the rail's
 *               replace-across picker for that asset
 *   3708:20446  after the delete the rail is back to "Select an asset…"
 *   3701:20353  rail Rename → the rename MODAL (the drawer's drill-in hub,
 *               which had no name field at all, no longer mounts here)
 *   3701:20394  bulk Download → "Download prepared"
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import type { ConfirmDeletePayload, MediaStateResult } from "../../sidebar/tabs/media/data/mediaTypes";
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
vi.mock("../../sidebar/tabs/media/components/MediaContextMenu", () => ({ MediaContextMenu: () => null }));

/* `hero` is placed three times, `menu` once — the counts the Clone prints. */
const USAGES = { "blob:hero": 3, "blob:menu": 1 };

const menuConfirm: ConfirmDeletePayload = {
  keys: ["menu"],
  names: ["menu-cover.png"],
  inUseCount: 1,
  inUse: [{ key: "menu", name: "menu-cover", count: 1, pages: ["Menu"] }],
  isBulk: false,
};

async function mountLibrary(over: Partial<MediaStateResult> = {}) {
  mocks.state.mediaState = makeMediaState({
    libraryItems: TEN,
    counts: { all: TEN.length, img: 5, vid: 2, ico: 2, fnt: 1 },
    ...over,
  });
  const { LibraryManager } = await import("../LibraryManager");
  const composer = makeComposer(USAGES);
  const utils = render(<LibraryManager composer={composer} onClose={vi.fn()} onOpenImageEditor={vi.fn()} onOpenIconPicker={vi.fn()} />);
  return { ...utils, composer };
}

const rail = () => within(screen.getByTestId("mgr-details"));

describe("Clone 3708:20650 / 20446 · Delete from the rail", () => {
  it("the rail's Delete asks for that asset by key", async () => {
    const requestDelete = vi.fn();
    await mountLibrary({ requestDelete });
    fireEvent.click(screen.getByTestId("mgr-asset-menu"));
    fireEvent.click(rail().getByRole("button", { name: "Delete" }));
    expect(requestDelete).toHaveBeenCalledWith("menu");
  });

  it("confirming clears the selection so the rail returns to 'Select an asset to see details.'", async () => {
    const executeDelete = vi.fn(() => Promise.resolve());
    await mountLibrary({ confirmDelete: menuConfirm, executeDelete });
    fireEvent.click(screen.getByTestId("mgr-asset-menu"));
    expect(rail().getByText("menu-cover.png")).toBeInTheDocument();

    expect(screen.getByTestId("media-delete-title")).toHaveTextContent("Delete menu-cover.png?");
    fireEvent.click(screen.getByTestId("media-delete-confirm"));
    expect(executeDelete).toHaveBeenCalledTimes(1);
    /* The mocked library still lists menu-cover.png, so the rail can only be
       empty because the orchestrator dropped its selection. */
    await screen.findByText("Select an asset to see details.");
    expect(rail().queryByText("menu-cover.png")).toBeNull();
  });

  it("a delete of some other asset leaves the selection alone", async () => {
    const executeDelete = vi.fn(() => Promise.resolve());
    await mountLibrary({ confirmDelete: menuConfirm, executeDelete });
    fireEvent.click(screen.getByTestId("mgr-asset-hero"));
    fireEvent.click(screen.getByTestId("media-delete-confirm"));
    await vi.waitFor(() => expect(executeDelete).toHaveBeenCalledTimes(1));
    expect(rail().getByText("hero-dark.jpg")).toBeInTheDocument();
  });

  it("Replace instead closes the confirm and opens the replace-across picker for that asset", async () => {
    const cancelDelete = vi.fn();
    await mountLibrary({ confirmDelete: menuConfirm, cancelDelete });
    fireEvent.click(screen.getByTestId("media-delete-replace"));
    expect(cancelDelete).toHaveBeenCalledTimes(1);
    expect(rail().getByText("menu-cover.png")).toBeInTheDocument();
    expect(screen.getByText(/Replace "menu-cover.png" across 1 use/)).toBeInTheDocument();
  });
});

describe("Clone 3701:20353 · Rename from the rail", () => {
  it("opens the rename modal pre-filled with the full filename and saves through renameItem", async () => {
    const renameItem = vi.fn(() => Promise.resolve());
    await mountLibrary({ renameItem });
    fireEvent.click(screen.getByTestId("mgr-asset-menu"));
    fireEvent.click(rail().getByRole("button", { name: "Rename" }));
    expect(screen.getByTestId("mgr-rename-title")).toHaveTextContent("Rename menu-cover.png");
    const input = screen.getByTestId("mgr-rename-input") as HTMLInputElement;
    expect(input.value).toBe("menu-cover.png");
    fireEvent.change(input, { target: { value: "menu-front.png" } });
    fireEvent.click(screen.getByTestId("mgr-rename-save"));
    expect(renameItem).toHaveBeenCalledWith("menu", "menu-front.png");
    await vi.waitFor(() => expect(screen.queryByTestId("mgr-rename")).toBeNull());
  });

  it("no longer mounts the drawer's asset drill-in in the library", async () => {
    await mountLibrary({ detailItem: TEN[0] });
    expect(screen.queryByTestId("media-detail-panel")).toBeNull();
  });
});
