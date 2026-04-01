/**
 * Canvas Element Drag Hook - Professional Drag & Drop System
 * Makes canvas elements draggable for re-parenting using event delegation
 *
 * Uses event delegation to attach handlers to the canvas container instead of
 * individual elements. This ensures drag handlers survive DOM recreation from
 * dangerouslySetInnerHTML (which happens on selection changes).
 *
 * Features:
 * - Alt+Drag: Clone/duplicate element instead of moving
 * - Smart guides during drag (snap lines)
 * - Touch support with long-press to initiate
 * - Multi-element drag for selected elements
 * - Auto-scroll when dragging near canvas edges
 * - Drop zone preview highlighting with validation
 * - Keyboard movement (Arrow keys: Up/Down = reorder, Left/Right = nesting)
 * - Enhanced drag ghost with element type label
 * - Modifier key support (Shift for larger steps, Ctrl for jumps)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { ElementType, GrapesElement } from "../../../shared/types";
import { setMultiDragData } from "../../../shared/utils/dragDrop";
import { useTouchDrag, useKeyboardMove } from "./drag";
import { useElementDragAutoScroll } from "./useElementDragAutoScroll";
import { useElementDragDomSync } from "./useElementDragDomSync";

/** Drag modifiers state */
interface DragModifiers {
  alt: boolean; // Clone mode
  shift: boolean; // Constrain axis
  ctrl: boolean; // Snap to grid
}

/** Axis constraint for shift+drag */
type AxisConstraint = "none" | "horizontal" | "vertical";

export interface UseCanvasElementDragOptions {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement>;
  showGuides?: boolean;
  onDraggingChange: (elementId: string | null) => void;
  onSnapLinesChange: (lines: import("./useCanvasSnapping").SnapLine[]) => void;
  snapCalculator?: (
    id: string,
    rect: { left: number; top: number; width: number; height: number },
    scale: number
  ) => { x: number; y: number; snapLines: import("./useCanvasSnapping").SnapLine[] };
  onDropTargetChange?: (targetId: string | null) => void;
}

