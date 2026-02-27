/**
 * Canvas Overlay Group
 * Renders all visual overlay layers (grid, guides, selection, hover, drag feedback,
 * marquee, inline toolbar, breadcrumb) on top of the canvas content.
 * Extracted from Canvas.tsx for maintainability.
 *
 * @module components/Canvas/overlays/CanvasOverlayGroup
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { Z_LAYERS } from "../../../shared/constants/canvas";
import type { SpacingIndicator, CanvasGuide } from "../../../shared/types/canvas";
import type { InvalidDropReason } from "../../../shared/utils/dragDrop/dropValidation";
import { RichTextEditor } from "../../panels/RichTextEditor";
import {
  guidesContainerStyles,
  spotsOverlayStyles,
  alignmentToolbarStyles,
  getMarqueeStyles,
} from "../canvasStyles";
import { UnifiedSelectionToolbar } from "../controls";
import type { DropPosition, DropSlotRect, BreadcrumbItem } from "../hooks/useCanvasDragDrop";
import type { EditingState } from "../hooks/useCanvasInlineEdit";
import type { MarqueeState } from "../hooks/useCanvasMarquee";
import type { SnapLine } from "../hooks/useCanvasSnapping";
import type { CursorState } from "../hooks/useCursorIntelligence";
import { GuideLines } from "../shared";
import { CanvasSpotSpacing } from "../spots";
import { AlignmentToolbar } from "../toolbars";
import {
  SelectionBoxOverlay,
  ElementHoverOverlay,
  DropFeedbackOverlay,
  RulersOverlay,
  GuidesOverlay,
  MultiSelectBadge,
  GridOverlay,
  RemoteCursorsOverlay,
  CanvasBreadcrumb,
  SmartGuidesOverlay,
} from "./";

// ─── Props ───────────────────────────────────────────────────────────────────

export interface CanvasOverlayGroupProps {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement | null>;

  // Grid / rulers / guides
  showGrid: boolean;
  gridSize: number;
  showRulers: boolean;
  showGuides: boolean;
  zoom: number;
  canvasSize: { width: number; height: number };
  rulerGuides: CanvasGuide[];
  addGuide: (type: "horizontal" | "vertical", position: number) => void;
  updateGuide: (id: string, position: number) => void;
  removeGuide: (id: string) => void;
  guides: CanvasGuide[];
  snapLines: SnapLine[];

  // Selection group
  selectedId: string | null;
  selectedIds: string[];
  isResizing: boolean;
  setIsResizing: (v: boolean) => void;
  showSpacing: boolean;
  spacingIndicators: SpacingIndicator[];
  onSelectParent: () => void;
  onSelectAncestor: (id: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onWrap: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUndo: () => void;
  onClear: () => void;

  // Hover
  shouldShowHover: boolean;
  hoveredElementId: string | null;
  cursorState: CursorState;
  isInspectorEnabled: boolean;
  devMode: boolean;

  // Drag
  isDragOver: boolean;
  dropTargetId: string | null;
  dropPosition: DropPosition | null;
  isValidDrop: boolean;
  invalidDropReason: InvalidDropReason;
  dropSlotRect: DropSlotRect | null;
  dropTargetPath: BreadcrumbItem[];

  // Misc
  marquee: MarqueeState | null;
  editing: EditingState;
  onInlineCommand: (command: string, value?: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * All canvas overlay layers rendered on top of canvas content.
 */
