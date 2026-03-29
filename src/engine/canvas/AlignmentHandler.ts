/**
 * Alignment Handler
 * Handles alignment and distribution of multiple elements
 * @license BSD-3-Clause
 */

import type { Composer } from "../../engine";

// ============================================================================
// TYPES
// ============================================================================

export type AlignmentAxis = "horizontal" | "vertical";
export type HorizontalAlignment = "left" | "center" | "right";
export type VerticalAlignment = "top" | "middle" | "bottom";
export type DistributionType = "horizontal" | "vertical";

interface ElementBounds {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

// ============================================================================
// ALIGNMENT HANDLER
// ============================================================================

/**
 * Handles alignment and distribution of multiple selected elements
 */
export class AlignmentHandler {
  private composer: Composer;

  constructor(composer: Composer) {
    this.composer = composer;
  }

  /**
   * Get bounds for all selected elements
   */
  private getElementBounds(elementIds: string[]): ElementBounds[] {
    const bounds: ElementBounds[] = [];

    for (const id of elementIds) {
      const el = this.composer.elements.getElement(id);
      if (!el) continue;

      const styles = el.getStyles?.() || {};
      const left = parseFloat(styles.left || "0") || 0;
      const top = parseFloat(styles.top || "0") || 0;
      const width = parseFloat(styles.width || "100") || 100;
      const height = parseFloat(styles.height || "100") || 100;

      bounds.push({
        id,
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
      });
    }

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
            this.setElementPosition(b.id, referenceX, undefined);
          });
          break;

        case "center": {
          const minLeft = Math.min(...bounds.map((b) => b.left));
          const maxRight = Math.max(...bounds.map((b) => b.right));
          referenceX = (minLeft + maxRight) / 2;
          bounds.forEach((b) => {
            const newLeft = referenceX - b.width / 2;
            this.setElementPosition(b.id, newLeft, undefined);
          });
          break;
        }

        case "right":
          referenceX = Math.max(...bounds.map((b) => b.right));
          bounds.forEach((b) => {
            const newLeft = referenceX - b.width;
            this.setElementPosition(b.id, newLeft, undefined);
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
            this.setElementPosition(b.id, undefined, referenceY);
          });
          break;

        case "middle": {
          const minTop = Math.min(...bounds.map((b) => b.top));
          const maxBottom = Math.max(...bounds.map((b) => b.bottom));
          referenceY = (minTop + maxBottom) / 2;
          bounds.forEach((b) => {
            const newTop = referenceY - b.height / 2;
            this.setElementPosition(b.id, undefined, newTop);
          });
          break;
        }

        case "bottom":
          referenceY = Math.max(...bounds.map((b) => b.bottom));
          bounds.forEach((b) => {
            const newTop = referenceY - b.height;
            this.setElementPosition(b.id, undefined, newTop);
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
          this.setElementPosition(b.id, currentX, undefined);
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
          this.setElementPosition(b.id, undefined, currentY);
          currentY += b.height + gap;
        });
      }
    } finally {
      this.composer.endTransaction?.();
    }
  }

  /**
   * Helper to set element position
   */
  private setElementPosition(id: string, left: number | undefined, top: number | undefined): void {
    const el = this.composer.elements.getElement(id);
    if (!el) return;

    if (left !== undefined) {
      el.setStyle?.("left", `${left}px`);
    }
    if (top !== undefined) {
      el.setStyle?.("top", `${top}px`);
    }
  }
}

export default AlignmentHandler;
