/**
 * useCanvasSnapping Hook
 * Calculates snap lines and corrected positions during drag/resize
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { Element } from "../../../engine/elements/Element";
import { SNAP_THRESHOLD } from "../../../engine/canvas/constants";

interface SiblingRect {
  id: string;
  rect: { left: number; top: number; width: number; height: number };
}

export interface SnapLine {
  orientation: "horizontal" | "vertical";
  position: number; // The constant coordinate (x or y)
  start: number; // Start of the line
  end: number; // End of the line
  /** Present for the red spacing indicators of board 815:4608 (scenarios 3
   *  and 4) — absent for the magenta alignment guides above (scenarios 1
   *  and 2), which is how SmartGuidesOverlay tells the two apart. */
  kind?: "equal-gap" | "parent-padding";
  /** The px value the indicator's label shows — the gap size, or the
   *  padding distance. Only set alongside `kind`. */
  value?: number;
}

export interface SnapResult {
  x: number;
  y: number;
  snapLines: SnapLine[];
}

/* Board 815:4608 names the snap threshold, and the editor held two of them:
   this hook declared its own `= 5` under a comment that said 4, while the
   sibling drag hook imported the engine's. One threshold, one home — the
   engine's, because that is the one a drag already obeys. The VALUE stays 5:
   the board's 4 is a drawing, the threshold is behaviour and behaviour follows
   the code contract. */
