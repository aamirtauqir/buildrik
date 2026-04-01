/**
 * Drag & Drop DOM Helpers
 * DOM manipulation utilities for drag & drop
 *
 * @module utils/dragDrop/domHelpers
 * @license BSD-3-Clause
 */

import { DATA_ATTRIBUTES, THRESHOLDS } from "../../constants";

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_DOM_TRAVERSAL = THRESHOLDS.MAX_NESTING_DEPTH;

/** Data attribute for element IDs */
const DATA_ATTR = DATA_ATTRIBUTES.ELEMENT_ID;
const DATA_SELECTOR = `[${DATA_ATTR}]`;

// =============================================================================
// ELEMENT ID HELPERS
// =============================================================================

/**
 * Get element ID from a DOM element
 */
export function getElementId(el: HTMLElement | null): string | null {
  return el?.getAttribute(DATA_ATTR) ?? null;
}

/**
 * Set element ID on a DOM element
 */
export function setElementId(el: HTMLElement, id: string): void {
  el.setAttribute(DATA_ATTR, id);
}

/**
 * Find DOM element by its aquibra ID
 */
export function findDOMElementById(id: string): HTMLElement | null {
  return document.querySelector(`[${DATA_ATTR}="${id}"]`) as HTMLElement | null;
}

/**
 * Find all aquibra elements
 */
export function findAllDOMElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll(DATA_SELECTOR)) as HTMLElement[];
}

// =============================================================================
// DROP TARGET HELPERS
// =============================================================================

/**
 * Find the closest aquibra element from a point
 */
export function findDropTargetElement(
  x: number,
  y: number,
  fallbackId?: string | null
): HTMLElement | null {
  const elementAtPoint = document.elementFromPoint(x, y) as HTMLElement | null;
  let target = elementAtPoint?.closest(DATA_SELECTOR) as HTMLElement | null;

  if (!target && fallbackId) {
    target = findDOMElementById(fallbackId);
  }

  return target;
}

/**
 * Find all elements under a point (for layered elements)
 */
export function findAllElementsAtPoint(x: number, y: number): HTMLElement[] {
  const elements: HTMLElement[] = [];
  let el = document.elementFromPoint(x, y) as HTMLElement | null;

  while (el) {
    const aqbElement = el.closest(DATA_SELECTOR) as HTMLElement | null;
    if (aqbElement && !elements.includes(aqbElement)) {
      elements.push(aqbElement);
    }
    // Move to parent to find elements behind
    el = el.parentElement;
  }

  return elements;
}

/**
 * Walk up DOM tree to find valid drop target
 * Avoids self and specified descendants
 */
export function findValidDOMTarget(
  dropTarget: HTMLElement | null,
  skipIds: Set<string>
): HTMLElement | null {
  let target = dropTarget;
  let counter = 0;

  while (target && counter < MAX_DOM_TRAVERSAL) {
    const id = getElementId(target);
    if (!id || !skipIds.has(id)) {
      return target;
    }
    target = target.parentElement?.closest(DATA_SELECTOR) as HTMLElement | null;
    counter++;
  }

  return target;
}

/**
 * Get all descendant element IDs
 */
export function getDescendantIds(element: HTMLElement): Set<string> {
  const ids = new Set<string>();
  const descendants = element.querySelectorAll(DATA_SELECTOR);

  descendants.forEach((el) => {
    const id = getElementId(el as HTMLElement);
    if (id) ids.add(id);
  });

  return ids;
}

/**
 * Check if element is descendant of another
 */
export function isDescendantOf(child: HTMLElement, parent: HTMLElement): boolean {
  return parent.contains(child) && child !== parent;
}

/**
 * Get scrollable parent
 */
export function getScrollableParent(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;

  while (parent) {
    const style = getComputedStyle(parent);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;

    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowX === "auto" ||
      overflowX === "scroll"
    ) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return (document.scrollingElement as HTMLElement) || document.documentElement;
}

/**
 * Clean up all drop indicator attributes from a container
 * Call this on drag end, drag leave, and drop to ensure consistent cleanup
 */
export function cleanupDropIndicators(container: HTMLElement | null): void {
  if (!container) return;

  try {
    // Remove drop target indicators
    container.querySelectorAll("[data-drop-target]").forEach((el) => {
      el.removeAttribute("data-drop-target");
    });

    // Remove invalid drop indicators
    container.querySelectorAll("[data-drop-invalid]").forEach((el) => {
      el.removeAttribute("data-drop-invalid");
    });

    // Remove breathing animation class
    container.querySelectorAll(".aqb-drop-zone-breathing").forEach((el) => {
      el.classList.remove("aqb-drop-zone-breathing");
    });

    // Remove shake animation class
    container.querySelectorAll(".aqb-invalid-drop-shake").forEach((el) => {
      el.classList.remove("aqb-invalid-drop-shake");
    });
  } catch {
    // Container may have been unmounted
  }
}
