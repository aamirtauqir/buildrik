/**
 * DOM Updater - Applies resize bounds to DOM elements
 * Handles both DOM style updates and visual feedback
 *
 * @module engine/canvas/resize/DOMUpdater
 * @license BSD-3-Clause
 */

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

/**
 * Apply bounds to element model
 * Updates width, height, position, and rotation in data model
 */
export function applyBoundsToModel(
  elementId: string,
  bounds: TransformBounds,
  composer: {
    elements: {
      getElement(id: string):
        | {
            getStyle?(prop: string): string | undefined;
            setStyle?(prop: string, value: string): void;
          }
        | null
        | undefined;
    };
    markDirty?(): void;
  }
): void {
  const element = composer.elements.getElement(elementId);
  if (!element) return;

  element.setStyle?.("width", `${Math.round(bounds.width)}px`);
  element.setStyle?.("height", `${Math.round(bounds.height)}px`);

  const position = element.getStyle?.("position");
  if (position === "absolute" || position === "fixed") {
    element.setStyle?.("left", `${Math.round(bounds.x)}px`);
    element.setStyle?.("top", `${Math.round(bounds.y)}px`);
  }

  if (bounds.rotation !== undefined && bounds.rotation !== 0) {
    element.setStyle?.("transform", `rotate(${bounds.rotation}deg)`);
  }

  composer.markDirty?.();
}

/**
 * Apply multi-element resize to model
 * Scales additional elements relative to primary element
 */
export function applyMultiResizeToModel(
  state: ResizeState,
  primaryBounds: TransformBounds,
  composer: {
    elements: {
      getElement(id: string):
        | {
            getStyle?(prop: string): string | undefined;
            setStyle?(prop: string, value: string): void;
          }
        | null
        | undefined;
    };
    markDirty?(): void;
  }
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
  composer: {
    elements: {
      getElement(id: string):
        | {
            setStyle?(prop: string, value: string): void;
          }
        | null
        | undefined;
    };
  }
): void {
  expandParentDOM(parentElement, newWidth, newHeight);

  const parentModel = composer.elements.getElement(parentId);
  if (parentModel) {
    parentModel.setStyle?.("width", `${Math.round(newWidth)}px`);
    parentModel.setStyle?.("height", `${Math.round(newHeight)}px`);
  }
}
