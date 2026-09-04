/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * Smart Alignment Guides Overlay
 * Renders dashed lines when dragging elements to show alignment with siblings
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Z_LAYERS } from "../../../shared/constants/canvas";
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
        zIndex: Z_LAYERS.dropFeedback,
      }}
    >
      {snapLines.map((line, i) => {
        const isHorizontal = line.orientation === "horizontal";
        /* Board 815:4608: magenta (#FF00FF) alignment guides (scenarios 1-2,
           no `kind`) vs red (#FF4444) spacing indicators (scenarios 3-4,
           `kind` set) — same line geometry, different meaning, different
           colour. `@lint-hex-policy: component-theme` at the top of this file
           exempts these from the chrome token rules: this paints ON the
           customer's canvas, not chrome. */
        const isSpacing = Boolean(line.kind);
        const color = isSpacing ? "#FF4444" : "#FF00FF";
        const style: React.CSSProperties = {
          position: "absolute",
          backgroundColor: color,
          opacity: 0.85,
          boxShadow: `0 0 3px ${isSpacing ? "rgba(255, 68, 68, 0.4)" : "rgba(255, 0, 255, 0.4)"}`,
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

        const labelStyle: React.CSSProperties = isHorizontal
          ? {
              position: "absolute",
              left: (line.start + line.end) / 2,
              top: line.position - 15,
              transform: "translateX(-50%)",
            }
          : {
              position: "absolute",
              left: line.position + 6,
              top: (line.start + line.end) / 2,
              transform: "translateY(-50%)",
            };

        return (
          <React.Fragment key={i}>
            {/* The line itself */}
            <div style={style} />

            {/* Board 815:4608 scenarios 3-4: the gap/padding value, e.g. "60". */}
            {isSpacing && line.value != null && (
              <span
                style={{
                  ...labelStyle,
                  fontSize: 11,
                  fontWeight: 500,
                  lineHeight: 1,
                  color,
                  whiteSpace: "nowrap",
                }}
              >
                {line.value}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
