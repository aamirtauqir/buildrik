/**
 * Command Operations
 * Reusable element mutation helpers used by default commands
 *
 * @module engine/commands/commandOperations
 * @license BSD-3-Clause
 */

import { snapToGrid } from "../../shared/utils/dragDrop";
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
  const domElement = document.querySelector(`[data-aqb-id="${elementId}"]`) as HTMLElement;
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
  composer.emit("element:nudged", { elementId, deltaX, deltaY });
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

  switch (direction) {
    case "forward":
      // Move up one position (swap with next sibling)
      if (currentIndex < siblings.length - 1) {
        const nextSibling = siblings[currentIndex + 1];
        selected.insertAfter(nextSibling);
      }
      break;

    case "backward":
      // Move down one position (swap with previous sibling)
      if (currentIndex > 0) {
        const prevSibling = siblings[currentIndex - 1];
        selected.insertBefore(prevSibling);
      }
      break;

    case "front":
      // Move to end (last child = visually on top)
      if (currentIndex < siblings.length - 1) {
        const lastSibling = siblings[siblings.length - 1];
        selected.insertAfter(lastSibling);
      }
      break;

    case "back":
      // Move to beginning (first child = visually behind)
      if (currentIndex > 0) {
        const firstSibling = siblings[0];
        selected.insertBefore(firstSibling);
      }
      break;
  }

  composer.endTransaction();
  composer.emit("element:reordered", {
    elementId: selected.getId(),
    direction,
  });
}
