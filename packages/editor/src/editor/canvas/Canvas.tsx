/**
 * Aquibra Canvas
 * Main editing canvas with drag & drop support
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EVENTS } from "../../shared/constants/events";
import { THRESHOLDS } from "../../shared/constants";
import { useToast } from "@/editor/chrome-ui";
import { getElementId } from "../../shared/utils/dragDrop";
import type { CanvasProps, CanvasRef } from "./Canvas.types";
import { DEVICE_SIZES } from "./Canvas.types";
import { CanvasEmptyCTA } from "./CanvasEmptyCTA";
import { CanvasLoadingSkeleton } from "./CanvasLoadingSkeleton";
import { useProjectLoading } from "../shell/hooks/useProjectLoading";
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
import { keyframesStyleSheet } from "@/shared/constants/animationKeyframes";
import { useGlobalCustomCss } from "./hooks/useGlobalCustomCss";
import { ElementContextMenu } from "./menus";
import { CanvasOverlayGroup } from "./overlays";
import { CommentLayer } from "./comments/CommentLayer";
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
      inspectorOpen,
      onToggleInspector,
      onAIRequest,
      showComponentView = false,
      showSpacing = false,
      showBadges = false,
      showGuides = true,
      showGrid = false,
      gridSize = 10,
      // Redesign P2 (sev 3): resting canvas must read as the rendered page, not a
      // blueprint. Per-element dashed outlines stay OFF by default — the single
      // ElementHoverOverlay (hover) + selection outline give the affordance, and
      // X-ray mode (showXRay) is the opt-in for the full-structure view.
      showOutlines = false,
      showRulers = false,
      showXRay = false,
      devMode = false,
      showFooterToolbar = true,
      readOnly = false,
      onZoomChange,
      onOverlayChange,
      onDeviceChange,
      canUndo,
      canRedo,
    },
    ref
  ) => {
    const canvasRef = React.useRef<HTMLDivElement>(null);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    /* The scrolling viewport, one level inside the wrapper. Zoom-to-fit and
       zoom-to-selection measure against THIS box — the wrapper carries the
       padding and the pinned toolbar, and is not what the canvas scrolls in. */
    const scrollRef = React.useRef<HTMLDivElement>(null);
    /* Declared here, not beside the JSX: the zoom-footprint layout effect below
       lists it as a dependency, and a `const` read before its own declaration
       is a temporal-dead-zone throw at render time, not a lint nit. */
    const scale = zoom / 100;
    /* The element getCanvasStyles styles — the one carrying `transform: scale`.
       `canvasRef` is its CHILD (the content div that receives customer HTML),
       so zoom compensation applied there styles the wrong box. */
    const frameRef = React.useRef<HTMLDivElement>(null);

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

    /* Announced, not toasted.
       Every successful drop raised a toast — "Inserted: Heading" — and building
       a page of thirty elements meant thirty of them stacking over the canvas.
       It also said nothing the canvas had not already said louder: the element
       appears, `animateDropSuccess` flashes it, and it is auto-selected, which
       moves the inspector.

       Deleting it outright would have taken the one channel that DID reach a
       screen reader, since the toast viewport is the editor's `role="status"`
       region. So the message survives in a visually-hidden live region and the
       visual noise goes. Walked live 2026-08-24: one routine drop, one toast. */
    const [announcement, setAnnouncement] = React.useState({ text: "", seq: 0 });
    const announce = React.useCallback((text: string) => {
      /* The seq is load-bearing. A plain string skips the DOM mutation when the
         same message repeats — drop a Heading, drop another Heading, and a
         screen reader hears the first one only. `aria-atomic` does not help;
         it governs how much is read once something changes, not whether
         anything changed. The span is keyed on seq, so an identical message
         still remounts. (Codex review, 2026-08-24.) */
      setAnnouncement((a) => ({ text, seq: a.seq + 1 }));
    }, []);

    const handleDropSuccess = React.useCallback(
      (success: DropSuccess) => {
        announce(`Inserted: ${success.elementLabel}`);
        /* An async drop is PROGRESS, not completion — an OS image drop reports
           "Uploading file.png..." before the upload finishes. Removing its
           visible signal made a slow upload look like an ignored drop, which
           invites a second attempt and makes the eventual error read as
           spurious. Completion stays silent; work-in-flight does not. */
        if (success.pending) {
          addToast({ description: success.elementLabel, tone: "info", duration: 4000 });
        }
      },
      [announce, addToast]
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

    // Live global custom CSS (Settings → Advanced) injected into the canvas.
    const globalCustomCss = useGlobalCustomCss(composer);

    // Zoom to fit: scale so the whole page fits the canvas viewport. The zoom
    // transform sits on the canvas content's parent, so canvasRef.offsetWidth is
    // the unscaled device width — measure against the wrapper's client box.
    const handleFitToScreen = React.useCallback(() => {
      const content = canvasRef.current;
      const viewport = scrollRef.current;
      if (!content || !viewport || !composer) return;
      const cw = content.offsetWidth;
      const ch = content.offsetHeight;
      if (!cw || !ch) return;
      const vw = viewport.clientWidth - 64; // breathing room
      const vh = viewport.clientHeight - 64;
      if (vw <= 0 || vh <= 0) return;
      const scale = Math.min(vw / cw, vh / ch);
      const clamped = Math.max(0.1, Math.min(5, scale));
      /* PERCENT, not a fraction. `setZoom` clamps to THRESHOLDS.ZOOM_MIN/MAX,
         which are 10 and 500, and every readout renders `{Math.round(zoom)}%`.
         This sent `clamped * 100 / 100` — 0.85 for an 85% fit — which clamped
         straight to 10, so Fit to screen snapped the canvas to 10% instead of
         fitting it. */
      composer.setZoom(Math.round(clamped * 100));
    }, [composer]);

    /* Board 817:4723's second flyout row. Fit answers "show me the page";
       this answers "show me the thing I am working on", which on a long page
       is the question people actually have. Measured off the selected
       element's own box, since that is the only thing that knows its size. */
    const handleZoomToSelection = React.useCallback(() => {
      const viewport = scrollRef.current;
      const id = composer?.selection?.getSelected?.()?.getId?.();
      if (!viewport || !id || !composer) return;
      const el = canvasRef.current?.querySelector(`[data-buildrick-id="${id}"]`);
      if (!(el instanceof HTMLElement)) return;
      const currentScale = (zoom || 100) / 100;
      /* offsetWidth is post-transform-free; getBoundingClientRect is not, so
         divide out the zoom already applied or the second press halves it. */
      const rect = el.getBoundingClientRect();
      const w = rect.width / currentScale;
      const h = rect.height / currentScale;
      if (!w || !h) return;
      const vw = viewport.clientWidth - 64;
      const vh = viewport.clientHeight - 64;
      if (vw <= 0 || vh <= 0) return;
      const scale = Math.min(vw / w, vh / h);
      composer.setZoom(Math.round(Math.max(0.1, Math.min(4, scale)) * 100));
      el.scrollIntoView({ block: "center", inline: "center" });
    }, [composer, zoom]);

    /* Make the canvas's LAYOUT footprint match what it paints when zoomed.
       `transform: scale()` runs after layout, so the box keeps its full size
       and the scroller sees overflow that is not there — at 50% the page sat
       off-centre with ~312px of scroll over empty grey. With
       `transform-origin: top left` (canvasStyles) the paint starts at the box's
       own origin, so trimming the scaled-away remainder off the right and
       bottom edges lines footprint up with paint. offsetWidth/offsetHeight are
       pre-transform, which is exactly the number needed. */
    React.useLayoutEffect(() => {
      const el = frameRef.current;
      if (!el) return;
      if (scale >= 1) {
        el.style.marginRight = "";
        el.style.marginBottom = "";
        return;
      }
      el.style.marginRight = `${-el.offsetWidth * (1 - scale)}px`;
      el.style.marginBottom = `${-el.offsetHeight * (1 - scale)}px`;
    }, [scale, device, canvasSize.width, canvasSize.height]);

    React.useEffect(() => {
      if (!composer) return;
      const handler = () => handleFitToScreen();
      composer.on(EVENTS.ZOOM_FIT, handler);
      return () => {
        composer.off(EVENTS.ZOOM_FIT, handler);
      };
    }, [composer, handleFitToScreen]);

    React.useEffect(() => {
      if (!composer) return;
      const handler = () => handleZoomToSelection();
      composer.on(EVENTS.ZOOM_SELECTION, handler);
      return () => {
        composer.off(EVENTS.ZOOM_SELECTION, handler);
      };
    }, [composer, handleZoomToSelection]);

    /* React state and composer state each hold a zoom, and only some paths
       wrote both. The canvas paints from the PROP (zoom / 100), while
       `EVENTS.ZOOM_IN` above steps from `composer.getState().zoom` — so after
       a chord that moved only React state, the flyout's Zoom In computed from
       a stale percent and the canvas jumped. Push the prop down whenever they
       disagree; `setZoom` no-ops when the value already matches, and the
       VIEWPORT_ZOOM listener that feeds React back is equally idempotent, so
       this settles rather than ping-pongs. */
    React.useEffect(() => {
      if (!composer) return;
      if (Math.round(composer.getState().zoom) !== Math.round(zoom)) composer.setZoom(zoom);
    }, [composer, zoom]);

    /* ZOOM_IN / ZOOM_OUT had no listener anywhere. BOTH command palettes emit
       them — the shell's ⌘K (CommandPalette.tsx:125,132) and the canvas's own
       ⌘⇧P (useCanvasCommandPalette.ts:113,121) — so "Zoom in" was a command you
       could find, read and run, and nothing moved. Steps by THRESHOLDS.ZOOM_STEP
       on the same percent scale ZoomControls uses. */
    React.useEffect(() => {
      if (!composer) return;
      const step = (delta: number) => () => {
        composer.setZoom(composer.getState().zoom + delta);
      };
      const zoomIn = step(THRESHOLDS.ZOOM_STEP);
      const zoomOut = step(-THRESHOLDS.ZOOM_STEP);
      composer.on(EVENTS.ZOOM_IN, zoomIn);
      composer.on(EVENTS.ZOOM_OUT, zoomOut);
      return () => {
        composer.off(EVENTS.ZOOM_IN, zoomIn);
        composer.off(EVENTS.ZOOM_OUT, zoomOut);
      };
    }, [composer]);

    // Command palette + cheat sheet (delegated to hooks)
    const { isPaletteOpen, closePalette, commands } = useCanvasCommandPalette({
      composer,
      selectedId,
      clear,
      readOnly,
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

    /* Empty-canvas CTA overlay state. This was `emptyDismissed`, and Start
       blank was the only thing that set it — so the button's whole effect was
       to hide the guidance. Board 807:6558 keeps the CTA on an empty page and
       changes what it says, so the flag now records that the user chose the
       blank route, and the page's own emptiness still decides whether the
       overlay shows at all. */
    const [startedBlank, setStartedBlank] = React.useState(false);
    /* A site the server says is gone gets no invitation to start work. The
       banner above the canvas explains it; this half was still offering
       "Browse templates" and "Start blank" over a project whose every save is
       refused. */
    const [projectUnavailable, setProjectUnavailable] = React.useState(false);
    React.useEffect(() => {
      if (!composer) return;
      const onGone = () => setProjectUnavailable(true);
      composer.on(EVENTS.PROJECT_UNAVAILABLE, onGone);
      return () => {
        composer.off(EVENTS.PROJECT_UNAVAILABLE, onGone);
      };
    }, [composer]);
    /* A page that received content is no longer mid-first-run, so emptying it
       again offers the two routes rather than the follow-up sentence. */
    React.useEffect(() => {
      if (content) setStartedBlank(false);
    }, [content]);

    /* An empty canvas means one of two things and they are opposites: this
       project has nothing in it, or this project has not arrived yet. Board
       65:412 draws the second one. Offering "Start building · Browse
       templates" during a load invites the user to build over the site that
       is seconds from landing. */
    const projectLoading = useProjectLoading(composer);
    /* "Empty" is a page with nothing ON it, not an empty HTML string. Every
       page owns a root container, so `content` is never falsy once one
       exists — which meant this CTA rendered for a single frame at boot and
       then never again. Board 65:2 is a state no user could reach. Keyed on
       `content` because that string changes on every canvas sync, which is
       exactly when the child count can have moved. */
    const pageIsEmpty = React.useMemo(() => {
      /* getActivePage() hands back PageData — a stored snapshot whose
         `root.children` is NOT maintained as elements are added (it read
         empty with a section on the page). The live tree is the Element
         instances, so resolve the root id through the manager. */
      const rootId = composer?.elements?.getActivePage?.()?.root?.id;
      const rootEl = rootId ? composer?.elements?.getElement?.(rootId) : null;
      return !!rootEl && rootEl.getChildren().length === 0;
    }, [composer, content]);
    const isCanvasEmpty = pageIsEmpty && !projectLoading && !projectUnavailable;
    const showLoadingCanvas = pageIsEmpty && projectLoading;

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
    }));

    // Close context menu on selection change — but NOT when the selection
    // change was caused by opening this very menu. Right-clicking an unselected
    // element calls select() (changing selectedId) in the same commit as
    // setContextMenu, so an unguarded close would dismiss the menu the instant
    // it opens (it only survived on already-selected elements).
    React.useEffect(() => {
      if (contextMenu && contextMenu.elementId === selectedId) return;
      closeContextMenu();
    }, [selectedId, closeContextMenu, contextMenu]);

    // ── Aria-live selection announcements (WCAG 4.1.3) ──────────────────────
    const liveAnnouncement = useSelectionAnnouncement({ composer, selectedId, selectedIds });
    /* Selection speaks through the same single region. The hook still suppresses
       a repeat of its OWN message — select two headings in a row and it emits
       nothing the second time — which is its own pre-existing gap, recorded in
       the U2 walk rather than widened into this change. */
    React.useEffect(() => {
      if (liveAnnouncement) announce(liveAnnouncement);
    }, [liveAnnouncement, announce]);

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

    /* readOnly withholds every handler that can change the document — inline
       edit, drop, the context menu and the keyboard (Delete, ⌘Z, ⌘D). Click and
       mouse-move stay: selection changes nothing when there is no inspector to
       drive, and comment pinning needs the pointer. */
    return (
      <div ref={wrapperRef} tabIndex={0} onKeyDown={readOnly ? undefined : handleKeyDown} style={wrapperStyles}>
        <div ref={scrollRef} className="bd-canvas-scroll">
        <DeviceFramePreview device={device} active={deviceFrameActive}>
        <div
          onDragOver={readOnly ? undefined : handleDragOver}
          onDragLeave={readOnly ? undefined : handleDragLeave}
          onDrop={readOnly ? undefined : handleDrop}
          onClick={handleCanvasClick}
          onDoubleClick={readOnly ? undefined : handleDoubleClick}
          onContextMenu={readOnly ? undefined : handleContextMenu}
          onMouseDown={readOnly ? undefined : handleMarqueeStart}
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
          ref={frameRef}
          /* Pick mode's crosshair cannot be an inline style on this frame.
             `cursor` inherits, and an inherited value loses to any declaration
             that matches the element itself — and Canvas.css matches every one
             of them: `[data-buildrick-id]:hover { cursor: move }`. So the
             crosshair showed over the empty gutter and nowhere else, which is
             the one part of the canvas with nothing to pick. The attribute
             hands it to a rule that reaches the subtree instead. */
          data-bk-pick={pickMode ? "true" : undefined}
          style={getCanvasStyles(size, device, scale, isDragOver)}
        >
          {/* Element animations resolve against these. The canvas had none
              after animation-utils.css was deleted with the vibcoder bundle,
              so every `animation: bd-anim-*` set through the inspector did
              nothing until publish. */}
          <style>{keyframesStyleSheet()}</style>

          {/* User's global custom CSS — applied live on the canvas. */}
          {globalCustomCss ? <style>{globalCustomCss}</style> : null}

          {/* Canvas Content */}
          <div
            ref={canvasRef}
            className={`buildrick-canvas${showComponentView ? " bd-canvas--component-view" : ""}`}
            data-buildrick-canvas="true"
            // Conformance anchor, deliberately separate from the engine markers
            // above. `data-buildrick-canvas` and `.buildrick-canvas` are queried
            // by engine and overlay code; this one is owned by the measurement
            // harness. Sharing a hook between the two would mean an engine
            // refactor silently unhooks conformance.
            data-testid="canvas"
            data-device={device}
            data-show-outlines={showOutlines ? "true" : undefined}
            data-xray-mode={showXRay ? "true" : undefined}
            data-badges={showBadges ? "true" : undefined}
            data-drag-active={isDragOver ? "true" : undefined}
            data-invalid-drop={isDragOver && !isValidDrop ? "true" : undefined}
            style={contentStyles}
            dangerouslySetInnerHTML={canvasInnerHtml}
          />

          {showLoadingCanvas && <CanvasLoadingSkeleton />}

          {/* "Start with a template, or drop your first section" with Browse
             templates / Start blank — build CTAs, and Browse templates emits an
             event whose drawer is not mounted in view mode, so it is a dead
             door as well as a wrong one. The container placeholder next to it
             was already suppressed; this larger one was missed.

             Start blank goes to board 807:6558: the Insert drawer opens, and
             the sentence becomes the next instruction. It used to only set a
             flag that hid the whole CTA, so the one button a first-time user
             pressed left them on an empty canvas with no drawer and nothing to
             do. `ui:switch-tab` is the seam StudioPanels already listens on,
             and it opens the panel when it is closed. */}
          {isCanvasEmpty && !readOnly && (
            <CanvasEmptyCTA
              started={startedBlank}
              onBrowseTemplates={() => composer?.emit("ui:browse-templates", {})}
              onStartBlank={() => {
                setStartedBlank(true);
                composer?.emit("ui:switch-tab", { tab: "add" });
              }}
            />
          )}

          {/* All overlays delegated to CanvasOverlayGroup */}
          <CanvasOverlayGroup
            readOnly={readOnly}
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

          {/* S5 shell state 6 — comment pins + click-to-pin + orphan recovery */}
          <CommentLayer composer={composer} canvasRef={canvasRef} />
        </div>
        </DeviceFramePreview>
        </div>

        {/* Canvas Footer Toolbar - Overlays & Zoom (IA Redesign 2026) */}
        {showFooterToolbar && onZoomChange && onOverlayChange && (
          <div style={footerToolbarContainerStyles}>
            <CanvasFooterToolbar
              overlays={{
                guides: showGuides,
                spacing: showSpacing,
                grid: showGrid,
                rulers: showRulers,
                badges: showBadges,
                xray: showXRay,
              }}
              zoom={zoom}
              onOverlayChange={onOverlayChange}
              onZoomChange={onZoomChange}
              onFitToScreen={handleFitToScreen}
              onZoomToSelection={handleZoomToSelection}
              onHelpClick={openCheatSheet}
              inspectorOpen={inspectorOpen}
              onToggleInspector={onToggleInspector}
              device={device === "watch" ? "mobile" : device}
              onDeviceChange={onDeviceChange}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={composer ? () => composer.history.undo() : undefined}
              onRedo={composer ? () => composer.history.redo() : undefined}
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

        {/* ONE polite region for the canvas, not two. A successful drop selects
            the new element and then reports the insert, so a second region meant
            two polite updates from one action — and AT that coalesces them can
            drop whichever it likes, which would have quietly thrown away the
            channel the toast removal was trying to preserve. Selection and
            insertion now queue through the same voice. (Codex review.) */}
        <div aria-live="polite" aria-atomic="true" className="bd-sr-only">
          <span key={announcement.seq}>{announcement.text}</span>
        </div>
      </div>
    );
  }
);

Canvas.displayName = "Canvas";
export default Canvas;
