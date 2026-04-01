/**
 * Drag & Drop Ghost/Preview
 * Drag ghost element management
 *
 * @module utils/dragDrop/dragGhost
 * @license BSD-3-Clause
 */

import type { Point, Rect } from "../../types";
import type { DragGhostOptions } from "./types";

// =============================================================================
// DRAG GHOST MANAGEMENT
// =============================================================================

/**
 * Create drag ghost element
 */
export function createDragGhost(
  sourceElement: HTMLElement,
  options: DragGhostOptions = {}
): HTMLElement {
  const {
    scale = 1,
    opacity = 0.8,
    rotation = 2,
    styles = {},
    clone = true,
    content,
    offset = { x: 0, y: 0 },
  } = options;

  let ghost: HTMLElement;

  if (clone && !content) {
    ghost = sourceElement.cloneNode(true) as HTMLElement;
  } else if (content) {
    ghost = document.createElement("div");
    if (typeof content === "string") {
      ghost.innerHTML = content;
    } else {
      ghost.appendChild(content.cloneNode(true));
    }
  } else {
    ghost = document.createElement("div");
    ghost.textContent = "Dragging...";
  }

  // Get source dimensions
  const rect = sourceElement.getBoundingClientRect();

  // Apply base styles
  Object.assign(ghost.style, {
    position: "fixed",
    top: `${rect.top + offset.y}px`,
    left: `${rect.left + offset.x}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    opacity: String(opacity),
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    transformOrigin: "top left",
    pointerEvents: "none",
    zIndex: "10000",
    transition: "transform 0.1s ease",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    borderRadius: "4px",
    overflow: "hidden",
    ...styles,
  });

  ghost.classList.add("aquibra-drag-ghost");

  return ghost;
}

/**
 * Update ghost position
 */
export function updateDragGhost(
  ghost: HTMLElement,
  position: Point,
  offset: Point = { x: 0, y: 0 }
): void {
  ghost.style.left = `${position.x + offset.x}px`;
  ghost.style.top = `${position.y + offset.y}px`;
}

/**
 * Remove drag ghost with animation
 */
export function removeDragGhost(ghost: HTMLElement, animate: boolean = true): Promise<void> {
  return new Promise((resolve) => {
    if (!animate) {
      ghost.remove();
      resolve();
      return;
    }

    ghost.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    ghost.style.opacity = "0";
    ghost.style.transform = "scale(0.8)";

    setTimeout(() => {
      ghost.remove();
      resolve();
    }, 200);
  });
}

/**
 * Animate ghost to final position
 */
export function animateDragGhostToDrop(ghost: HTMLElement, targetRect: Rect): Promise<void> {
  return new Promise((resolve) => {
    ghost.style.transition = "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
    ghost.style.left = `${targetRect.x}px`;
    ghost.style.top = `${targetRect.y}px`;
    ghost.style.width = `${targetRect.width}px`;
    ghost.style.height = `${targetRect.height}px`;
    ghost.style.opacity = "0.5";
    ghost.style.transform = "scale(1) rotate(0deg)";

    setTimeout(() => {
      ghost.remove();
      resolve();
    }, 250);
  });
}
