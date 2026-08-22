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
  // Match useCanvasGuides hook signatures (id-based, not index/Guide-based).
  // Drift fixed 2026-05-22 — interface previously claimed Guide/index-based
  // shapes that didn't match the hook OR what child overlays consumed.
  addGuide: (type: "horizontal" | "vertical", position: number) => void;
  updateGuide: (id: string, position: number) => void;
  removeGuide: (id: string) => void;

  // Selection
  selectedId: string | null;
  selectedIds: string[];
  onSelectParent: () => void;
  onSelectAncestor: (id: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  /**
   * Client view. Selection itself is harmless, but the chrome it draws is not:
   * the resize box and the unified toolbar carry Duplicate, Delete, Copy, Wrap
   * and Move. Withholding the canvas's own mutation handlers left this whole
   * layer reachable by a single click.
   */
  readOnly?: boolean;
  onCopy: () => void;
  onWrap: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUndo: () => void;
  onClear: () => void;

  // Hover
  shouldShowHover: boolean;
  hoveredElementId: string | null;
  /** Inspector mode forces full hover detail (drift-fix 2026-05-22 —
   *  Canvas was passing these but interface didn't declare them). */
  isInspectorEnabled?: boolean;
  /** Dev mode debug overlay flag — unused today but parent passes it. */
  devMode?: boolean;

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
  // Parent passes CanvasGuide[] (ruler-placed). The legacy SpacingIndicator[]
  // type here didn't match what GuideLines actually accepts — fixed 2026-05-22.
  guides: CanvasGuide[];
  snapLines: SnapLine[];

  // Indicators
  showSpacing: boolean;
  spacingIndicators: SpacingIndicator[];

  // Section Reordering — match useSectionReorder hook + SectionReorderHandles
  // child interface (drift fixed 2026-05-22).
  sectionBoundaries: SectionBoundary[];
  sectionDragState: SectionDragState | null;
  hoveredSectionBoundary: string | null;
  onSectionStartDrag: (sectionId: string, fromIndex: number) => void;
  onSectionUpdateDrag: (clientY: number) => void;
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
  readOnly = false,
  onCopy,
  onWrap,
  onMoveUp,
  onMoveDown,
  onUndo,
  onClear,
  shouldShowHover,
  hoveredElementId,
  isInspectorEnabled,
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
     
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: Z_LAYERS.selectionOutline,
      }}
    >
      {/* Grid overlay */}
      {showGrid && <GridOverlay gridSize={gridSize} />}

      {/* Hover highlight — only show when not dragging/resizing */}
      {shouldShowHover && hoveredElementId && canvasRef.current && (
        <ElementHoverOverlay
          hoveredElementId={hoveredElementId}
          canvasRef={canvasRef as React.RefObject<HTMLDivElement | null>}
          altHeld={cursorState?.altHeld}
          shiftHeld={cursorState?.shiftHeld}
          isCloneMode={cursorState?.ctrlHeld}
          inspectorEnabled={isInspectorEnabled}
        />
      )}

      {/* Redesign P2 (sev 2): the parent context lives in the bottom breadcrumb
          (Canvas › Container › …) + the toolbar's parent button + Alt+↑. The
          persistent blue parent-region highlight + "Parent: …" badge was a third,
          redundant chrome layer that re-cluttered the canvas on every select. */}

      {/* Marquee selection tool */}
      {marquee && <div style={getMarqueeStyles(marquee)} />}

      {/* Rulers and persistent guides */}
      {showRulers && canvasRef.current && (
        <RulersOverlay
          canvasSize={canvasSize}
          zoom={zoom}
          onCreateGuide={addGuide}
        />
      )}

      {/* User-placed guides (from rulers) */}
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

      {/* Selection overlays — every one of them is an edit affordance. */}
      {selectedId && !readOnly && (
        <div style={spotsOverlayStyles}>
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
          {/* Legacy label only when the unified toolbar is hidden (resize /
              multi-select) — both render at the same spot and the toolbar's
              backdrop blur smears the dark label pill underneath. */}
          {selectedId && canvasRef.current && (selectedIds.length !== 1 || isResizing) && (
            <SelectionLabel
              composer={composer}
              elementId={selectedId}
              canvasRef={canvasRef as React.RefObject<HTMLDivElement | null>}
              onSelectParent={onSelectParent}
              /* SelectionLabel's ancestor dropdown calls onAncestorClick and
                 nothing supplied it, so every row closed the dropdown and
                 selected nothing. The handler was already here — the two
                 siblings below take it as onSelectAncestor. */
              onAncestorClick={onSelectAncestor}
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
            />
          )}
          {selectedIds.length > 1 && (
            <div style={alignmentToolbarStyles}>
              <AlignmentToolbar composer={composer} selectedIds={selectedIds} />
              <MultiSelectBadge selectedIds={selectedIds} onClear={onClear} />
            </div>
          )}
        </div>
      )}

      {/* Inline Text Editor — board 1176:4824 floats the 18-control toolbar
          above the element being edited. The overlay host is
          pointer-events:none by design; without re-enabling here every
          control is mouse-transparent and clicks fall through to the canvas.
          The bd-inline-toolbar class is load-bearing: useCanvasInlineEdit's
          blur/click guards match on it to keep a toolbar click from ending
          the edit session. */}
      {editing.id && (
        <div
          className="bd-inline-toolbar"
          style={{
            position: "absolute",
            left: editing.rect ? Math.max(8, editing.rect.left) : 8,
            top: editing.rect ? Math.max(8, editing.rect.top - 52) : 8,
            zIndex: Z_LAYERS.floatingToolbar,
            pointerEvents: "auto",
          }}
          /* The standard rich-text toolbar pair. preventDefault on mousedown
             keeps focus — and the user's text selection — in the editing
             element while the button is pressed. stopPropagation on click
             keeps the click from bubbling into the canvas, whose handlers
             refocus the canvas wrapper; that focus steal blurred the editor
             with a relatedTarget outside this toolbar and ended the session
             after every command. */
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => e.stopPropagation()}
        >
          <RichTextEditor onCommand={onInlineCommand} />
        </div>
      )}

      {/* Drag & drop feedback (slot indicators, breadcrumb) */}
      {isDragOver && canvasRef.current && (
        <DropFeedbackOverlay
          isDragOver={isDragOver}
          dropTargetId={dropTargetId}
          dropPosition={dropPosition}
          isValidDrop={isValidDrop}
          invalidReason={invalidDropReason}
          canvasRef={canvasRef as React.RefObject<HTMLDivElement | null>}
          dropSlotRect={dropSlotRect}
          dropTargetPath={dropTargetPath}
        />
      )}

      {/* Canvas breadcrumb (bottom center) */}
      {!isDragOver && selectedId && !isResizing && (
        <CanvasBreadcrumb composer={composer} selectedId={selectedId} onSelectElement={onSelectAncestor} />
      )}

      {/* Section reorder handles */}
      <SectionReorderHandles
        boundaries={sectionBoundaries}
        dragState={sectionDragState}
        hoveredBoundary={hoveredSectionBoundary}
        onStartDrag={onSectionStartDrag}
        onUpdateDrag={onSectionUpdateDrag}
        onCompleteDrag={onSectionCompleteDrag}
        onCancelDrag={onSectionCancelDrag}
        onHoverBoundary={onSectionHoverBoundary}
      />

      {/* Remote cursors for collaboration */}
      <RemoteCursorsOverlay composer={composer} />
    </div>
  );
}
