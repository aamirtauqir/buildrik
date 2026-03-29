/**
 * Measurement Manager
 * Manages distance measurements and dimension overlays
 *
 * @module engine/canvas/indicators/MeasurementManager
 * @license BSD-3-Clause
 */

import type {
  DistanceMeasurement,
  DimensionOverlay,
  ElementBounds,
} from "../../../shared/types/canvas";
import type { Composer } from "../../Composer";
import { BoundsCalculator } from "./BoundsCalculator";

/**
 * Manages distance and dimension measurements
 */
export class MeasurementManager {
  private composer: Composer;
  private boundsCalculator: BoundsCalculator;
  private distanceMeasurements: DistanceMeasurement[] = [];
  private dimensionOverlays: Map<string, DimensionOverlay> = new Map();

  constructor(composer: Composer, boundsCalculator: BoundsCalculator) {
    this.composer = composer;
    this.boundsCalculator = boundsCalculator;
  }

  /**
   * Calculate distance measurements between selected element and others
   */
  calculateDistanceMeasurements(
    elementId: string,
    targetElementId?: string
  ): DistanceMeasurement[] {
    this.distanceMeasurements = [];

    const element = this.composer.elements.getElement(elementId);
    if (!element) return this.distanceMeasurements;

    const bounds = this.boundsCalculator.getElementBounds(element);
    if (!bounds) return this.distanceMeasurements;

    if (targetElementId) {
      const targetElement = this.composer.elements.getElement(targetElementId);
      if (targetElement) {
        const targetBounds = this.boundsCalculator.getElementBounds(targetElement);
        if (targetBounds) {
          this.addDistanceMeasurements(bounds, targetBounds, elementId, targetElementId);
        }
      }
    } else {
      const allBounds = this.boundsCalculator.collectElementBounds(elementId);
      for (const otherBounds of allBounds) {
        this.addDistanceMeasurements(bounds, otherBounds, elementId, otherBounds.elementId);
      }
    }

    return this.distanceMeasurements;
  }

  private addDistanceMeasurements(
    fromBounds: ElementBounds,
    toBounds: ElementBounds,
    fromId: string,
    toId: string
  ): void {
    // Horizontal distance (from is left of to)
    if (fromBounds.x + fromBounds.width < toBounds.x) {
      const distance = toBounds.x - (fromBounds.x + fromBounds.width);
      const midY =
        Math.max(fromBounds.y, toBounds.y) +
        Math.min(fromBounds.y + fromBounds.height, toBounds.y + toBounds.height) / 2;

      this.distanceMeasurements.push({
        id: `dm-h-${fromId}-${toId}`,
        fromElementId: fromId,
        toElementId: toId,
        distance: Math.round(distance),
        direction: "horizontal",
        lineStart: { x: fromBounds.x + fromBounds.width, y: midY },
        lineEnd: { x: toBounds.x, y: midY },
        labelPosition: {
          x: fromBounds.x + fromBounds.width + distance / 2,
          y: midY - 10,
        },
      });
    } else if (toBounds.x + toBounds.width < fromBounds.x) {
      // To is left of from
      const distance = fromBounds.x - (toBounds.x + toBounds.width);
      const midY =
        Math.max(fromBounds.y, toBounds.y) +
        Math.min(fromBounds.y + fromBounds.height, toBounds.y + toBounds.height) / 2;

      this.distanceMeasurements.push({
        id: `dm-h-${fromId}-${toId}`,
        fromElementId: fromId,
        toElementId: toId,
        distance: Math.round(distance),
        direction: "horizontal",
        lineStart: { x: toBounds.x + toBounds.width, y: midY },
        lineEnd: { x: fromBounds.x, y: midY },
        labelPosition: {
          x: toBounds.x + toBounds.width + distance / 2,
          y: midY - 10,
        },
      });
    }

    // Vertical distance (from is above to)
    if (fromBounds.y + fromBounds.height < toBounds.y) {
      const distance = toBounds.y - (fromBounds.y + fromBounds.height);
      const midX =
        Math.max(fromBounds.x, toBounds.x) +
        Math.min(fromBounds.x + fromBounds.width, toBounds.x + toBounds.width) / 2;

      this.distanceMeasurements.push({
        id: `dm-v-${fromId}-${toId}`,
        fromElementId: fromId,
        toElementId: toId,
        distance: Math.round(distance),
        direction: "vertical",
        lineStart: { x: midX, y: fromBounds.y + fromBounds.height },
        lineEnd: { x: midX, y: toBounds.y },
        labelPosition: {
          x: midX + 5,
          y: fromBounds.y + fromBounds.height + distance / 2,
        },
      });
    } else if (toBounds.y + toBounds.height < fromBounds.y) {
      // To is above from
      const distance = fromBounds.y - (toBounds.y + toBounds.height);
      const midX =
        Math.max(fromBounds.x, toBounds.x) +
        Math.min(fromBounds.x + fromBounds.width, toBounds.x + toBounds.width) / 2;

      this.distanceMeasurements.push({
        id: `dm-v-${fromId}-${toId}`,
        fromElementId: fromId,
        toElementId: toId,
        distance: Math.round(distance),
        direction: "vertical",
        lineStart: { x: midX, y: toBounds.y + toBounds.height },
        lineEnd: { x: midX, y: fromBounds.y },
        labelPosition: {
          x: midX + 5,
          y: toBounds.y + toBounds.height + distance / 2,
        },
      });
    }
  }

  /**
   * Get current distance measurements
   */
  getDistanceMeasurements(): DistanceMeasurement[] {
    return [...this.distanceMeasurements];
  }

  /**
   * Clear distance measurements
   */
  clearDistanceMeasurements(): void {
    this.distanceMeasurements = [];
  }

  /**
   * Show dimension overlay for an element
   */
  showDimensionOverlay(elementId: string): DimensionOverlay | null {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;

    const bounds = this.boundsCalculator.getElementBounds(element);
    if (!bounds) return null;

    const overlay: DimensionOverlay = {
      elementId,
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
      labelPosition: "bottom",
      labelCoords: {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height + 5,
      },
      showWidth: true,
      showHeight: true,
      format: "compact",
    };

    // Adjust position if near bottom edge
    if (bounds.y + bounds.height > window.innerHeight - 30) {
      overlay.labelPosition = "top";
      overlay.labelCoords.y = bounds.y - 20;
    }

    this.dimensionOverlays.set(elementId, overlay);
    return overlay;
  }

  /**
   * Hide dimension overlay for an element
   */
  hideDimensionOverlay(elementId: string): boolean {
    return this.dimensionOverlays.delete(elementId);
  }

  /**
   * Get dimension overlay for an element
   */
  getDimensionOverlay(elementId: string): DimensionOverlay | undefined {
    return this.dimensionOverlays.get(elementId);
  }

  /**
   * Get all dimension overlays
   */
  getAllDimensionOverlays(): DimensionOverlay[] {
    return Array.from(this.dimensionOverlays.values());
  }

  /**
   * Clear all dimension overlays
   */
  clearDimensionOverlays(): void {
    this.dimensionOverlays.clear();
  }
}
