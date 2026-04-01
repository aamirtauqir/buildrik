/**
 * Drag & Drop Animations
 * Animation helpers for drag feedback
 *
 * @module utils/dragDrop/animations
 * @license BSD-3-Clause
 */

import type { Rect } from "../../types";

// =============================================================================
// ANIMATION HELPERS
// =============================================================================

/**
 * Animate element to position
 */
export function animateToPosition(
  element: HTMLElement,
  targetRect: Rect,
  duration: number = 250
): Promise<void> {
  return new Promise((resolve) => {
    const currentRect = element.getBoundingClientRect();

    element.style.transition = "none";
    element.style.transform = `translate(${currentRect.left - targetRect.x}px, ${currentRect.top - targetRect.y}px)`;

    // Force reflow
    void element.offsetHeight;

    element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    element.style.transform = "translate(0, 0)";

    setTimeout(() => {
      element.style.transition = "";
      element.style.transform = "";
      resolve();
    }, duration);
  });
}

/**
 * Shake element (for invalid drop)
 */
export function shakeElement(element: HTMLElement, intensity: number = 10): Promise<void> {
  return new Promise((resolve) => {
    const originalTransform = element.style.transform;

    element.style.transition = "transform 0.05s ease-in-out";

    const shake = [intensity, -intensity, intensity, -intensity, intensity / 2, -intensity / 2, 0];
    let index = 0;

    const doShake = () => {
      if (index >= shake.length) {
        element.style.transform = originalTransform;
        element.style.transition = "";
        resolve();
        return;
      }

      element.style.transform = `translateX(${shake[index]}px)`;
      index++;
      setTimeout(doShake, 50);
    };

    doShake();
  });
}

/**
 * Pulse element (for valid drop)
 */
export function pulseElement(element: HTMLElement, color: string = "#4caf50"): Promise<void> {
  return new Promise((resolve) => {
    const originalBoxShadow = element.style.boxShadow;

    element.style.transition = "box-shadow 0.2s ease";
    element.style.boxShadow = `0 0 0 3px ${color}`;

    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;
      setTimeout(() => {
        element.style.transition = "";
        resolve();
      }, 200);
    }, 200);
  });
}

// =============================================================================
// PHASE 4: DROP MICRO-INTERACTIONS
// =============================================================================

/**
 * Flash animation on successful drop (haptic feedback visual)
 * Shows a green ripple effect emanating from the element
 */
export function flashOnDrop(element: HTMLElement, color: string = "#a6e3a1"): Promise<void> {
  return new Promise((resolve) => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      resolve();
      return;
    }

    // Add CSS class for animation
    element.classList.add("aqb-element-flash");

    // Also apply inline style for custom color
    const originalBoxShadow = element.style.boxShadow;
    element.style.boxShadow = `0 0 0 0 ${color}`;

    // Force reflow
    void element.offsetHeight;

    // Animate
    element.style.transition = "box-shadow 0.4s ease-out";
    element.style.boxShadow = `0 0 0 8px transparent`;

    const cleanup = () => {
      element.classList.remove("aqb-element-flash");
      element.style.boxShadow = originalBoxShadow;
      element.style.transition = "";
      resolve();
    };

    setTimeout(cleanup, 400);
  });
}

/**
 * Settle animation when element lands in new position
 * Subtle scale bounce effect
 */
export function settleElement(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      resolve();
      return;
    }

    // Add CSS class for animation
    element.classList.add("aqb-element-settle");

    const cleanup = () => {
      element.classList.remove("aqb-element-settle");
      resolve();
    };

    setTimeout(cleanup, 300);
  });
}

/**
 * Combined flash + settle animation for successful drops
 */
export async function animateDropSuccess(
  element: HTMLElement,
  flashColor: string = "#a6e3a1"
): Promise<void> {
  await flashOnDrop(element, flashColor);
  await settleElement(element);
}
