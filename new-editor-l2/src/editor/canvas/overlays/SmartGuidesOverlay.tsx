/**
 * Smart Alignment Guides Overlay
 * Renders dashed lines when dragging elements to show alignment with siblings
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { SnapLine } from "../hooks/useCanvasSnapping";

interface SmartGuidesOverlayProps {
  snapLines: SnapLine[];
  zoom: number;
}

export const SmartGuidesOverlay: React.FC<SmartGuidesOverlayProps> = ({ snapLines, zoom }) => {
  if (snapLines.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999, // Above almost everything
      }}
    >
      {snapLines.map((line, i) => {
        const isHorizontal = line.orientation === "horizontal";
        const style: React.CSSProperties = {
          position: "absolute",
          backgroundColor: "#FF00FF",
          opacity: 0.85,
          boxShadow: "0 0 3px rgba(255, 0, 255, 0.4)",
        };

        if (isHorizontal) {
          style.top = line.position;
          style.left = line.start;
          style.width = line.end - line.start;
          style.height = 1 / (zoom / 100); // 1px visual thickness regardless of zoom
        } else {
          style.left = line.position;
          style.top = line.start;
          style.height = line.end - line.start;
          style.width = 1 / (zoom / 100);
        }

        return (
          <React.Fragment key={i}>
            {/* The line itself */}
            <div style={style} />

            {/* Optional distance labels could go here */}
          </React.Fragment>
        );
      })}
    </div>
  );
};
