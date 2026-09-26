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
import type { Element } from "../elements/Element";

/** Direction for z-index reordering */
export type ReorderDirection = "forward" | "backward" | "front" | "back";

/**
 * A-5: drop locked elements and elements inside a component instance from a
 * destructive multi-selection op (delete/cut), and never remove a locked
 * element as part of an ancestor's subtree. Locking and instance
 * membership are read straight from the element (the single source of
 * truth — see ElementSerialization.isLocked/isComponentInstance), not from a
 * panel's own tracking set. Returns the survivors and whether anything was
 * skipped, so the caller can tell the user their selection shrank. Lives
 * here (not defaultCommands.ts, which imports FROM this module) so both
 * defaultCommands' delete/cut and nudgeSelected below can share it without
 * a circular import.
 */
export function dropLockedAndInstances(elements: Element[]): { kept: Element[]; skipped: boolean } {
  const kept: Element[] = [];
  let skipped = false;
  /* An unlocked element is removed with its whole subtree, so one holding a
     locked descendant is not removed itself: its children are considered in
     its place, down to the locked one. Callers pass the topMost()-pruned
     selection, and ⌘A selects every element — so without this descent a
     locked image inside a selected section was never looked at and went
     with the section (A-5, walked live: 11 → 3, the locked image gone). */
  const visit = (el: Element): void => {
    if (el.isLocked() || el.isComponentInstance()) {
      skipped = true;
      return;
    }
    if (!hasLockedDescendant(el)) {
      kept.push(el);
      return;
    }
    skipped = true;
    el.getChildren().forEach(visit);
  };
  elements.forEach(visit);
  return { kept, skipped };
}

function hasLockedDescendant(el: Element): boolean {
  return el.getChildren().some((child) => child.isLocked() || hasLockedDescendant(child));
}

/**
 * Nudge the currently selected element by (deltaX, deltaY) pixels.
 * Applies position changes via inline styles.
 * Respects snap-to-grid setting when enabled.
 *
 * IMPORTANT 2: a locked element nudged anyway —
 * the delete/cut/toggleLock/drop-target guards from A-5 never reached the
 * keyboard-arrow path. Skips a locked (or instance-owned) selection and
 * emits the same LOCKED_ELEMENTS_SKIPPED event delete/cut emit, so the
 * shell's toast fires the same way.
 */
export function nudgeSelected(composer: Composer, deltaX: number, deltaY: number): void {
  const selected = composer.selection.getSelected();
  if (!selected) return;
  if (selected.isLocked?.() || selected.isComponentInstance?.()) {
    composer.emit(EVENTS.LOCKED_ELEMENTS_SKIPPED, undefined);
    return;
  }

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
