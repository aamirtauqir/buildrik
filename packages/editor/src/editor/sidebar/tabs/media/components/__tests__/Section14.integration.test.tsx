import { ToastProvider } from "@/editor/ui";
/**
 * §14 MultiSelectBanner integration — Phase 5 Task 28.
 *
 * Asserts ExpandedMediaPanel renders the banner when selMode + items
 * are selected, opens MoveToFolderPopover on Move click, and fires
 * state.bulkMoveAssets when a folder is picked.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function makeItem(key: string, name: string) {
  return {
    key,
    name,
    type: "img" as const,
    src: "data:image/png;base64,",
    size: 1000,
    createdAt: "2026-01-01T00:00:00.000Z",
    mimeType: "image/png",
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

describe("§14 — MultiSelectBanner integration", () => {
  it("renders banner only when selMode + selectedKeys.size > 0", () => {
    const { rerender } = renderPanel({
      libraryItems: [makeItem("a1", "A")],
      selMode: false,
      selectedKeys: new Set(),
    });
    expect(
      screen.queryByRole("region", { name: /multi-select actions/i }),
    ).not.toBeInTheDocument();

    // Re-render with selection — banner should appear
    const composer = mockComposer({ folders: [] });
    const state = mockMediaState(
      expandedStateOverrides({
        libraryItems: [makeItem("a1", "A")],
        selMode: true,
        selectedKeys: new Set(["a1"]),
      }) as Partial<ReturnType<typeof mockMediaState>>,
    );
    rerender(
      <ToastProvider>
        <ExpandedMediaPanel
          composer={composer}
          state={state as unknown as MediaStateResult}
          onCompact={() => {}}
          onOpenLibrary={() => {}}
        />
      </ToastProvider>,
    );
    expect(
      screen.getByRole("region", { name: /multi-select actions/i }),
    ).toBeInTheDocument();
  });

  it("Move click opens popover; folder pick fires bulkMoveAssets + exits selMode", async () => {
    const user = userEvent.setup();
    const bulkMoveAssets = vi.fn(async () => {});
    const toggleSelMode = vi.fn();
    renderPanel({
      libraryItems: [makeItem("a1", "A"), makeItem("a2", "B")],
      selMode: true,
      selectedKeys: new Set(["a1", "a2"]),
      folders: [F_BRAND],
      allFolders: [F_BRAND],
      bulkMoveAssets,
      toggleSelMode,
    });
    await user.click(screen.getByRole("button", { name: /move to folder/i }));
    expect(
      screen.getByTestId("move-to-folder-popover"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /brand/i }));
    expect(bulkMoveAssets).toHaveBeenCalledWith(["a1", "a2"], "f1");
    expect(toggleSelMode).toHaveBeenCalledTimes(1);
  });

  it("Cancel click exits selMode (calls toggleSelMode)", async () => {
    const user = userEvent.setup();
    const toggleSelMode = vi.fn();
    renderPanel({
      libraryItems: [makeItem("a1", "A")],
      selMode: true,
      selectedKeys: new Set(["a1"]),
      toggleSelMode,
    });
    await user.click(screen.getByRole("button", { name: /cancel selection/i }));
    expect(toggleSelMode).toHaveBeenCalledTimes(1);
  });
});