export function useCanvasSnapping(composer: Composer | null) {
  const calculateSnapping = React.useCallback(
    (
      id: string,
      draggingRect: { left: number; top: number; width: number; height: number },
      scale: number = 1
    ): SnapResult => {
      if (!composer) return { x: draggingRect.left, y: draggingRect.top, snapLines: [] };

      const { left, top, width, height } = draggingRect;
      const snapLines: SnapLine[] = [];

      // Find siblings via composer
      const element = composer.elements.getElement(id);
      if (!element) return { x: left, y: top, snapLines: [] };

      const parent = element.getParent();
      if (!parent) return { x: left, y: top, snapLines: [] };

      const children = (parent.getChildren() || []) as Element[];
      // Filter out self and find DOM rects
      const siblings = children
        .filter((child) => child.getId() !== id)
        .map((child) => {
          const childId = child.getId();
          const el = document.querySelector(`[data-buildrick-id="${childId}"]`);
          if (el) {
            const rect = el.getBoundingClientRect();
            // Convert to canvas coordinates if needed, but assuming draggingRect is already in client/screen space OR relative space.
            // However, useCanvasDragDrop passes coordinates relative to canvas?
            // Actually useCanvasDragDrop calculates draggingBounds relative to canvas rect.
            // So we need sibling rects relative to canvas rect too.

            // We need canvas reference? Or assume document query is enough?
            // If input draggingRect is relative to canvas, we need to convert sibling clientRect to canvas relative.
            // But we don't have canvas rect here.

            // Alternative: The input draggingRect passed from useCanvasDragDrop is relative to CANVAS (e.clientX - rect.left).
            // So we need to convert sibling BoundingClientRect to relative to CANVAS.
            // We can find canvas using closest('.buildrick-canvas') from the sibling element.
            const canvas = el.closest(".buildrick-canvas");
            if (canvas) {
              const canvasRect = canvas.getBoundingClientRect();
              return {
                id: childId,
                rect: {
                  left: rect.left - canvasRect.left,
                  top: rect.top - canvasRect.top,
                  width: rect.width,
                  height: rect.height,
                },
              };
            }
          }
          return null;
        })
        .filter((s): s is SiblingRect => s !== null);

      // Edges to check
      const V_CENTERS = [left, left + width / 2, left + width];
      const H_CENTERS = [top, top + height / 2, top + height];

      // Track closest snaps
      const threshold = SNAP_THRESHOLD / scale;
      let closestXDist = Infinity;
      let closestYDist = Infinity;
      let snapX = left;
      let snapY = top;

      // Iterate through all siblings
      siblings.forEach((sibling) => {
        const { rect } = sibling;
        // Use the relative rect calculated above
        const sLeft = rect.left;
        const sTop = rect.top;
        const sWidth = rect.width;
        const sHeight = rect.height;

        const sVCenters = [sLeft, sLeft + sWidth / 2, sLeft + sWidth];
        const sHCenters = [sTop, sTop + sHeight / 2, sTop + sHeight];

        // Horizontal Snapping (Vertical Lines)
        V_CENTERS.forEach((vCenter) => {
          sVCenters.forEach((sVCenter) => {
            const dist = Math.abs(vCenter - sVCenter);
            if (dist < threshold && dist < closestXDist) {
              closestXDist = dist;
              // Calculate correction
              const correction = sVCenter - vCenter;
              snapX = left + correction;

              // Create visual line
              snapLines.push({
                orientation: "vertical",
                position: sVCenter,
                start: Math.min(top, sTop),
                end: Math.max(top + height, sTop + sHeight),
              });
            }
          });
        });

        // Vertical Snapping (Horizontal Lines)
        H_CENTERS.forEach((hCenter) => {
          sHCenters.forEach((sHCenter) => {
            const dist = Math.abs(hCenter - sHCenter);
            if (dist < threshold && dist < closestYDist) {
              closestYDist = dist;
              // Calculate correction
              const correction = sHCenter - hCenter;
              snapY = top + correction;

              // Create visual line
              snapLines.push({
                orientation: "horizontal",
                position: sHCenter,
                start: Math.min(left, sLeft),
                end: Math.max(left + width, sLeft + width),
              });
            }
          });
        });
      });

      /* Board 815:4608 scenarios 3 and 4 — red spacing indicators, computed
         against the element's SNAPPED position so the numbers match where it
         will actually land, not where the cursor happens to be. Both reuse
         the SnapLine shape (a straight line at `position`, spanning
         `start`..`end`) that the alignment guides above already return —
         `kind` + `value` are what SmartGuidesOverlay reads to draw them red
         with a dimension label instead of magenta. */
      const spacingLines: SnapLine[] = [];
      const dragRect = { left: snapX, top: snapY, width, height };
      const GAP_TOLERANCE = threshold;

      /* Scenario 3: equal spacing. Sort the dragged element in among its
         siblings on one axis and check whether every resulting gap agrees —
         mirrors AutoLayoutManager.checkEqualSpacingDirection's tolerance
         logic, but against the projected drag position rather than committed
         DOM state (nothing has actually moved yet). */
      (["horizontal", "vertical"] as const).forEach((axis) => {
        const ordered = [{ id, rect: dragRect }, ...siblings].sort((a, b) =>
          axis === "horizontal" ? a.rect.left - b.rect.left : a.rect.top - b.rect.top
        );
        if (ordered.length < 3) return;
        const gaps = ordered.slice(0, -1).map((cur, i) => {
          const next = ordered[i + 1];
          return axis === "horizontal"
            ? next.rect.left - (cur.rect.left + cur.rect.width)
            : next.rect.top - (cur.rect.top + cur.rect.height);
        });
        const first = gaps[0];
        const allEqual = first > 0 && gaps.every((g) => Math.abs(g - first) <= GAP_TOLERANCE);
        if (!allEqual) return;
        ordered.slice(0, -1).forEach((cur, i) => {
          const next = ordered[i + 1];
          if (axis === "horizontal") {
            const midY =
              Math.max(cur.rect.top, next.rect.top) +
              Math.min(cur.rect.height, next.rect.height) / 2;
            spacingLines.push({
              orientation: "horizontal",
              position: midY,
              start: cur.rect.left + cur.rect.width,
              end: next.rect.left,
              kind: "equal-gap",
              value: Math.round(gaps[i]),
            });
          } else {
            const midX =
              Math.max(cur.rect.left, next.rect.left) +
              Math.min(cur.rect.width, next.rect.width) / 2;
            spacingLines.push({
              orientation: "vertical",
              position: midX,
              start: cur.rect.top + cur.rect.height,
              end: next.rect.top,
              kind: "equal-gap",
              value: Math.round(gaps[i]),
            });
          }
        });
      });

      /* Scenario 4: parent padding. An edge distance counts once a sibling
         already sits that same distance from the same parent edge — the
         indicator is confirming a match, not inventing one from nothing. */
      const parentId = parent.getId?.();
      const parentDomEl = parentId
        ? document.querySelector(`[data-buildrick-id="${parentId}"]`)
        : null;
      if (parentDomEl) {
        const pRect = parentDomEl.getBoundingClientRect();
        const parentCanvas = parentDomEl.closest(".buildrick-canvas");
        if (parentCanvas) {
          const canvasRect = parentCanvas.getBoundingClientRect();
          const parentRect = {
            left: pRect.left - canvasRect.left,
            top: pRect.top - canvasRect.top,
            width: pRect.width,
            height: pRect.height,
          };
          const edgeDistance = (
            rect: { left: number; top: number; width: number; height: number },
            edge: "left" | "right" | "top" | "bottom"
          ): number => {
            switch (edge) {
              case "left":
                return rect.left - parentRect.left;
              case "right":
                return parentRect.left + parentRect.width - (rect.left + rect.width);
              case "top":
                return rect.top - parentRect.top;
              case "bottom":
                return parentRect.top + parentRect.height - (rect.top + rect.height);
            }
          };
          (["left", "right", "top", "bottom"] as const).forEach((edge) => {
            const dragDist = edgeDistance(dragRect, edge);
            if (dragDist <= 0) return;
            const matches = siblings.some(
              (s) => Math.abs(edgeDistance(s.rect, edge) - dragDist) <= threshold
            );
            if (!matches) return;
            const value = Math.round(dragDist);
            if (edge === "left") {
              spacingLines.push({
                orientation: "horizontal",
                position: dragRect.top + dragRect.height / 2,
                start: parentRect.left,
                end: dragRect.left,
                kind: "parent-padding",
                value,
              });
            } else if (edge === "right") {
              spacingLines.push({
                orientation: "horizontal",
                position: dragRect.top + dragRect.height / 2,
                start: dragRect.left + dragRect.width,
                end: parentRect.left + parentRect.width,
                kind: "parent-padding",
                value,
              });
            } else if (edge === "top") {
              spacingLines.push({
                orientation: "vertical",
                position: dragRect.left + dragRect.width / 2,
                start: parentRect.top,
                end: dragRect.top,
                kind: "parent-padding",
                value,
              });
            } else {
              spacingLines.push({
                orientation: "vertical",
                position: dragRect.left + dragRect.width / 2,
                start: dragRect.top + dragRect.height,
                end: parentRect.top + parentRect.height,
                kind: "parent-padding",
                value,
              });
            }
          });
        }
      }

      // Filter snap lines to only show the "winning" snaps
      const activeLines = snapLines.filter((line) => {
        if (line.orientation === "vertical") {
          return (
            Math.abs(line.position - (snapX + (line.position > snapX + width / 2 ? width : 0))) <
              1 ||
            Math.abs(line.position - snapX) < 1 ||
            Math.abs(line.position - (snapX + width / 2)) < 1 ||
            Math.abs(line.position - (snapX + width)) < 1
          );
        } else {
          return (
            Math.abs(line.position - snapY) < 1 ||
            Math.abs(line.position - (snapY + height / 2)) < 1 ||
            Math.abs(line.position - (snapY + height)) < 1
          );
        }
      });

      return {
        x: closestXDist < Infinity ? snapX : left,
        y: closestYDist < Infinity ? snapY : top,
        snapLines: [
          ...(activeLines.length > 0
            ? activeLines
            : snapLines.length > 5
              ? snapLines.slice(0, 5)
              : snapLines),
          ...spacingLines,
        ],
      };
    },
    [composer, SNAP_THRESHOLD]
  );

  return { calculateSnapping };
}
