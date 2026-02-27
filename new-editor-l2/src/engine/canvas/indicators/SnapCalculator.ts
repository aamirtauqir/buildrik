/**
 * Snap Calculator
 * Manages snap points and smart guides for element alignment
 *
 * @module engine/canvas/indicators/SnapCalculator
 * @license BSD-3-Clause
 */

import type {
  SnapPoint,
  SmartGuide,
  CanvasGuide,
  ElementBounds,
} from "../../../shared/types/canvas";
import type { Composer } from "../../Composer";
import type { Element } from "../../elements/Element";
import { SNAP_THRESHOLD } from "../constants";
import { BoundsCalculator } from "./BoundsCalculator";
import type { SimpleBounds } from "./types";

/**
 * Calculates snap points and smart guides
 */
export class SnapCalculator {
  private composer: Composer;
  private boundsCalculator: BoundsCalculator;
  private snapPoints: SnapPoint[] = [];
  private smartGuides: SmartGuide[] = [];

  constructor(composer: Composer, boundsCalculator: BoundsCalculator) {
    this.composer = composer;
    this.boundsCalculator = boundsCalculator;
  }

  /**
   * Calculate snap points for element positioning
   */
  calculateSnapPoints(elementId: string, guides: Map<string, CanvasGuide>): SnapPoint[] {
    this.snapPoints = [];

    // Add guide snap points
    for (const guide of guides.values()) {
      this.snapPoints.push({
        type: "guide",
        axis: guide.type === "horizontal" ? "horizontal" : "vertical",
        position: guide.position,
        guideId: guide.id,
      });
    }

    // Add edge snap points from other elements
    const activePage = this.composer.elements.getActivePage();
    if (activePage) {
      const rootElement = this.composer.elements.getElement(activePage.root.id);
      if (rootElement) {
        this.addElementSnapPoints(rootElement, elementId);
      }
    }

    return [...this.snapPoints];
  }

  /**
   * Add snap points from an element
   */
  private addElementSnapPoints(element: Element, excludeElementId: string): void {
    if (element.getId() === excludeElementId) return;

    const bounds = this.boundsCalculator.getElementBounds(element);
    if (!bounds) return;

    const elementId = element.getId();

    // Add edge snap points
    this.snapPoints.push(
      {
        type: "edge",
        axis: "horizontal",
        position: bounds.y,
        sourceElementId: elementId,
      },
      {
        type: "edge",
        axis: "horizontal",
        position: bounds.y + bounds.height,
        sourceElementId: elementId,
      },
      {
        type: "edge",
        axis: "vertical",
        position: bounds.x,
        sourceElementId: elementId,
      },
      {
        type: "edge",
        axis: "vertical",
        position: bounds.x + bounds.width,
        sourceElementId: elementId,
      }
    );

    // Add center snap points
    this.snapPoints.push(
      {
        type: "center",
        axis: "horizontal",
        position: bounds.y + bounds.height / 2,
        sourceElementId: elementId,
      },
      {
        type: "center",
        axis: "vertical",
        position: bounds.x + bounds.width / 2,
        sourceElementId: elementId,
      }
    );

    // Recurse to children
    const children = element.getChildren() || [];
    children.forEach((child) => this.addElementSnapPoints(child, excludeElementId));
  }

  /**
   * Get snap points
   */
  getSnapPoints(): SnapPoint[] {
    return [...this.snapPoints];
  }

