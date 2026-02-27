/**
 * Drag & Drop Touch Support
 * Touch event handling for drag operations
 *
 * @module utils/dragDrop/touchSupport
 * @license BSD-3-Clause
 */

import { distance } from "./geometry";
import type { TouchDragState } from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_LONG_PRESS_DELAY = 500; // ms for touch

// =============================================================================
// TOUCH DRAG STATE
// =============================================================================

/**
 * Create touch drag state
 */
export function createTouchDragState(touch: Touch): TouchDragState {
  return {
    touchId: touch.identifier,
    startPosition: { x: touch.clientX, y: touch.clientY },
    currentPosition: { x: touch.clientX, y: touch.clientY },
    longPressTimer: null,
    isLongPress: false,
    startTime: Date.now(),
    targetElement: touch.target as HTMLElement,
  };
}

/**
 * Check if touch has moved beyond threshold
 */
export function hasTouchMoved(state: TouchDragState, threshold: number = 10): boolean {
  return distance(state.startPosition, state.currentPosition) > threshold;
}

// =============================================================================
// LONG PRESS DETECTION
// =============================================================================

/**
 * Start long press detection
 */
export function startLongPressDetection(
  state: TouchDragState,
  callback: () => void,
  delay: number = DEFAULT_LONG_PRESS_DELAY
): void {
  state.longPressTimer = window.setTimeout(() => {
    if (!hasTouchMoved(state)) {
      state.isLongPress = true;
      callback();
    }
  }, delay);
}

/**
 * Cancel long press detection
 */
export function cancelLongPressDetection(state: TouchDragState): void {
  if (state.longPressTimer !== null) {
    clearTimeout(state.longPressTimer);
    state.longPressTimer = null;
  }
}

/**
 * Prevent default touch behaviors during drag
 */
export function preventTouchDefaults(event: TouchEvent): void {
  event.preventDefault();
  event.stopPropagation();
}
