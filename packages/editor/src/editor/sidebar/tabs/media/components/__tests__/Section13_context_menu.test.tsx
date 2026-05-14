/**
 * §13 folder context menu tests — Phase 4 Task 24.
 *
 * Asserts that right-clicking a folder in the rail opens a context
 * menu with Rename + Delete items.
 *   - Rename → triggers inline-edit; Enter commits via composer.media.renameFolder
 *   - Delete on non-empty folder → opens ConfirmDialog with item count
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { ToastProvider } from "@/editor/shared/vibcoder";
import { ExpandedMediaPanel } from "../ExpandedMediaPanel";
import { mockComposer } from "../../__tests__/test-utils/mockComposer";
import { mockMediaState } from "../../__tests__/test-utils/mockMediaState";
import type { MediaStateResult } from "../../data/mediaTypes";

function expandedStateOverrides(extra: Record<string, unknown> = {}) {
  return {
    currentFolderId: null,
    setCurrentFolderId: () => {},
    setSort: () => {},
    setGridN: () => {},
    setFmtFilter: () => {},
    toggleSelMode: () => {},
    toggleSelect: () => {},
    selectAll: () => {},
    requestBulkDelete: () => {},
    requestDelete: () => {},
    openCtxMenu: () => {},
    openDetail: () => {},
    closeDetail: () => {},
    closeCtxMenu: () => {},
    moveAsset: async () => {},
    bulkMoveAssets: async () => {},
    copyUrl: () => {},
    renameItem: async () => {},
    updateItem: async () => {},
    executeDelete: async () => {},
    cancelDelete: () => {},
    panelDragOver: false,
    handlePanelDragEnter: () => {},
    handlePanelDragLeave: () => {},
    handlePanelDragOver: () => {},
    handlePanelDrop: () => {},
    ctxMenu: null,
    detailItem: null,
    confirmDelete: null,
    replaceAcrossPair: null,
    setReplaceAcrossPair: () => {},
    stockPhotos: [],
    stockVideos: [],
    discIcons: [],
    discFonts: [],
    discLoading: { img: false, vid: false, ico: false, fnt: false },
    discoverySearch: "",
    discOrientation: "all",
    discColor: "all",
    discSearchAll: () => {},
    setDiscOrientation: () => {},
    setDiscColor: () => {},
    loadMoreDisc: async () => {},
    saveToLibrary: async () => {},
    ...extra,
  };
}

function renderPanel(extra: Record<string, unknown> = {}) {
  const allFolders = (extra.allFolders as unknown[]) ?? [];
  const composer = mockComposer({ folders: allFolders as never });
  const state = mockMediaState(
    expandedStateOverrides(extra) as Partial<ReturnType<typeof mockMediaState>>,
  );
  return {
    composer,
    state,
    ...render(
      <ToastProvider>
        <ExpandedMediaPanel
          composer={composer}
          state={state as unknown as MediaStateResult}
          onCompact={() => {}}
          onOpenLibrary={() => {}}
        />
      </ToastProvider>,
    ),
  };
}

describe("§13 — folder context menu", () => {
  it("right-click folder opens menu with Rename + Delete items", () => {
    const { container } = renderPanel({
      folders: [{ id: "f1", name: "Brand", parentId: null, createdAt: "x", updatedAt: "x" }],
      allFolders: [{ id: "f1", name: "Brand", parentId: null, createdAt: "x", updatedAt: "x" }],
    });
    const f1 = container.querySelector("[data-folder-id='f1']") as HTMLElement;
    fireEvent.contextMenu(f1);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /rename/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeInTheDocument();
  });

  it("Rename → input appears with current name and Enter commits via state.renameFolder", async () => {
    const renameFolder = vi.fn(async () => {});
    const { container } = renderPanel({
      folders: [{ id: "f1", name: "Old", parentId: null, createdAt: "x", updatedAt: "x" }],
      allFolders: [{ id: "f1", name: "Old", parentId: null, createdAt: "x", updatedAt: "x" }],
      renameFolder,
    });
    const f1 = container.querySelector("[data-folder-id='f1']") as HTMLElement;
    fireEvent.contextMenu(f1);
    fireEvent.click(screen.getByRole("menuitem", { name: /rename/i }));
    const input = (await screen.findByDisplayValue("Old")) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Brand New" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    await Promise.resolve();
    expect(renameFolder).toHaveBeenCalledWith("f1", "Brand New");
  });

  it("Delete on non-empty folder opens confirm dialog mentioning item count", async () => {
    const inspectFolder = vi.fn(() => ({ assetCount: 5, subFolderCount: 0 }));
    const { container } = renderPanel({
      folders: [{ id: "f1", name: "Brand", parentId: null, createdAt: "x", updatedAt: "x" }],
      allFolders: [{ id: "f1", name: "Brand", parentId: null, createdAt: "x", updatedAt: "x" }],
      inspectFolder,
    });
    const f1 = container.querySelector("[data-folder-id='f1']") as HTMLElement;
    fireEvent.contextMenu(f1);
    fireEvent.click(screen.getByRole("menuitem", { name: /delete/i }));
    expect(inspectFolder).toHaveBeenCalledWith("f1");
    expect(await screen.findByText(/5 items/i)).toBeInTheDocument();
  });

  it("Escape in rename input cancels without calling state.renameFolder", () => {
    const renameFolder = vi.fn(async () => {});
    const { container } = renderPanel({
      folders: [{ id: "f1", name: "Old", parentId: null, createdAt: "x", updatedAt: "x" }],
      allFolders: [{ id: "f1", name: "Old", parentId: null, createdAt: "x", updatedAt: "x" }],
      renameFolder,
    });
    const f1 = container.querySelector("[data-folder-id='f1']") as HTMLElement;
    fireEvent.contextMenu(f1);
    fireEvent.click(screen.getByRole("menuitem", { name: /rename/i }));
    const input = screen.getByDisplayValue("Old") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Discarded" } });
    fireEvent.keyDown(input, { key: "Escape", code: "Escape" });
    expect(renameFolder).not.toHaveBeenCalled();
  });
});
