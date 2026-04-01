/**
 * Aquibra Canvas Spot
 * Base overlay components for canvas
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface CanvasSpotProps {
  children: React.ReactNode;
  position: { x: number; y: number };
  anchor?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  visible?: boolean;
  zIndex?: number;
  className?: string;
}

export interface PointerBadgeProps {
  label: string;
  color?: string;
  position: { x: number; y: number };
  visible?: boolean;
}

/**
 * Base overlay component for positioning elements on canvas
 */
export const CanvasSpot: React.FC<CanvasSpotProps> = ({
  children,
  position,
  anchor = "top-left",
  visible = true,
  zIndex = 100,
  className,
}) => {
  if (!visible) return null;

  const anchorStyles: Record<string, React.CSSProperties> = {
    "top-left": { top: position.y, left: position.x },
    "top-right": { top: position.y, right: position.x },
    "bottom-left": { bottom: position.y, left: position.x },
    "bottom-right": { bottom: position.y, right: position.x },
    center: {
      top: position.y,
      left: position.x,
      transform: "translate(-50%, -50%)",
    },
  };

  return (
    <div
      className={`aqb-canvas-spot ${className || ""}`}
      style={{
        position: "absolute",
        zIndex,
        pointerEvents: "none",
        ...anchorStyles[anchor],
      }}
    >
      {children}
    </div>
  );
};

/**
 * Small badge that follows pointer or shows at position
 */
export const PointerBadge: React.FC<PointerBadgeProps> = ({
  label,
  color = "var(--aqb-primary)",
  position,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <div
      className="aqb-pointer-badge"
      style={{
        position: "absolute",
        top: position.y - 24,
        left: position.x,
        padding: "2px 8px",
        background: color,
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 4,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      {label}
    </div>
  );
};

export default CanvasSpot;
