/**
 * Drag & Drop Auto-Scroll
 * Automatic scrolling during drag operations
 *
 * @module utils/dragDrop/autoScroll
 * @license BSD-3-Clause
 */

import { THRESHOLDS } from "../../constants";
import type { Point } from "../../types";
import type { AutoScrollConfig } from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_AUTO_SCROLL_THRESHOLD = THRESHOLDS.DRAG_SCROLL_MARGIN;
const DEFAULT_AUTO_SCROLL_SPEED = 10; // px per frame

// =============================================================================
// AUTO-SCROLL STATE
// =============================================================================

/**
 * Tracks active scroll animation for cancellation
 */
interface ScrollAnimationState {
  animationId: number;
  isActive: boolean;
}

const activeScrolls = new Map<number, ScrollAnimationState>();
let nextScrollId = 1;

// =============================================================================
// AUTO-SCROLL FUNCTIONS
// =============================================================================

/**
 * Calculate scroll speed based on cursor distance from edge
 */
function calculateScrollSpeed(
  distance: number,
  threshold: number,
  baseSpeed: number,
  maxSpeed: number,
  acceleration: number
): number {
  const ratio = distance / threshold;
  return Math.min(baseSpeed * ratio * acceleration, maxSpeed);
}

/**
 * Start auto-scrolling based on cursor position
 * BUG-019 FIX: Use RAF instead of setInterval for smooth scrolling
 */
export function startAutoScroll(point: Point, config: AutoScrollConfig): number | null {
  const {
    container,
    threshold = DEFAULT_AUTO_SCROLL_THRESHOLD,
    speed = DEFAULT_AUTO_SCROLL_SPEED,
    maxSpeed = 30,
    acceleration = 1.5,
  } = config;

  const rect = container.getBoundingClientRect();
  let scrollX = 0;
  let scrollY = 0;

  // Calculate scroll directions and speeds
  if (point.y < rect.top + threshold) {
    const distance = rect.top + threshold - point.y;
    scrollY = -calculateScrollSpeed(distance, threshold, speed, maxSpeed, acceleration);
  } else if (point.y > rect.bottom - threshold) {
    const distance = point.y - (rect.bottom - threshold);
    scrollY = calculateScrollSpeed(distance, threshold, speed, maxSpeed, acceleration);
  }

  if (point.x < rect.left + threshold) {
    const distance = rect.left + threshold - point.x;
    scrollX = -calculateScrollSpeed(distance, threshold, speed, maxSpeed, acceleration);
  } else if (point.x > rect.right - threshold) {
    const distance = point.x - (rect.right - threshold);
    scrollX = calculateScrollSpeed(distance, threshold, speed, maxSpeed, acceleration);
  }

  if (scrollX === 0 && scrollY === 0) {
    return null;
  }

  // Create scroll state for this animation
  const scrollId = nextScrollId++;
  const state: ScrollAnimationState = {
    animationId: 0,
    isActive: true,
  };
  activeScrolls.set(scrollId, state);

  // Use RAF for smooth scrolling
  const scrollLoop = () => {
    if (!state.isActive) return;

    container.scrollBy(scrollX, scrollY);
    state.animationId = requestAnimationFrame(scrollLoop);
  };

  state.animationId = requestAnimationFrame(scrollLoop);
  return scrollId;
}

/**
 * Stop auto-scrolling
 */
export function stopAutoScroll(scrollId: number | null): void {
  if (scrollId === null) return;

  const state = activeScrolls.get(scrollId);
  if (state) {
    state.isActive = false;
    cancelAnimationFrame(state.animationId);
    activeScrolls.delete(scrollId);
  }
}

/**
 * Stop all active auto-scroll animations
 */
export function stopAllAutoScrolls(): void {
  activeScrolls.forEach((state, id) => {
    state.isActive = false;
    cancelAnimationFrame(state.animationId);
    activeScrolls.delete(id);
  });
}

/**
 * Update auto-scroll speed based on new cursor position
 * Call this during drag to dynamically adjust scroll speed
 */
export function updateAutoScroll(
  scrollId: number | null,
  point: Point,
  config: AutoScrollConfig
): number | null {
  // Stop existing scroll and start new one with updated speed
  stopAutoScroll(scrollId);
  return startAutoScroll(point, config);
}
