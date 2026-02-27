/**
 * LayersPanel - Minimal Tree Design
 * Maximum content, minimum chrome. Search + Tree only.
 *
 * @deprecated This standalone component is deprecated. Use NavigatorTab
 * (packages/editor/src/components/Panels/LeftSidebar/tabs/NavigatorTab.tsx)
 * which is the canonical layers view integrated into the sidebar.
 * This file will be removed in a future version.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Element } from "../../../engine/elements/Element";
import type { ElementType } from "../../../shared/types";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { IconTree, IconSearch, IconSettings, IconPlus } from "../../../shared/ui/Icons";
import { canNestElement, canHaveChildren } from "../../../shared/utils/nesting";
import { useLayersState } from "./hooks/useLayersState";
import { LayerTreeItem } from "./LayerTreeItem";
import { layersPanelStyles } from "./styles";
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

        // Reordering within same parent: index needs correction if moving forward
        const sourceParent = sourceEl.getParent();
        if (sourceParent && sourceParent.getId() === parent.getId()) {
          const sourceIndex = parent.getChildIndex(sourceEl);
          if (sourceIndex < targetIndex && position === "after") {
            // No change needed, targetIndex already shifted
          } else if (sourceIndex < targetIndex && position === "before") {
            // No change needed
          }
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
      `.aqb-layer-row[aria-selected="true"]`
    ) as HTMLElement | null;
    if (layerRow) layerRow.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state.treeContainerRef]);

  // Auto-scroll to selected element on selection change
  React.useEffect(() => {
    if (!selectedElement?.id || !state.treeContainerRef.current || !composer) return;

    const ancestorIds: string[] = [];
    let current = composer.elements.getElement(selectedElement.id);
    while (current) {
      const parent = current.getParent?.();
      if (parent) ancestorIds.unshift(parent.getId());
      current = parent ?? undefined;
    }

    if (ancestorIds.length > 0) {
      state.expandedIds.forEach(() => {}); // Trigger re-render with expanded ancestors
    }

    const scrollTimeout = setTimeout(scrollToSelection, 50);
    return () => clearTimeout(scrollTimeout);
  }, [selectedElement?.id, composer, state.expandedIds, state.treeContainerRef, scrollToSelection]);

  // Listen for explicit scroll requests (Phase 6: "Show in Layers" button)
  React.useEffect(() => {
    if (!composer) return;

    const handleScrollRequest = () => {
      // Small delay to ensure DOM is ready
      setTimeout(scrollToSelection, 50);
    };

    composer.on("layers:scroll-to-selection", handleScrollRequest);
    return () => {
      composer.off("layers:scroll-to-selection", handleScrollRequest);
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
    (id: string) => {
      if (!composer) return;
      const el = composer.elements.getElement(id);
      if (el) composer.selection.select(el);
    },
    [composer]
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

  // Filter tree by search only (no category filters in Minimal Tree design)
  const filteredLayers = state.filterTree(state.layers);

  return (
    <div className="aqb-layers-panel aqb-layers-minimal">
      {/* Minimal Search Bar + Settings */}
      <div className="aqb-layers-search-row">
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
        <button
          className="aqb-layers-settings-btn"
          title="Layer settings"
          aria-label="Layer settings"
        >
          <IconSettings size="sm" />
        </button>
      </div>

      {/* Screen reader announcement for search results (WCAG 4.1.3) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="aqb-sr-only"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {state.search && filteredLayers.length > 0
          ? `${filteredLayers.length} layer${filteredLayers.length === 1 ? "" : "s"} found`
          : state.search && filteredLayers.length === 0
            ? "No layers match your search"
            : ""}
      </div>

      {/* Drop feedback message (UX improvement - Phase 3) */}
      {dropFeedback && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: "8px 12px",
            margin: "0 8px 8px",
            fontSize: "var(--aqb-text-xs, 12px)",
            borderRadius: "var(--aqb-radius-sm, 4px)",
            background:
              dropFeedback.type === "error"
                ? "var(--aqb-error-bg, rgba(239, 68, 68, 0.1))"
                : "var(--aqb-info-bg, rgba(59, 130, 246, 0.1))",
            color:
              dropFeedback.type === "error"
                ? "var(--aqb-error, #ef4444)"
                : "var(--aqb-info, #3b82f6)",
            border: `1px solid ${dropFeedback.type === "error" ? "var(--aqb-error, #ef4444)" : "var(--aqb-info, #3b82f6)"}`,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span aria-hidden>{dropFeedback.type === "error" ? "⚠️" : "ℹ️"}</span>
          {dropFeedback.message}
        </div>
      )}

      {/* Clean Tree View - Maximum space for content */}
      <div
        ref={state.treeContainerRef}
        id="aqb-layers-tree"
        className="aqb-layers-tree aqb-layers-tree-minimal"
        role="tree"
        aria-label="Page structure"
      >
        {state.layers.length === 0 && (
          <EmptyState
            icon={<IconTree size="md" />}
            title="No layers yet"
            description="Add blocks to start building your page"
            action={{
              label: "Add Block",
              onClick: onAddBlockClick || (() => {}),
              icon: <IconPlus size="sm" />,
            }}
            size="sm"
            className="aqb-layers-empty-state"
          />
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
            onEditingNameChange={state.setEditingName}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onSelect={handleSelect}
            getVisibleLayerIds={state.getVisibleLayerIds}
          />
        ))}
      </div>

      <style>{layersPanelStyles}</style>
    </div>
  );
};

export default LayersPanel;
