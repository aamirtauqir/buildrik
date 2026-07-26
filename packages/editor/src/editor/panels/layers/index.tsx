/**
 * LayersPanel - Minimal Tree Design. Search + Tree only.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/ui";
import "./styles/layers-v2.css";
import type { Element } from "../../../engine/elements/Element";
import type { ElementType } from "../../../shared/types";
import { LayersEmptyState } from "./components/LayersEmptyState";
import { canNestElement, canHaveChildren } from "../../../shared/utils/nesting";
import { LayerBreadcrumb } from "./components/LayerBreadcrumb";
import { LayerContextMenu } from "./components/LayerContextMenu";
import { LayerDisplaySettings } from "./components/LayerDisplaySettings";
import { LayerSelectionBanner } from "./components/LayerSelectionBanner";
import { useLayerContextActions } from "./hooks/useLayerContextActions";
import { useLayersState } from "./hooks/useLayersState";
import { LayerTreeItem } from "./LayerTreeItem";
import type { LayersPanelProps } from "./types";

export type { LayersPanelProps, SelectedElementInfo } from "./types";

export const LayersPanel: React.FC<LayersPanelProps> = ({
  composer,
  selectedElement,
  onLayerHover,
  canvasHoveredId,
  onAddBlockClick,
  search,
  displaySettingsOpen,
  onDisplaySettingsToggle,
  onSearchChange,
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

  // Emit stats to LayersTab
  const totalCount = state.treeHook.totalCount;
  const selectedCount = state.selectionHook.selectedIds.size;
  React.useEffect(() => {
    if (!composer) return;
    composer.emit("layers:stats-change", { total: totalCount, selected: selectedCount });
  }, [composer, totalCount, selectedCount]);

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

  // Inline confirm state for multi-layer delete (replaces window.confirm)
  const [pendingBannerDelete, setPendingBannerDelete] = React.useState(false);

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
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
        state.setDragState((prev) => ({ ...prev, targetId: null, position: null }));
      }
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

  const handleContextAction = useLayerContextActions(state);

  const handleBannerGroup = React.useCallback(() => {
    state.actionsHook.groupLayers([...state.selectionHook.selectedIds], state.treeHook.layers);
  }, [state.actionsHook, state.selectionHook, state.treeHook]);

  const handleBannerHide = React.useCallback(() => {
    state.actionsHook.hideMultiple([...state.selectionHook.selectedIds]);
  }, [state.actionsHook, state.selectionHook]);

  const handleBannerDelete = React.useCallback(() => {
    if (!composer) return;
    setPendingBannerDelete(true);
  }, [composer]);

  const confirmBannerDelete = React.useCallback(() => {
    if (!composer) return;
    const ids = [...state.selectionHook.selectedIds];
    composer.beginTransaction("delete-layers");
    ids.forEach((id) => composer.elements.removeElement(id));
    composer.endTransaction();
    state.selectionHook.clearSelection();
    setPendingBannerDelete(false);
  }, [composer, state.selectionHook]);

  // Filter tree by search only (no category filters in Minimal Tree design)
  const filteredLayers = state.filterTree(state.layers);
  const matchCount = state.searchHook.countMatches(state.layers, state.actionsHook.customNames);

  return (
    <div className="bdc-layers-panel">
      {displaySettingsOpen && (
        <LayerDisplaySettings
          prefs={state.displayPrefs}
          onChange={state.updateDisplayPrefs}
          onClose={() => onDisplaySettingsToggle?.()}
        />
      )}
      {state.selectionHook.selectedIds.size === 1 && (
        <LayerBreadcrumb
          selectedId={[...state.selectionHook.selectedIds][0]}
          layers={state.treeHook.layers}
          customNames={state.actionsHook.customNames}
          onSelect={state.selectionHook.selectLayer}
        />
      )}
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
          <span aria-hidden>{dropFeedback.type === "error" ? "⚠️" : "ℹ️"}</span>
          {dropFeedback.message}
        </div>
      )}
      <LayerSelectionBanner
        count={state.selectionHook.selectedIds.size}
        onGroup={handleBannerGroup}
        onHide={handleBannerHide}
        onDelete={handleBannerDelete}
        onExit={state.selectionHook.clearSelection}
      />
      {pendingBannerDelete && state.selectionHook.selectedIds.size > 1 && (
        <div className="bdc-layers-confirm" role="alert">
          <span>Delete {state.selectionHook.selectedIds.size} layers?</span>
          <Button className="bdc-btn bdc-btn-danger" onClick={confirmBannerDelete}>Delete</Button>
          <Button className="bdc-btn bdc-btn-ghost" onClick={() => setPendingBannerDelete(false)}>Cancel</Button>
        </div>
      )}
      {/* Clean Tree View - Maximum space for content */}
      <div
        ref={state.treeContainerRef}
        id="bd-layers-tree"
        className={`bdc-layers-tree${state.displayPrefs.treeDensity === "compact" ? " bdc-layers-tree-compact" : ""}`}
        role="tree"
        aria-label="Page structure"
      >
        {state.layers.length === 0 && <LayersEmptyState onAddBlockClick={onAddBlockClick} />}

        {state.searchHook.isSearching && filteredLayers.length === 0 && (
          <div className="bdc-layers-empty-search" role="status">
            <span className="bdc-les-icon">🔍</span>
            <p className="bdc-les-title">No layers match &quot;{state.search}&quot;</p>
            <Button className="bdc-les-clear" onClick={() => onSearchChange ? onSearchChange("") : setSearch("")}>
              Clear search
            </Button>
          </div>
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
      </div>
      {state.contextMenu && (
        <LayerContextMenu
          x={state.contextMenu.x}
          y={state.contextMenu.y}
          nodeId={state.contextMenu.nodeId}
          nodeName={state.contextMenu.nodeName}
          isHidden={state.contextMenu.isHidden}
          isLocked={state.contextMenu.isLocked}
          childCount={state.contextMenu.childCount}
          selectedCount={state.selectionHook.selectedIds.size}
          onAction={handleContextAction}
          onClose={state.closeContextMenu}
        />
      )}
    </div>
  );
};

export default LayersPanel;
