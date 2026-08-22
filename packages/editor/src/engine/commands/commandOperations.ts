/**
 * Command Operations
 * Reusable element mutation helpers used by default commands
 *
 * @module engine/commands/commandOperations
 * @license BSD-3-Clause
 */

import { snapToGrid } from "../../shared/utils/dragDrop";
import { EVENTS } from "../../shared/constants/events";
import type { Composer } from "../Composer";

/** Direction for z-index reordering */
export type ReorderDirection = "forward" | "backward" | "front" | "back";

/**
 * Nudge the currently selected element by (deltaX, deltaY) pixels.
 * Applies position changes via inline styles.
 * Respects snap-to-grid setting when enabled.
 */
export function nudgeSelected(composer: Composer, deltaX: number, deltaY: number): void {
  const selected = composer.selection.getSelected();
  if (!selected) return;

  const elementId = selected.getId();
  const domElement = document.querySelector(`[data-buildrick-id="${elementId}"]`) as HTMLElement;
  if (!domElement) return;

  composer.beginTransaction("nudge");

  // Get current position or default to 0
  const style = window.getComputedStyle(domElement);
  const currentLeft = parseFloat(style.left) || 0;
  const currentTop = parseFloat(style.top) || 0;

  // For elements without position, set relative positioning
  if (style.position === "static") {
    selected.setStyle("position", "relative");
  }

  // Calculate new position
  let newLeft = currentLeft + deltaX;
  let newTop = currentTop + deltaY;

  // Apply snap-to-grid if enabled
  const state = composer.getState();
  if (state.snapToGrid && state.gridSize > 0) {
    const snapped = snapToGrid({ x: newLeft, y: newTop }, state.gridSize);
    newLeft = snapped.x;
    newTop = snapped.y;
  }

  // Apply new position
  selected.setStyle("left", `${newLeft}px`);
  selected.setStyle("top", `${newTop}px`);

  composer.endTransaction();
  composer.emit(EVENTS.ELEMENT_NUDGED, { elementId, deltaX, deltaY });
}

/**
 * Reorder the currently selected element within its parent.
 * @param direction - 'forward' | 'backward' | 'front' | 'back'
 */
export function reorderElement(composer: Composer, direction: ReorderDirection): void {
  const selected = composer.selection.getSelected();
  if (!selected) return;

  const parent = selected.getParent();
  if (!parent) return;

  const siblings = parent.getChildren();
  const currentIndex = siblings.findIndex((s) => s.getId() === selected.getId());
  if (currentIndex === -1) return;

  composer.beginTransaction("reorder");

  /* `x.insertAfter(y)` puts Y after X — the DOM's direction, and what
     Element.ops.test locks. These four read the other way round for a while,
     so Bring Forward moved the NEXT sibling and Bring to Front moved the last
     one; only Send Backward looked right, because swapping two adjacent
     siblings gives the same answer whichever one you move. */
  switch (direction) {
    case "forward":
      // One position later (the next sibling ends up in front of it)
      if (currentIndex < siblings.length - 1) {
        siblings[currentIndex + 1].insertAfter(selected);
      }
      break;

    case "backward":
      // One position earlier
      if (currentIndex > 0) {
        siblings[currentIndex - 1].insertBefore(selected);
      }
      break;

    case "front":
      // Last child = painted on top
      if (currentIndex < siblings.length - 1) {
        siblings[siblings.length - 1].insertAfter(selected);
      }
      break;

    case "back":
      // First child = painted behind
      if (currentIndex > 0) {
        siblings[0].insertBefore(selected);
      }
      break;
  }

  composer.endTransaction();
  composer.emit(EVENTS.ELEMENT_REORDERED, {
    elementId: selected.getId(),
    direction,
  });
}
