/**
 * LayersPanel - Minimal Tree Design. Search + Tree only.
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./styles/layers-v2.css";
import type { Element } from "../../../engine/elements/Element";
import type { ElementType } from "../../../shared/types";
import { LayersEmptyState } from "./components/LayersEmptyState";
import { canNestElement, canHaveChildren } from "../../../shared/utils/nesting";
import { LayerContextMenu, elementsLabel } from "./components/LayerContextMenu";
import { LayerDisplaySettings } from "./components/LayerDisplaySettings";
import { MoveToPageDialog } from "./components/MoveToPageDialog";
import { LayersScrollThumb } from "./components/LayersScrollThumb";
import { useLayerContextActions } from "./hooks/useLayerContextActions";
import { useLayersState } from "./hooks/useLayersState";
import { LayerTreeItem } from "./LayerTreeItem";
import { itemMatches } from "./hooks/useLayerSearch";
import { findById as findLayer, getDisplayName } from "./data/layerUtils";
import { LayersNoResults } from "./components/LayersStateBlocks";
import type { LayersPanelProps } from "./types";
import { Button, ConfirmDialog, useToast } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
export type { LayersPanelProps, SelectedElementInfo } from "./types";

/** "Heading, Subtitle and Menu previews" — board 6887:78291's sentence. */
function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "the selection";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  composer,
  selectedElement,
  onLayerHover,
  canvasHoveredId,
  search,
  displaySettingsOpen,
  onDisplaySettingsToggle,
}) => {
  const state = useLayersState({ composer, canvasHoveredId });

  // Sync controlled search prop -> internal useLayerSearch state
  const { search: stateSearch, setSearch } = state;
  React.useEffect(() => {
    if (typeof search === "string" && search !== stateSearch) {
      setSearch(search);
    }
  }, [search, stateSearch, setSearch]);

  // Expand/collapse-all from LayersTab
  const { expandAll, collapseAll } = state.treeHook;
  React.useEffect(() => {
    if (!composer) return;
    const onExpand = () => expandAll();
    const onCollapse = () => collapseAll();
    composer.on("layers:expand-all", onExpand);
    composer.on("layers:collapse-all", onCollapse);
    return () => {
      composer.off("layers:expand-all", onExpand);
      composer.off("layers:collapse-all", onCollapse);
    };
  }, [composer, expandAll, collapseAll]);

  const totalCount = state.treeHook.totalCount;
  const selectedCount = state.selectionHook.selectedIds.size;

  // Auto-expand ancestors of matching layers during search
  const { getAncestorIdsForMatches, isSearching } = state.searchHook;
  const { layers: treeLayers, expandIds } = state.treeHook;
  const { filterTree } = state; // 1-arg wrapper that injects customNames
  React.useEffect(() => {
    if (!isSearching) return;
    const filtered = filterTree(treeLayers);
    const ancestorIds = getAncestorIdsForMatches(filtered, treeLayers);
    expandIds(ancestorIds);
  }, [isSearching, filterTree, treeLayers, getAncestorIdsForMatches, expandIds]);

  /* Board 6887:78291 "Delete 3 elements?" — the one confirm the Layers
     tree asks for, and only for N ≥ 2 (decision 17: one element goes at
     once with the Undo toast). Opened from the selection's context menu. */
  const [deleteSelectionOpen, setDeleteSelectionOpen] = React.useState(false);
  const { addToast } = useToast();

  // Feedback message for invalid drop operations (UX improvement)
  const [dropFeedback, setDropFeedback] = React.useState<{
    message: string;
    type: "error" | "info";
  } | null>(null);

  // Auto-clear feedback after 3 seconds
  React.useEffect(() => {
    if (dropFeedback) {
      const timer = setTimeout(() => setDropFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [dropFeedback]);

  // Helper to show drop error feedback
  const showDropError = React.useCallback((message: string) => {
    setDropFeedback({ message, type: "error" });
  }, []);

  // Handle layer drop for reordering
  const handleLayerDrop = React.useCallback(
    (sourceId: string, targetId: string, position: "before" | "after" | "inside") => {
      if (!composer || !sourceId || sourceId === targetId) return;

      const elements = composer.elements;
      const sourceEl = elements.getElement(sourceId);
      const targetEl = elements.getElement(targetId);
      if (!sourceEl || !targetEl) return;

      const page = elements.getActivePage();
      if (page && page.root.id === sourceId) return;

      const descendants = sourceEl.getDescendants();
      if (descendants.some((d) => d.getId() === targetId)) return;

      const sourceType = sourceEl.getType() as ElementType;
      let newParent: Element | null = null;
      let index: number | undefined = undefined;

      if (position === "inside") {
        // Prevent dropping INTO locked container
        if (state.lockedIds.has(targetId)) {
          showDropError("Cannot drop inside a locked container");
          return;
        }
        newParent = targetEl;
        const parentType = newParent.getType() as ElementType;
        if (!canHaveChildren(parentType)) {
          showDropError(`${parentType} cannot contain children`);
          return;
        }
        if (!canNestElement(sourceType, parentType)) {
          showDropError(`${sourceType} cannot be nested inside ${parentType}`);
          return;
        }
        index = newParent.getChildCount();
      } else {
        const parent = targetEl.getParent();
        if (!parent) return;

        // Prevent dropping INTO locked parent container
        if (state.lockedIds.has(parent.getId())) {
          showDropError("Cannot drop next to elements in a locked container");
          return;
        }

        const parentType = parent.getType() as ElementType;
        if (!canNestElement(sourceType, parentType)) {
          showDropError(`${sourceType} cannot be placed in ${parentType}`);
          return;
        }

        const targetIndex = parent.getChildIndex(targetEl);
        let dropIndex = position === "before" ? targetIndex : targetIndex + 1;

        // Same-parent move: account for source removal shifting indices
        const sourceParent = sourceEl.getParent?.();
        if (sourceParent && sourceParent.getId() === parent.getId()) {
          const sourceIndex = parent.getChildIndex(sourceEl);
          if (sourceIndex < dropIndex) dropIndex -= 1;
        }

        newParent = parent;
        index = dropIndex;
      }

      if (!newParent) return;
      composer.beginTransaction("move-layer");
      elements.moveElement(sourceEl.getId(), newParent.getId(), index);
      composer.endTransaction();

      // Post-move selection reconciliation: force re-emit selection event
      setTimeout(() => composer.selection.reselect(), 0);
    },
    [composer, state.lockedIds, showDropError]
  );

  // Scroll to selected element helper
  const scrollToSelection = React.useCallback(() => {
    if (!state.treeContainerRef.current) return;
    const layerRow = state.treeContainerRef.current.querySelector(
      `.bdc-lr[aria-selected="true"]`
    ) as HTMLElement | null;
    if (layerRow) layerRow.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state.treeContainerRef]);

  // Auto-expand ancestors + scroll to selected element on selection change
  React.useEffect(() => {
    if (!selectedElement?.id || !composer) return;
    // Collect ancestor IDs walking up the element tree (visited guards against cycles)
    const ancestorIds: string[] = [];
    const visited = new Set<string>();
    let current = composer.elements.getElement(selectedElement.id);
    while (current && !visited.has(current.getId())) {
      visited.add(current.getId());
      const parent = current.getParent?.();
      if (!parent) break;
      ancestorIds.unshift(parent.getId());
      current = parent;
    }
    if (ancestorIds.length > 0) expandIds(ancestorIds);
    const scrollTimeout = setTimeout(scrollToSelection, 50);
    return () => clearTimeout(scrollTimeout);
  }, [selectedElement?.id, composer, expandIds, scrollToSelection]);

  // Listen for explicit scroll requests ("Show in Layers" button)
  React.useEffect(() => {
    if (!composer) return;
    const onScroll = () => setTimeout(scrollToSelection, 50);
    composer.on("layers:scroll-to-selection", onScroll);
    return () => {
      composer.off("layers:scroll-to-selection", onScroll);
    };
  }, [composer, scrollToSelection]);

  // Drag handlers
  const handleDragStart = React.useCallback(
    (e: React.DragEvent, layerId: string, layerType: string) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("layer-id", layerId);
      e.dataTransfer.setData("layer-type", layerType);
      state.setDragState({ draggedId: layerId, targetId: null, position: null });
      (e.target as HTMLElement).classList.add("is-dragging");
    },
    [state]
  );

  const handleDragEnd = React.useCallback(
    (e: React.DragEvent) => {
      (e.target as HTMLElement).classList.remove("is-dragging");
      state.setDragState({ draggedId: null, targetId: null, position: null });
    },
    [state]
  );

  const handleDragOver = React.useCallback(
    (e: React.DragEvent, layerId: string, layerType: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!state.dragState.draggedId || state.dragState.draggedId === layerId) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;

      // More forgiving hit zones: 30% top/bottom for reorder, 40% middle for nesting
      let position: "before" | "after" | "inside";
      const isContainer = canHaveChildren(layerType as ElementType);

      if (y < height * 0.3) {
        position = "before";
      } else if (y > height * 0.7) {
        position = "after";
      } else if (isContainer) {
        position = "inside";
      } else {
        // Fallback for non-containers: top half = before, bottom half = after
        position = y < height * 0.5 ? "before" : "after";
      }

      state.setDragState((prev) => {
        // Avoid flickering if state hasn't changed
        if (prev.targetId === layerId && prev.position === position) return prev;
        return { ...prev, targetId: layerId, position };
      });
    },
    [state]
  );

  const handleDragLeave = React.useCallback(
    (e: React.DragEvent) => {
      /* Chromium hands drag events a NULL relatedTarget, and a row's own
         label/glyph children fire dragleave on it as the pointer crosses
         them — so "no relatedTarget" cleared the drop line while the pointer
         was still on the row, and with no further dragover the line never
         came back (walk 2026-09-24: "no drop indicator"). Leaving means the
         pointer is outside the row's box. */
      const r = e.currentTarget.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX < r.right && e.clientY >= r.top && e.clientY < r.bottom;
      if (inside) return;
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (relatedTarget && e.currentTarget.contains(relatedTarget)) return;
      state.setDragState((prev) => ({ ...prev, targetId: null, position: null }));
    },
    [state]
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const sourceId = e.dataTransfer.getData("layer-id");
      const { position } = state.dragState;
      if (sourceId && targetId && position) handleLayerDrop(sourceId, targetId, position);
      state.setDragState({ draggedId: null, targetId: null, position: null });
    },
    [state, handleLayerDrop]
  );

  const handleSelect = React.useCallback(
    (id: string, modifiers: { shift?: boolean; meta?: boolean } = {}) => {
      state.selectionHook.selectLayer(id, modifiers);
    },
    [state.selectionHook]
  );

  const handleMouseEnter = React.useCallback(
    (id: string) => {
      state.handleLayerMouseEnter(id);
      onLayerHover?.(id);
    },
    [state, onLayerHover]
  );

  const handleMouseLeave = React.useCallback(() => {
    state.handleLayerMouseLeave();
    onLayerHover?.(null);
  }, [state, onLayerHover]);

  const requestDeleteSelection = React.useCallback(() => setDeleteSelectionOpen(true), []);
  /* "Move to page…" (4418:82847): the ids being moved, while the picker is open. */
  const [moveIds, setMoveIds] = React.useState<string[] | null>(null);
  const handleContextAction = useLayerContextActions(state, { requestDeleteSelection, requestMoveToPage: setMoveIds });
  const activePage = composer?.elements.getActivePage?.();
  const otherPages = React.useMemo(
    () =>
      moveIds
        ? (composer?.elements.getAllPages?.() ?? []).filter((p) => p.id !== activePage?.id).map((p) => ({ id: p.id, name: p.name }))
        : [],
    [composer, moveIds, activePage?.id]
  );
  const moveSubject = React.useMemo(() => {
    if (!moveIds) return "";
    if (moveIds.length >= 2) return elementsLabel(moveIds.length);
    /* The menu's own name for the row ("Heading"), so the title matches the
       row that was clicked. */
    const node = findLayer(state.layers, moveIds[0]);
    const name = state.actionsHook.customNames.get(moveIds[0]) ?? node?.type ?? "element";
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [moveIds, state.layers, state.actionsHook.customNames]);
  const confirmMoveToPage = React.useCallback(
    (pageId: string) => {
      if (!moveIds) return;
      const target = otherPages.find((p) => p.id === pageId)?.name ?? "the page";
      const subject = moveSubject;
      setMoveIds(null);
      if (!state.actionsHook.moveToPage(moveIds, pageId)) return;
      state.selectionHook.clearSelection();
      addToast({
        description: `${subject} moved to ${target}`,
        action: { label: "Undo", onClick: () => composer?.history.undo() },
      });
    },
    [moveIds, otherPages, moveSubject, state.actionsHook, state.selectionHook, addToast, composer]
  );

  /* The names the confirm reads out ("This removes Heading, Subtitle and
     Menu previews."), in tree order. */
  const selectedNames = React.useMemo(() => {
    const names: string[] = [];
    const walk = (items: typeof state.layers) => {
      for (const item of items) {
        if (state.selectionHook.selectedIds.has(item.id)) {
          names.push(getDisplayName(item.id, item.type, state.actionsHook.customNames, item.preview));
        }
        walk(item.children);
      }
    };
    walk(state.layers);
    return names;
  }, [state.layers, state.selectionHook.selectedIds, state.actionsHook.customNames]);

  const confirmDeleteSelection = React.useCallback(() => {
    if (!composer) return;
    const n = selectedCount;
    /* The engine's own delete: prunes to top-most elements and wraps one
       transaction, so Undo puts all of them back at once. */
    composer.commands.run("delete", { confirmed: true });
    state.selectionHook.clearSelection();
    setDeleteSelectionOpen(false);
    /* Board 6881:71749 "3 elements deleted" + Undo. */
    addToast({
      description: `${elementsLabel(n)} deleted`,
      action: { label: "Undo", onClick: () => composer.history.undo() },
      duration: 8000,
    });
  }, [composer, selectedCount, state.selectionHook, addToast]);

  const dimmedSelection = React.useMemo(() => {
    const id = selectedElement?.id;
    if (!id || selectedCount > 1 || !state.hiddenIds.has(id)) return null;
    const item = findLayer(state.layers, id);
    return item ? { id, name: getDisplayName(id, item.type, state.actionsHook.customNames, item.preview) } : null;
  }, [selectedElement?.id, selectedCount, state.hiddenIds, state.layers, state.actionsHook.customNames]);

  // Filter tree by search only (no category filters in Minimal Tree design)
  const treeFiltered = state.filterTree(state.layers);
  const matchCount = state.searchHook.countMatches(state.layers, state.actionsHook.customNames);

  /* Stats for LayersTab's count footer; `matches` while a filter is on
     (4418:79355 "1 of 12 layers match “button”"). */
  const matches = state.searchHook.isSearching ? matchCount : null;
  React.useEffect(() => {
    if (!composer) return;
    composer.emit("layers:stats-change", { total: totalCount, selected: selectedCount, matches });
  }, [composer, totalCount, selectedCount, matches]);

  // Board 143:2 (Layers · filtered): search results render FLAT — only the
  // matching rows, no indentation, no chevrons, no ancestor context. The
  // filtered tree keeps ancestors so we walk it and keep just the matches.
  const filteredLayers = React.useMemo(() => {
    if (!state.searchHook.isSearching) return treeFiltered;
    const q = state.search.toLowerCase();
    const names = state.actionsHook.customNames;
    const flat: typeof treeFiltered = [];
    const walk = (items: typeof treeFiltered) => {
      for (const it of items) {
        if (itemMatches(it, names, q)) flat.push({ ...it, children: [], depth: 0 });
        walk(it.children as typeof treeFiltered);
      }
    };
    walk(treeFiltered);
    return flat;
  }, [treeFiltered, state.searchHook.isSearching, state.search, state.actionsHook.customNames]);

  return (
    <div className="bdc-layers-panel tw:relative">
      {displaySettingsOpen && (
        <LayerDisplaySettings
          prefs={state.displayPrefs}
          onChange={state.updateDisplayPrefs}
          onClose={() => onDisplaySettingsToggle?.()}
        />
      )}
      {/* No breadcrumb band and no purpose line: v3 board 4418:81300 starts the
          tree directly under the search band (first row y136). The selected
          element's path lives in the canvas breadcrumb / status bar (G2-062). */}
      {/* Screen reader announcement for search results (WCAG 4.1.3) */}
      <div aria-live="polite" aria-atomic="true" className="bdc-sr-only">
        {state.search && matchCount > 0
          ? `${matchCount} layer${matchCount === 1 ? "" : "s"} found`
          : state.search && matchCount === 0
            ? "No layers match your search"
            : ""}
      </div>
      {/* Drop feedback message (UX improvement - Phase 3) */}
      {dropFeedback && (
        <div className="bdc-layers-drop-alert" role="alert" aria-live="assertive">
          {dropFeedback.message}
        </div>
      )}
      {/* The multi-select banner is gone (audit G2-068): the count line in
          the LayersTab footer and the selection's context menu carry it. */}
      <ConfirmDialog
        open={deleteSelectionOpen && selectedCount >= 2}
        onClose={() => setDeleteSelectionOpen(false)}
        onConfirm={confirmDeleteSelection}
        title={`Delete ${elementsLabel(selectedCount)}?`}
        message={`This removes ${listNames(selectedNames)}.`}
        confirmLabel={`Delete ${elementsLabel(selectedCount)}`}
        tone="destructive"
        testId="layers-delete-selection"
      />
      <MoveToPageDialog
        open={moveIds !== null}
        subject={moveSubject}
        fromPage={activePage?.name ?? "this page"}
        pages={otherPages}
        onMove={confirmMoveToPage}
        onClose={() => setMoveIds(null)}
      />
      {/* Clean Tree View - Maximum space for content. Wrapped so
          LayersScrollThumb (board 1082:4835) can sit OUTSIDE the scrollable
          element — a thumb rendered inside it would scroll away with the
          rows it is meant to describe. */}
      <div className="tw:relative tw:flex tw:flex-1 tw:min-h-0 tw:flex-col">
      <div
        ref={state.treeContainerRef}
        id="bd-layers-tree"
        /* Filtered rows are flat (4418:79355): no chevron slot, the glyph
           sits where depth 0's chevron would. */
        className={`bdc-layers-tree${state.displayPrefs.treeDensity === "compact" ? " bdc-layers-tree-compact" : ""}${
          state.searchHook.isSearching ? " tw:[&_.bdc-lr-chev]:hidden!" : ""
        }`}
        role="tree"
        aria-label="Page structure"
      >
        {state.layers.length === 0 && <LayersEmptyState />}

        {state.searchHook.isSearching && filteredLayers.length === 0 && (
          <LayersNoResults
            search={state.search}
            onSearchEverywhere={composer ? (query) => composer.emit(EVENTS.UI_TOGGLE_COMMAND_PALETTE, { query }) : undefined}
          />
        )}

        {filteredLayers.map((layer) => (
          <LayerTreeItem
            key={layer.id}
            layer={layer}
            composer={composer}
            expandedIds={state.expandedIds}
            dragState={state.dragState}
            hiddenIds={state.hiddenIds}
            lockedIds={state.lockedIds}
            selectedIds={state.selectionHook.selectedIds}
            customNames={state.customNames}
            canvasHoveredId={canvasHoveredId ?? null}
            editingId={state.editingId}
            editingName={state.editingName}
            editInputRef={state.editInputRef}
            onToggleExpand={state.toggleExpand}
            onToggleVisibility={state.toggleVisibility}
            onToggleLock={state.toggleLock}
            onStartEditing={state.startEditing}
            onSaveEditedName={state.saveEditedName}
            onCancelEditing={state.cancelEditing}
            onEditingNameChange={state.setEditingName}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onSelect={handleSelect}
            onContextMenu={state.openContextMenu}
            getVisibleLayerIds={state.getVisibleLayerIds}
            displayPrefs={state.displayPrefs}
          />
        ))}
        {dimmedSelection && (
          /* v3 4418:79800: the selected layer is dimmed — say what dimming
             is (editor only) and where site hiding lives, with the way back. */
          <div className="tw:flex tw:flex-col tw:items-start tw:gap-1.5 tw:px-3 tw:pt-4 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]" data-testid="layers-dimmed-note">
            <p className="tw:m-0">{dimmedSelection.name} is dimmed in the editor. It still appears on the live site.</p>
            <p className="tw:m-0">To hide on the site, use Inspector → Visibility.</p>
            <Button
              type="button"
              color="light"
              size="xs"
              className="tw:h-7 tw:px-4 tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink-soft)] tw:focus:ring-0"
              data-testid="layers-dimmed-show"
              onClick={(e: React.MouseEvent) => state.toggleVisibility(dimmedSelection.id, e)}
            >
              Show normally in editor
            </Button>
          </div>
        )}
      </div>
      <LayersScrollThumb containerRef={state.treeContainerRef} />
      </div>
      {state.contextMenu && (
        <LayerContextMenu
          x={state.contextMenu.x}
          y={state.contextMenu.y}
          nodeId={state.contextMenu.nodeId}
          hasClipboard={!!composer?.clipboard?.length}
          nodeName={state.contextMenu.nodeName}
          selectedCount={selectedCount}
          inSelection={state.selectionHook.selectedIds.has(state.contextMenu.nodeId)}
          onAction={handleContextAction}
          onClose={state.closeContextMenu}
        />
      )}
    </div>
  );
};

export default LayersPanel;
