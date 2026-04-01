/**
 * Drag & Drop Visual Indicators
 * Drop indicators and visual feedback elements
 *
 * @module utils/dragDrop/indicators
 * @license BSD-3-Clause
 */

import type { Rect } from "../../types";
import type { DropPosition, DropIndicatorStyle } from "./types";

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Get top position from DOMRect or Rect
 */
function getRectTop(rect: DOMRect | Rect): number {
  return "top" in rect ? rect.top : rect.y;
}

/**
 * Get left position from DOMRect or Rect
 */
function getRectLeft(rect: DOMRect | Rect): number {
  return "left" in rect ? rect.left : rect.x;
}

// =============================================================================
// DROP INDICATOR CALCULATIONS
// =============================================================================

/**
 * Calculate drop indicator position and style
 */
export function calculateDropIndicator(
  targetRect: DOMRect | Rect,
  dropPosition: DropPosition,
  isHorizontal: boolean = false,
  indicatorSize: number = 2
): DropIndicatorStyle {
  const top = getRectTop(targetRect);
  const left = getRectLeft(targetRect);

  switch (dropPosition) {
    case "before":
      return {
        position: isHorizontal ? "left" : "top",
        rect: {
          x: left,
          y: top,
          width: isHorizontal ? indicatorSize : targetRect.width,
          height: isHorizontal ? targetRect.height : indicatorSize,
        },
        className: `drop-indicator-${isHorizontal ? "left" : "top"}`,
      };

    case "after":
      return {
        position: isHorizontal ? "right" : "bottom",
        rect: {
          x: isHorizontal ? left + targetRect.width - indicatorSize : left,
          y: isHorizontal ? top : top + targetRect.height - indicatorSize,
          width: isHorizontal ? indicatorSize : targetRect.width,
          height: isHorizontal ? targetRect.height : indicatorSize,
        },
        className: `drop-indicator-${isHorizontal ? "right" : "bottom"}`,
      };

    case "inside":
    case "first":
    case "last":
    default:
      return {
        position: "overlay",
        rect: {
          x: left,
          y: top,
          width: targetRect.width,
          height: targetRect.height,
        },
        className: "drop-indicator-inside",
      };
  }
}

/**
 * Create drop indicator element
 */
export function createDropIndicatorElement(
  style: DropIndicatorStyle,
  color: string = "#2196f3"
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = `aquibra-drop-indicator ${style.className || ""}`;

  Object.assign(el.style, {
    position: "fixed",
    top: `${style.rect.y}px`,
    left: `${style.rect.x}px`,
    width: `${style.rect.width}px`,
    height: `${style.rect.height}px`,
    backgroundColor: style.position === "overlay" ? `${color}20` : color,
    border: style.position === "overlay" ? `2px dashed ${color}` : "none",
    borderRadius: style.position === "overlay" ? "4px" : "0",
    pointerEvents: "none",
    zIndex: "9999",
    transition: "all 0.15s ease",
  });

  return el;
}

/**
 * Update drop indicator position
 */
export function updateDropIndicator(indicator: HTMLElement, style: DropIndicatorStyle): void {
  Object.assign(indicator.style, {
    top: `${style.rect.y}px`,
    left: `${style.rect.x}px`,
    width: `${style.rect.width}px`,
    height: `${style.rect.height}px`,
  });
}