export function useCanvasElementDrag({
  composer,
  canvasRef,
  showGuides = true,
  onDraggingChange,
  onSnapLinesChange,
  snapCalculator,
  onDropTargetChange,
}: UseCanvasElementDragOptions): void {
  // Track the currently dragging element for cleanup
  const draggingElementRef = React.useRef<HTMLElement | null>(null);
  const isDraggingRef = React.useRef(false);

  // Store current rootId in ref - updated on page changes (fixes stale rootId issue)
  const rootIdRef = React.useRef<string | null>(null);

  // Touch drag handling via dedicated hook
  const { touchHandlers } = useTouchDrag({
    composer,
    canvasRef,
    rootIdRef,
    showGuides,
    onDraggingChange,
    onSnapLinesChange,
  });

  // Keyboard movement handling via dedicated hook
  useKeyboardMove({
    composer,
    rootIdRef,
  });

  // Drag modifiers state (Alt, Shift, Ctrl)
  const modifiersRef = React.useRef<DragModifiers>({
    alt: false,
    shift: false,
    ctrl: false,
  });

  // Axis constraint for shift+drag
  const axisConstraintRef = React.useRef<AxisConstraint>("none");

  // Starting position for constraint calculation
  const dragStartPosRef = React.useRef<{ x: number; y: number } | null>(null);

  // Clone mode tracking (Alt+Drag)
  const isCloneModeRef = React.useRef(false);
  const clonedElementIdRef = React.useRef<string | null>(null);

  // Auto-scroll (extracted hook)
  const { startAutoScroll, stopAutoScroll } = useElementDragAutoScroll({ canvasRef });

  // Drop-target highlighting + MutationObserver (extracted hook)
  const { updateDropTarget, clearDropTarget } = useElementDragDomSync({
    composer,
    canvasRef,
    rootIdRef,
    isDraggingRef,
    draggingElementRef,
    onDropTargetChange,
  });

  // Throttle for drag calculations
  const lastDragCalcRef = React.useRef<number>(0);
  const DRAG_THROTTLE_MS = 50;

  // Track modifier keys globally (keydown/keyup events)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      modifiersRef.current = {
        alt: e.altKey,
        shift: e.shiftKey,
        ctrl: e.ctrlKey || e.metaKey,
      };
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      modifiersRef.current = {
        alt: e.altKey,
        shift: e.shiftKey,
        ctrl: e.ctrlKey || e.metaKey,
      };
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Use event delegation - attach to canvas container, not individual elements
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !composer) return;

    // Handle mousedown - prepare for potential drag
    const handleMouseDown = (e: MouseEvent) => {
      // Ignore if not left click
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      const draggableEl = target.closest("[data-aqb-id]") as HTMLElement | null;
      if (!draggableEl) return;

      const elementId = draggableEl.getAttribute("data-aqb-id");
      const rootId = rootIdRef.current;

      // Don't make root draggable
      if (!elementId || elementId === rootId) {
        draggableEl.draggable = false;
        return;
      }

      // Ensure element is draggable
      draggableEl.draggable = true;
      draggableEl.style.cursor = "grabbing";
    };

    // Reset cursor on mouseup
    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const draggableEl = target.closest("[data-aqb-id]") as HTMLElement | null;
      if (draggableEl && !isDraggingRef.current) {
        draggableEl.style.cursor = "grab";
      }
    };

    // Handle dragstart using event delegation
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      const draggableEl = target.closest("[data-aqb-id]") as HTMLElement | null;
      if (!draggableEl || !composer) return;

      let elementId = draggableEl.getAttribute("data-aqb-id");
      if (!elementId) return;

      const rootId = rootIdRef.current;

      // Don't allow dragging root element
      if (elementId === rootId) {
        e.preventDefault();
        return;
      }

      // Capture modifiers from event (more reliable at drag start)
      modifiersRef.current = {
        alt: e.altKey,
        shift: e.shiftKey,
        ctrl: e.ctrlKey || e.metaKey,
      };

      // Capture starting position for axis constraint
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      axisConstraintRef.current = "none";

      // Alt+Drag: Clone mode - duplicate the element and drag the clone
      if (modifiersRef.current.alt) {
        isCloneModeRef.current = true;

        composer.beginTransaction("clone-element");
        try {
          // Use duplicateElement which creates a clone as sibling
          const clonedEl = composer.elements.duplicateElement(elementId);
          if (clonedEl) {
            const clonedId = clonedEl.getId();
            clonedElementIdRef.current = clonedId;
            // Continue dragging with the cloned element
            elementId = clonedId;
            // Select the cloned element
            composer.selection.select(clonedEl);
          }
          composer.endTransaction();
        } catch {
          composer.rollbackTransaction();
          isCloneModeRef.current = false;
        }
      } else {
        isCloneModeRef.current = false;
        clonedElementIdRef.current = null;
      }

      // Check if multi-select drag
      const selectedIds = composer.selection.getSelectedIds();
      const isMultiDrag = selectedIds.length > 1 && selectedIds.includes(elementId);

      // Mark as dragging
      isDraggingRef.current = true;
      draggingElementRef.current = draggableEl;
      onDraggingChange(elementId);

      // Set drag data
      if (isMultiDrag && e.dataTransfer) {
        // Multi-select drag: use setMultiDragData
        const elements = selectedIds.map((id) => {
          const el = composer.elements.getElement(id);
          const parent = el?.getParent?.();
          const siblings = parent?.getChildren?.() || [];
          const index = siblings.findIndex((s: GrapesElement) => s.getId() === id);
          return {
            elementId: id,
            elementType: (el?.getType?.() || "default") as ElementType,
            originalParentId: parent?.getId?.(),
            originalIndex: index >= 0 ? index : undefined,
          };
        });
        setMultiDragData(e.dataTransfer, elements, { x: e.clientX, y: e.clientY });
      } else {
        // Single element drag
        e.dataTransfer?.setData("element", JSON.stringify({ elementId }));
      }
      e.dataTransfer!.effectAllowed = "move";

      // Create enhanced drag ghost with element type label
      const rect = draggableEl.getBoundingClientRect();
      const dragGhost = document.createElement("div");
      dragGhost.className = "aqb-drag-ghost";
      dragGhost.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: ${Math.min(rect.width, 300)}px;
        max-height: 200px;
        overflow: hidden;
        background: #1e1e2e;
        border: 2px solid #89b4fa;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(137, 180, 250, 0.3);
        pointer-events: none;
        z-index: 99999;
      `;

      // Clone content with reduced opacity
      const contentClone = draggableEl.cloneNode(true) as HTMLElement;
      contentClone.style.opacity = "0.9";
      contentClone.style.transform = "scale(0.95)";
      contentClone.style.transformOrigin = "top left";
      dragGhost.appendChild(contentClone);

      // Add element type label
      const sourceEl = composer.elements.getElement(elementId);
      const elementType = sourceEl?.getType?.() || "element";
      const label = document.createElement("div");
      label.style.cssText = `
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #89b4fa 0%, #b4befe 100%);
        color: #1e1e2e;
        padding: 2px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        white-space: nowrap;
      `;
      label.textContent = isCloneModeRef.current ? `+ ${elementType}` : elementType;
      dragGhost.appendChild(label);

      document.body.appendChild(dragGhost);
      e.dataTransfer?.setDragImage(
        dragGhost,
        Math.min(e.clientX - rect.left, 150),
        Math.min(e.clientY - rect.top, 100)
      );

      // Remove ghost after browser captures drag image
      // BUG-018 FIX: RAF was too fast - browser needs ~50ms to capture
      setTimeout(() => {
        dragGhost.remove();
      }, 50);

      // Visual feedback during drag
      draggableEl.style.opacity = "0.4";
      draggableEl.classList.add("aqb-dragging");

      // Clone mode visual feedback
      if (isCloneModeRef.current) {
        draggableEl.classList.add("aqb-clone-mode");
        // Set copy effect for cursor feedback
        e.dataTransfer!.effectAllowed = "copy";
      }

      // Notify DragManager SSOT (fires DRAG_START event)
      const startPos = { x: e.clientX, y: e.clientY };
      const dragData = isMultiDrag
        ? {
            type: "multi" as const,
            sessionId: "",
            startTime: Date.now(),
            startPosition: startPos,
            elements: selectedIds.map((id) => ({
              elementId: id,
              elementType: "default" as ElementType,
            })),
          }
        : {
            type: "element" as const,
            sessionId: "",
            startTime: Date.now(),
            startPosition: startPos,
            elementId,
            elementType: (sourceEl?.getType?.() || "default") as ElementType,
          };
      composer.drag?.start(dragData, "canvas", startPos);
    };

    // Handle dragend using event delegation
    const handleDragEnd = (e: DragEvent) => {
      isDraggingRef.current = false;

      const target = e.target as HTMLElement;
      const draggableEl = target.closest("[data-aqb-id]") as HTMLElement | null;

      // Clean up the element that was being dragged
      if (draggableEl) {
        draggableEl.style.opacity = "1";
        draggableEl.style.cursor = "grab";
        draggableEl.classList.remove("aqb-dragging");
        draggableEl.classList.remove("aqb-clone-mode");
      }

      // Also clean up via ref in case DOM was recreated during drag
      if (draggingElementRef.current && draggingElementRef.current !== draggableEl) {
        draggingElementRef.current.style.opacity = "1";
        draggingElementRef.current.style.cursor = "grab";
        draggingElementRef.current.classList.remove("aqb-dragging");
        draggingElementRef.current.classList.remove("aqb-clone-mode");
      }

      // Reset modifier state
      isCloneModeRef.current = false;
      clonedElementIdRef.current = null;
      axisConstraintRef.current = "none";
      dragStartPosRef.current = null;

      // Stop auto-scroll and clear drop target
      stopAutoScroll();
      clearDropTarget();

      draggingElementRef.current = null;
      onDraggingChange(null);
      onSnapLinesChange([]);
    };

    // Handle drag - calculate smart guides, auto-scroll, and drop target during movement
    const handleDrag = (e: DragEvent) => {
      if (!isDraggingRef.current) return;

      // Throttle drag calculations to avoid performance issues
      const now = Date.now();
      if (now - lastDragCalcRef.current < DRAG_THROTTLE_MS) return;
      lastDragCalcRef.current = now;

      const target = e.target as HTMLElement;
      const draggableEl = target.closest("[data-aqb-id]") as HTMLElement | null;
      if (!draggableEl) return;

      const elementId = draggableEl.getAttribute("data-aqb-id");
      if (!elementId) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Auto-scroll when near edges
      startAutoScroll(e.clientX, e.clientY);

      // Update drop target highlighting
      updateDropTarget(e.clientX, e.clientY, elementId);

      // Smart guides (only if enabled and canvasIndicators available)
      if (showGuides && composer?.canvasIndicators) {
        // Get element's current bounds relative to canvas
        const canvasRect = canvas.getBoundingClientRect();
        const elementRect = draggableEl.getBoundingClientRect();

        const draggedBounds = {
          x: elementRect.left - canvasRect.left,
          y: elementRect.top - canvasRect.top,
          width: elementRect.width,
          height: elementRect.height,
        };

        if (snapCalculator) {
          const snapResult = snapCalculator(
            elementId,
            {
              left: draggedBounds.x,
              top: draggedBounds.y,
              width: draggedBounds.width,
              height: draggedBounds.height,
            },
            1
          );

          if (snapResult.snapLines) {
            onSnapLinesChange(snapResult.snapLines);
          }
        } else {
          // Calculate smart guides
          const smartGuides = composer.canvasIndicators.calculateSmartGuides(
            elementId,
            draggedBounds
          );

          // Convert to snap lines format
          const snapLines = smartGuides.map((guide) => ({
            orientation: guide.axis,
            position: guide.position,
            start: -99999,
            end: 99999,
          }));

          onSnapLinesChange(snapLines);
        }
      }
    };

    // Attach event listeners to the canvas container (event delegation)
    canvas.addEventListener("mousedown", handleMouseDown, { capture: true });
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("dragstart", handleDragStart);
    canvas.addEventListener("drag", handleDrag);
    canvas.addEventListener("dragend", handleDragEnd);

    // Touch events for mobile/tablet support (via useTouchDrag hook)
    canvas.addEventListener("touchstart", touchHandlers.onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", touchHandlers.onTouchMove, { passive: false });
    canvas.addEventListener("touchend", touchHandlers.onTouchEnd);
    canvas.addEventListener("touchcancel", touchHandlers.onTouchCancel);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown, { capture: true });
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("dragstart", handleDragStart);
      canvas.removeEventListener("drag", handleDrag);
      canvas.removeEventListener("dragend", handleDragEnd);
      canvas.removeEventListener("touchstart", touchHandlers.onTouchStart);
      canvas.removeEventListener("touchmove", touchHandlers.onTouchMove);
      canvas.removeEventListener("touchend", touchHandlers.onTouchEnd);
      canvas.removeEventListener("touchcancel", touchHandlers.onTouchCancel);
    };
  }, [composer, canvasRef, showGuides, onDraggingChange, onSnapLinesChange, touchHandlers]);
}
