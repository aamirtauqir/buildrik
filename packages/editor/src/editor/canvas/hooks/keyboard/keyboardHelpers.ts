/**
 * keyboardHelpers — pure helper functions for useCanvasKeyboard
 * Extracted to keep useCanvasKeyboard.ts under 500 lines.
 * @license BSD-3-Clause
 */

import type { Composer } from "../../../../engine/Composer";
import type { Element } from "../../../../engine/elements/Element";
import {
  activeBreakpoint,
  stylesAt,
  writableElements,
  writeCanvasStyles,
} from "../../../../engine/commands/commandOperations";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface NavigationTargets {
  prev: Element | null;
  next: Element | null;
  parent: Element | null;
  firstChild: Element | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Get navigation targets (prev/next sibling, parent, firstChild) for an element */
export function getNavigationTargets(element: Element): NavigationTargets {
  const parent = element.getParent?.();
  let prev: Element | null = null;
  let next: Element | null = null;

  if (parent) {
    const siblings = parent.getChildren?.() || [];
    const currentIndex = siblings.findIndex((s) => s.getId() === element.getId());
    if (currentIndex > 0) {
      prev = siblings[currentIndex - 1];
    }
    if (currentIndex < siblings.length - 1) {
      next = siblings[currentIndex + 1];
    }
  }

  const children = element.getChildren?.() || [];
  const firstChild = children.length > 0 ? children[0] : null;

  return { prev, next, parent, firstChild };
}

/**
 * Get all navigable elements in tree order (for Tab cycling).
 * @param composer - The composer instance
 * @param rootId - The root element ID to exclude from the Tab cycle.
 *   Pass `null` or omit to include all elements.
 *   The root cannot be moved or meaningfully edited via keyboard, so it
 *   should be excluded from Tab navigation (same principle as drag: see
 *   useCanvasElementDrag.ts — "don't make root draggable").
 */
export function getAllNavigableElements(
  composer: Composer,
  rootId: string | null = null
): Element[] {
  const page = composer.elements.getActivePage();
  if (!page?.root) return [];

  const elements: Element[] = [];

  function traverse(element: Element) {
    elements.push(element);
    const children = element.getChildren?.() || [];
    children.forEach(traverse);
  }

  const root = composer.elements.getElement(page.root.id);
  if (root) {
    traverse(root);
  }

  if (rootId === null) return elements;
  return elements.filter((el) => el.getId() !== rootId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Position / reorder helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Move a POSITIONED element by delta pixels (its top/left). Returns false and
 * changes nothing for an in-flow (static) element: nudging one used to write
 * a transform, which moved the pixels while the layout box — and the page
 * around it — stayed put, and nothing in the inspector showed it (G2-047,
 * CI-62). The caller says why nothing moved.
 *
 * Reads and writes at the active breakpoint and goes through the lock gate
 * (writeCanvasStyles) — a nudge on Tablet moved Desktop too, and a locked
 * element moved (audit 2026-10-08 P1-2/P1-3). A locked refusal returns true:
 * the "locked" toast already said why, so the in-flow hint must not.
 */
export function moveElementPosition(
  composer: Composer,
  elementId: string,
  deltaX: number,
  deltaY: number
): boolean {
  const element = composer.elements.getElement(elementId);
  if (!element) return false;

  const current = stylesAt(composer, element, activeBreakpoint(composer));
  const position = current.position || "static";
  if (position === "static") return false;

  const currentTop = parseFloat(current.top || "0") || 0;
  const currentLeft = parseFloat(current.left || "0") || 0;
  writeCanvasStyles(composer, element, "keyboard-move", {
    top: `${currentTop + deltaY}px`,
    left: `${currentLeft + deltaX}px`,
  });
  return true;
}

/** Reorder element within its parent (keyboard-driven) */
export function reorderElement(
  element: Element,
  composer: Composer,
  selectedId: string,
  direction: "up" | "down" | "first" | "last"
): void {
  const parent = element.getParent?.();
  if (!parent) return;

  const siblings = parent.getChildren?.() || [];
  const currentIndex = siblings.findIndex((s) => s.getId() === selectedId);
  if (currentIndex === -1) return;

  /* `moveElement`'s index is a slot in the sibling list AS IT IS NOW, before
     the element is pulled out of it — the drop-indicator position, not the
     final array index. When the move stays inside the same parent it
     decrements any slot that sits after the element (ElementCRUD.moveElement).
     So the final index the caller wants has to be expressed one slot later
     when moving down. Passing the final index instead made ⌥↓ a silent no-op
     (target+1 came straight back to target) and left ⌥End one short of last —
     both measured live before this was written. `moveToBottom` in
     useLayerActions already speaks this dialect (it passes getChildCount()). */
  let newIndex: number | null = null;
  /* A locked element keeps its place (audit 2026-10-08 P1-3); the lock gate
     raises the "locked" toast. */
  if (writableElements(composer, [element]).length === 0) return;

  switch (direction) {
    case "up":
      if (currentIndex > 0) newIndex = currentIndex - 1;
      break;
    case "down":
      if (currentIndex < siblings.length - 1) newIndex = currentIndex + 2;
      break;
    case "first":
      if (currentIndex > 0) newIndex = 0;
      break;
    case "last":
      if (currentIndex < siblings.length - 1) newIndex = siblings.length;
      break;
  }

  if (newIndex !== null) {
    composer.beginTransaction("keyboard-reorder");
    try {
      composer.elements.moveElement(selectedId, parent.getId(), newIndex);
    } finally {
      composer.endTransaction();
    }
  }
}
