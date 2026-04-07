/**
 * Spacing Calculator
 * Manages spacing indicator calculations (margin/padding)
 *
 * @module engine/canvas/indicators/SpacingCalculator
 * @license BSD-3-Clause
 */

import type { SpacingIndicator } from "../../../shared/types/canvas";
import type { Composer } from "../../Composer";
import type { Element } from "../../elements/Element";
import { BoundsCalculator } from "./BoundsCalculator";

/**
 * Calculates and manages spacing indicators
 */
export class SpacingCalculator {
  private composer: Composer;
  private boundsCalculator: BoundsCalculator;
  private spacingIndicators: Map<string, SpacingIndicator[]> = new Map();

  constructor(composer: Composer, boundsCalculator: BoundsCalculator) {
    this.composer = composer;
    this.boundsCalculator = boundsCalculator;
  }

  /**
   * Update spacing indicators for all visible elements
   */
  updateSpacingIndicators(): void {
    this.spacingIndicators.clear();

    const activePage = this.composer.elements.getActivePage();
    if (!activePage) return;

    const rootElement = this.composer.elements.getElement(activePage.root.id);
    if (!rootElement) return;

    this.calculateSpacingForElement(rootElement);
  }

  /**
   * Calculate spacing indicators for an element and its children
   */
  private calculateSpacingForElement(element: Element): void {
    const bounds = this.boundsCalculator.getElementBounds(element);
    if (!bounds) return;

    const elementId = element.getId();
    const indicators: SpacingIndicator[] = [];

    // Margin indicators
    this.addMarginIndicators(elementId, bounds, indicators);
    // Padding indicators
    this.addPaddingIndicators(elementId, bounds, indicators);

    if (indicators.length > 0) {
      this.spacingIndicators.set(elementId, indicators);
    }

    // Recurse to children
    const children = element.getChildren() || [];
    children.forEach((child) => this.calculateSpacingForElement(child));
  }

  /**
   * Add margin indicators for all sides
   */
  private addMarginIndicators(
    elementId: string,
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
      margin: { top: number; right: number; bottom: number; left: number };
    },
    indicators: SpacingIndicator[]
  ): void {
    if (bounds.margin.top > 0) {
      indicators.push({
        elementId,
        type: "margin",
        side: "top",
        value: bounds.margin.top,
        position: {
          x: bounds.x,
          y: bounds.y - bounds.margin.top,
          width: bounds.width,
          height: bounds.margin.top,
        },
      });
    }

    if (bounds.margin.right > 0) {
      indicators.push({
        elementId,
        type: "margin",
        side: "right",
        value: bounds.margin.right,
        position: {
          x: bounds.x + bounds.width,
          y: bounds.y,
          width: bounds.margin.right,
          height: bounds.height,
        },
      });
    }

    if (bounds.margin.bottom > 0) {
      indicators.push({
        elementId,
        type: "margin",
        side: "bottom",
        value: bounds.margin.bottom,
        position: {
          x: bounds.x,
          y: bounds.y + bounds.height,
          width: bounds.width,
          height: bounds.margin.bottom,
        },
      });
    }

    if (bounds.margin.left > 0) {
      indicators.push({
        elementId,
        type: "margin",
        side: "left",
        value: bounds.margin.left,
        position: {
          x: bounds.x - bounds.margin.left,
          y: bounds.y,
          width: bounds.margin.left,
          height: bounds.height,
        },
      });
    }
  }

  /**
   * Add padding indicators for all sides
   */
  private addPaddingIndicators(
    elementId: string,
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
      padding: { top: number; right: number; bottom: number; left: number };
    },
    indicators: SpacingIndicator[]
  ): void {
    if (bounds.padding.top > 0) {
      indicators.push({
        elementId,
        type: "padding",
        side: "top",
        value: bounds.padding.top,
        position: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.padding.top,
        },
      });
    }

    if (bounds.padding.right > 0) {
      indicators.push({
        elementId,
        type: "padding",
        side: "right",
        value: bounds.padding.right,
        position: {
          x: bounds.x + bounds.width - bounds.padding.right,
          y: bounds.y,
          width: bounds.padding.right,
          height: bounds.height,
        },
      });
    }

    if (bounds.padding.bottom > 0) {
      indicators.push({
        elementId,
        type: "padding",
        side: "bottom",
        value: bounds.padding.bottom,
        position: {
          x: bounds.x,
          y: bounds.y + bounds.height - bounds.padding.bottom,
          width: bounds.width,
          height: bounds.padding.bottom,
        },
      });
    }

    if (bounds.padding.left > 0) {
      indicators.push({
        elementId,
        type: "padding",
        side: "left",
        value: bounds.padding.left,
        position: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.padding.left,
          height: bounds.height,
        },
      });
    }
  }

  /**
   * Get spacing indicators for an element
   */
  getSpacingIndicators(elementId: string): SpacingIndicator[] {
    return this.spacingIndicators.get(elementId) || [];
  }

  /**
   * Get all spacing indicators
   */
  getAllSpacingIndicators(): SpacingIndicator[] {
    const all: SpacingIndicator[] = [];
    for (const indicators of this.spacingIndicators.values()) {
      all.push(...indicators);
    }
    return all;
  }

  /**
   * Clear all spacing indicators
   */
  clear(): void {
    this.spacingIndicators.clear();
  }
}
