/**
 * Element Drag DOM Sync Hook
 * Handles drop-target highlighting and MutationObserver for draggable attribute sync.
 *
 * Extracted from useCanvasElementDrag.ts for file size compliance (500-line limit).
 *
 * @module components/Canvas/hooks/useElementDragDomSync
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import type { ElementType } from "../../../shared/types";
import { canNestElement } from "../../../shared/utils/nesting";

// =============================================================================
// TYPES
// =============================================================================

export interface UseElementDragDomSyncOptions {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement>;
  rootIdRef: React.MutableRefObject<string | null>;
  isDraggingRef: React.MutableRefObject<boolean>;
  draggingElementRef: React.MutableRefObject<HTMLElement | null>;
  onDropTargetChange?: (targetId: string | null) => void;
}

export interface UseElementDragDomSyncResult {
  updateDropTarget: (clientX: number, clientY: number, draggingElementId: string) => void;
  clearDropTarget: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

export function useElementDragDomSync({
  composer,
  canvasRef,
  rootIdRef,
  isDraggingRef,
  draggingElementRef,
  onDropTargetChange,
}: UseElementDragDomSyncOptions): UseElementDragDomSyncResult {
  const currentDropTargetRef = React.useRef<string | null>(null);
  const lastDropTargetRef = React.useRef<string | null>(null);
  const observerRef = React.useRef<MutationObserver | null>(null);

  // ---------------------------------------------------------------------------
  // Drop target highlighting
  // ---------------------------------------------------------------------------

  const updateDropTarget = React.useCallback(
    (clientX: number, clientY: number, draggingElementId: string) => {
      const canvas = canvasRef.current;
      if (!canvas || !composer) return;

      const elementsAtPoint = document.elementsFromPoint(clientX, clientY);
      let newDropTarget: string | null = null;

      for (const elem of elementsAtPoint) {
        const aqbEl = elem.closest("[data-aqb-id]") as HTMLElement | null;
        if (aqbEl) {
          const targetId = aqbEl.getAttribute("data-aqb-id");
          if (targetId && targetId !== draggingElementId && targetId !== rootIdRef.current) {
            const sourceEl = composer.elements.getElement(draggingElementId);
            const targetEl = composer.elements.getElement(targetId);
            if (sourceEl && targetEl) {
              const sourceType = sourceEl.getType?.() as ElementType;
              const targetType = targetEl.getType?.() as ElementType;
              if (canNestElement(sourceType, targetType)) {
                newDropTarget = targetId;
                break;
              }
            }
          }
        }
      }

      if (newDropTarget !== currentDropTargetRef.current) {
        if (lastDropTargetRef.current) {
          const prevEl = canvas.querySelector(
            `[data-aqb-id="${lastDropTargetRef.current}"]`
          ) as HTMLElement | null;
          if (prevEl) {
            prevEl.removeAttribute("data-drop-target");
            prevEl.removeAttribute("data-drop-valid");
          }
        }

        if (newDropTarget) {
          const newEl = canvas.querySelector(
            `[data-aqb-id="${newDropTarget}"]`
          ) as HTMLElement | null;
          if (newEl) {
            newEl.setAttribute("data-drop-target", "true");
            newEl.setAttribute("data-drop-valid", "true");
          }
        }

        currentDropTargetRef.current = newDropTarget;
        lastDropTargetRef.current = newDropTarget;
        onDropTargetChange?.(newDropTarget);
      }
    },
    [canvasRef, composer, rootIdRef, onDropTargetChange]
  );

  const clearDropTarget = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (lastDropTargetRef.current && canvas) {
      const el = canvas.querySelector(
        `[data-aqb-id="${lastDropTargetRef.current}"]`
      ) as HTMLElement | null;
      if (el) {
        el.removeAttribute("data-drop-target");
        el.removeAttribute("data-drop-valid");
      }
    }
    currentDropTargetRef.current = null;
    lastDropTargetRef.current = null;
    onDropTargetChange?.(null);
  }, [canvasRef, onDropTargetChange]);

  // ---------------------------------------------------------------------------
  // MutationObserver: sync draggable attributes after DOM recreation
  // BUG-012 FIX: innerHTML replacement loses draggable attrs on elements
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !composer) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const applyDraggable = () => {
      const rootId = rootIdRef.current;
      const elements = canvas.querySelectorAll("[data-aqb-id]");
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const id = htmlEl.getAttribute("data-aqb-id");
        if (id && id !== rootId) {
          htmlEl.draggable = true;
          htmlEl.style.cursor = "grab";
        } else {
          htmlEl.draggable = false;
        }
      });

      if (draggingElementRef.current && !isDraggingRef.current) {
        draggingElementRef.current = null;
      }
    };

    applyDraggable();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as Element;
              if (el.hasAttribute?.("data-aqb-id") || el.querySelector?.("[data-aqb-id]")) {
                applyDraggable();
                return;
              }
            }
          }
        }
      }
    });

    observerRef.current = observer;
    observer.observe(canvas, { childList: true, subtree: true });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [composer, canvasRef, rootIdRef, isDraggingRef, draggingElementRef]);

  // ---------------------------------------------------------------------------
  // Root ID tracking
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    if (!composer) {
      rootIdRef.current = null;
      return;
    }

    const updateRootId = () => {
      const page = composer.elements.getActivePage();
      rootIdRef.current = page?.root?.id ?? null;
    };

    updateRootId();

    composer.on(EVENTS.PAGE_CHANGED, updateRootId);
    composer.on(EVENTS.PAGE_CREATED, updateRootId);

    return () => {
      composer.off(EVENTS.PAGE_CHANGED, updateRootId);
      composer.off(EVENTS.PAGE_CREATED, updateRootId);
    };
  }, [composer, rootIdRef]);

  return { updateDropTarget, clearDropTarget };
}
