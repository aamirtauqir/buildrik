/**
 * Selection Indicator Manager
 * Manages selection boxes (VISUAL ONLY)
 *
 * NOTE: This class is responsible for VISUAL RENDERING of selection,
 * NOT the selection state itself. Selection state is managed by
 * engine/SelectionManager.ts (the SSOT for which elements are selected).
 *
 * @module engine/canvas/indicators/SelectionIndicatorManager
 * @license BSD-3-Clause
 */

import type { SelectionBox } from "@/shared/types/canvas";
import type { Composer } from "@/engine/Composer";
import { CANVAS_COLORS as COLORS } from "@/shared/constants/canvas";
import { BoundsCalculator } from "./BoundsCalculator";

/**
 * Manages selection boxes (visual indicators only)
 * Renamed from SelectionManager to avoid confusion with engine/SelectionManager.ts
 */
export class SelectionIndicatorManager {
  private composer: Composer;
  private boundsCalculator: BoundsCalculator;
  private selectionBoxes: Map<string, SelectionBox> = new Map();

  constructor(composer: Composer, boundsCalculator: BoundsCalculator) {
    this.composer = composer;
    this.boundsCalculator = boundsCalculator;
  }

  /**
   * Create selection box for an element
   */
  createSelectionBox(elementId: string, isMultiSelect = false): SelectionBox | null {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;

    const bounds = this.boundsCalculator.getElementBounds(element);
    if (!bounds) return null;

    const ROTATION_OFFSET = 20;

    const handles: SelectionBox["handles"] = [
      { position: "nw", x: bounds.x, y: bounds.y, cursor: "nwse-resize" },
      { position: "n", x: bounds.x + bounds.width / 2, y: bounds.y, cursor: "ns-resize" },
      { position: "ne", x: bounds.x + bounds.width, y: bounds.y, cursor: "nesw-resize" },
      {
        position: "e",
        x: bounds.x + bounds.width,
        y: bounds.y + bounds.height / 2,
        cursor: "ew-resize",
      },
      {
        position: "se",
        x: bounds.x + bounds.width,
        y: bounds.y + bounds.height,
        cursor: "nwse-resize",
      },
      {
        position: "s",
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height,
        cursor: "ns-resize",
      },
      { position: "sw", x: bounds.x, y: bounds.y + bounds.height, cursor: "nesw-resize" },
      { position: "w", x: bounds.x, y: bounds.y + bounds.height / 2, cursor: "ew-resize" },
    ];

    const selectionBox: SelectionBox = {
      elementId,
      bounds: {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
      handles,
      rotationHandle: {
        x: bounds.x + bounds.width / 2,
        y: bounds.y - ROTATION_OFFSET,
        angle: 0,
      },
      color: COLORS.SELECTION,
      isMultiSelect,
      isLocked: false,
    };

    this.selectionBoxes.set(elementId, selectionBox);
    return selectionBox;
  }

  /**
   * Get all selection boxes
   */
  getAllSelectionBoxes(): SelectionBox[] {
    return Array.from(this.selectionBoxes.values());
  }

  /**
   * Clear all selection boxes
   */
  clearAllSelectionBoxes(): void {
    this.selectionBoxes.clear();
  }
}
