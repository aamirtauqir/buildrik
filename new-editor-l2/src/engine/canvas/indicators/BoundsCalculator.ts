/**
 * Bounds Calculator
 * Shared utility for calculating element bounds from DOM
 *
 * @module engine/canvas/indicators/BoundsCalculator
 * @license BSD-3-Clause
 */

import type { ElementBounds } from "../../../shared/types/canvas";
import { parseNumericValue } from "../../../shared/utils/helpers";
import type { Composer } from "../../Composer";
import type { Element } from "../../elements/Element";

/**
 * Calculates element bounds from DOM measurements
 */
export class BoundsCalculator {
  private composer: Composer;

  constructor(composer: Composer) {
    this.composer = composer;
  }

  /**
   * Get element bounds with spacing from actual DOM measurements
   * Returns coordinates relative to the canvas container
   */
  getElementBounds(element: Element): ElementBounds | null {
    if (typeof document === "undefined") return null;

    const domElement = document.querySelector(
      `[data-aqb-id="${element.getId()}"]`
    ) as HTMLElement | null;

    if (!domElement) return null;

    const canvasContainer = document.querySelector(
      "[data-aqb-canvas], .aqb-canvas"
    ) as HTMLElement | null;

    const elementRect = domElement.getBoundingClientRect();
    const containerRect = canvasContainer?.getBoundingClientRect() || {
      left: 0,
      top: 0,
    };

    const computedStyle = window.getComputedStyle(domElement);

    return {
      elementId: element.getId(),
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
