/**
 * Spacing Labels Component
 * Displays margin and padding values on hover overlay
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { BoxSpacing } from "../utils/elementInfo";

export interface SpacingLabelsProps {
  /** Element bounding rect */
  rect: DOMRect;
  /** Margin values */
  margin: BoxSpacing;
  /** Padding values */
  padding: BoxSpacing;
}

/** Shared label style */
const labelStyle: React.CSSProperties = {
  position: "absolute",
  padding: "1px 4px",
  borderRadius: "2px",
  fontSize: "10px",
  fontFamily: "monospace",
  color: "#000",
  transform: "translateX(-50%)",
};

/** Margin label style (orange) */
const marginLabelStyle: React.CSSProperties = {
  ...labelStyle,
  background: "rgba(246, 178, 107, 0.9)",
};

/** Padding label style (green) */
const paddingLabelStyle: React.CSSProperties = {
  ...labelStyle,
  background: "rgba(147, 196, 125, 0.9)",
};

/**
 * SpacingLabels - Displays margin and padding values
 */
export const SpacingLabels: React.FC<SpacingLabelsProps> = ({ rect, margin, padding }) => {
  return (
    <>
      {/* Margin top */}
      {margin.top > 0 && (
        <div
          style={{
            ...marginLabelStyle,
            left: rect.left + rect.width / 2,
            top: rect.top - margin.top / 2 - 6,
          }}
        >
          {margin.top}
        </div>
      )}

      {/* Margin bottom */}
      {margin.bottom > 0 && (
        <div
          style={{
            ...marginLabelStyle,
            left: rect.left + rect.width / 2,
            top: rect.top + rect.height + margin.bottom / 2 - 6,
          }}
        >
          {margin.bottom}
        </div>
      )}

      {/* Padding top */}
      {padding.top > 0 && (
        <div
          style={{
            ...paddingLabelStyle,
            left: rect.left + rect.width / 2,
            top: rect.top + padding.top / 2 - 6,
          }}
        >
          {padding.top}
        </div>
      )}

      {/* Padding bottom */}
      {padding.bottom > 0 && (
        <div
          style={{
            ...paddingLabelStyle,
            left: rect.left + rect.width / 2,
            top: rect.top + rect.height - padding.bottom / 2 - 6,
          }}
        >
          {padding.bottom}
        </div>
      )}
    </>
  );
};

export default SpacingLabels;
