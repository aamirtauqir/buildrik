/**
 * useCanvasSnapping Hook
 * Calculates snap lines and corrected positions during drag/resize
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { Element } from "../../../engine/elements/Element";

interface SiblingRect {
  id: string;
  rect: { left: number; top: number; width: number; height: number };
}

export interface SnapLine {
  orientation: "horizontal" | "vertical";
  position: number; // The constant coordinate (x or y)
  start: number; // Start of the line
  end: number; // End of the line
}

export interface SnapResult {
  x: number;
  y: number;
  snapLines: SnapLine[];
}

export function useCanvasSnapping(composer: Composer | null) {
  // Configurable threshold (4px at 100% zoom)
  const SNAP_THRESHOLD = 5;

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
          const el = document.querySelector(`[data-aqb-id="${childId}"]`);
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
            // We can find canvas using closest('.aqb-canvas') from the sibling element.
            const canvas = el.closest(".aqb-canvas");
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
        snapLines:
          activeLines.length > 0
            ? activeLines
            : snapLines.length > 5
              ? snapLines.slice(0, 5)
              : snapLines,
      };
    },
    [composer, SNAP_THRESHOLD]
  );

  return { calculateSnapping };
}
