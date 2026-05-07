/**
 * useDragSnapGuides — extracted from useCanvasDragDrop (Phase D D1
 * split, stage 1). Owns the snap-line + snap-point calculation that
 * runs throttled during dragOver.
 *
 * The hook returns a single `calculate(e, now)` function the parent
 * orchestrator calls. The function reads `composer.canvasIndicators`,
 * the current canvas rect, the dragged element's bounding rect, and
 * (optionally) a custom snapCalculator override. It pushes the resulting
 * snap lines through `onSnapLinesChange` once per call.
 *
 * Behavior preserved bit-for-bit from the original inline
 * `calculateSnapGuides` in useCanvasDragDrop. The only change is
 * mechanical: the function moved here; its dependencies are now
 * explicit hook inputs.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SNAP_THRESHOLD } from "../../../../engine/canvas/constants";
import type { Composer } from "../../../../engine";
import type { SnapPoint, SmartGuide } from "../../../../shared/types/canvas";
import type { SnapLine } from "../useCanvasSnapping";

export interface UseDragSnapGuidesOptions {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  showGuides: boolean;
  draggingElementId: string | null;
  snapCalculator?: (
    id: string,
    rect: { left: number; top: number; width: number; height: number },
    scale: number,
  ) => { x: number; y: number; snapLines: SnapLine[] };
  onSnapLinesChangeRef: React.MutableRefObject<(lines: SnapLine[]) => void>;
}

export interface UseDragSnapGuidesResult {
  /** Compute + emit snap guides for this drag-over event. */
  calculate: (e: React.DragEvent, now: number) => void;
  /** Mutable timestamp ref the orchestrator uses to throttle calls. */
  lastSnapCalcRef: React.MutableRefObject<number>;
}

export function useDragSnapGuides({
  composer,
  canvasRef,
  showGuides,
  draggingElementId,
  snapCalculator,
  onSnapLinesChangeRef,
}: UseDragSnapGuidesOptions): UseDragSnapGuidesResult {
  const lastSnapCalcRef = React.useRef<number>(0);

  // Reset throttle when drag stops — moves the matching effect from the
  // orchestrator into the same module that owns the timestamp.
  React.useEffect(() => {
    if (!draggingElementId) {
      lastSnapCalcRef.current = 0;
    }
  }, [draggingElementId]);

  const calculate = React.useCallback(
    (e: React.DragEvent, now: number) => {
      if (!composer?.canvas.indicators || !showGuides || !canvasRef.current || !draggingElementId) {
        onSnapLinesChangeRef.current([]);
        lastSnapCalcRef.current = now;
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      const draggedDomEl = canvasRef.current.querySelector(
        `[data-buildrick-id="${draggingElementId}"]`,
      ) as HTMLElement | null;

      const lines: SnapLine[] = [];

      if (draggedDomEl) {
        const draggedRect = draggedDomEl.getBoundingClientRect();
        const draggedBounds = {
          x: draggedRect.left - rect.left,
          y: draggedRect.top - rect.top,
          width: draggedRect.width,
          height: draggedRect.height,
        };

        if (snapCalculator) {
          const snapResult = snapCalculator(
            draggingElementId,
            {
              left: draggedBounds.x,
              top: draggedBounds.y,
              width: draggedBounds.width,
              height: draggedBounds.height,
            },
            1,
          );
          if (snapResult.snapLines) lines.push(...snapResult.snapLines);
        } else {
          const smartGuides = composer.canvas.indicators.calculateSmartGuides(
            draggingElementId,
            draggedBounds,
          );
          smartGuides.forEach((guide: SmartGuide) => {
            lines.push({
              orientation: guide.axis,
              position: guide.position,
              start: -99999,
              end: 99999,
            });
          });
        }
      }

      const snapPoints = composer.canvas.indicators.calculateSnapPoints(draggingElementId) || [];
      snapPoints.forEach((pt: SnapPoint) => {
        if (pt.axis === "vertical" && Math.abs(localX - pt.position) <= SNAP_THRESHOLD) {
          if (
            !lines.some(
              (l) => l.orientation === "vertical" && Math.abs(l.position - pt.position) < 2,
            )
          ) {
            lines.push({
              orientation: "vertical",
              position: pt.position,
              start: -99999,
              end: 99999,
            });
          }
        }
        if (pt.axis === "horizontal" && Math.abs(localY - pt.position) <= SNAP_THRESHOLD) {
          if (
            !lines.some(
              (l) => l.orientation === "horizontal" && Math.abs(l.position - pt.position) < 2,
            )
          ) {
            lines.push({
              orientation: "horizontal",
              position: pt.position,
              start: -99999,
              end: 99999,
            });
          }
        }
      });

      onSnapLinesChangeRef.current(lines);
      lastSnapCalcRef.current = now;
    },
    [composer, showGuides, draggingElementId, canvasRef, snapCalculator, onSnapLinesChangeRef],
  );

  return { calculate, lastSnapCalcRef };
}
