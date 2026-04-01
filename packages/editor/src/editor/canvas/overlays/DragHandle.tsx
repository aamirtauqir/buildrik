/**
 * Drag Handle Component
 * 6-dot grip for dragging elements on the canvas
 * @license BSD-3-Clause
 */

import * as React from "react";

export type DragHandleSize = "small" | "normal";

export interface DragHandleProps {
  /** Bounding rect of the element being dragged */
  rect: DOMRect;
  /** ID of the element */
  elementId: string;
  /** Handle size: "small" (4-dot, 8x8) or "normal" (6-dot, 16x24) */
  size?: DragHandleSize;
}

/** Size configurations */
const SIZE_CONFIG = {
  small: {
    width: 8,
    height: 8,
    dots: 4,
    cols: 2,
    rows: 2,
    gap: 1,
    padding: 1,
    dotSize: 2,
    borderRadius: 2,
    offset: 12, // Distance from element edge
    verticalOffset: 4, // Half the height
  },
  normal: {
    width: 16,
    height: 24,
    dots: 6,
    cols: 2,
    rows: 3,
    gap: 2,
    padding: 3,
    dotSize: 4,
    borderRadius: 4,
    offset: 20,
    verticalOffset: 12,
  },
} as const;

/**
 * Drag handle - appears on left edge of hovered element
 * Supports "small" (4-dot, minimal mode) and "normal" (6-dot, default)
 */
export const DragHandle: React.FC<DragHandleProps> = ({ rect, elementId, size = "normal" }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const config = SIZE_CONFIG[size];

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDragging(true);

      // Find the actual element and trigger native drag
      const element = document.querySelector(`[data-aqb-id="${elementId}"]`) as HTMLElement;
      if (element) {
        // Create and dispatch a dragstart event
        const dragEvent = new DragEvent("dragstart", {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer(),
        });
        dragEvent.dataTransfer?.setData("element", JSON.stringify({ elementId }));
        element.dispatchEvent(dragEvent);
      }
    },
    [elementId]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp);
      return () => document.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isDragging, handleMouseUp]);

  // Calculate handle position (left edge, vertically centered)
  // Clamp to prevent going off-screen on left edge
  const handleLeft = Math.max(4, rect.left - config.offset);
  const handleTop = rect.top + rect.height / 2 - config.verticalOffset;

  // Professional blue color (matching updated palette)
  const bgColor = isHovered ? "#2563EB" : "rgba(37, 99, 235, 0.85)";

  // Keyboard handler for accessibility
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // Trigger drag mode visually for keyboard users
      setIsDragging(true);
    }
  }, []);

  return (
    <div
      className="aqb-drag-handle"
      role="button"
      aria-label="Drag to move element"
      aria-pressed={isDragging}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      style={{
        position: "absolute",
        left: handleLeft,
        top: handleTop,
        width: config.width,
        height: config.height,
        background: bgColor,
        borderRadius: config.borderRadius,
        cursor: isDragging ? "grabbing" : "grab",
        display: "grid",
        gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
        gridTemplateRows: `repeat(${config.rows}, 1fr)`,
        gap: config.gap,
        padding: config.padding,
        pointerEvents: "auto",
        transform: isHovered ? "scale(1.1)" : "scale(1)",
        transition: "transform 0.15s ease, background 0.15s ease",
        boxShadow: isHovered ? "0 0 0 2px rgba(37, 99, 235, 0.3)" : "0 1px 4px rgba(0, 0, 0, 0.15)",
        zIndex: 10000,
      }}
    >
      {/* Dots in grid pattern */}
      {Array.from({ length: config.dots }).map((_, i) => (
        <div
          key={i}
          style={{
            width: config.dotSize,
            height: config.dotSize,
            borderRadius: "50%",
            background: isHovered ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.7)",
          }}
        />
      ))}
    </div>
  );
};

export default DragHandle;
