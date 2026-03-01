/**
 * LayersPanel - Minimal Tree Design. Search + Tree only.
 * @deprecated Use NavigatorTab (canonical layers view in sidebar). Removed in future.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Element } from "../../../engine/elements/Element";
import type { ElementType } from "../../../shared/types";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { IconTree, IconSearch, IconSettings, IconPlus } from "../../../shared/ui/Icons";
import { canNestElement, canHaveChildren } from "../../../shared/utils/nesting";
import { LayerBreadcrumb } from "./components/LayerBreadcrumb";
import { LayerContextMenu } from "./components/LayerContextMenu";
import { LayerDisplaySettings } from "./components/LayerDisplaySettings";
import { LayerSelectionBanner } from "./components/LayerSelectionBanner";
import { useLayerContextActions } from "./hooks/useLayerContextActions";
import { useLayersState } from "./hooks/useLayersState";
import { LayerTreeItem } from "./LayerTreeItem";
import { layersPanelStyles, SR_ONLY_STYLE, getDropFeedbackStyle } from "./styles";
import type { LayersPanelProps } from "./types";

export type { LayersPanelProps, SelectedElementInfo } from "./types";

export const LayersPanel: React.FC<LayersPanelProps> = ({
  composer,
  selectedElement,
  onLayerHover,
  canvasHoveredId,
  onAddBlockClick,
}) => {
  const state = useLayersState({ composer, canvasHoveredId });

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
        const dropIndex = position === "before" ? targetIndex : targetIndex + 1;

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
      `.aqb-layer-row[aria-selected="true"]`
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
    if (ancestorIds.length > 0) state.treeHook.expandIds(ancestorIds);
    const scrollTimeout = setTimeout(scrollToSelection, 50);
    return () => clearTimeout(scrollTimeout);
  }, [selectedElement?.id, composer, state.treeHook, scrollToSelection]);

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
    const ids = [...state.selectionHook.selectedIds];
    if (!window.confirm(`Delete ${ids.length} layer${ids.length === 1 ? "" : "s"}?`)) return;
    composer.beginTransaction("delete-layers");
    ids.forEach((id) => composer.elements.removeElement(id));
    composer.endTransaction();
    state.selectionHook.clearSelection();
  }, [composer, state.selectionHook]);

  // Filter tree by search only (no category filters in Minimal Tree design)
  const filteredLayers = state.filterTree(state.layers);

  return (
    <div className="aqb-layers-panel aqb-layers-minimal">
      {/* Search Bar + Settings */}
      <div className="aqb-layers-search-row">
        {/* Header row: expand/collapse + count */}
        <div className="aqb-layers-header-row">
          <div className="aqb-layers-header-actions">
            <button
              className="aqb-layers-settings-btn"
              title="Expand all layers (Alt+→)"
              aria-label="Expand all layers"
              onClick={() => state.treeHook.expandAll()}
            >
              ⊞
            </button>
            <button
              className="aqb-layers-settings-btn"
              title="Collapse all layers (Alt+←)"
              aria-label="Collapse all layers"
              onClick={() => state.treeHook.collapseAll()}
            >
              ⊟
            </button>
            <span
              className="aqb-layers-count"
              aria-live="polite"
              aria-label={`${state.treeHook.totalCount} layers`}
            >
              {state.treeHook.totalCount > 0 ? `· ${state.treeHook.totalCount}` : ""}
            </span>
          </div>
        </div>

        {/* Search input */}
        <div className="aqb-search-container">
          <span className="aqb-search-icon" aria-hidden>
            <IconSearch size="sm" />
          </span>
          <input
            type="text"
            placeholder="Search layers..."
            value={state.search}
            onChange={(e) => state.setSearch(e.target.value)}
            aria-label="Search layers"
            aria-controls="aqb-layers-tree"
            className="aqb-search-input"
          />
          {state.search && (
            <button
              className="aqb-search-clear"
              onClick={() => state.setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Gear icon — now wired to display settings */}
        <div style={{ position: "relative" }}>
          <button
            className="aqb-layers-settings-btn"
            title="Display settings"
            aria-label="Layer display settings"
            aria-expanded={state.displaySettingsOpen}
            onClick={() => state.setDisplaySettingsOpen((prev: boolean) => !prev)}
          >
            <IconSettings size="sm" />
          </button>
          {state.displaySettingsOpen && (
            <LayerDisplaySettings
              prefs={state.displayPrefs}
              onChange={state.updateDisplayPrefs}
              onClose={() => state.setDisplaySettingsOpen(false)}
            />
          )}
        </div>
      </div>

      {state.selectionHook.selectedIds.size === 1 && (
        <LayerBreadcrumb
          selectedId={[...state.selectionHook.selectedIds][0]}
          layers={state.treeHook.layers}
          customNames={state.actionsHook.customNames}
          onSelect={state.selectionHook.selectLayer}
        />
      )}

      {/* Screen reader announcement for search results (WCAG 4.1.3) */}
      <div aria-live="polite" aria-atomic="true" className="aqb-sr-only" style={SR_ONLY_STYLE}>
        {state.search && filteredLayers.length > 0
          ? `${filteredLayers.length} layer${filteredLayers.length === 1 ? "" : "s"} found`
          : state.search && filteredLayers.length === 0
            ? "No layers match your search"
            : ""}
      </div>

      {/* Drop feedback message (UX improvement - Phase 3) */}
      {dropFeedback && (
        <div role="alert" aria-live="assertive" style={getDropFeedbackStyle(dropFeedback.type)}>
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

      {/* Clean Tree View - Maximum space for content */}
      <div
        ref={state.treeContainerRef}
        id="aqb-layers-tree"
        className={`aqb-layers-tree aqb-layers-tree-minimal${state.displayPrefs.treeDensity === "compact" ? " aqb-layers-compact" : ""}`}
        role="tree"
        aria-label="Page structure"
      >
        {state.layers.length === 0 && (
          <EmptyState
            icon={<IconTree size="md" />}
            title="No layers yet"
            description="Add blocks to start building your page"
            action={{
              label: "Open Build Panel →",
              onClick: onAddBlockClick || (() => {}),
              icon: <IconPlus size="sm" />,
            }}
            size="sm"
            className="aqb-layers-empty-state"
          />
        )}

        {state.searchHook.isSearching && filteredLayers.length === 0 && (
          <div className="aqb-layers-empty-search" role="status">
            <span className="aqb-les-icon">🔍</span>
            <p className="aqb-les-title">No layers match &quot;{state.search}&quot;</p>
            <button className="aqb-les-clear" onClick={() => state.setSearch("")}>
              Clear search
            </button>
          </div>
        )}

        {filteredLayers.map((layer) => (
          <LayerTreeItem
            key={layer.id}
            layer={layer}
            composer={composer}
            selectedElementId={selectedElement?.id ?? null}
            expandedIds={state.expandedIds}
            dragState={state.dragState}
            hiddenIds={state.hiddenIds}
            lockedIds={state.lockedIds}
            selectedIds={state.selectionHook.selectedIds}
            customNames={state.customNames}
            canvasHoveredId={canvasHoveredId ?? null}
            hoveredLayerId={state.hoveredLayerId}
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

      <style>{layersPanelStyles}</style>
    </div>
  );
};

export default LayersPanel;
