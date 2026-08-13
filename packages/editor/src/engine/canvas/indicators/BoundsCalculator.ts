/**
 * Bounds Calculator
 * Shared utility for calculating element bounds from DOM
 *
 * @module engine/canvas/indicators/BoundsCalculator
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../../shared/constants/events";
import type { ElementBounds } from "../../../shared/types/canvas";
import { parseNumericValue } from "../../../shared/utils/helpers";
import type { Composer } from "../../Composer";
import type { Element } from "../../elements/Element";

/**
 * Calculates element bounds from DOM measurements
 */
export class BoundsCalculator {
  private composer: Composer;
  private boundsCache: Map<string, ElementBounds> = new Map();
  private cacheVersion = 0;

  constructor(composer: Composer) {
    this.composer = composer;

    /* The cache is read before the DOM on every lookup, so it has to be
       dropped whenever geometry moves. SnapCalculator and SpacingCalculator
       each carried their own copy of this wiring, on four event names nothing
       emits — "element:style-changed" (the event is element:style-updated),
       "element:children-changed", "canvas:scrolled" (canvas:scroll) and
       "viewport:resized" (viewport:changed). Eight registrations, zero
       invalidations: smart guides and spacing indicators measured against
       wherever each element sat the first time it was ever measured.

       Wired here because this class owns the cache. Scroll is deliberately
       absent: bounds are stored relative to the canvas container, so scrolling
       moves both rects together and the difference is unchanged. */
    const drop = () => this.invalidateCache();
    composer.on(EVENTS.ELEMENT_UPDATED, drop);
    composer.on(EVENTS.ELEMENT_STYLE_UPDATED, drop);
    composer.on(EVENTS.ELEMENT_DELETED, drop);
    composer.on(EVENTS.VIEWPORT_ZOOM, drop);
  }

  /**
   * Get element bounds with spacing from actual DOM measurements
   * Returns coordinates relative to the canvas container
   */
  getElementBounds(element: Element): ElementBounds | null {
    if (typeof document === "undefined") return null;

    const elementId = element.getId();
    const cached = this.boundsCache.get(elementId);
    if (cached) return cached;

    const domElement = document.querySelector(
      `[data-buildrick-id="${elementId}"]`
    ) as HTMLElement | null;

    if (!domElement) return null;

    const canvasContainer = document.querySelector(
      "[data-buildrick-canvas], .buildrick-canvas"
    ) as HTMLElement | null;

    const elementRect = domElement.getBoundingClientRect();
    const containerRect = canvasContainer?.getBoundingClientRect() || {
      left: 0,
      top: 0,
    };

    const computedStyle = window.getComputedStyle(domElement);

    const bounds: ElementBounds = {
      elementId,
      x: elementRect.left - containerRect.left,
      y: elementRect.top - containerRect.top,
      width: elementRect.width,
      height: elementRect.height,
      margin: {
        top: parseNumericValue(computedStyle.marginTop),
        right: parseNumericValue(computedStyle.marginRight),
        bottom: parseNumericValue(computedStyle.marginBottom),
        left: parseNumericValue(computedStyle.marginLeft),
      },
      padding: {
        top: parseNumericValue(computedStyle.paddingTop),
        right: parseNumericValue(computedStyle.paddingRight),
        bottom: parseNumericValue(computedStyle.paddingBottom),
        left: parseNumericValue(computedStyle.paddingLeft),
      },
    };

    this.boundsCache.set(elementId, bounds);
    return bounds;
  }

  /**
   * Get bounds by element ID
   */
  getBoundsById(elementId: string): ElementBounds | null {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;
    return this.getElementBounds(element);
  }

  /**
   * Invalidate the cached bounds for a specific element, or clear the entire cache
   */
  invalidateCache(elementId?: string): void {
    if (elementId) {
      this.boundsCache.delete(elementId);
    } else {
      this.boundsCache.clear();
      this.cacheVersion++;
    }
  }

  /**
   * Get the current cache version (increments on full invalidation)
   */
  getCacheVersion(): number {
    return this.cacheVersion;
  }

  /**
   * Collect bounds for all elements except the excluded one
   */
  collectElementBounds(excludeId: string): ElementBounds[] {
    const activePage = this.composer.elements.getActivePage();
    if (!activePage) return [];

    const rootElement = this.composer.elements.getElement(activePage.root.id);
    if (!rootElement) return [];

    return this.collectBoundsRecursive(rootElement, excludeId);
  }

  /**
   * Recursively collect element bounds
   */
  private collectBoundsRecursive(element: Element, excludeId: string): ElementBounds[] {
    const bounds: ElementBounds[] = [];

    if (element.getId() !== excludeId) {
      const elementBounds = this.getElementBounds(element);
      if (elementBounds) {
        bounds.push(elementBounds);
      }
    }

    const children = element.getChildren() || [];
    for (const child of children) {
      bounds.push(...this.collectBoundsRecursive(child, excludeId));
    }

    return bounds;
  }
}
