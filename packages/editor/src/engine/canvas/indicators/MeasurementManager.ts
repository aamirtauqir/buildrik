/**
 * Measurement Manager
 * Manages dimension overlays
 *
 * @module engine/canvas/indicators/MeasurementManager
 * @license BSD-3-Clause
 */

import type { DimensionOverlay } from "@/shared/types/canvas";
import type { Composer } from "@/engine/Composer";
import { BoundsCalculator } from "./BoundsCalculator";

/**
 * Manages dimension measurements
 */
export class MeasurementManager {
  private composer: Composer;
  private boundsCalculator: BoundsCalculator;
  private dimensionOverlays: Map<string, DimensionOverlay> = new Map();

  constructor(composer: Composer, boundsCalculator: BoundsCalculator) {
    this.composer = composer;
    this.boundsCalculator = boundsCalculator;
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
