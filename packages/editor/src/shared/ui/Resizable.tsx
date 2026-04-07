/**
 * Aquibra Resizable Panel
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface ResizableProps {
  children: React.ReactNode;
  direction?: "horizontal" | "vertical" | "both";
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  onResize?: (width: number, height: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Resizable: React.FC<ResizableProps> = ({
  children,
  direction = "horizontal",
  minWidth = 100,
  maxWidth = 800,
  minHeight = 100,
  maxHeight = 800,
  defaultWidth = 300,
  defaultHeight = 300,
  onResize,
  className,
  style,
}) => {
  const [size, setSize] = React.useState({
    width: defaultWidth,
    height: defaultHeight,
  });
  const [isResizing, setIsResizing] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, edge: string) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (edge.includes("right") || edge.includes("left")) {
        const deltaX = edge.includes("right")
          ? moveEvent.clientX - startX
          : startX - moveEvent.clientX;
        newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX));
      }

      if (edge.includes("bottom") || edge.includes("top")) {
        const deltaY = edge.includes("bottom")
          ? moveEvent.clientY - startY
          : startY - moveEvent.clientY;
        newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + deltaY));
      }

      setSize({ width: newWidth, height: newHeight });
      onResize?.(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleStyle: React.CSSProperties = {
    position: "absolute",
    background: "transparent",
    zIndex: 10,
  };

  return (
    <div
      ref={containerRef}
      className={`aqb-resizable ${className || ""}`}
      style={{
        position: "relative",
        width: direction !== "vertical" ? size.width : "100%",
        height: direction !== "horizontal" ? size.height : "100%",
        ...style,
      }}
    >
      {children}

      {/* Right handle */}
      {(direction === "horizontal" || direction === "both") && (
        <div
          onMouseDown={(e) => handleMouseDown(e, "right")}
          style={{
            ...handleStyle,
            right: 0,
            top: 0,
            width: 6,
            height: "100%",
            cursor: "ew-resize",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 2,
              top: "50%",
              transform: "translateY(-50%)",
              width: 2,
              height: 40,
              background: isResizing ? "var(--aqb-primary)" : "var(--aqb-border)",
              borderRadius: 1,
              transition: "background 0.15s",
            }}
          />
        </div>
      )}

      {/* Bottom handle */}
      {(direction === "vertical" || direction === "both") && (
        <div
          onMouseDown={(e) => handleMouseDown(e, "bottom")}
          style={{
            ...handleStyle,
            bottom: 0,
            left: 0,
            width: "100%",
            height: 6,
            cursor: "ns-resize",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 2,
              left: "50%",
              transform: "translateX(-50%)",
              width: 40,
              height: 2,
              background: isResizing ? "var(--aqb-primary)" : "var(--aqb-border)",
              borderRadius: 1,
              transition: "background 0.15s",
            }}
          />
        </div>
      )}

      {/* Corner handle */}
      {direction === "both" && (
        <div
          onMouseDown={(e) => handleMouseDown(e, "right-bottom")}
          style={{
            ...handleStyle,
            right: 0,
            bottom: 0,
            width: 12,
            height: 12,
            cursor: "nwse-resize",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 3,
              bottom: 3,
              width: 6,
              height: 6,
              borderRight: `2px solid ${isResizing ? "var(--aqb-primary)" : "var(--aqb-border)"}`,
              borderBottom: `2px solid ${isResizing ? "var(--aqb-primary)" : "var(--aqb-border)"}`,
              transition: "border-color 0.15s",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Resizable;
