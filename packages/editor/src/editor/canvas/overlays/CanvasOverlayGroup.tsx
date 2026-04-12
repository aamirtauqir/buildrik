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
import type { SectionBoundary, SectionDragState } from "../hooks/useSectionReorder";
import { GuideLines } from "../shared";
import { CanvasSpotSpacing } from "../spots";
import { AlignmentToolbar } from "../toolbars";
import {
  SelectionBoxOverlay,
  ElementHoverOverlay,
  ParentHighlight,
  DropFeedbackOverlay,
  RulersOverlay,
  GuidesOverlay,
  MultiSelectBadge,
  GridOverlay,
  RemoteCursorsOverlay,
  CanvasBreadcrumb,
  SmartGuidesOverlay,
  SectionReorderHandles,
  SelectionLabel,
} from "./";

// ─── Props ───────────────────────────────────────────────────────────────────

export interface CanvasOverlayGroupProps {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLElement | null>;

  // Grid & Rulers
  showGrid: boolean;
  gridSize: number;
  showRulers: boolean;
  zoom: number;
  canvasSize: { width: number; height: number };
  rulerGuides: CanvasGuide[];
  addGuide: (guide: CanvasGuide) => void;
  updateGuide: (index: number, position: number) => void;
  removeGuide: (index: number) => void;

  // Selection
  selectedId: string | null;
  selectedIds: string[];
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

  // Drag & Resize
  isResizing: boolean;
  setIsResizing: (is: boolean) => void;
  cursorState: CursorState;
  isDragOver: boolean;
  dropTargetId: string | null;
  dropPosition: DropPosition;
  isValidDrop: boolean;
  invalidDropReason: InvalidDropReason;
  dropSlotRect: DropSlotRect | null;
  dropTargetPath: BreadcrumbItem[];

  // Guides & Snapping
  showGuides: boolean;
  guides: SpacingIndicator[];
  snapLines: SnapLine[];

  // Indicators
  showSpacing: boolean;
  spacingIndicators: SpacingIndicator[];

  // Section Reordering
  sectionBoundaries: SectionBoundary[];
  sectionDragState: SectionDragState | null;
  hoveredSectionBoundary: string | null;
  onSectionStartDrag: (id: string, e: React.MouseEvent) => void;
  onSectionUpdateDrag: (e: MouseEvent) => void;
  onSectionCompleteDrag: () => void;
  onSectionCancelDrag: () => void;
  onSectionHoverBoundary: (id: string | null) => void;

  // Misc
  marquee: MarqueeState | null;
  editing: EditingState;
  onInlineCommand: (cmd: string, value?: any) => void;
  onOpenImageEditor?: (item: any) => void;
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
  selectedId,
  selectedIds,
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
  isResizing,
  setIsResizing,
  cursorState,
  isDragOver,
  dropTargetId,
  dropPosition,
  isValidDrop,
  invalidDropReason,
  dropSlotRect,
  dropTargetPath,
  showGuides,
  guides,
  snapLines,
  showSpacing,
  spacingIndicators,
  sectionBoundaries,
  sectionDragState,
  hoveredSectionBoundary,
  onSectionStartDrag,
  onSectionUpdateDrag,
  onSectionCompleteDrag,
  onSectionCancelDrag,
  onSectionHoverBoundary,
  marquee,
  editing,
  onInlineCommand,
  onOpenImageEditor,
}: CanvasOverlayGroupProps) {
  // Defensive early return if critical objects are missing
  if (!composer || !canvasRef) return null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="aqb-canvas-overlay-group"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: Z_LAYERS.overlays,
      }}
    >
      {/* Grid overlay */}
      {showGrid && <GridOverlay size={gridSize} zoom={zoom} />}

      {/* Hover highlight — only show when not dragging/resizing */}
      {shouldShowHover && hoveredElementId && canvasRef.current && (
        <ElementHoverOverlay
          composer={composer}
          elementId={hoveredElementId}
          cursorState={cursorState}
        />
      )}

      {/* Parent highlight (when hovering or selected) */}
      {canvasRef.current && selectedId && (
        <ParentHighlight
          composer={composer}
          childElementId={selectedId}
          canvasRef={canvasRef as React.RefObject<HTMLDivElement | null>}
        />
      )}

      {/* Marquee selection tool */}
      {marquee && <div className="aqb-canvas-marquee" style={getMarqueeStyles(marquee)} />}

      {/* Rulers and persistent guides */}
      {showRulers && canvasRef.current && (
        <RulersOverlay
          guides={rulerGuides}
          canvasSize={canvasSize}
          zoom={zoom}
          onAddGuide={addGuide}
          onUpdateGuide={updateGuide}
          onRemoveGuide={removeGuide}
        />
      )}

      {/* User-placed guides (from rulers) */}
      {showRulers && rulerGuides.length > 0 && (
        <GuidesOverlay guides={rulerGuides} canvasSize={canvasSize} />
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
      {selectedId && (
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
            onOpenImageEditor={onOpenImageEditor}
          />
          {selectedId && canvasRef.current && (
            <SelectionLabel
              composer={composer}
              elementId={selectedId}
              canvasRef={canvasRef as React.RefObject<HTMLDivElement | null>}
            />
          )}
          {selectedIds.length === 1 && !isResizing && canvasRef.current && (
            <UnifiedSelectionToolbar
              composer={composer}
              elementId={selectedId}
              canvasRef={canvasRef as React.RefObject<HTMLDivElement | null>}
              onSelectParent={onSelectParent}
              onSelectAncestor={onSelectAncestor}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onCopy={onCopy}
              onWrap={onWrap}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onUndo={onUndo}
              onClear={onClear}
            />
          )}
          {selectedIds.length > 1 && (
            <div style={alignmentToolbarStyles}>
              <AlignmentToolbar composer={composer} selectedIds={selectedIds} />
              <MultiSelectBadge count={selectedIds.length} />
            </div>
          )}
        </div>
      )}

      {/* Inline Text Editor */}
      {editing.id && (
        <RichTextEditor
          id={editing.id}
          composer={composer}
          initialValue={editing.content}
          onCommand={onInlineCommand}
        />
      )}

      {/* Drag & drop feedback (slot indicators, breadcrumb) */}
      {isDragOver && canvasRef.current && (
        <DropFeedbackOverlay
          composer={composer}
          dropTargetId={dropTargetId}
          dropPosition={dropPosition}
          isValid={isValidDrop}
          invalidReason={invalidDropReason}
          slotRect={dropSlotRect}
          breadcrumbPath={dropTargetPath}
        />
      )}

      {/* Canvas breadcrumb (bottom center) */}
      {!isDragOver && selectedId && !isResizing && (
        <CanvasBreadcrumb composer={composer} elementId={selectedId} onSelect={onSelectAncestor} />
      )}

      {/* Section reorder handles */}
      <SectionReorderHandles
        boundaries={sectionBoundaries}
        dragState={sectionDragState}
        hoveredBoundary={hoveredSectionBoundary}
        onStartDrag={onSectionStartDrag}
        onHoverBoundary={onSectionHoverBoundary}
      />

      {/* Remote cursors for collaboration */}
      <RemoteCursorsOverlay composer={composer} />
    </div>
  );
}
