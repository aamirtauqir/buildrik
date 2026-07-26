import { ToastProvider } from "@/editor/ui";
/**
 * §13 drag-to-folder tests — Phase 4 Task 23.
 *
 * Asserts that:
 *   - AssetCell renders draggable=true and writes its key to dataTransfer
 *     on dragstart (both BuildRik MIME + text/plain fallback).
 *   - Each folder item in the expanded panel rail has a data-folder-id
 *     attribute and is wired with dragover/dragleave/drop handlers.
 *   - dragover applies a snap-feedback class; drop fires
 *     state.moveAsset(assetKey, folderId) with the payload from the
 *     drag source.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { AssetCell } from "../AssetCell";
import { ExpandedMediaPanel } from "../ExpandedMediaPanel";
import { mockComposer } from "../../__tests__/test-utils/mockComposer";
import { mockMediaState } from "../../__tests__/test-utils/mockMediaState";
import type { LibraryItem, MediaStateResult } from "../../data/mediaTypes";

const imgItem: LibraryItem = {
  key: "img-1",
  name: "Hero",
  type: "img",
  src: "https://example.com/hero.jpg",
  thumb: "https://example.com/hero-thumb.jpg",
  size: 1024,
  createdAt: "2026-05-13T00:00:00.000Z",
  mimeType: "image/jpeg",
};

// Mirrors Section13_breadcrumb.test.tsx — fields ExpandedMediaPanel
// reads off state that aren't in the Phase 0 minimal mockMediaState.
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

describe("§13 — drag asset onto folder", () => {
  it("AssetCell renders with draggable=true", () => {
    const { container } = render(
      <AssetCell item={imgItem} onClick={() => {}} />,
    );
    const cell = container.querySelector("button.med-asset-cell");
    expect(cell).toBeTruthy();
    expect(cell?.getAttribute("draggable")).toBe("true");
  });

  it("dragstart sets dataTransfer payload carrying the asset key", () => {
    const { container } = render(
      <AssetCell item={imgItem} onClick={() => {}} />,
    );
    const cell = container.querySelector("button.med-asset-cell") as HTMLElement;
    const setData = vi.fn();
    fireEvent.dragStart(cell, {
      dataTransfer: { setData, effectAllowed: "" },
    });
    const calls = setData.mock.calls.map((c) => c.join(":"));
    expect(calls.some((c) => c.includes("img-1"))).toBe(true);
  });

  it("locked AssetCell is NOT draggable", () => {
    const { container } = render(
      <AssetCell item={imgItem} onClick={() => {}} isLocked />,
    );
    const cell = container.querySelector("button.med-asset-cell");
    expect(cell?.getAttribute("draggable")).toBe("false");
  });

  it("folder item drop calls state.moveAsset(assetKey, folderId) and shows snap feedback", () => {
    const moveAsset = vi.fn();
    const composer = mockComposer({
      folders: [{ id: "f1", name: "Brand", parentId: null }],
    });
    const state = mockMediaState(
      expandedStateOverrides({
        currentFolderId: null,
        folders: [{ id: "f1", name: "Brand", parentId: null }],
        allFolders: [{ id: "f1", name: "Brand", parentId: null }],
        moveAsset,
      }) as Partial<ReturnType<typeof mockMediaState>>,
    ) as unknown as MediaStateResult;
    const { container } = render(
      <ToastProvider>
        <ExpandedMediaPanel
          composer={composer}
          state={state}
          onCompact={() => {}}
          onOpenLibrary={() => {}}
        />
      </ToastProvider>,
    );
    const folderItems = container.querySelectorAll("[data-folder-id]");
    expect(folderItems.length).toBeGreaterThan(0);
    const f1 = Array.from(folderItems).find(
      (el) => el.getAttribute("data-folder-id") === "f1",
    ) as HTMLElement;
    expect(f1).toBeTruthy();

    fireEvent.dragOver(f1, { dataTransfer: { dropEffect: "" } });
    expect(f1.classList.toString()).toMatch(/drop-target|drag-over|snap/i);

    fireEvent.drop(f1, {
      dataTransfer: {
        getData: (k: string) =>
          k === "application/x-buildrik-media-asset-key" || k === "text/plain"
            ? "img-1"
            : "",
      },
    });
    expect(moveAsset).toHaveBeenCalledWith("img-1", "f1");
  });
});
