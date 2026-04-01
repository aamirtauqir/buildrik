/**
 * keyboardHelpers — pure helper functions for useCanvasKeyboard
 * Extracted to keep useCanvasKeyboard.ts under 500 lines.
 * @license BSD-3-Clause
 */

import type { Composer } from "../../../../engine/Composer";
import type { Element } from "../../../../engine/elements/Element";

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
 * Move element position by delta pixels.
 * Adjusts top/left for absolute/fixed; transform for static/relative.
 */
export function moveElementPosition(
  composer: Composer,
  elementId: string,
  deltaX: number,
  deltaY: number
): void {
  const element = composer.elements.getElement(elementId);
  if (!element) return;

  const currentStyles = element.getStyles?.() || {};
  const position = currentStyles.position || "static";

  composer.beginTransaction("keyboard-move");
  try {
    if (position === "absolute" || position === "fixed") {
      const currentTop = parseFloat(currentStyles.top || "0") || 0;
      const currentLeft = parseFloat(currentStyles.left || "0") || 0;
      element.setStyle?.("top", `${currentTop + deltaY}px`);
      element.setStyle?.("left", `${currentLeft + deltaX}px`);
    } else {
      // Static/relative: use transform to preserve document flow
      const currentTransform = currentStyles.transform || "";
      const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);

      let newX = deltaX;
      let newY = deltaY;

      if (translateMatch) {
        newX += parseFloat(translateMatch[1]) || 0;
        newY += parseFloat(translateMatch[2]) || 0;
      }

      const otherTransforms = currentTransform.replace(/translate\([^)]+\)/, "").trim();
      const newTransform = `translate(${newX}px, ${newY}px)${otherTransforms ? " " + otherTransforms : ""}`;
      element.setStyle?.("transform", newTransform);
    }
  } finally {
    composer.endTransaction();
  }
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

  let newIndex: number | null = null;

  switch (direction) {
    case "up":
      if (currentIndex > 0) newIndex = currentIndex - 1;
      break;
    case "down":
      if (currentIndex < siblings.length - 1) newIndex = currentIndex + 1;
      break;
    case "first":
      if (currentIndex > 0) newIndex = 0;
      break;
    case "last":
      if (currentIndex < siblings.length - 1) newIndex = siblings.length - 1;
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
