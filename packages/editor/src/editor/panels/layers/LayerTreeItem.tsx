import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * LayerTreeItem - Minimal Tree Design
 * Clean rows with hover-reveal actions (Hide/Lock)
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { ELEMENT_TYPE_LABELS } from "../../../shared/constants/elementTypeLabels";
import { getElementIcon } from "../../../shared/ui/Icons";
import type { LayerItem, DragState, LayerDisplayPrefs } from "./types";

export interface LayerTreeItemProps {
  layer: LayerItem;
  composer: Composer | null;
  expandedIds: Set<string>;
  dragState: DragState;
  hiddenIds: Set<string>;
  lockedIds: Set<string>;
  selectedIds: Set<string>;
  customNames: Map<string, string>;
  canvasHoveredId: string | null;
  editingId: string | null;
  editingName: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;

  // Handlers
  onToggleExpand: (id: string) => void;
  onToggleVisibility: (id: string, e: React.MouseEvent) => void;
  onToggleLock: (id: string, e: React.MouseEvent) => void;
  onStartEditing: (id: string, currentName: string, e: React.MouseEvent) => void;
  onSaveEditedName: () => void;
  onCancelEditing: () => void;
  onEditingNameChange: (value: string) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  onDragStart: (e: React.DragEvent, layerId: string, layerType: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, layerId: string, layerType: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onSelect: (id: string, modifiers: { shift?: boolean; meta?: boolean }) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  getVisibleLayerIds: () => string[];
  displayPrefs: LayerDisplayPrefs;
}

export const LayerTreeItem: React.FC<LayerTreeItemProps> = (props) => {
  const {
    layer,
    composer,
    expandedIds,
    dragState,
    hiddenIds,
    lockedIds,
    selectedIds,
    customNames,
    canvasHoveredId,
    editingId,
    editingName,
    editInputRef,
    onToggleExpand,
    onToggleVisibility,
    onToggleLock,
    onStartEditing,
    onSaveEditedName,
    onCancelEditing,
    onEditingNameChange,
    onMouseEnter,
    onMouseLeave,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    onSelect,
    onContextMenu,
    getVisibleLayerIds,
    displayPrefs,
  } = props;
  const isSelected = selectedIds.has(layer.id);
  const isExpanded = expandedIds.has(layer.id);
  const hasChildren = layer.children.length > 0;
  const IconComponent = getElementIcon(layer.type);
  const isDragging = dragState.draggedId === layer.id;
  const isDropTarget = dragState.targetId === layer.id;
  const dropPosition = isDropTarget ? dragState.position : null;
  const isHidden = hiddenIds.has(layer.id);
  const isLocked = lockedIds.has(layer.id);
  const isEditing = editingId === layer.id;
  const isCanvasHovered = canvasHoveredId === layer.id;
  const displayName =
    customNames.get(layer.id) ||
    (ELEMENT_TYPE_LABELS[layer.type] ?? layer.type.charAt(0).toUpperCase() + layer.type.slice(1));
  const canDrag = !!(composer && layer.depth > 0 && !isLocked);

  const rowStyle: React.CSSProperties = {
    paddingLeft: `${6 + layer.depth * 14}px`,
  };

  const rowClassNames = [
    "bdc-lr",
    isSelected ? "bdc-sel" : "",
    isCanvasHovered ? "bdc-canvas-hover" : "",
    isHidden ? "bdc-hidden" : "",
    isEditing ? "bdc-editing" : "",
    isDragging ? "is-dragging" : "",
    hasChildren ? "" : "bdc-leaf",
    hasChildren && !isExpanded ? "bdc-closed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(layer.id, {});
    } else if (e.key === "F2") {
      e.preventDefault();
      if (!isLocked) {
        onStartEditing(layer.id, displayName, e as unknown as React.MouseEvent);
      }
    } else if (e.key === "ArrowRight" && hasChildren && !isExpanded) {
      e.preventDefault();
      onToggleExpand(layer.id);
    } else if (e.key === "ArrowLeft" && hasChildren && isExpanded) {
      e.preventDefault();
      onToggleExpand(layer.id);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const visibleIds = getVisibleLayerIds();
      const currentIndex = visibleIds.indexOf(layer.id);
      if (currentIndex === -1) return;
      const delta = e.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + delta + visibleIds.length) % visibleIds.length;
      const nextId = visibleIds[nextIndex];
      if (nextId) onSelect(nextId, {});
    }
  };

  return (
    <>
      <div
        className={rowClassNames}
        role="treeitem"
        tabIndex={0}
        draggable={canDrag}
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-label={`${displayName}, ${layer.type} element${isHidden ? ", hidden" : ""}${isLocked ? ", locked" : ""}`}
        aria-level={layer.depth + 1}
        title={`${displayName}${isHidden ? " (Hidden)" : ""}${isLocked ? " (Locked)" : ""}`}
        style={rowStyle}
        data-drop={dropPosition ?? undefined}
        onMouseEnter={() => onMouseEnter(layer.id)}
        onMouseLeave={onMouseLeave}
        onDragStart={canDrag ? (e) => onDragStart(e, layer.id, layer.type) : undefined}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, layer.id, layer.type)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, layer.id)}
        onClick={(e) => {
          onSelect(layer.id, { shift: e.shiftKey, meta: e.metaKey || e.ctrlKey });
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, layer.id);
        }}
        onDoubleClick={(e) => {
          if (!isLocked) onStartEditing(layer.id, displayName, e);
        }}
        onKeyDown={handleKeyDown}
      >
        <Button
          type="button"
          className="bdc-lr-chev"
          aria-label={hasChildren ? (isExpanded ? "Collapse children" : "Expand children") : undefined}
          aria-hidden={!hasChildren}
          tabIndex={hasChildren ? undefined : -1}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(layer.id);
          }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </Button>

        <span className="bdc-lr-ic" aria-hidden>
          <IconComponent size="sm" />
        </span>

        {isEditing ? (
          <Input
            ref={editInputRef}
            type="text"
            className="bdc-lr-edit"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onBlur={onSaveEditedName}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEditedName();
              else if (e.key === "Escape") onCancelEditing();
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <span className="bdc-lr-nm">{displayName}</span>
            {displayPrefs.showHtmlBadges && (
              <span className="bdc-lr-tag" aria-hidden>{layer.tagName}</span>
            )}
            {displayPrefs.showElementIds && (
              // 8-char slice truncates IDs with shared prefix (e.g. multiple
              // elements born from one createElement burst share `el-mpebx*`
              // and diverge only in the trailing 4 chars). Bumping to 12 +
              // exposing the full id via title disambiguates the layer
              // tree without ballooning row width.
              <span className="bdc-lr-id" title={layer.id} aria-hidden>#{layer.id.slice(0, 12)}</span>
            )}
            {layer.isComponent && (
              <span className="bdc-lr-cmp" title="Component instance" aria-label="Component instance">⚡</span>
            )}
            {layer.breakpointOverrides?.mobile?.hidden && (
              <span className="bdc-lr-bp" title="Hidden on mobile" role="img" aria-label="Hidden on mobile">M</span>
            )}
            {layer.breakpointOverrides?.tablet?.hidden && (
              <span className="bdc-lr-bp" title="Hidden on tablet" role="img" aria-label="Hidden on tablet">T</span>
            )}
          </>
        )}

        <Button
          type="button"
          className={`bdc-lr-lock${isLocked ? " bdc-on" : ""}`}
          title={isLocked ? "Unlock element" : "Lock element"}
          aria-label={isLocked ? "Unlock element" : "Lock element"}
          onClick={(e) => onToggleLock(layer.id, e)}
        >
          <svg viewBox="0 0 24 24">
            {isLocked ? (
              <>
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 018 0v4" />
              </>
            ) : (
              <>
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 018 0" />
              </>
            )}
          </svg>
        </Button>

        <Button
          type="button"
          className={`bdc-lr-eye${isHidden ? " bdc-off" : ""}`}
          title={isHidden ? "Show element" : "Hide element"}
          aria-label={isHidden ? "Show element" : "Hide element"}
          onClick={(e) => onToggleVisibility(layer.id, e)}
        >
          <svg viewBox="0 0 24 24">
            {isHidden ? (
              <>
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                <path d="M9.9 5.1A9.5 9.5 0 0121 12a9.5 9.5 0 01-2.1 3" />
              </>
            ) : (
              <>
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="2.5" />
              </>
            )}
          </svg>
        </Button>
      </div>
      {isExpanded && hasChildren && layer.children.map((child) => (
        <LayerTreeItem key={child.id} {...props} layer={child} />
      ))}
    </>
  );
};

export default LayerTreeItem;
