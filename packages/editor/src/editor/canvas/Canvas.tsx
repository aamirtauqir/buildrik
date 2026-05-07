/**
 * Aquibra Canvas
 * Main editing canvas with drag & drop support
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EVENTS } from "../../shared/constants/events";
import { useToast } from "@/editor/shared/vibcoder";
import { getElementId } from "../../shared/utils/dragDrop";
import type { CanvasProps, CanvasRef } from "./Canvas.types";
import { DEVICE_SIZES } from "./Canvas.types";
import { CanvasEmptyCTA } from "./CanvasEmptyCTA";
import { CanvasFooterToolbar } from "./CanvasFooterToolbar";
import { DeviceFramePreview, DeviceFrameToggle } from "./DeviceFramePreview";
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
  useSectionReorder,
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
          description: error.message,
          tone: "warning",
          duration: 3000,
        });
      },
      [addToast]
    );

    // GAP-FIX: Toast notification for successful element insertion
    const handleDropSuccess = React.useCallback(
      (success: DropSuccess) => {
        addToast({
          description: `Inserted: ${success.elementLabel}`,
          tone: "success",
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

    // Inspector pick mode — subscribe to inspector:pick-start/cancel events
    // emitted by the ProInspector Crosshair button. While active, next canvas
    // click resolves the element under cursor and selects it instead of
    // running normal selection behavior. Escape key cancels.
    const [pickMode, setPickMode] = React.useState(false);
    React.useEffect(() => {
      if (!composer) return;
      const start = () => setPickMode(true);
      const cancel = () => setPickMode(false);
      composer.on("inspector:pick-start", start);
      composer.on("inspector:pick-cancel", cancel);
      return () => {
        composer.off("inspector:pick-start", start);
        composer.off("inspector:pick-cancel", cancel);
      };
    }, [composer]);
    React.useEffect(() => {
      if (!pickMode) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setPickMode(false);
          composer?.emit("inspector:pick-cancel");
        }
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [pickMode, composer]);

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

    // Device frame preview toggle
    const [deviceFrameActive, setDeviceFrameActive] = React.useState(false);

    // Section reorder
    const {
      boundaries: sectionBoundaries,
      dragState: sectionDragState,
      hoveredBoundary: hoveredSectionBoundary,
      startDrag: sectionStartDrag,
      updateDrag: sectionUpdateDrag,
      completeDrag: sectionCompleteDrag,
      cancelDrag: sectionCancelDrag,
      setHoveredBoundary: setSectionHoveredBoundary,
    } = useSectionReorder({ composer, canvasRef });

    // Content with CMS bindings resolved — selection/drop highlighting handled by overlay layer
    const { displayContent } = useCanvasContent({ composer, content });

    // Memoize the inner-HTML prop object so its reference is stable across
    // renders when `displayContent` hasn't actually changed. Without this,
    // React's DOM reconciler sees a new object on every render and rewrites
    // `canvas.innerHTML` from scratch on unrelated state updates like
    // `setIsDragOver`. That wipe detaches the DOM node the user is currently
    // dragging over, so the subsequent `drop` event fires on an orphaned node
    // and the React handler never runs. It also thrashes layout 60+ times/sec
    // during drag (measurable performance bottleneck).
    //
    // displayContent is produced by useCanvasContent which resolves CMS bindings
    // from composer element tree HTML — already the sanitized editor source.
    const canvasInnerHtml = React.useMemo(() => ({ __html: displayContent }), [displayContent]);

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

    // Canvas click handler - wraps selection behavior with focus management.
    // If inspector pick mode is active, intercept: resolve target element id
    // from the nearest [data-buildrick-id] ancestor, select it via composer,
    // emit inspector:pick-result, exit pick mode, and skip the normal
    // click-through/additive selection path.
    const handleCanvasClick = React.useCallback(
      (e: React.MouseEvent) => {
        wrapperRef.current?.focus();
        if (pickMode && composer) {
          const target = (e.target as HTMLElement).closest("[data-buildrick-id]") as HTMLElement | null;
          const id = target?.getAttribute("data-buildrick-id") ?? null;
          if (id) {
            const el = composer.elements.getElement(id);
            if (el) composer.selection.select(el);
          }
          composer.emit("inspector:pick-result", id);
          setPickMode(false);
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        handleSelectionClick(e);
      },
      [handleSelectionClick, pickMode, composer]
    );

    // Context menu handler - includes element stack detection for "Select from stack" feature
    const handleContextMenu = React.useCallback(
      (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const editableEl = target.closest("[data-buildrick-id]") as HTMLElement | null;
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
          .filter((elem) => elem.hasAttribute("data-buildrick-id"))
          .map((elem) => elem.getAttribute("data-buildrick-id")!)
          .filter(Boolean);

        setContextMenu({ x: e.clientX, y: e.clientY, elementId: id, elementStack });
      },
      [composer, select, closeContextMenu, setContextMenu]
    );

    const size = DEVICE_SIZES[device];
    const scale = zoom / 100;

    return (
      <div ref={wrapperRef} tabIndex={0} onKeyDown={handleKeyDown} style={wrapperStyles}>
        <DeviceFramePreview device={device} active={deviceFrameActive}>
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
          style={{
            ...getCanvasStyles(size, device, scale, isDragOver),
            ...(pickMode ? { cursor: "crosshair" } : {}),
          }}
        >
          {/* Canvas Content */}
          <div
            ref={canvasRef}
            className={`buildrick-canvas${showComponentView ? " buildrick-canvas--component-view" : ""}`}
            data-buildrick-canvas="true"
            data-show-outlines={showOutlines ? "true" : undefined}
            data-xray-mode={showXRay ? "true" : undefined}
            data-badges={showBadges ? "true" : undefined}
            data-drag-active={isDragOver ? "true" : undefined}
            data-invalid-drop={isDragOver && !isValidDrop ? "true" : undefined}
            style={contentStyles}
            dangerouslySetInnerHTML={canvasInnerHtml}
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
            sectionBoundaries={sectionBoundaries}
            sectionDragState={sectionDragState}
            hoveredSectionBoundary={hoveredSectionBoundary}
            onSectionStartDrag={sectionStartDrag}
            onSectionUpdateDrag={sectionUpdateDrag}
            onSectionCompleteDrag={sectionCompleteDrag}
            onSectionCancelDrag={sectionCancelDrag}
            onSectionHoverBoundary={setSectionHoveredBoundary}
            marquee={marquee}
            editing={editing}
            onInlineCommand={handleInlineCommand}
          />
        </div>
        </DeviceFramePreview>

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
            <DeviceFrameToggle
              active={deviceFrameActive}
              onToggle={() => setDeviceFrameActive((v) => !v)}
              device={device}
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
        <div aria-live="polite" aria-atomic="true" className="bd-sr-only">
          {liveAnnouncement}
        </div>
      </div>
    );
  }
);

Canvas.displayName = "Canvas";
export default Canvas;
