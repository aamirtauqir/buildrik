/**
 * Selection Handles Component
 * Corner and edge resize handles for selection box
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SELECTION_HANDLE_SIZE, HANDLE_SIZE } from "../../../engine/canvas/constants";
import type { HandlePosition } from "../../../engine/canvas/ResizeHandler";
import { Z_INDEX, SELECTION_COLORS, SHADOWS } from "../../../shared/constants/canvas";

export interface SelectionHandlesProps {
  /** Selection rectangle position */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Callback when handle is dragged */
  onHandleMouseDown: (handle: HandlePosition, e: React.MouseEvent) => void;
}

const EDGE_SIZE = HANDLE_SIZE;

const CURSOR_MAP: Record<HandlePosition, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  nw: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  se: "nwse-resize",
};

/** Human-readable labels for screen readers (WCAG 2.1) */
const ARIA_LABELS: Record<HandlePosition, string> = {
  n: "Resize from top edge",
  s: "Resize from bottom edge",
  e: "Resize from right edge",
  w: "Resize from left edge",
  nw: "Resize from top-left corner",
  ne: "Resize from top-right corner",
  sw: "Resize from bottom-left corner",
  se: "Resize from bottom-right corner",
};

const handleBaseStyle: React.CSSProperties = {
  position: "absolute",
  background: SELECTION_COLORS.handleGradient,
  border: "2px solid #fff",
  borderRadius: "3px",
  zIndex: Z_INDEX.selectionHandle,
  boxShadow: SHADOWS.glowMd,
  transition: "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease",
};

const cornerHandleStyle: React.CSSProperties = {
  ...handleBaseStyle,
  width: SELECTION_HANDLE_SIZE,
  height: SELECTION_HANDLE_SIZE,
};

const edgeHandleStyle: React.CSSProperties = {
  ...handleBaseStyle,
  borderRadius: "2px",
};

/**
 * SelectionHandles - Corner and edge resize handles
 */
export const SelectionHandles: React.FC<SelectionHandlesProps> = ({
  left,
  top,
  width,
  height,
  onHandleMouseDown,
}) => {
  return (
    <>
      {/* Corner handles */}
      {(["nw", "ne", "sw", "se"] as HandlePosition[]).map((handle) => {
        const isLeft = handle.includes("w");
        const isTop = handle.includes("n");
        return (
          <div
            key={handle}
            role="button"
            aria-label={ARIA_LABELS[handle]}
            tabIndex={0}
            style={{
              ...cornerHandleStyle,
              left: isLeft
                ? left - SELECTION_HANDLE_SIZE / 2
                : left + width - SELECTION_HANDLE_SIZE / 2,
              top: isTop
                ? top - SELECTION_HANDLE_SIZE / 2
                : top + height - SELECTION_HANDLE_SIZE / 2,
              cursor: CURSOR_MAP[handle],
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => onHandleMouseDown(handle, e)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onHandleMouseDown(handle, e as unknown as React.MouseEvent);
              }
            }}
          />
        );
      })}

      {/* Edge handles - only show if element is large enough */}
      {width > 50 && (
        <>
          {/* N */}
          <div
            role="button"
            aria-label={ARIA_LABELS.n}
            tabIndex={0}
            style={{
              ...edgeHandleStyle,
              left: left + width / 2 - 12,
              top: top - EDGE_SIZE / 2,
              width: 24,
              height: EDGE_SIZE,
              cursor: "ns-resize",
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => onHandleMouseDown("n", e)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onHandleMouseDown("n", e as unknown as React.MouseEvent);
              }
            }}
          />
          {/* S */}
          <div
            role="button"
            aria-label={ARIA_LABELS.s}
            tabIndex={0}
            style={{
              ...edgeHandleStyle,
              left: left + width / 2 - 12,
              top: top + height - EDGE_SIZE / 2,
              width: 24,
              height: EDGE_SIZE,
              cursor: "ns-resize",
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => onHandleMouseDown("s", e)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onHandleMouseDown("s", e as unknown as React.MouseEvent);
              }
            }}
          />
        </>
      )}
      {height > 50 && (
        <>
          {/* W */}
          <div
            role="button"
            aria-label={ARIA_LABELS.w}
            tabIndex={0}
            style={{
              ...edgeHandleStyle,
              left: left - EDGE_SIZE / 2,
              top: top + height / 2 - 12,
              width: EDGE_SIZE,
              height: 24,
              cursor: "ew-resize",
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => onHandleMouseDown("w", e)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onHandleMouseDown("w", e as unknown as React.MouseEvent);
              }
            }}
          />
          {/* E */}
          <div
            role="button"
            aria-label={ARIA_LABELS.e}
            tabIndex={0}
            style={{
              ...edgeHandleStyle,
              left: left + width - EDGE_SIZE / 2,
              top: top + height / 2 - 12,
              width: EDGE_SIZE,
              height: 24,
              cursor: "ew-resize",
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => onHandleMouseDown("e", e)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onHandleMouseDown("e", e as unknown as React.MouseEvent);
              }
            }}
          />
        </>
      )}
    </>
  );
};

export default SelectionHandles;
