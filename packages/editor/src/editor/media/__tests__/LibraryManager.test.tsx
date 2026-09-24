/**
 * LibraryManager — D5 Stage 0 baseline tests (audit-remediation 2026-05-08).
 *
 * Captures externally-observable behavior of the orchestrator BEFORE the
 * Stage 1+ split into a useLibraryUiState reducer + sub-components
 * (FolderTree / AssetGrid / AssetDetailsPanel) + react-window virtualization.
 *
 * Mock strategy mirrors D3 (VersionHistoryPanel.test.tsx):
 *   - vi.hoisted for closure state on the data hook
 *   - mock useMediaState with a typed factory (70+ fields)
 *   - stub the heavy modal/overlay children to render-as-null
 *   - composer's mediaOps.getUsages mocked at the consumer level
 *
 * The 4 tests cover the highest-risk render branches: empty state,
 * populated grid, search-filtered empty, selected-item details.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import type { MediaStateResult } from "../../sidebar/tabs/media/data/mediaTypes";
import { makeComposer, makeFolder, makeItem, makeMediaState } from "./libraryFixture";

// ─── Hoisted mock state ──────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const state: { mediaState: import("../../sidebar/tabs/media/data/mediaTypes").MediaStateResult } = {
    // assigned in beforeEach via setMediaState
    mediaState: null as unknown as import("../../sidebar/tabs/media/data/mediaTypes").MediaStateResult,
  };
  return { state };
});

// ─── Mock external surfaces ──────────────────────────────────────────────────

vi.mock("../../sidebar/tabs/media/hooks/useMediaState", () => ({
  useMediaState: () => mocks.state.mediaState,
}));

vi.mock("@/editor/chrome-ui", async () => {
  const actual: Record<string, unknown> = await vi.importActual("@/editor/chrome-ui");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn() }),
  };
});

// Stub heavy children so jsdom doesn't choke on portals / overlays.
vi.mock("../../sidebar/tabs/media/components/StockSourceModal", () => ({
  StockSourceModal: () => null,
}));
vi.mock("../../sidebar/tabs/media/components/ConfirmDeleteModal", () => ({
  ConfirmDeleteModal: () => null,
}));
vi.mock("../../sidebar/tabs/media/components/MediaContextMenu", () => ({
  MediaContextMenu: () => null,
}));
vi.mock("../../sidebar/tabs/media/components/AssetDetailOverlay", () => ({
  AssetDetailOverlay: () => null,
}));

// ─── Mount helper ────────────────────────────────────────────────────────────

async function mount(state: MediaStateResult, usages: Record<string, number> = {}) {
  mocks.state.mediaState = state;
  const { LibraryManager } = await import("../LibraryManager");
  return render(
    <LibraryManager
      composer={makeComposer(usages)}
      onClose={vi.fn()}
      onOpenImageEditor={vi.fn()}
    />
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("LibraryManager — D5 baseline", () => {
  // Board 1162:4617 — at zero assets the question is "is this the right
  // place?", so the empty state says where uploads go.
  it("renders the board empty state when there are no assets", async () => {
    await mount(makeMediaState({ libraryItems: [] }));
    expect(screen.getByText("No images or files yet.")).toBeInTheDocument();
    expect(screen.getByText(/one library for the whole site/)).toBeInTheDocument();
    // Two Uploads on screen now: the top bar's and the empty state's — the
    // board draws both, so scope the assertion to the empty state.
    const hero = document.querySelector(".mgr-empty-actions")!;
    expect(hero.textContent).toContain("Upload");
    expect(hero.textContent).toContain("Browse stock");
  });

  it("renders asset names in the grid when libraryItems is populated", async () => {
    const items = [
      makeItem({ key: "a", name: "logo.png" }),
      makeItem({ key: "b", name: "hero.jpg", src: "https://example.com/hero.jpg" }),
      makeItem({ key: "c", name: "icon.svg", src: "https://example.com/icon.svg", type: "img" }),
    ];
    await mount(
      makeMediaState({
        libraryItems: items,
        counts: { all: 3, img: 3, vid: 0, ico: 0, fnt: 0 },
      })
    );
    expect(screen.getByText("logo.png")).toBeInTheDocument();
    expect(screen.getByText("hero.jpg")).toBeInTheDocument();
    expect(screen.getByText("icon.svg")).toBeInTheDocument();
  });

  it("renders the no-results state when search has no matches", async () => {
    await mount(
      makeMediaState({
        libraryItems: [],
        librarySearch: "asdf",
      })
    );
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText(/No assets match "asdf"/)).toBeInTheDocument();
  });

  it("shows the asset count and scope in the toolbar count line", async () => {
    const items = [
      makeItem({ key: "a", name: "one.png" }),
      makeItem({ key: "b", name: "two.png", src: "https://example.com/two.png" }),
    ];
    await mount(
      makeMediaState({
        libraryItems: items,
        counts: { all: 2, img: 2, vid: 0, ico: 0, fnt: 0 },
      })
    );
    // Clone 3695:45155 — "2 files · All assets"; the grid foot that used to
    // read "Showing N of M" is gone (LibraryManager.clone.test.tsx).
    expect(screen.getByTestId("mgr-count")).toHaveTextContent("2 files · All assets");
  });

  /* QA 2026-09-24 (A1, board B1-13 7564:185465): "Move files…" in the
     folder-delete confirm used to close with an info toast. It hands the
     folder's files to the Move modal. */
  it("Move files… opens the Move modal with the folder's files", async () => {
    const folder = makeFolder({ id: "f1", name: "Products" });
    const inFolder = makeItem({ key: "a", name: "shoe.png", folderId: "f1" });
    const atRoot = makeItem({ key: "b", name: "logo.png" });
    await mount(
      makeMediaState({
        folders: [folder],
        allFolders: [folder],
        libraryItems: [inFolder, atRoot],
        allLibraryItems: [inFolder, atRoot],
        inspectFolder: vi.fn(() => ({ assetCount: 1, subFolderCount: 0 })),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete folder" }));
    fireEvent.click(screen.getByRole("button", { name: "Move files…" }));
    expect(screen.getByTestId("mgr-move-title")).toHaveTextContent("Move 1 asset");
    expect(screen.getByTestId("mgr-move-body")).toHaveTextContent("Products");
  });
});
