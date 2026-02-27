/**
 * LayerTreeItem - Minimal Tree Design
 * Clean rows with hover-reveal actions (Hide/Lock)
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { getElementIcon } from "../../../shared/ui/Icons";
import type { LayerItem, DragState } from "./types";

export interface LayerTreeItemProps {
  layer: LayerItem;
  composer: Composer | null;
  selectedElementId: string | null;
  expandedIds: Set<string>;
  dragState: DragState;
  hiddenIds: Set<string>;
  lockedIds: Set<string>;
  customNames: Map<string, string>;
  canvasHoveredId: string | null;
  hoveredLayerId: string | null;
  editingId: string | null;
  editingName: string;
  editInputRef: React.RefObject<HTMLInputElement>;

  // Handlers
  onToggleExpand: (id: string) => void;
  onToggleVisibility: (id: string, e: React.MouseEvent) => void;
  onToggleLock: (id: string, e: React.MouseEvent) => void;
  onStartEditing: (id: string, currentName: string, e: React.MouseEvent) => void;
  onSaveEditedName: () => void;
  onEditingNameChange: (value: string) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  onDragStart: (e: React.DragEvent, layerId: string, layerType: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, layerId: string, layerType: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onSelect: (id: string) => void;
  getVisibleLayerIds: () => string[];
}

export const LayerTreeItem: React.FC<LayerTreeItemProps> = ({
  layer,
  composer,
  selectedElementId,
  expandedIds,
  dragState,
  hiddenIds,
  lockedIds,
  customNames,
  canvasHoveredId,
  hoveredLayerId,
  editingId,
  editingName,
  editInputRef,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onStartEditing,
  onSaveEditedName,
  onEditingNameChange,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelect,
  getVisibleLayerIds,
}) => {
  const isSelected = selectedElementId === layer.id;
  const isExpanded = expandedIds.has(layer.id);
  const hasChildren = layer.children.length > 0;
  const IconComponent = getElementIcon(layer.type);
  const isDragging = dragState.draggedId === layer.id;
  const isDropTarget = dragState.targetId === layer.id;
  const dropPosition = isDropTarget ? dragState.position : null;
  const isHidden = hiddenIds.has(layer.id);
  const isLocked = lockedIds.has(layer.id);
  const isEditing = editingId === layer.id;
  const displayName = customNames.get(layer.id) || layer.type;
  const isCanvasHovered = canvasHoveredId === layer.id;
  const isLayerHovered = hoveredLayerId === layer.id;
  const canDrag = !!(composer && layer.depth > 0 && !isLocked);

  // Minimal Tree: Simple depth-based indentation via CSS padding
  const rowStyle = {
    "--layer-depth": layer.depth,
    paddingLeft: `${8 + layer.depth * 16}px`,
    opacity: isDragging ? 0.5 : isHidden ? 0.5 : 1,
  } as React.CSSProperties;

  const rowClassNames = [
    "aqb-layer-row",
    hasChildren ? "has-children" : "",
    isSelected ? "is-selected" : "",
    isDragging ? "is-dragging" : "",
    isDropTarget ? "is-drop-target" : "",
    dropPosition ? `drop-${dropPosition}` : "",
    isHidden ? "is-hidden" : "",
    isLocked ? "is-locked" : "",
    isCanvasHovered ? "is-canvas-hovered" : "",
    isLayerHovered ? "is-layer-hovered" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(layer.id);
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
      if (nextId) onSelect(nextId);
    }
  };

  return (
    <div className="aqb-layer-node">
      <div
        className={rowClassNames}
        role="treeitem"
        tabIndex={0}
        draggable={canDrag}
        aria-pressed={isSelected}
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-label={`${displayName}, ${layer.type} element${isHidden ? ", hidden" : ""}${isLocked ? ", locked" : ""}`}
        aria-level={layer.depth + 1}
        title={`${displayName}${isHidden ? " (Hidden)" : ""}${isLocked ? " (Locked)" : ""}`}
        style={rowStyle}
        onMouseEnter={() => onMouseEnter(layer.id)}
        onMouseLeave={onMouseLeave}
        onDragStart={canDrag ? (e) => onDragStart(e, layer.id, layer.type) : undefined}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, layer.id, layer.type)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, layer.id)}
        onClick={() => onSelect(layer.id)}
        onDoubleClick={(e) => {
          if (!isLocked) onStartEditing(layer.id, displayName, e);
        }}
        onKeyDown={handleKeyDown}
      >
        {dropPosition === "before" && <div className="aqb-drop-indicator aqb-drop-before" />}
        {dropPosition === "after" && <div className="aqb-drop-indicator aqb-drop-after" />}
        {dropPosition === "inside" && <div className="aqb-drop-indicator aqb-drop-inside" />}

        {/* Expand/Collapse Toggle */}
        {hasChildren ? (
          <button
            type="button"
            className={`aqb-layer-toggle ${isExpanded ? "" : "collapsed"}`}
            aria-label={isExpanded ? "Collapse children" : "Expand children"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(layer.id);
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M3 2l4 3-4 3V2z" />
            </svg>
          </button>
        ) : (
          <span className="aqb-layer-toggle-placeholder" aria-hidden>
            •
          </span>
        )}
        <div className="aqb-layer-icon" aria-hidden>
          <IconComponent size="sm" />
        </div>
        <div className="aqb-layer-meta">
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              className="aqb-layer-name-input"
              value={editingName}
              onChange={(e) => onEditingNameChange(e.target.value)}
              onBlur={onSaveEditedName}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEditedName();
                else if (e.key === "Escape") onSaveEditedName();
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="aqb-layer-name">{displayName}</span>
              {/* Type Tag */}
              <span className="aqb-layer-type">{layer.tagName}</span>
              {/* Component Badge */}
              {layer.isComponent && (
                <span className="aqb-component-badge" title="Component instance">
                  ⚡
                </span>
              )}
            </>
          )}
        </div>

        <div className="aqb-layer-actions">
          <button
            type="button"
            className={`aqb-layer-action-btn ${isHidden ? "is-active" : ""}`}
            title={isHidden ? "Show element" : "Hide element"}
            onClick={(e) => onToggleVisibility(layer.id, e)}
            aria-label={isHidden ? "Show element" : "Hide element"}
          >
            {isHidden ? <EyeOffIcon /> : <EyeIcon />}
          </button>
          <button
            type="button"
            className={`aqb-layer-action-btn ${isLocked ? "is-active" : ""}`}
            title={isLocked ? "Unlock element" : "Lock element"}
            onClick={(e) => onToggleLock(layer.id, e)}
            aria-label={isLocked ? "Unlock element" : "Lock element"}
          >
            {isLocked ? <LockIcon /> : <UnlockIcon />}
          </button>
        </div>
      </div>
      {isExpanded && layer.children.length > 0 && (
        <div className="aqb-layer-children" role="group">
          {layer.children.map((child) => (
            <LayerTreeItem
              key={child.id}
              layer={child}
              composer={composer}
              selectedElementId={selectedElementId}
              expandedIds={expandedIds}
              dragState={dragState}
              hiddenIds={hiddenIds}
              lockedIds={lockedIds}
              customNames={customNames}
              canvasHoveredId={canvasHoveredId}
              hoveredLayerId={hoveredLayerId}
              editingId={editingId}
              editingName={editingName}
              editInputRef={editInputRef}
              onToggleExpand={onToggleExpand}
              onToggleVisibility={onToggleVisibility}
              onToggleLock={onToggleLock}
              onStartEditing={onStartEditing}
              onSaveEditedName={onSaveEditedName}
              onEditingNameChange={onEditingNameChange}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onSelect={onSelect}
              getVisibleLayerIds={getVisibleLayerIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Icon components
const EyeIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LockIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UnlockIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

export default LayerTreeItem;
