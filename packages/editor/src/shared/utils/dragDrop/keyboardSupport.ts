/**
 * Drag & Drop Keyboard Support
 * Keyboard navigation for drag operations
 *
 * @module utils/dragDrop/keyboardSupport
 * @license BSD-3-Clause
 */

import type { KeyboardDragConfig } from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_KEYBOARD_CONFIG: KeyboardDragConfig = {
  smallStep: 1,
  largeStep: 10,
  indexStep: 1,
};

// =============================================================================
// KEYBOARD DRAG HANDLING
// =============================================================================

/**
 * Handle keyboard drag movement
 */
export function handleKeyboardDrag(
  event: KeyboardEvent,
  currentIndex: number,
  maxIndex: number,
  config: KeyboardDragConfig = DEFAULT_KEYBOARD_CONFIG
): { newIndex: number; handled: boolean } {
  let newIndex = currentIndex;
  let handled = false;

  const step = event.shiftKey ? config.largeStep : config.indexStep;

  switch (event.key) {
    case "ArrowUp":
    case "ArrowLeft":
      newIndex = Math.max(0, currentIndex - step);
      handled = true;
      break;
    case "ArrowDown":
    case "ArrowRight":
      newIndex = Math.min(maxIndex, currentIndex + step);
      handled = true;
      break;
    case "Home":
      newIndex = 0;
      handled = true;
      break;
    case "End":
      newIndex = maxIndex;
      handled = true;
      break;
    case "Escape":
      newIndex = -1; // Signal cancel
      handled = true;
      break;
    case "Enter":
    case " ":
      newIndex = currentIndex; // Signal confirm
      handled = true;
      break;
  }

  if (handled) {
    event.preventDefault();
  }

  return { newIndex, handled };
}
