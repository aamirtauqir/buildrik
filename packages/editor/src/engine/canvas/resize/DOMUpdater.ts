/**
 * DOM Updater - Applies resize bounds to DOM elements
 * Handles both DOM style updates and visual feedback
 *
 * @module engine/canvas/resize/DOMUpdater
 * @license BSD-3-Clause
 */

import type { Composer } from "../../Composer";
import { activeBreakpoint, stylesAt, writeCanvasStyles } from "../../commands/commandOperations";
import { scaleBounds } from "./resizeMath";
import type { TransformBounds, ResizeState } from "./types";
import { getDOMElement } from "./utils";

// =============================================================================
// DOM STYLE APPLICATION
// =============================================================================

/**
 * Apply bounds to DOM element styles
 * Updates width, height, position, and rotation
 */
export function applyBoundsToDOM(elementId: string, bounds: TransformBounds): void {
  const domElement = getDOMElement(elementId);
  if (!domElement) return;

  domElement.style.width = `${bounds.width}px`;
  domElement.style.height = `${bounds.height}px`;

  const position = window.getComputedStyle(domElement).position;
  if (position === "absolute" || position === "fixed") {
    domElement.style.left = `${bounds.x}px`;
    domElement.style.top = `${bounds.y}px`;
  }

  if (bounds.rotation !== undefined) {
    domElement.style.transform = `rotate(${bounds.rotation}deg)`;
  }
}

/**
 * Apply multi-element resize to DOM
 * Scales additional elements relative to primary element
 */
export function applyMultiResizeToDOM(state: ResizeState, primaryBounds: TransformBounds): void {
  for (const elId of state.additionalElementIds) {
    const elStartBounds = state.additionalStartBounds.get(elId);
    if (!elStartBounds) continue;

    const newBounds = scaleBounds(elStartBounds, state.startBounds, primaryBounds);
    applyBoundsToDOM(elId, newBounds);
  }
}

/**
 * Expand parent element DOM dimensions
 * Used when child resize exceeds parent bounds
 */
export function expandParentDOM(
  parentElement: HTMLElement,
  newWidth: number,
  newHeight: number
): void {
  parentElement.style.width = `${newWidth}px`;
  parentElement.style.height = `${newHeight}px`;
}

// =============================================================================
// MODEL APPLICATION (requires composer)
// =============================================================================

/** A px length, or null for anything this cannot resolve here (%, em, vw, calc). */
function pxOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const m = /^(-?\d+(?:\.\d+)?)px$/.exec(value.trim());
  return m ? Number(m[1]) : null;
}

/**
 * Keep a resized size inside the element's OWN min/max constraints.
 *
 * The browser already clamps the rendered box, so a card carrying
 * `max-width: 320px` stops growing on screen while the drag keeps going — and
 * the model happily stored the overshoot. Measured live: dragging the
 * bottom-right handle wrote `width: 380px` on an element that stayed 320px
 * wide, so the inspector read 380 for a 320px card. Clamping only changes what
 * is STORED; the rendered size is unchanged, which is the point — the two now
 * agree. Constraints in units this cannot resolve (%, em, vw, calc) are left
 * alone rather than guessed at.
 */
function clampToConstraints(
  value: number,
  min: string | undefined,
  max: string | undefined
): number {
  const maxPx = pxOrNull(max);
  const minPx = pxOrNull(min);
  let out = value;
  if (maxPx !== null) out = Math.min(out, maxPx);
  if (minPx !== null) out = Math.max(out, minPx);
  return out;
}

/**
 * Apply bounds to element model
 * Updates width, height, position, and rotation in data model — at the
 * active breakpoint and through the lock gate (writeCanvasStyles): a resize on
 * Tablet is a tablet override, and a locked element is not resized. It wrote
 * the base styles at every device, unchecked, until audit 2026-10-08 P1-2.
 */
export function applyBoundsToModel(elementId: string, bounds: TransformBounds, composer: Composer): void {
  const element = composer.elements.getElement(elementId);
  if (!element) return;

  const current = stylesAt(composer, element, activeBreakpoint(composer));
  const styles: Record<string, string> = {
    width: `${clampToConstraints(Math.round(bounds.width), current["min-width"], current["max-width"])}px`,
    height: `${clampToConstraints(Math.round(bounds.height), current["min-height"], current["max-height"])}px`,
  };

  if (current.position === "absolute" || current.position === "fixed") {
    styles.left = `${Math.round(bounds.x)}px`;
    styles.top = `${Math.round(bounds.y)}px`;
  }

  if (bounds.rotation !== undefined && bounds.rotation !== 0) {
    styles.transform = `rotate(${bounds.rotation}deg)`;
  }

  writeCanvasStyles(composer, element, "resize-element", styles);
}

/**
 * Apply multi-element resize to model
 * Scales additional elements relative to primary element
 */
export function applyMultiResizeToModel(
  state: ResizeState,
  primaryBounds: TransformBounds,
  composer: Composer
): void {
  for (const elId of state.additionalElementIds) {
    const elStartBounds = state.additionalStartBounds.get(elId);
    if (!elStartBounds) continue;

    const newBounds = scaleBounds(elStartBounds, state.startBounds, primaryBounds);
    applyBoundsToModel(elId, newBounds, composer);
  }
}

/**
 * Expand parent element in both DOM and model
 */
export function expandParent(
  parentId: string,
  parentElement: HTMLElement,
  newWidth: number,
  newHeight: number,
  composer: Composer
): void {
  expandParentDOM(parentElement, newWidth, newHeight);

  const parentModel = composer.elements.getElement(parentId);
  if (parentModel) {
    /* Same invariant as applyBoundsToModel: never store a size the element
       cannot have. Growing a parent to fit a resized child is a different
       intent, but the browser clamps the parent's box against its own
       min/max exactly the same way, so an unclamped write leaves the model
       holding a width the parent never renders at. Same breakpoint + lock
       rules too (writeCanvasStyles). */
    const current = stylesAt(composer, parentModel, activeBreakpoint(composer));
    writeCanvasStyles(composer, parentModel, "resize-element", {
      width: `${clampToConstraints(Math.round(newWidth), current["min-width"], current["max-width"])}px`,
      height: `${clampToConstraints(Math.round(newHeight), current["min-height"], current["max-height"])}px`,
    });
  }
}