  /**
   * Calculate smart guides during drag operation
   */
  calculateSmartGuides(draggedElementId: string, draggedBounds: SimpleBounds): SmartGuide[] {
    this.smartGuides = [];

    const otherBounds = this.boundsCalculator.collectElementBounds(draggedElementId);

    const draggedEdges = {
      left: draggedBounds.x,
      right: draggedBounds.x + draggedBounds.width,
      top: draggedBounds.y,
      bottom: draggedBounds.y + draggedBounds.height,
      centerX: draggedBounds.x + draggedBounds.width / 2,
      centerY: draggedBounds.y + draggedBounds.height / 2,
    };

    for (const other of otherBounds) {
      const otherEdges = {
        left: other.x,
        right: other.x + other.width,
        top: other.y,
        bottom: other.y + other.height,
        centerX: other.x + other.width / 2,
        centerY: other.y + other.height / 2,
      };

      // Check vertical alignments
      this.checkVerticalAlignment(
        draggedEdges.left,
        otherEdges.left,
        "edge-left",
        draggedElementId,
        other.elementId,
        draggedBounds,
        other
      );
      this.checkVerticalAlignment(
        draggedEdges.right,
        otherEdges.right,
        "edge-right",
        draggedElementId,
        other.elementId,
        draggedBounds,
        other
      );
      this.checkVerticalAlignment(
        draggedEdges.left,
        otherEdges.right,
        "edge-left",
        draggedElementId,
        other.elementId,
        draggedBounds,
        other
      );
      this.checkVerticalAlignment(
        draggedEdges.right,
        otherEdges.left,
        "edge-right",
        draggedElementId,
        other.elementId,
        draggedBounds,
        other
      );
      this.checkVerticalAlignment(
        draggedEdges.centerX,
        otherEdges.centerX,
        "center-x",
        draggedElementId,
        other.elementId,
        draggedBounds,
        other
      );

      // Check horizontal alignments
      this.checkHorizontalAlignment(
        draggedEdges.top,
        otherEdges.top,
        "edge-top",
        draggedElementId,
        other.elementId,
        draggedBounds,
        other
      );
      this.checkHorizontalAlignment(
        draggedEdges.bottom,
        otherEdges.bottom,
        "edge-bottom",
        draggedElementId,
        other.elementId,
        draggedBounds,
        other
      );
      this.checkHorizontalAlignment(
        draggedEdges.top,
        otherEdges.bottom,
        "edge-top",
        draggedElementId,
        other.elementId,
        draggedBounds,
        other
      );
      this.checkHorizontalAlignment(
        draggedEdges.bottom,
        otherEdges.top,
        "edge-bottom",
        draggedElementId,
        other.elementId,
        draggedBounds,
        other
      );
      this.checkHorizontalAlignment(
        draggedEdges.centerY,
        otherEdges.centerY,
        "center-y",
        draggedElementId,
        other.elementId,
        draggedBounds,
        other
      );
    }

    return this.smartGuides;
  }

  private checkVerticalAlignment(
    draggedPos: number,
    otherPos: number,
    alignType: SmartGuide["alignType"],
    draggedId: string,
    otherId: string,
    draggedBounds: SimpleBounds,
    otherBounds: ElementBounds
  ): void {
    if (Math.abs(draggedPos - otherPos) <= SNAP_THRESHOLD) {
      const minY = Math.min(draggedBounds.y, otherBounds.y);
      const maxY = Math.max(
        draggedBounds.y + draggedBounds.height,
        otherBounds.y + otherBounds.height
      );

      this.smartGuides.push({
        id: `sg-v-${draggedId}-${otherId}-${alignType}`,
        axis: "vertical",
        position: otherPos,
        start: minY - 10,
        end: maxY + 10,
        alignType,
        sourceElementId: otherId,
        targetElementId: draggedId,
        color: "#FF00FF",
      });
    }
  }

  private checkHorizontalAlignment(
    draggedPos: number,
    otherPos: number,
    alignType: SmartGuide["alignType"],
    draggedId: string,
    otherId: string,
    draggedBounds: SimpleBounds,
    otherBounds: ElementBounds
  ): void {
    if (Math.abs(draggedPos - otherPos) <= SNAP_THRESHOLD) {
      const minX = Math.min(draggedBounds.x, otherBounds.x);
      const maxX = Math.max(
        draggedBounds.x + draggedBounds.width,
        otherBounds.x + otherBounds.width
      );

      this.smartGuides.push({
        id: `sg-h-${draggedId}-${otherId}-${alignType}`,
        axis: "horizontal",
        position: otherPos,
        start: minX - 10,
        end: maxX + 10,
        alignType,
        sourceElementId: otherId,
        targetElementId: draggedId,
        color: "#FF00FF",
      });
    }
  }

  /**
   * Get current smart guides
   */
  getSmartGuides(): SmartGuide[] {
    return [...this.smartGuides];
  }

  /**
   * Clear smart guides
   */
  clearSmartGuides(): void {
    this.smartGuides = [];
  }
}
