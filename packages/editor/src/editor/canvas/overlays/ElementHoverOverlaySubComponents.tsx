/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette (error boundary / overlay / preview
 *   frame / warm neutral / onboarding theme). Chrome-hex lint rules do not apply.
 *
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

// Dev-tool overlay palette — semantic, intentionally distinct from chrome theme.
// Per file's @lint-hex-policy header, these are debug-info colors (badge bg,
// monospace dimensions, class-name highlight), not panel/inspector chrome.
/** The hover badge floats OVER the customer's page, so it is deliberately
 *  dark-on-content rather than chrome-light — same reason the video transport
 *  is white-on-video. The three hexes stay; only their delivery changes. */
const BADGE =
  "tw:flex tw:flex-col tw:gap-0.5 tw:absolute tw:whitespace-nowrap tw:px-2 tw:py-1 tw:rounded " +
  "tw:bg-[#3b3b3b] tw:text-white tw:text-xs tw:[font-family:var(--bk-font-ui)] " +
  "tw:[box-shadow:0_4px_12px_rgba(0,0,0,0.3)]";
const BADGE_TAG = "tw:px-1 tw:rounded-[2px] tw:text-xs tw:bg-[var(--bk-accent)]";
const HINT =
  "tw:absolute tw:-translate-x-full tw:whitespace-nowrap tw:px-2 tw:py-[3px] tw:rounded " +
  "tw:text-xs tw:font-medium tw:[box-shadow:0_2px_8px_rgba(0,0,0,0.2)]";

export const InfoBadge: React.FC<InfoBadgeProps> = ({ rect, info, colors }) => (
  <div
    className={BADGE}
    /* measured geometry — the only thing here that cannot be a class */
    style={{ left: rect.left, top: rect.top - (info.parentName ? 38 : 22) }}
  >
    <div className="tw:flex tw:items-center tw:gap-1.5">
      <span className="tw:font-semibold" style={{ color: colors.hierarchyCurrent }}>
        {info.friendlyName}
      </span>
      {info.hasLink && (
        <span className="tw:text-xs" title="Has link">
          🔗
        </span>
      )}
      {info.hasCMSBinding && (
        <span className="tw:text-xs" title="CMS bound">
          📊
        </span>
      )}
      {info.isFlexContainer && (
        <span className={BADGE_TAG}>flex{info.flexDirection === "column" ? "↓" : "→"}</span>
      )}
      {info.isGridContainer && (
        <span className={BADGE_TAG}>grid</span>
      )}
    </div>
    <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs">
      {info.parentName && <span className="tw:text-gray-400">in {info.parentName}</span>}
      <span className="tw:text-[#a5f3fc] tw:[font-family:var(--bk-font-mono)]">
        {info.dimensions.width} × {info.dimensions.height}
      </span>
      {info.classes.length > 0 && info.classes[0] && (
        <span className="tw:text-[#f9e2af] tw:opacity-80">.{info.classes[0]}</span>
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
    className={HINT}
    style={{
      left: rect.left + rect.width - 4,
      top: rect.top + rect.height + 4,
      background: colors.outline,
      color: colors.labelText,
    }}
  >
    Double-click to edit
  </div>
);
