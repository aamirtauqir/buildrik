import { ToastProvider } from "@/editor/ui";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ExpandedMediaPanel } from "../ExpandedMediaPanel";
import { mockComposer } from "../../__tests__/test-utils/mockComposer";
import { mockMediaState } from "../../__tests__/test-utils/mockMediaState";
import type { MediaStateResult } from "../../data/mediaTypes";

// Extra render-time fields ExpandedMediaPanel reads off `state` that aren't
// covered by the Phase 0 minimal mockMediaState. All callbacks are no-op
// stubs since the §12 layout tests don't exercise them.
function expandedStateOverrides() {
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
  };
}

function renderExpandedPanel(opts: { onCompact?: () => void } = {}) {
  const composer = mockComposer();
  const state = mockMediaState(
    expandedStateOverrides() as Partial<ReturnType<typeof mockMediaState>>,
  ) as unknown as MediaStateResult;
  return render(
    <ToastProvider>
      <ExpandedMediaPanel
        composer={composer}
        state={state}
        onCompact={opts.onCompact ?? (() => {})}
        onOpenLibrary={() => {}}
      />
    </ToastProvider>,
  );
}

describe("§12 — expanded media panel 180/380 split", () => {
  it("renders folder rail (.exp-panel__folders)", () => {
    const { container } = renderExpandedPanel();
    expect(container.querySelector(".exp-panel__folders")).toBeInTheDocument();
  });

  it("renders library area (.exp-panel__library)", () => {
    const { container } = renderExpandedPanel();
    expect(container.querySelector(".exp-panel__library")).toBeInTheDocument();
  });

  it("renders Compact button (.exp-panel__compact-btn) that fires onCompact", () => {
    const onCompact = vi.fn();
    const { container } = renderExpandedPanel({ onCompact });
    const btn = container.querySelector(".exp-panel__compact-btn") as HTMLButtonElement;
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onCompact).toHaveBeenCalledTimes(1);
  });
});
