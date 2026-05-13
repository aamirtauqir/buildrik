/**
 * §13 breadcrumb tests — Phase 4 Task 22.
 *
 * Asserts that the expanded media panel renders a folder breadcrumb
 * trail above the library area:
 *   - Default ("All Media") when no folder selected.
 *   - Nested path (All Media › Brand Assets › Logos) when a nested
 *     folder is selected.
 *   - Clicking a segment fires setCurrentFolderId with the right id.
 *
 * SSOT component: FolderBreadcrumb (also consumed by fullpage
 * LibraryManager).
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

// Same render-time fields ExpandedMediaPanel reads off `state` that aren't
// in the Phase 0 minimal mockMediaState. Mirrors Section12.test.tsx.
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

function renderPanel(extra: Record<string, unknown> = {}) {
  const composer = mockComposer();
  const state = mockMediaState(
    expandedStateOverrides(extra) as Partial<ReturnType<typeof mockMediaState>>,
  ) as unknown as MediaStateResult;
  return render(
    <ToastProvider>
      <ExpandedMediaPanel
        composer={composer}
        state={state}
        onCompact={() => {}}
        onOpenLibrary={() => {}}
      />
    </ToastProvider>,
  );
}

describe("§13 — breadcrumb in expanded panel", () => {
  it("renders 'All Media' when no folder selected", () => {
    const { container } = renderPanel({
      currentFolderId: null,
      folders: [],
      allFolders: [],
    });
    const crumb = container.querySelector("[data-testid='folder-breadcrumb']");
    expect(crumb).toBeInTheDocument();
    expect(crumb?.textContent).toContain("All Media");
  });

  it("renders nested path when folder selected", () => {
    const nested = [
      { id: "f1", name: "Brand Assets", parentId: null },
      { id: "f2", name: "Logos", parentId: "f1" },
    ];
    const { container } = renderPanel({
      currentFolderId: "f2",
      folders: nested,
      allFolders: nested,
    });
    const crumb = container.querySelector("[data-testid='folder-breadcrumb']");
    expect(crumb).toBeInTheDocument();
    expect(crumb?.textContent).toMatch(/All Media.*Brand Assets.*Logos/);
  });

  it("clicking segment calls setCurrentFolderId with that id", () => {
    const setCurrentFolderId = vi.fn();
    const nested = [
      { id: "f1", name: "Brand Assets", parentId: null },
      { id: "f2", name: "Logos", parentId: "f1" },
    ];
    const { container } = renderPanel({
      currentFolderId: "f2",
      folders: nested,
      allFolders: nested,
      setCurrentFolderId,
    });
    const buttons = container.querySelectorAll(
      "[data-testid='folder-breadcrumb'] button",
    );
    // 3 segments: All Media (idx 0), Brand Assets (idx 1), Logos (idx 2)
    expect(buttons.length).toBe(3);
    fireEvent.click(buttons[1]);
    expect(setCurrentFolderId).toHaveBeenCalledWith("f1");
  });

  it("renders nested path even when state.folders contains only roots (production case)", () => {
    // Production: composer.media.getFolders() returns roots only.
    // composer.media.getAllFolders() returns the flat tree.
    // Breadcrumb must read from allFolders, not folders, to render nested paths.
    const { container } = renderPanel({
      currentFolderId: "f2",
      folders: [
        { id: "f1", name: "Brand Assets", parentId: null },
        // f2 NOT in folders (it's nested — getFolders(null) would not return it)
      ],
      allFolders: [
        { id: "f1", name: "Brand Assets", parentId: null },
        { id: "f2", name: "Logos", parentId: "f1" },
      ],
    });
    const crumb = container.querySelector("[data-testid='folder-breadcrumb']");
    expect(crumb?.textContent).toMatch(/All Media.*Brand Assets.*Logos/);
  });
});
