/**
 * Guide Manager
 * Manages canvas guides, rulers, and parent boundary alignment
 *
 * @module engine/canvas/indicators/GuideManager
 * @license BSD-3-Clause
 */

import type { CanvasGuide, RulerConfig, ParentBoundaryGuide } from "../../../shared/types/canvas";
import type { Composer } from "../../Composer";
import { BoundsCalculator } from "./BoundsCalculator";

/**
 * Manages guides, rulers, and parent boundaries
 */
export class GuideManager {
  private composer: Composer;
  private boundsCalculator: BoundsCalculator;
  private guides: Map<string, CanvasGuide> = new Map();
  private rulerConfig: RulerConfig;
  private parentBoundaryGuides: ParentBoundaryGuide[] = [];

  constructor(composer: Composer, boundsCalculator: BoundsCalculator) {
    this.composer = composer;
    this.boundsCalculator = boundsCalculator;

    // Default ruler configuration
    this.rulerConfig = {
      showHorizontal: false,
      showVertical: false,
      size: 20,
      majorTickInterval: 100,
      minorTickInterval: 10,
      showNumbers: true,
      backgroundColor: "#f5f5f5",
      tickColor: "#999",
      zoom: 1,
      scrollOffset: { x: 0, y: 0 },
    };
  }

  // ============================================
  // Guides
  // ============================================

  /**
   * Add guide
   */
  addGuide(guide: CanvasGuide): void {
    this.guides.set(guide.id, guide);
  }

  /**
   * Remove guide
   */
  removeGuide(guideId: string): boolean {
    return this.guides.delete(guideId);
  }

  /**
   * Get all guides
   */
  getGuides(): CanvasGuide[] {
    return Array.from(this.guides.values());
  }

  /**
   * Get guides map (for snap calculations)
   */
  getGuidesMap(): Map<string, CanvasGuide> {
    return this.guides;
  }

  /**
   * Clear all guides
   */
  clearGuides(): void {
    this.guides.clear();
  }

  // ============================================
  // Rulers
  // ============================================

  /**
   * Update ruler configuration
   */
  updateRulerConfig(updates: Partial<RulerConfig>): void {
    Object.assign(this.rulerConfig, updates);
  }

  /**
   * Get ruler configuration
   */
  getRulerConfig(): RulerConfig {
    return { ...this.rulerConfig };
  }

  /**
   * Update ruler scroll offset
   */
  updateRulerScroll(scrollOffset: { x: number; y: number }): void {
    this.rulerConfig.scrollOffset = scrollOffset;
  }

  /**
   * Update ruler zoom level
   */
  updateRulerZoom(zoom: number): void {
    this.rulerConfig.zoom = zoom;
  }

  /**
   * Toggle rulers visibility
   */
  toggleRulers(show?: boolean): boolean {
    const shouldShow = show !== undefined ? show : !this.rulerConfig.showHorizontal;
    this.rulerConfig.showHorizontal = shouldShow;
    this.rulerConfig.showVertical = shouldShow;
    return shouldShow;
  }

  // ============================================
  // Parent Boundary Guides
  // ============================================

  /**
   * Calculate alignment guides relative to parent
   */
  calculateParentBoundaryGuides(elementId: string): ParentBoundaryGuide | null {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;

    const parent = element.getParent?.();
    if (!parent) return null;

    const elementBounds = this.boundsCalculator.getElementBounds(element);
    const parentBounds = this.boundsCalculator.getElementBounds(parent);

    if (!elementBounds || !parentBounds) return null;

    const THRESHOLD = 2;
    const alignedEdges: ParentBoundaryGuide["alignedEdges"] = [];

    // Check top alignment
    if (Math.abs(elementBounds.y - parentBounds.y) <= THRESHOLD) {
      alignedEdges.push({
        edge: "top",
        position: parentBounds.y,
        lineStart: { x: parentBounds.x, y: parentBounds.y },
        lineEnd: { x: parentBounds.x + parentBounds.width, y: parentBounds.y },
      });
    }

    // Check bottom alignment
    if (
      Math.abs(elementBounds.y + elementBounds.height - (parentBounds.y + parentBounds.height)) <=
      THRESHOLD
    ) {
      const y = parentBounds.y + parentBounds.height;
      alignedEdges.push({
        edge: "bottom",
        position: y,
        lineStart: { x: parentBounds.x, y },
        lineEnd: { x: parentBounds.x + parentBounds.width, y },
      });
    }

    // Check left alignment
    if (Math.abs(elementBounds.x - parentBounds.x) <= THRESHOLD) {
      alignedEdges.push({
        edge: "left",
        position: parentBounds.x,
        lineStart: { x: parentBounds.x, y: parentBounds.y },
        lineEnd: { x: parentBounds.x, y: parentBounds.y + parentBounds.height },
      });
    }

    // Check right alignment
    if (
      Math.abs(elementBounds.x + elementBounds.width - (parentBounds.x + parentBounds.width)) <=
      THRESHOLD
    ) {
      const x = parentBounds.x + parentBounds.width;
      alignedEdges.push({
        edge: "right",
        position: x,
        lineStart: { x, y: parentBounds.y },
        lineEnd: { x, y: parentBounds.y + parentBounds.height },
      });
    }

    // Check center-x alignment
    const elementCenterX = elementBounds.x + elementBounds.width / 2;
    const parentCenterX = parentBounds.x + parentBounds.width / 2;
    if (Math.abs(elementCenterX - parentCenterX) <= THRESHOLD) {
      alignedEdges.push({
        edge: "center-x",
        position: parentCenterX,
        lineStart: { x: parentCenterX, y: parentBounds.y },
        lineEnd: { x: parentCenterX, y: parentBounds.y + parentBounds.height },
      });
    }

    // Check center-y alignment
    const elementCenterY = elementBounds.y + elementBounds.height / 2;
    const parentCenterY = parentBounds.y + parentBounds.height / 2;
    if (Math.abs(elementCenterY - parentCenterY) <= THRESHOLD) {
      alignedEdges.push({
        edge: "center-y",
        position: parentCenterY,
        lineStart: { x: parentBounds.x, y: parentCenterY },
        lineEnd: { x: parentBounds.x + parentBounds.width, y: parentCenterY },
      });
    }

    const guide: ParentBoundaryGuide = {
      elementId,
      parentId: parent.getId(),
      alignedEdges,
      edgeDistances: {
        top: elementBounds.y - parentBounds.y,
        right: parentBounds.x + parentBounds.width - (elementBounds.x + elementBounds.width),
        bottom: parentBounds.y + parentBounds.height - (elementBounds.y + elementBounds.height),
        left: elementBounds.x - parentBounds.x,
      },
    };

    this.parentBoundaryGuides = [guide];
    return guide;
  }

  /**
   * Get parent boundary guides
   */
  getParentBoundaryGuides(): ParentBoundaryGuide[] {
    return [...this.parentBoundaryGuides];
  }

  /**
   * Clear parent boundary guides
   */
  clearParentBoundaryGuides(): void {
    this.parentBoundaryGuides = [];
  }
}
