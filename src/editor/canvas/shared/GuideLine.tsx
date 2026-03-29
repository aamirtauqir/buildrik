/**
 * GuideLine Component
 * Renders horizontal/vertical guide lines on canvas
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface GuideLineProps {
  axis: "horizontal" | "vertical";
  position: number;
  color?: string;
  thickness?: number;
  isSnap?: boolean;
}

/** Figma-style magenta color for smart guides / snap lines */
const SMART_GUIDE_COLOR = "#FF00FF";

/**
 * Renders a single guide line (horizontal or vertical)
 */
export const GuideLine: React.FC<GuideLineProps> = ({
  axis,
  position,
  color,
  thickness = 1,
  isSnap = false,
}) => {
  // Use magenta for snap/smart guides (Figma style)
  const defaultColor = isSnap ? SMART_GUIDE_COLOR : "rgba(137,180,250,0.6)";
  const lineColor = color || defaultColor;
  const lineThickness = isSnap ? 1 : thickness;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    background: lineColor,
    boxShadow: `0 0 0 1px ${lineColor.replace("0.6", "0.2")}`,
    pointerEvents: "none",
  };

  if (axis === "vertical") {
    return (
      <div
        style={{
          ...baseStyle,
          top: 0,
          bottom: 0,
          left: position,
          width: lineThickness,
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...baseStyle,
        left: 0,
        right: 0,
        top: position,
        height: lineThickness,
      }}
    />
  );
};

export interface GuideLinesProps {
  guides: Array<{
    id?: string;
    type?: "horizontal" | "vertical";
    axis?: "horizontal" | "vertical";
    position: number;
  }>;
  snapLines?: Array<{
    /** New preferred field name */
    orientation?: "horizontal" | "vertical";
    /** Legacy field name - deprecated */
    axis?: "horizontal" | "vertical";
    position: number;
    start?: number;
    end?: number;
  }>;
  canvasSize?: { width: number; height: number };
  showCenterGuides?: boolean;
}

/**
 * Renders all guide lines and snap lines
 */
export const GuideLines: React.FC<GuideLinesProps> = ({
  guides = [],
  snapLines = [],
  canvasSize,
  showCenterGuides = true,
}) => {
  // Default center guides if no guides provided
  const effectiveGuides =
    guides.length > 0
      ? guides
      : showCenterGuides && canvasSize
        ? [
            { id: "guide-center-v", type: "vertical" as const, position: canvasSize.width / 2 },
            { id: "guide-center-h", type: "horizontal" as const, position: canvasSize.height / 2 },
          ]
        : [];

  return (
    <>
      {/* Regular guides */}
      {effectiveGuides.map((guide, idx) => (
        <GuideLine
          key={guide.id || `guide-${idx}`}
          axis={(guide.type || guide.axis) as "horizontal" | "vertical"}
          position={guide.position}
        />
      ))}

      {/* Snap lines (red, thicker) */}
      {snapLines.map((line, idx) => {
        const lineAxis = line.orientation || line.axis || "horizontal";
        return (
          <GuideLine
            key={`snap-${lineAxis}-${idx}-${line.position}`}
            axis={lineAxis}
            position={line.position}
            isSnap
          />
        );
      })}
    </>
  );
};

export default GuideLines;
