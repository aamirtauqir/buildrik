/**
 * Auto Layout Manager - Manages auto-layout, gap highlights, and equal spacing
 * @module engine/canvas/indicators/AutoLayoutManager
 * @license BSD-3-Clause
 */

import type {
  AutoLayoutIndicator,
  GapHighlight,
  EqualSpacingIndicator,
  ElementBounds,
} from "../../../shared/types/canvas";
import { parseNumericValue } from "../../../shared/utils/helpers";
import type { Composer } from "../../Composer";
import { BoundsCalculator } from "./BoundsCalculator";

/** Manages auto-layout, gap, and equal spacing indicators */
export class AutoLayoutManager {
  private composer: Composer;
  private boundsCalculator: BoundsCalculator;
  private autoLayoutIndicators: Map<string, AutoLayoutIndicator> = new Map();
  private gapHighlights: GapHighlight[] = [];
  private equalSpacingIndicators: EqualSpacingIndicator[] = [];

  constructor(composer: Composer, boundsCalculator: BoundsCalculator) {
    this.composer = composer;
    this.boundsCalculator = boundsCalculator;
  }

  /** Show auto-layout indicators for flex/grid containers */
  showAutoLayoutIndicator(elementId: string): AutoLayoutIndicator | null {
    if (typeof document === "undefined") return null;
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;
    const domElement = document.querySelector(`[data-aqb-id="${elementId}"]`) as HTMLElement | null;
    if (!domElement) return null;

    const computedStyle = window.getComputedStyle(domElement);
    const display = computedStyle.display;
    let layoutType: AutoLayoutIndicator["layoutType"] = "none";
    let flexDirection: AutoLayoutIndicator["flexDirection"];

    if (display === "flex" || display === "inline-flex") {
      layoutType = "flex";
      flexDirection = computedStyle.flexDirection as "row" | "column";
    } else if (display === "grid" || display === "inline-grid") {
      layoutType = "grid";
    }
    if (layoutType === "none") return null;

    const gap = parseNumericValue(computedStyle.gap) || 0;
    const padding = {
      top: parseNumericValue(computedStyle.paddingTop),
      right: parseNumericValue(computedStyle.paddingRight),
      bottom: parseNumericValue(computedStyle.paddingBottom),
      left: parseNumericValue(computedStyle.paddingLeft),
    };

    const children = element.getChildren?.() || [];
    const childSpacing: AutoLayoutIndicator["childSpacing"] = [];
    for (let i = 0; i < children.length - 1; i++) {
      const curB = this.boundsCalculator.getElementBounds(children[i]);
      const nextB = this.boundsCalculator.getElementBounds(children[i + 1]);
      if (curB && nextB) {
        const isRow = flexDirection === "row";
        childSpacing.push({
          afterElementId: children[i].getId(),
          gapLine: {
            start: isRow
              ? { x: curB.x + curB.width, y: curB.y + curB.height / 2 }
              : { x: curB.x + curB.width / 2, y: curB.y + curB.height },
            end: isRow
              ? { x: nextB.x, y: nextB.y + nextB.height / 2 }
              : { x: nextB.x + nextB.width / 2, y: nextB.y },
          },
        });
      }
    }

    const indicator: AutoLayoutIndicator = {
      elementId,
      layoutType,
      flexDirection,
      gap,
      padding,
      childSpacing,
    };
    this.autoLayoutIndicators.set(elementId, indicator);
    return indicator;
  }

  getAutoLayoutIndicator(elementId: string): AutoLayoutIndicator | undefined {
    return this.autoLayoutIndicators.get(elementId);
  }
  getAllAutoLayoutIndicators(): AutoLayoutIndicator[] {
    return Array.from(this.autoLayoutIndicators.values());
  }
  clearAutoLayoutIndicator(elementId: string): boolean {
    return this.autoLayoutIndicators.delete(elementId);
  }
  clearAllAutoLayoutIndicators(): void {
    this.autoLayoutIndicators.clear();
  }

