/**
 * Drag & Drop Sortable Helpers
 * Sortable list utilities
 *
 * @module utils/dragDrop/sortable
 * @license BSD-3-Clause
 */

import type { Point, Rect } from "../../types";

// =============================================================================
// SORTABLE LIST HELPERS
// =============================================================================

/**
 * Get insertion index for sortable list
 */
export function getSortableInsertIndex(
  point: Point,
  items: HTMLElement[],
  isHorizontal: boolean = false
): number {
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    const center = isHorizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
    const cursor = isHorizontal ? point.x : point.y;

    if (cursor < center) {
      return i;
    }
  }

  return items.length;
}

/**
 * Calculate placeholder position for sortable
 */
export function calculatePlaceholderRect(
  items: HTMLElement[],
  insertIndex: number,
  itemRect: Rect,
  isHorizontal: boolean = false
): Rect {
  if (items.length === 0) {
    return itemRect;
  }

  if (insertIndex >= items.length) {
    const lastItem = items[items.length - 1];
    const lastRect = lastItem.getBoundingClientRect();

    return {
      x: isHorizontal ? lastRect.right : lastRect.left,
      y: isHorizontal ? lastRect.top : lastRect.bottom,
      width: itemRect.width,
      height: itemRect.height,
    };
  }

  const targetItem = items[insertIndex];
  const targetRect = targetItem.getBoundingClientRect();

  return {
    x: targetRect.left,
    y: targetRect.top,
    width: itemRect.width,
    height: itemRect.height,
  };
}

/**
 * Animate list items to make room for dragged item
 */
export function animateSortableItems(
  items: HTMLElement[],
  draggedIndex: number,
  hoverIndex: number,
  isHorizontal: boolean = false
): void {
  items.forEach((item, index) => {
    if (index === draggedIndex) return;

    let offset = 0;

    if (draggedIndex < hoverIndex) {
      // Moving down/right
      if (index > draggedIndex && index <= hoverIndex) {
        offset = isHorizontal
          ? -items[draggedIndex].offsetWidth
          : -items[draggedIndex].offsetHeight;
      }
    } else {
      // Moving up/left
      if (index >= hoverIndex && index < draggedIndex) {
        offset = isHorizontal ? items[draggedIndex].offsetWidth : items[draggedIndex].offsetHeight;
      }
    }

    item.style.transform = isHorizontal ? `translateX(${offset}px)` : `translateY(${offset}px)`;
    item.style.transition = "transform 0.2s ease";
  });
}

/**
 * Reset sortable item transforms
 */
export function resetSortableItems(items: HTMLElement[]): void {
  items.forEach((item) => {
    item.style.transform = "";
    item.style.transition = "";
  });
}
