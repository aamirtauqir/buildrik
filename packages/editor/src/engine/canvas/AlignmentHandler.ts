/**
 * Alignment Handler
 * Handles alignment and distribution of multiple elements.
 *
 * Geometry is the RENDERED box, measured by the chrome (the engine has no
 * DOM) — authored left/width were often absent (an in-flow element, a width
 * from a class or from its content) and defaulted to 0/100. Moves are written
 * as left/top deltas on top of the element's computed offset, which only a
 * positioned element obeys: a static (or sticky) member is never written.
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";
import { activeBreakpoint, setStyleAt, writableElements } from "@/engine/commands/commandOperations";

// ============================================================================
// TYPES
// ============================================================================

export type AlignmentAxis = "horizontal" | "vertical";
export type HorizontalAlignment = "left" | "center" | "right";
export type VerticalAlignment = "top" | "middle" | "bottom";
export type DistributionType = "horizontal" | "vertical";

/** An element's box as rendered on the canvas, in unzoomed CSS pixels. */
export interface RenderedBox {
  left: number;
  top: number;
  width: number;
  height: number;
  /** Computed `position`. */
  position: string;
  /** Computed `left` / `top` in px — the offset a move is added to. */
  cssLeft: number;
  cssTop: number;
}

/** Reads one element's rendered box; null when it is not on the canvas. */
export type MeasureBox = (id: string) => RenderedBox | null;

interface ElementBounds extends RenderedBox {
  id: string;
  right: number;
  bottom: number;
}

/** left/top move only positioned elements; static and sticky ignore them. */
export function isMovable(box: RenderedBox): boolean {
  return box.position === "absolute" || box.position === "fixed" || box.position === "relative";
}

const px = (n: number) => `${Math.round(n * 100) / 100}px`;

// ============================================================================
// ALIGNMENT HANDLER
// ============================================================================

/**
 * Handles alignment and distribution of multiple selected elements
 */
export class AlignmentHandler {
  private composer: Composer;
  private measure: MeasureBox;
  /** The members the current operation may move (unlocked). */
  private writable = new Set<string>();

  constructor(composer: Composer, measure: MeasureBox) {
    this.composer = composer;
    this.measure = measure;
  }

  /**
   * Rendered bounds for every selected element still on the canvas
   */
  private getElementBounds(elementIds: string[]): ElementBounds[] {
    /* BK-13: a locked member still anchors the alignment but is not moved —
       one "locked" toast for the whole operation (writableElements). */
    const elements = elementIds.map((id) => this.composer.elements.getElement(id));
    const kept = new Set(writableElements(this.composer, elements));
    this.writable = new Set(elementIds.filter((_, i) => elements[i] && kept.has(elements[i]!)));

    const bounds: ElementBounds[] = [];
    elementIds.forEach((id, i) => {
      const box = elements[i] ? this.measure(id) : null;
      if (box) bounds.push({ ...box, id, right: box.left + box.width, bottom: box.top + box.height });
    });
    return bounds;
  }

  /**
   * Align elements horizontally
   */
  alignHorizontal(elementIds: string[], alignment: HorizontalAlignment): void {
    if (elementIds.length < 2) return;

    const bounds = this.getElementBounds(elementIds);
    if (bounds.length < 2) return;

    this.composer.beginTransaction?.("align-horizontal");

    try {
      // Find the reference point based on alignment type
      let referenceX: number;

      switch (alignment) {
        case "left":
          referenceX = Math.min(...bounds.map((b) => b.left));
          bounds.forEach((b) => {
            this.setElementPosition(b, referenceX, undefined);
          });
          break;

        case "center": {
          const minLeft = Math.min(...bounds.map((b) => b.left));
          const maxRight = Math.max(...bounds.map((b) => b.right));
          referenceX = (minLeft + maxRight) / 2;
          bounds.forEach((b) => {
            const newLeft = referenceX - b.width / 2;
            this.setElementPosition(b, newLeft, undefined);
          });
          break;
        }

        case "right":
          referenceX = Math.max(...bounds.map((b) => b.right));
          bounds.forEach((b) => {
            const newLeft = referenceX - b.width;
            this.setElementPosition(b, newLeft, undefined);
          });
          break;
      }
    } finally {
      this.composer.endTransaction?.();
    }
  }

  /**
   * Align elements vertically
   */
  alignVertical(elementIds: string[], alignment: VerticalAlignment): void {
    if (elementIds.length < 2) return;

    const bounds = this.getElementBounds(elementIds);
    if (bounds.length < 2) return;

    this.composer.beginTransaction?.("align-vertical");

    try {
      let referenceY: number;

      switch (alignment) {
        case "top":
          referenceY = Math.min(...bounds.map((b) => b.top));
          bounds.forEach((b) => {
            this.setElementPosition(b, undefined, referenceY);
          });
          break;

        case "middle": {
          const minTop = Math.min(...bounds.map((b) => b.top));
          const maxBottom = Math.max(...bounds.map((b) => b.bottom));
          referenceY = (minTop + maxBottom) / 2;
          bounds.forEach((b) => {
            const newTop = referenceY - b.height / 2;
            this.setElementPosition(b, undefined, newTop);
          });
          break;
        }

        case "bottom":
          referenceY = Math.max(...bounds.map((b) => b.bottom));
          bounds.forEach((b) => {
            const newTop = referenceY - b.height;
            this.setElementPosition(b, undefined, newTop);
          });
          break;
      }
    } finally {
      this.composer.endTransaction?.();
    }
  }

  /**
   * Distribute elements evenly
   */
  distribute(elementIds: string[], direction: DistributionType): void {
    if (elementIds.length < 3) return;

    const bounds = this.getElementBounds(elementIds);
    if (bounds.length < 3) return;

    this.composer.beginTransaction?.("distribute");

    try {
      if (direction === "horizontal") {
        // Sort by left position
        bounds.sort((a, b) => a.left - b.left);

        const totalWidth = bounds.reduce((sum, b) => sum + b.width, 0);
        const leftMost = bounds[0].left;
        const rightMost = bounds[bounds.length - 1].right;
        const availableSpace = rightMost - leftMost - totalWidth;
        const gap = availableSpace / (bounds.length - 1);

        let currentX = leftMost;
        bounds.forEach((b) => {
          this.setElementPosition(b, currentX, undefined);
          currentX += b.width + gap;
        });
      } else {
        // Sort by top position
        bounds.sort((a, b) => a.top - b.top);

        const totalHeight = bounds.reduce((sum, b) => sum + b.height, 0);
        const topMost = bounds[0].top;
        const bottomMost = bounds[bounds.length - 1].bottom;
        const availableSpace = bottomMost - topMost - totalHeight;
        const gap = availableSpace / (bounds.length - 1);

        let currentY = topMost;
        bounds.forEach((b) => {
          this.setElementPosition(b, undefined, currentY);
          currentY += b.height + gap;
        });
      }
    } finally {
      this.composer.endTransaction?.();
    }
  }

  /**
   * Move a member so its rendered box starts at left/top (canvas px)
   */
  private setElementPosition(b: ElementBounds, left: number | undefined, top: number | undefined): void {
    const el = this.composer.elements.getElement(b.id);
    if (!el || !this.writable.has(b.id) || !isMovable(b)) return;
    const breakpoint = activeBreakpoint(this.composer);

    if (left !== undefined) {
      setStyleAt(this.composer, el, breakpoint, "left", px(b.cssLeft + left - b.left));
    }
    if (top !== undefined) {
      setStyleAt(this.composer, el, breakpoint, "top", px(b.cssTop + top - b.top));
    }
  }
}
