/**
 * DOM Updater - Applies resize bounds to DOM elements
 * Handles both DOM style updates and visual feedback
 *
 * @module engine/canvas/resize/DOMUpdater
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine/Composer";
import { activeBreakpoint, stylesAt, writeCanvasStyles } from "@/engine/commands/commandOperations";
import { scaleBounds } from "./resizeMath";
import type { TransformBounds, ResizeState } from "./types";
import { getDOMElement } from "./utils";
import { trackEvent } from "@/shared/utils/errorTracking";

// =============================================================================
// SCREEN → CSS PIXELS
// =============================================================================

/**
 * Bounds measured on screen (getBoundingClientRect, pointer deltas) in the
 * CSS pixels the page is written in. At 50 % zoom a 296 px box measures
 * 148 on screen; writing the screen number halved it on every click (BK-01).
 */
export function toCssBounds(bounds: TransformBounds, scale: number): TransformBounds {
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
  return { ...bounds, x: bounds.x / s, y: bounds.y / s, width: bounds.width / s, height: bounds.height / s };
}

const isFiniteBounds = (b: TransformBounds) =>
  [b.x, b.y, b.width, b.height].every((v) => Number.isFinite(v));

/** Which of a box's values a handle moves. */
export interface ResizeAxes {
  width: boolean;
  height: boolean;
  left: boolean;
  top: boolean;
}

/** BK-01: an E handle changes width only, never height; a corner both. */
export function axesForHandle(handle: string): ResizeAxes {
  if (handle === "rotation") return { width: false, height: false, left: false, top: false };
  return {
    width: handle.includes("e") || handle.includes("w"),
    height: handle.includes("n") || handle.includes("s"),
    left: handle.includes("w"),
    top: handle.includes("n"),
  };
}

const ALL_AXES: ResizeAxes = { width: true, height: true, left: true, top: true };

// =============================================================================
// DOM STYLE APPLICATION
// =============================================================================

/* Inline styles a gesture writes for live feedback, so they can be taken off
   when it ends (OV-E3). The canvas carries element styles as stylesheet rules
   and no longer re-renders its HTML on a style change, so an inline width
   left behind would override the committed value — or the undone one — for
   good. */
const gestureStyles = new Map<HTMLElement, Set<string>>();

function setGestureStyle(el: HTMLElement, property: string, value: string): void {
  el.style.setProperty(property, value);
  let props = gestureStyles.get(el);
  if (!props) gestureStyles.set(el, (props = new Set()));
  props.add(property);
}

/**
 * End of a gesture (commit, cancel or keyboard step): bring the stylesheet up
 * to the model first, then take the gesture's inline feedback off, so the
 * element never shows a frame of its old size in between.
 */
export function releaseGestureStyles(composer: Pick<Composer, "styles"> | null | undefined): void {
  composer?.styles?.flush?.();
  for (const [el, props] of gestureStyles) {
    for (const prop of props) el.style.removeProperty(prop);
  }
  gestureStyles.clear();
}

/**
 * Apply bounds to DOM element styles
 * Updates width, height, position, and rotation
 */
export function applyBoundsToDOM(elementId: string, bounds: TransformBounds, scale = 1): void {
  const domElement = getDOMElement(elementId);
  if (!domElement) return;
  const css = toCssBounds(bounds, scale);
  if (!isFiniteBounds(css)) return;

  setGestureStyle(domElement, "width", `${css.width}px`);
  setGestureStyle(domElement, "height", `${css.height}px`);

  const position = window.getComputedStyle(domElement).position;
  if (position === "absolute" || position === "fixed") {
    setGestureStyle(domElement, "left", `${css.x}px`);
    setGestureStyle(domElement, "top", `${css.y}px`);
  }

  if (bounds.rotation !== undefined) {
    setGestureStyle(domElement, "transform", `rotate(${bounds.rotation}deg)`);
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
    applyBoundsToDOM(elId, newBounds, state.scale);
  }
}

/**
 * Expand parent element DOM dimensions
 * Used when child resize exceeds parent bounds
 */
function expandParentDOM(
  parentElement: HTMLElement,
  newWidth: number,
  newHeight: number
): void {
  setGestureStyle(parentElement, "width", `${newWidth}px`);
  setGestureStyle(parentElement, "height", `${newHeight}px`);
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
export function applyBoundsToModel(
  elementId: string,
  bounds: TransformBounds,
  composer: Composer,
  axes: ResizeAxes = ALL_AXES,
): void {
  const element = composer.elements.getElement(elementId);
  if (!element) return;

  const current = stylesAt(composer, element, activeBreakpoint(composer));
  const candidate: Record<string, number> = {};
  if (axes.width) candidate.width = clampToConstraints(Math.round(bounds.width), current["min-width"], current["max-width"]);
  if (axes.height) candidate.height = clampToConstraints(Math.round(bounds.height), current["min-height"], current["max-height"]);
  if (current.position === "absolute" || current.position === "fixed") {
    if (axes.left) candidate.left = Math.round(bounds.x);
    if (axes.top) candidate.top = Math.round(bounds.y);
  }

  /* BK-02: a size that is not a number was stored ("NaNpx") and survived a
     reload. Nothing non-finite is written; the refusal is counted (D8). */
  const styles: Record<string, string> = {};
  let refused = 0;
  for (const [prop, value] of Object.entries(candidate)) {
    if (Number.isFinite(value)) styles[prop] = `${value}px`;
    else refused++;
  }
  if (refused > 0) trackEvent("geometry.refused", { refused });

  if (bounds.rotation !== undefined && bounds.rotation !== 0 && Number.isFinite(bounds.rotation)) {
    styles.transform = `rotate(${bounds.rotation}deg)`;
  }

  if (Object.keys(styles).length === 0) return;
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
    applyBoundsToModel(elId, toCssBounds(newBounds, state.scale), composer, axesForHandle(String(state.handle)));
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