export function CanvasOverlayGroup({
  composer,
  canvasRef,
  showGrid,
  gridSize,
  showRulers,
  zoom,
  canvasSize,
  rulerGuides,
  addGuide,
  updateGuide,
  removeGuide,
  showGuides,
  guides,
  snapLines,
  selectedId,
  selectedIds,
  isResizing,
  setIsResizing,
  showSpacing,
  spacingIndicators,
  onSelectParent,
  onSelectAncestor,
  onDuplicate,
  onDelete,
  onCopy,
  onWrap,
  onMoveUp,
  onMoveDown,
  onUndo,
  onClear,
  shouldShowHover,
  hoveredElementId,
  cursorState,
  isInspectorEnabled,
  devMode,
  isDragOver,
  dropTargetId,
  dropPosition,
  isValidDrop,
  invalidDropReason,
  dropSlotRect,
  dropTargetPath,
  marquee,
  editing,
  onInlineCommand,
}: CanvasOverlayGroupProps) {
  return (
    <>
      {/* Grid & Rulers */}
      {showGrid && <GridOverlay gridSize={gridSize} />}
      {showRulers && <RulersOverlay zoom={zoom} canvasSize={canvasSize} onCreateGuide={addGuide} />}
      {showRulers && rulerGuides.length > 0 && (
        <GuidesOverlay
          guides={rulerGuides}
          zoom={zoom}
          onDragGuide={updateGuide}
          onRemoveGuide={removeGuide}
        />
      )}

      {/* Persistent canvas guides (user-placed via rulers) */}
      {showGuides && guides.length > 0 && (
        <div aria-hidden style={guidesContainerStyles}>
          <GuideLines guides={guides} canvasSize={canvasSize} showCenterGuides={false} />
        </div>
      )}

      {/* Snap lines during drag — single renderer, zoom-aware */}
      {showGuides && <SmartGuidesOverlay snapLines={snapLines} zoom={zoom} />}

      {/* Selection overlays */}
      {composer && selectedId && (
        <div className="aqb-canvas-spots-overlay" style={spotsOverlayStyles}>
          {showSpacing && spacingIndicators.length > 0 && (
            <CanvasSpotSpacing
              composer={composer}
              elementId={selectedId}
              indicators={spacingIndicators}
            />
          )}
          <SelectionBoxOverlay
            composer={composer}
            elementId={selectedId}
            selectedIds={selectedIds}
            onResizeStateChange={setIsResizing}
          />
          {selectedIds.length === 1 && !isResizing && (
            <UnifiedSelectionToolbar
              composer={composer}
              elementId={selectedId}
              canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
              onSelectParent={onSelectParent}
              onSelectAncestor={onSelectAncestor}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onCopy={onCopy}
              onWrap={onWrap}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onUndo={onUndo}
            />
          )}
          <MultiSelectBadge selectedIds={selectedIds} primaryId={selectedId} onClear={onClear} />
          {selectedIds.length >= 2 && (
            <div style={alignmentToolbarStyles}>
              <AlignmentToolbar composer={composer} selectedIds={selectedIds} />
            </div>
          )}
        </div>
      )}

      {/* Hover overlay */}
      {shouldShowHover && (
        <ElementHoverOverlay
          hoveredElementId={hoveredElementId}
          canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
          altHeld={cursorState.altHeld}
          shiftHeld={cursorState.shiftHeld}
          inspectorEnabled={isInspectorEnabled || devMode}
        />
      )}

      {/* Remote collaboration cursors */}
      {composer?.collaboration?.isConnected() && (
        <RemoteCursorsOverlay composer={composer} zoom={zoom} />
      )}

      {/* Drop feedback */}
      {isDragOver && dropTargetId && (
        <DropFeedbackOverlay
          isDragOver={isDragOver}
          dropTargetId={dropTargetId}
          dropPosition={dropPosition}
          isValidDrop={isValidDrop}
          invalidReason={invalidDropReason}
          canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
          dropSlotRect={dropSlotRect}
          dropTargetPath={dropTargetPath}
        />
      )}

      {/* Marquee selection box */}
      {marquee && <div aria-hidden style={getMarqueeStyles(marquee)} />}

      {/* Floating inline rich text toolbar */}
      {editing.id && editing.rect && (
        <div
          className="aqb-inline-toolbar"
          style={{
            position: "absolute",
            top: editing.rect.top - 52,
            left: Math.max(8, editing.rect.left),
            zIndex: Z_LAYERS.tooltip,
            pointerEvents: "auto",
            transform:
              editing.rect.top < 60 ? `translateY(${editing.rect.height + 60}px)` : undefined,
          }}
        >
          <RichTextEditor onCommand={onInlineCommand} />
        </div>
      )}

      {/* Canvas breadcrumb at bottom */}
      {composer && selectedId && (
        <CanvasBreadcrumb
          composer={composer}
          selectedId={selectedId}
          onSelectElement={onSelectAncestor}
        />
      )}
    </>
  );
}
