/**
 * Aquibra Canvas
 * Main editing canvas with drag & drop support
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EVENTS } from "../../shared/constants/events";
import { useToast } from "../../shared/ui/Toast";
import { getElementId } from "../../shared/utils/dragDrop";
import type { CanvasProps, CanvasRef } from "./Canvas.types";
import { DEVICE_SIZES } from "./Canvas.types";
import { CanvasEmptyCTA } from "./CanvasEmptyCTA";
import { CanvasFooterToolbar } from "./CanvasFooterToolbar";
import {
  wrapperStyles,
  getCanvasStyles,
  contentStyles,
  footerToolbarContainerStyles,
} from "./canvasStyles";
import { CommandPalette, KeyboardCheatSheet, useKeyboardCheatSheet } from "./controls";
import { useInspectorMode } from "./controls/InspectorToggle";
import {
  useCanvasDragDrop,
  useCanvasInlineEdit,
  useCanvasElementDrag,
  useComposerSelection,
  useCanvasGuides,
  useCanvasSync,
  useCanvasIndicators,
  useCanvasMarquee,
  useCanvasKeyboard,
  useCanvasHover,
  useCanvasContent,
  useCanvasContextMenu,
  useCursorSync,
  useSelectionBehavior,
  useCursorIntelligence,
  useCanvasSnapping,
  useCanvasCommandPalette,
  useCanvasToolbarActions,
  useCanvasInlineCommands,
  useCanvasSize,
  useSelectionAnnouncement,
} from "./hooks";
import type { DropError, DropSuccess } from "./hooks/useCanvasDragDrop";
import { ElementContextMenu } from "./menus";
import { CanvasOverlayGroup } from "./overlays";
import "./Canvas.css";

export type { CanvasProps, CanvasRef };

// ============================================================================
// COMPONENT
// ============================================================================

export const Canvas = React.forwardRef<CanvasRef, CanvasProps>(
  (
    {
      composer,
      device,
      zoom,
      onAIRequest,
      showComponentView = false,
      showSpacing = false,
      showBadges = false,
      showGuides = true,
      showGrid = false,
      gridSize = 10,
      showOutlines = true,
      showRulers = false,
      showXRay = false,
      devMode = false,
      showFooterToolbar = true,
      onZoomChange,
      onOverlayChange,
    },
    ref
  ) => {
    const canvasRef = React.useRef<HTMLDivElement>(null);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    // Toast notifications for drop errors and success
    const { addToast } = useToast();
    const handleDropError = React.useCallback(
      (error: DropError) => {
        addToast({
          message: error.message,
          variant: "warning",
          duration: 3000,
        });
      },
      [addToast]
    );

    // GAP-FIX: Toast notification for successful element insertion
    const handleDropSuccess = React.useCallback(
      (success: DropSuccess) => {
        addToast({
          message: `Inserted: ${success.elementLabel}`,
          variant: "success",
          duration: 2000,
        });
      },
      [addToast]
    );

    // Core hooks
    const { content, syncFromComposer } = useCanvasSync({ composer });
    const { selectedId, selectedIds, select, clear } = useComposerSelection({ composer });

    // UI state hooks
    const { contextMenu, setContextMenu, menuData, closeContextMenu } = useCanvasContextMenu({
      composer,
      onAIRequest,
      addToast,
    });

    // Indicators and canvas size
    const { spacingIndicators, guides } = useCanvasIndicators({
      composer,
      selectedId,
      showSpacing,
      showBadges,
      showGuides,
      showGrid,
    });
    const { canvasSize } = useCanvasSize({ canvasRef, content, device, zoom });
    const [snapLines, setSnapLines] = React.useState<
      import("./hooks/useCanvasSnapping").SnapLine[]
    >([]);
    const [isResizing, setIsResizing] = React.useState(false);

    // Phase 6: Snapping Logic
    const { calculateSnapping } = useCanvasSnapping(composer);

    // Inline editing (must be before useSelectionBehavior since it needs editing.id)
    const { editing, handleDoubleClick } = useCanvasInlineEdit({ composer, canvasRef });

    // Selection behavior hook (click-through, additive, hit expansion)
    const { handleClick: handleSelectionClick } = useSelectionBehavior({
      composer,
      isEditing: Boolean(editing.id),
      onContextMenuClose: closeContextMenu,
    });

    // Inline editing commands (delegated to useCanvasInlineCommands)
    const { handleInlineCommand } = useCanvasInlineCommands({
      composer,
      canvasRef,
      editingId: editing.id,
    });

    // Drag and drop
    const {
      isDragOver,
      dropTargetId,
      dropPosition,
      draggingElementId,
      isValidDrop,
      invalidDropReason,
      dropSlotRect,
      dropTargetPath,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      setDraggingElementId,
    } = useCanvasDragDrop({
      composer,
      canvasRef,
      showGuides,
      isEditing: Boolean(editing.id),
      onSnapLinesChange: setSnapLines,
      onDropError: handleDropError,
      onDropSuccess: handleDropSuccess,
      snapCalculator: calculateSnapping,
    });

    useCanvasElementDrag({
      composer,
      canvasRef,
      showGuides,
      onDraggingChange: setDraggingElementId,
      onSnapLinesChange: setSnapLines,
      snapCalculator: calculateSnapping,
    });

    // Ruler guides
    const {
      guides: rulerGuides,
      addGuide,
      removeGuide,
      updateGuide,
    } = useCanvasGuides({ enabled: showRulers });

    // Hover, marquee, keyboard
    const { hoveredElementId, shouldShowHover, handleCanvasMouseMove, handleCanvasMouseLeave } =
      useCanvasHover({
        composer,
        selectedId,
        isDragOver,
        editingId: editing.id,
        draggingElementId,
        isResizing,
      });

    // Inspector mode (persistent toggle)
    const { isInspectorEnabled } = useInspectorMode();

    // Cursor intelligence - tracks modifier keys for smart hover display
    const { cursorState } = useCursorIntelligence({
      canvasRef,
      isDragging: Boolean(draggingElementId),
      isInvalidDrop: !isValidDrop && isDragOver,
      inspectorEnabled: isInspectorEnabled,
    });

    // Command palette + cheat sheet (delegated to hooks)
    const { isPaletteOpen, closePalette, openPalette, commands } = useCanvasCommandPalette({
      composer,
      selectedId,
      clear,
    });
    const {
      isOpen: isCheatSheetOpen,
      open: openCheatSheet,
      close: closeCheatSheet,
    } = useKeyboardCheatSheet();

    // Emit hover events for LayersPanel sync
    React.useEffect(() => {
      if (composer) {
        composer.emit(EVENTS.CANVAS_HOVER, { id: hoveredElementId });
      }
    }, [composer, hoveredElementId]);

    // Collaboration cursor sync
    const { handleMouseMove: handleCursorSync } = useCursorSync({
      composer,
      canvasRef,
    });

    const { marquee, handleMarqueeStart, handleMarqueeMove, handleMarqueeEnd } = useCanvasMarquee({
      composer,
      canvasRef,
      isEditing: Boolean(editing.id),
      isDragOver,
      draggingElementId,
      clear,
    });

    const { handleKeyDown } = useCanvasKeyboard({
      composer,
      selectedId,
      selectedIds,
      editingId: editing.id,
      select,
      clear,
      syncFromComposer,
      addToast,
      onOpenContextMenu: (elementId, position) => {
        // elementStack omitted: keyboard target is unambiguous (selectedId),
        // unlike right-click where multiple elements may overlap
        setContextMenu({ x: position.x, y: position.y, elementId });
      },
    });

    // Content with CMS bindings resolved — selection/drop highlighting handled by overlay layer
    const { displayContent } = useCanvasContent({ composer, content });

    // Empty canvas CTA overlay state
    const [emptyDismissed, setEmptyDismissed] = React.useState(false);
    React.useEffect(() => {
      if (content) setEmptyDismissed(false);
    }, [content]);
    const isCanvasEmpty = !content && !emptyDismissed;

    // Toolbar action callbacks (delegated to useCanvasToolbarActions)
    const {
      handleSelectParent,
      handleSelectAncestor,
      handleToolbarDuplicate,
      handleToolbarDelete,
      handleToolbarCopy,
      handleToolbarWrap,
      handleToolbarMoveUp,
      handleToolbarMoveDown,
      handleToolbarUndo,
    } = useCanvasToolbarActions({ composer, selectedId, addToast, select });

    // Expose ref methods
    React.useImperativeHandle(ref, () => ({
      undo: () => composer?.history.undo(),
      redo: () => composer?.history.redo(),
      canUndo: Boolean(composer?.history.canUndo?.()),
      canRedo: Boolean(composer?.history.canRedo?.()),
      getHTML: () =>
        composer?.exportHTML().combined || "<!DOCTYPE html><html><body>No content</body></html>",
      getCSS: () => composer?.styles.toCSS() || "/* No styles */",
      getContent: () => content,
      openCommandPalette: () => openPalette(),
    }));

    // Close context menu on selection change
    React.useEffect(() => {
      closeContextMenu();
    }, [selectedId, closeContextMenu]);

    // ── Aria-live selection announcements (WCAG 4.1.3) ──────────────────────
    const liveAnnouncement = useSelectionAnnouncement({ composer, selectedId, selectedIds });

    // Canvas click handler - wraps selection behavior with focus management
    const handleCanvasClick = React.useCallback(
      (e: React.MouseEvent) => {
        // Focus wrapper for keyboard events
        wrapperRef.current?.focus();
        // Delegate to selection behavior hook
        handleSelectionClick(e);
      },
      [handleSelectionClick]
    );

    // Context menu handler - includes element stack detection for "Select from stack" feature
    const handleContextMenu = React.useCallback(
      (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const editableEl = target.closest("[data-aqb-id]") as HTMLElement | null;
        if (!editableEl || !composer) {
          closeContextMenu();
          return;
        }
        e.preventDefault();
        const id = getElementId(editableEl);
        if (!id) return;
        const el = composer.elements.getElement(id);
        if (!el) return;
        select(el);

        // Detect all elements at this position for "Select from stack" feature
        const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
        const elementStack = elementsAtPoint
          .filter((elem) => elem.hasAttribute("data-aqb-id"))
          .map((elem) => elem.getAttribute("data-aqb-id")!)
          .filter(Boolean);

        setContextMenu({ x: e.clientX, y: e.clientY, elementId: id, elementStack });
      },
      [composer, select, closeContextMenu, setContextMenu]
    );

    const size = DEVICE_SIZES[device];
    const scale = zoom / 100;

    return (
      <div ref={wrapperRef} tabIndex={0} onKeyDown={handleKeyDown} style={wrapperStyles}>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleCanvasClick}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMarqueeStart}
          onMouseMove={(e) => {
            handleCanvasMouseMove(e);
            handleMarqueeMove(e);
            handleCursorSync(e);
          }}
          onMouseUp={handleMarqueeEnd}
          onMouseLeave={() => {
            handleCanvasMouseLeave();
            handleMarqueeEnd();
          }}
          style={getCanvasStyles(size, device, scale, isDragOver)}
        >
          {/* Canvas Content */}
          <div
            ref={canvasRef}
            className={`aqb-canvas${showComponentView ? " aqb-canvas--component-view" : ""}`}
            data-aqb-canvas="true"
            data-show-outlines={showOutlines ? "true" : undefined}
            data-xray-mode={showXRay ? "true" : undefined}
            data-badges={showBadges ? "true" : undefined}
            data-drag-active={isDragOver ? "true" : undefined}
            data-invalid-drop={isDragOver && !isValidDrop ? "true" : undefined}
            style={contentStyles}
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />

          {isCanvasEmpty && (
            <CanvasEmptyCTA
              onBrowseTemplates={() => composer?.emit("ui:browse-templates", {})}
              onStartBlank={() => setEmptyDismissed(true)}
            />
          )}

          {/* All overlays delegated to CanvasOverlayGroup */}
          <CanvasOverlayGroup
            composer={composer}
            canvasRef={canvasRef}
            showGrid={showGrid}
            gridSize={gridSize}
            showRulers={showRulers}
            zoom={zoom}
            canvasSize={canvasSize}
            rulerGuides={rulerGuides}
            addGuide={addGuide}
            updateGuide={updateGuide}
            removeGuide={removeGuide}
            showGuides={showGuides}
            guides={guides}
            snapLines={snapLines}
            selectedId={selectedId}
            selectedIds={selectedIds}
            isResizing={isResizing}
            setIsResizing={setIsResizing}
            showSpacing={showSpacing}
            spacingIndicators={spacingIndicators}
            onSelectParent={handleSelectParent}
            onSelectAncestor={handleSelectAncestor}
            onDuplicate={handleToolbarDuplicate}
            onDelete={handleToolbarDelete}
            onCopy={handleToolbarCopy}
            onWrap={handleToolbarWrap}
            onMoveUp={handleToolbarMoveUp}
            onMoveDown={handleToolbarMoveDown}
            onUndo={handleToolbarUndo}
            onClear={clear}
            shouldShowHover={shouldShowHover}
            hoveredElementId={hoveredElementId}
            cursorState={cursorState}
            isInspectorEnabled={isInspectorEnabled}
            devMode={devMode}
            isDragOver={isDragOver}
            dropTargetId={dropTargetId}
            dropPosition={dropPosition}
            isValidDrop={isValidDrop}
            invalidDropReason={invalidDropReason}
            dropSlotRect={dropSlotRect}
            dropTargetPath={dropTargetPath}
            marquee={marquee}
            editing={editing}
            onInlineCommand={handleInlineCommand}
          />
        </div>

        {/* Canvas Footer Toolbar - Overlays & Zoom (IA Redesign 2026) */}
        {showFooterToolbar && onZoomChange && onOverlayChange && (
          <div style={footerToolbarContainerStyles}>
            <CanvasFooterToolbar
              overlays={{
                guides: showGuides,
                spacing: showSpacing,
                grid: showGrid,
                badges: showBadges,
                xray: showXRay,
              }}
              zoom={zoom}
              onOverlayChange={onOverlayChange}
              onZoomChange={onZoomChange}
              onHelpClick={openCheatSheet}
            />
          </div>
        )}

        {contextMenu && menuData && (
          <ElementContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            actions={menuData.actions}
            context={menuData.context}
            onClose={closeContextMenu}
          />
        )}

        {/* Command Palette (Cmd+Shift+P) */}
        <CommandPalette
          isOpen={isPaletteOpen}
          onClose={closePalette}
          commands={commands}
          selectedId={selectedId}
        />

        {/* Keyboard Cheat Sheet ('?' key) */}
        <KeyboardCheatSheet isOpen={isCheatSheetOpen} onClose={closeCheatSheet} />

        {/* Aria-live region for selection announcements (WCAG 4.1.3 — always in DOM) */}
        <div aria-live="polite" aria-atomic="true" className="aqb-sr-only">
          {liveAnnouncement}
        </div>
      </div>
    );
  }
);

Canvas.displayName = "Canvas";
export default Canvas;
