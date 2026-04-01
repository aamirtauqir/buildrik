/**
 * Selection Indicator Manager
 * Manages selection boxes and hover highlights (VISUAL ONLY)
 *
 * NOTE: This class is responsible for VISUAL RENDERING of selection,
 * NOT the selection state itself. Selection state is managed by
 * engine/SelectionManager.ts (the SSOT for which elements are selected).
 *
 * @module engine/canvas/indicators/SelectionIndicatorManager
 * @license BSD-3-Clause
 */

import type { SelectionBox, HoverHighlight } from "../../../shared/types/canvas";
import type { Composer } from "../../Composer";
import { CANVAS_COLORS as COLORS } from "../constants";
import { BoundsCalculator } from "./BoundsCalculator";

/**
 * Manages selection boxes and hover highlights (visual indicators only)
 * Renamed from SelectionManager to avoid confusion with engine/SelectionManager.ts
 */
export class SelectionIndicatorManager {
  private composer: Composer;
  private boundsCalculator: BoundsCalculator;
  private selectionBoxes: Map<string, SelectionBox> = new Map();
  private hoverHighlight: HoverHighlight | null = null;

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
   * Create multi-selection bounding box
   */
  createMultiSelectionBox(elementIds: string[]): SelectionBox | null {
    if (elementIds.length === 0) return null;

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (const id of elementIds) {
      const element = this.composer.elements.getElement(id);
      if (!element) continue;
      const bounds = this.boundsCalculator.getElementBounds(element);
      if (!bounds) continue;

      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }

    if (minX === Infinity) return null;

    const combinedBounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    const handles: SelectionBox["handles"] = [
      { position: "nw", x: combinedBounds.x, y: combinedBounds.y, cursor: "nwse-resize" },
      {
        position: "n",
        x: combinedBounds.x + combinedBounds.width / 2,
        y: combinedBounds.y,
        cursor: "ns-resize",
      },
      {
        position: "ne",
        x: combinedBounds.x + combinedBounds.width,
        y: combinedBounds.y,
        cursor: "nesw-resize",
      },
      {
        position: "e",
        x: combinedBounds.x + combinedBounds.width,
        y: combinedBounds.y + combinedBounds.height / 2,
        cursor: "ew-resize",
      },
      {
        position: "se",
        x: combinedBounds.x + combinedBounds.width,
        y: combinedBounds.y + combinedBounds.height,
        cursor: "nwse-resize",
      },
      {
        position: "s",
        x: combinedBounds.x + combinedBounds.width / 2,
        y: combinedBounds.y + combinedBounds.height,
        cursor: "ns-resize",
      },
      {
        position: "sw",
        x: combinedBounds.x,
        y: combinedBounds.y + combinedBounds.height,
        cursor: "nesw-resize",
      },
      {
        position: "w",
        x: combinedBounds.x,
        y: combinedBounds.y + combinedBounds.height / 2,
        cursor: "ew-resize",
      },
    ];

    const multiBox: SelectionBox = {
      elementId: `multi-${elementIds.join("-")}`,
      bounds: combinedBounds,
      handles,
      color: COLORS.SELECTION,
      isMultiSelect: true,
      isLocked: false,
    };

    this.selectionBoxes.set(multiBox.elementId, multiBox);
    return multiBox;
  }

  /**
   * Get selection box for element
   */
  getSelectionBox(elementId: string): SelectionBox | undefined {
    return this.selectionBoxes.get(elementId);
  }

  /**
   * Get all selection boxes
   */
  getAllSelectionBoxes(): SelectionBox[] {
    return Array.from(this.selectionBoxes.values());
  }

  /**
   * Clear selection box
   */
  clearSelectionBox(elementId: string): boolean {
    return this.selectionBoxes.delete(elementId);
  }

  /**
   * Clear all selection boxes
   */
  clearAllSelectionBoxes(): void {
    this.selectionBoxes.clear();
  }

  /**
   * Show hover highlight on element
   */
  showHoverHighlight(elementId: string): HoverHighlight | null {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;

    const bounds = this.boundsCalculator.getElementBounds(element);
    if (!bounds) return null;

    this.hoverHighlight = {
      elementId,
      bounds: {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
      tagName: element.getTagName?.() || "div",
      label: element.getAttribute?.("class") || element.getAttribute?.("id"),
      color: COLORS.HOVER,
    };

    return this.hoverHighlight;
  }

  /**
   * Get current hover highlight
   */
  getHoverHighlight(): HoverHighlight | null {
    return this.hoverHighlight;
  }

  /**
   * Clear hover highlight
   */
  clearHoverHighlight(): void {
    this.hoverHighlight = null;
  }
}
