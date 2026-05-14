/**
 * §13 empty-folder drop zone tests — Phase 4 Task 25.
 *
 * Asserts that when a folder is selected and contains 0 assets (and no
 * active search), ExpandedMediaPanel renders EmptyFolderDropZone instead
 * of LibraryView's standard empty state. Drop or click uploads with
 * folderId targeting the current folder.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
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

const F_BRAND = { id: "f1", name: "Brand", parentId: null, createdAt: "x", updatedAt: "x" };

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

describe("§13 — empty-folder drop zone", () => {
  it("renders EmptyFolderDropZone when folder selected and 0 items, no search", () => {
    const { container } = renderPanel({
      folders: [F_BRAND],
      allFolders: [F_BRAND],
      currentFolderId: "f1",
      libraryItems: [],
      librarySearch: "",
    });
    const zone = container.querySelector("[data-testid='empty-folder-drop-zone']");
    expect(zone).toBeInTheDocument();
    expect(zone?.textContent).toMatch(/Brand/);
  });

  it("does NOT render EmptyFolderDropZone at root (currentFolderId=null)", () => {
    const { container } = renderPanel({
      folders: [F_BRAND],
      allFolders: [F_BRAND],
      currentFolderId: null,
      libraryItems: [],
    });
    expect(
      container.querySelector("[data-testid='empty-folder-drop-zone']"),
    ).not.toBeInTheDocument();
  });

  it("does NOT render EmptyFolderDropZone when search is active", () => {
    const { container } = renderPanel({
      folders: [F_BRAND],
      allFolders: [F_BRAND],
      currentFolderId: "f1",
      libraryItems: [],
      librarySearch: "logo",
    });
    expect(
      container.querySelector("[data-testid='empty-folder-drop-zone']"),
    ).not.toBeInTheDocument();
  });

  it("drop on zone calls state.upload(files, { folderId: currentFolderId })", () => {
    const upload = vi.fn();
    const { container } = renderPanel({
      folders: [F_BRAND],
      allFolders: [F_BRAND],
      currentFolderId: "f1",
      libraryItems: [],
      upload,
    });
    const zone = container.querySelector(
      "[data-testid='empty-folder-drop-zone']",
    ) as HTMLElement;
    const file = new File(["x"], "hero.png", { type: "image/png" });
    fireEvent.drop(zone, {
      dataTransfer: { files: [file] },
    });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0][0]).toEqual([file]);
    expect(upload.mock.calls[0][1]).toEqual({ folderId: "f1" });
  });
});