  /** Highlight gaps between elements */
  highlightGaps(parentId: string): GapHighlight[] {
    this.gapHighlights = [];
    const parent = this.composer.elements.getElement(parentId);
    if (!parent) return this.gapHighlights;
    const children = parent.getChildren?.() || [];
    if (children.length < 2) return this.gapHighlights;

    const childBounds: Array<{ id: string; bounds: ElementBounds }> = [];
    for (const child of children) {
      const bounds = this.boundsCalculator.getElementBounds(child);
      if (bounds) childBounds.push({ id: child.getId(), bounds });
    }

    // Horizontal gaps
    const sortedX = [...childBounds].sort((a, b) => a.bounds.x - b.bounds.x);
    for (let i = 0; i < sortedX.length - 1; i++) {
      const cur = sortedX[i],
        next = sortedX[i + 1];
      const gapX = next.bounds.x - (cur.bounds.x + cur.bounds.width);
      if (gapX > 0) {
        this.gapHighlights.push({
          id: `gap-h-${cur.id}-${next.id}`,
          direction: "horizontal",
          size: gapX,
          area: {
            x: cur.bounds.x + cur.bounds.width,
            y: Math.min(cur.bounds.y, next.bounds.y),
            width: gapX,
            height: Math.max(cur.bounds.height, next.bounds.height),
          },
          betweenElements: [cur.id, next.id],
        });
      }
    }

    // Vertical gaps
    const sortedY = [...childBounds].sort((a, b) => a.bounds.y - b.bounds.y);
    for (let i = 0; i < sortedY.length - 1; i++) {
      const cur = sortedY[i],
        next = sortedY[i + 1];
      const gapY = next.bounds.y - (cur.bounds.y + cur.bounds.height);
      if (gapY > 0) {
        this.gapHighlights.push({
          id: `gap-v-${cur.id}-${next.id}`,
          direction: "vertical",
          size: gapY,
          area: {
            x: Math.min(cur.bounds.x, next.bounds.x),
            y: cur.bounds.y + cur.bounds.height,
            width: Math.max(cur.bounds.width, next.bounds.width),
            height: gapY,
          },
          betweenElements: [cur.id, next.id],
        });
      }
    }
    return this.gapHighlights;
  }

  getGapHighlights(): GapHighlight[] {
    return [...this.gapHighlights];
  }
  clearGapHighlights(): void {
    this.gapHighlights = [];
  }

  /** Detect equal spacing between sibling elements */
  detectEqualSpacing(elementIds: string[]): EqualSpacingIndicator[] {
    this.equalSpacingIndicators = [];
    if (elementIds.length < 3) return this.equalSpacingIndicators;

    const boundsMap = new Map<string, ElementBounds>();
    for (const id of elementIds) {
      const element = this.composer.elements.getElement(id);
      if (element) {
        const bounds = this.boundsCalculator.getElementBounds(element);
        if (bounds) boundsMap.set(id, bounds);
      }
    }
    if (boundsMap.size < 3) return this.equalSpacingIndicators;

    const entries = Array.from(boundsMap.entries());
    const h = this.checkEqualSpacingDirection(entries, "horizontal");
    if (h) this.equalSpacingIndicators.push(h);
    const v = this.checkEqualSpacingDirection(entries, "vertical");
    if (v) this.equalSpacingIndicators.push(v);
    return this.equalSpacingIndicators;
  }

  private checkEqualSpacingDirection(
    elements: [string, ElementBounds][],
    direction: "horizontal" | "vertical"
  ): EqualSpacingIndicator | null {
    const sorted = [...elements].sort((a, b) =>
      direction === "horizontal" ? a[1].x - b[1].x : a[1].y - b[1].y
    );
    const gaps: number[] = [];
    const gapLines: EqualSpacingIndicator["gapLines"] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const cur = sorted[i][1],
        next = sorted[i + 1][1];
      let gap: number, start: { x: number; y: number }, end: { x: number; y: number };
      if (direction === "horizontal") {
        gap = next.x - (cur.x + cur.width);
        const midY = Math.max(cur.y, next.y) + Math.min(cur.height, next.height) / 2;
        start = { x: cur.x + cur.width, y: midY };
        end = { x: next.x, y: midY };
      } else {
        gap = next.y - (cur.y + cur.height);
        const midX = Math.max(cur.x, next.x) + Math.min(cur.width, next.width) / 2;
        start = { x: midX, y: cur.y + cur.height };
        end = { x: midX, y: next.y };
      }
      gaps.push(gap);
      gapLines.push({
        start,
        end,
        midpoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      });
    }

    const TOLERANCE = 1;
    const firstGap = gaps[0];
    const isEqual = gaps.every((g) => Math.abs(g - firstGap) <= TOLERANCE);
    if (isEqual && firstGap > 0) {
      return {
        id: `es-${direction}-${sorted.map((s) => s[0]).join("-")}`,
        direction,
        spacing: Math.round(firstGap),
        elementIds: sorted.map((s) => s[0]),
        gapLines,
        isEqual: true,
      };
    }
    return null;
  }

  getEqualSpacingIndicators(): EqualSpacingIndicator[] {
    return [...this.equalSpacingIndicators];
  }
  clearEqualSpacingIndicators(): void {
    this.equalSpacingIndicators = [];
  }
}
