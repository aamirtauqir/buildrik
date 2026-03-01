/**
 * ElementHoverOverlay — Pure visual sub-components
 * Internal detail: imported ONLY by ElementHoverOverlay.tsx.
 * Not part of the public overlay API.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { BoxModel, ElementInfo } from "../utils/elementInfo";

/**
 * Subset of the COLORS palette consumed by sub-components.
 * Mirrors the shape of the COLORS constant in ElementHoverOverlay.tsx — kept
 * in sync manually. Using an explicit interface avoids a circular import.
 * @internal
 */
export interface HoverColors {
  outline: string;
  outlineDashed: string;
  label: string;
  labelText: string;
  content: string;
  padding: string;
  margin: string;
  hierarchyBg: string;
  hierarchyText: string;
  hierarchyCurrent: string;
  cloneMode: string;
}

// =============================================================================
// MarginBoxes
// =============================================================================

interface MarginBoxesProps {
  rect: DOMRect;
  margin: BoxModel["margin"];
  colors: HoverColors;
}

export const MarginBoxes: React.FC<MarginBoxesProps> = ({ rect, margin, colors }) => {
  if (margin.top === 0 && margin.right === 0 && margin.bottom === 0 && margin.left === 0) {
    return null;
  }

  return (
    <>
      {margin.top > 0 && (
        <div
          style={{
            position: "absolute",
            left: rect.left - margin.left,
            top: rect.top - margin.top,
            width: rect.width + margin.left + margin.right,
            height: margin.top,
            background: colors.margin,
          }}
        />
      )}
      {margin.right > 0 && (
        <div
          style={{
            position: "absolute",
            left: rect.left + rect.width,
            top: rect.top,
            width: margin.right,
            height: rect.height,
            background: colors.margin,
          }}
        />
      )}
      {margin.bottom > 0 && (
        <div
          style={{
            position: "absolute",
            left: rect.left - margin.left,
            top: rect.top + rect.height,
            width: rect.width + margin.left + margin.right,
            height: margin.bottom,
            background: colors.margin,
          }}
        />
      )}
      {margin.left > 0 && (
        <div
          style={{
            position: "absolute",
            left: rect.left - margin.left,
            top: rect.top,
            width: margin.left,
            height: rect.height,
            background: colors.margin,
          }}
        />
      )}
    </>
  );
};

// =============================================================================
// PaddingBoxes
// =============================================================================

interface PaddingBoxesProps {
  rect: DOMRect;
  padding: BoxModel["padding"];
  colors: HoverColors;
}

export const PaddingBoxes: React.FC<PaddingBoxesProps> = ({ rect, padding, colors }) => {
  if (padding.top === 0 && padding.right === 0 && padding.bottom === 0 && padding.left === 0) {
    return null;
  }

  return (
    <>
      {padding.top > 0 && (
        <div
          style={{
            position: "absolute",
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: padding.top,
            background: colors.padding,
          }}
        />
      )}
      {padding.right > 0 && (
        <div
          style={{
            position: "absolute",
            left: rect.left + rect.width - padding.right,
            top: rect.top + padding.top,
            width: padding.right,
            height: Math.max(0, rect.height - padding.top - padding.bottom),
            background: colors.padding,
          }}
        />
      )}
      {padding.bottom > 0 && (
        <div
          style={{
            position: "absolute",
            left: rect.left,
            top: rect.top + rect.height - padding.bottom,
            width: rect.width,
            height: padding.bottom,
            background: colors.padding,
          }}
        />
      )}
      {padding.left > 0 && (
        <div
          style={{
            position: "absolute",
            left: rect.left,
            top: rect.top + padding.top,
            width: padding.left,
            height: Math.max(0, rect.height - padding.top - padding.bottom),
            background: colors.padding,
          }}
        />
      )}
    </>
  );
};

// =============================================================================
// InfoBadge
// =============================================================================

interface InfoBadgeProps {
  rect: DOMRect;
  info: ElementInfo;
  colors: HoverColors;
}

export const InfoBadge: React.FC<InfoBadgeProps> = ({ rect, info, colors }) => (
  <div
    style={{
      position: "absolute",
      left: rect.left,
      top: rect.top - (info.parentName ? 38 : 22),
      background: "#3b3b3b",
      color: "white",
      padding: "4px 8px",
      borderRadius: 4,
      fontSize: 11,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      whiteSpace: "nowrap",
      display: "flex",
      flexDirection: "column",
      gap: 2,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: colors.hierarchyCurrent, fontWeight: 600 }}>{info.friendlyName}</span>
      {info.hasLink && (
        <span style={{ fontSize: 10 }} title="Has link">
          🔗
        </span>
      )}
      {info.hasCMSBinding && (
        <span style={{ fontSize: 10 }} title="CMS bound">
          📊
        </span>
      )}
      {info.isFlexContainer && (
        <span
          style={{
            background: "var(--aqb-primary)",
            padding: "0 4px",
            borderRadius: 2,
            fontSize: 9,
          }}
        >
          flex{info.flexDirection === "column" ? "↓" : "→"}
        </span>
      )}
      {info.isGridContainer && (
        <span style={{ background: "#ec4899", padding: "0 4px", borderRadius: 2, fontSize: 9 }}>
          grid
        </span>
      )}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10 }}>
      {info.parentName && <span style={{ color: "#6c7086" }}>in {info.parentName}</span>}
      <span style={{ color: "#a5f3fc", fontFamily: "monospace" }}>
        {info.dimensions.width} × {info.dimensions.height}
      </span>
      {info.classes.length > 0 && info.classes[0] && (
        <span style={{ color: "#f9e2af", opacity: 0.8 }}>.{info.classes[0]}</span>
      )}
    </div>
  </div>
);

// =============================================================================
// TextEditHint
// =============================================================================

interface TextEditHintProps {
  rect: DOMRect;
  colors: HoverColors;
}

export const TextEditHint: React.FC<TextEditHintProps> = ({ rect, colors }) => (
  <div
    style={{
      position: "absolute",
      left: rect.left + rect.width - 4,
      top: rect.top + rect.height + 4,
      transform: "translateX(-100%)",
      background: colors.outline,
      color: colors.labelText,
      padding: "3px 8px",
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 500,
      whiteSpace: "nowrap",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    }}
  >
    Double-click to edit
  </div>
);
