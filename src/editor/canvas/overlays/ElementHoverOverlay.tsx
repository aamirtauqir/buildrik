/**
 * Element Hover Overlay
 * Smart escalation-based visualization:
 * - Level 1 (Normal): Dashed outline + tiny label
 * - Level 3 (Alt): Parent hierarchy chain
 * - Level 4 (Alt+Shift): Full DevTools-style box model
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Z_LAYERS } from "../../../shared/constants/canvas";
import { getBoxModel, getElementInfo } from "../utils/elementInfo";
import type { BoxModel, ElementInfo } from "../utils/elementInfo";
import { DragHandle } from "./DragHandle";
import { SpacingLabels } from "./SpacingLabels";

// =============================================================================
// TYPES
// =============================================================================

export type HoverLevel = "minimal" | "hierarchy" | "boxmodel";

export interface ElementHoverOverlayProps {
  hoveredElementId: string | null;
  canvasRef: React.RefObject<HTMLDivElement>;
  /** Alt key held - show hierarchy */
  altHeld?: boolean;
  /** Shift key held (with Alt) - show box model */
  shiftHeld?: boolean;
  /** Inspector mode enabled - always show full details */
  inspectorEnabled?: boolean;
  /** Parent hierarchy for Alt+Hover display */
  parentHierarchy?: Array<{ id: string; type: string; label: string }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Colors using CSS variables - single source of truth is Canvas.css
const COLORS = {
  // Minimal mode - uses CSS vars for consistency
  outline: "var(--aqb-primary)",
  outlineDashed: "var(--aqb-selection-alpha-40)",
  label: "var(--aqb-surface-2)",
  labelText: "var(--aqb-text-primary)",

  // Box model (DevTools-style) - CSS vars for theme compatibility
  content: "var(--aqb-boxmodel-content)",
  padding: "var(--aqb-boxmodel-padding)",
  margin: "var(--aqb-boxmodel-margin)",

  // Hierarchy
  hierarchyBg: "rgba(30, 30, 46, 0.95)",
  hierarchyText: "var(--aqb-text-secondary)",
  hierarchyCurrent: "var(--aqb-primary-light)",
};

// =============================================================================
// HELPER: Determine hover level
// =============================================================================

function getHoverLevel(
  altHeld: boolean,
  shiftHeld: boolean,
  inspectorEnabled: boolean
): HoverLevel {
  if (inspectorEnabled || (altHeld && shiftHeld)) {
    return "boxmodel";
  }
  if (altHeld) {
    return "hierarchy";
  }
  return "minimal";
}

// =============================================================================
// COMPONENT
// =============================================================================

const ElementHoverOverlayComponent: React.FC<ElementHoverOverlayProps> = ({
  hoveredElementId,
  canvasRef,
  altHeld = false,
  shiftHeld = false,
  inspectorEnabled = false,
  parentHierarchy = [],
}) => {
  const [overlayData, setOverlayData] = React.useState<{
    rect: DOMRect;
    boxModel: BoxModel;
    info: ElementInfo;
  } | null>(null);

  // Calculate hover level
  const hoverLevel = getHoverLevel(altHeld, shiftHeld, inspectorEnabled);

  React.useEffect(() => {
    if (!hoveredElementId || !canvasRef.current) {
      setOverlayData(null);
      return;
    }

    const element = canvasRef.current.querySelector(
      `[data-aqb-id="${hoveredElementId}"]`
    ) as HTMLElement;

    if (!element) {
      setOverlayData(null);
      return;
    }

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const relativeRect = new DOMRect(
      elementRect.left - canvasRect.left,
      elementRect.top - canvasRect.top,
      elementRect.width,
      elementRect.height
    );

    setOverlayData({
      rect: relativeRect,
      boxModel: getBoxModel(element),
      info: getElementInfo(element),
    });
  }, [hoveredElementId, canvasRef]);

  if (!overlayData) return null;

  const { rect, boxModel, info } = overlayData;

  return (
    <div
      className="aqb-hover-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: Z_LAYERS.hoverOverlay,
      }}
    >
      {/* Level 1: Minimal - Dashed outline + tiny label */}
      {hoverLevel === "minimal" && (
        <MinimalOverlay rect={rect} info={info} hoveredElementId={hoveredElementId} />
      )}

      {/* Level 3: Hierarchy - Show parent chain */}
      {hoverLevel === "hierarchy" && (
        <HierarchyOverlay
          rect={rect}
          info={info}
          parentHierarchy={parentHierarchy}
          hoveredElementId={hoveredElementId}
        />
      )}

      {/* Level 4: Box Model - Full DevTools-style */}
      {hoverLevel === "boxmodel" && (
        <BoxModelOverlay
          rect={rect}
          boxModel={boxModel}
          info={info}
          hoveredElementId={hoveredElementId}
        />
      )}
    </div>
  );
};

// =============================================================================
// LEVEL 1: Minimal Overlay (Default hover)
// =============================================================================

interface MinimalOverlayProps {
  rect: DOMRect;
  info: ElementInfo;
  hoveredElementId: string | null;
}

const MinimalOverlay: React.FC<MinimalOverlayProps> = ({ rect, info, hoveredElementId }) => (
  <>
    {/* Dashed outline */}
    <div
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        border: `1px dashed ${COLORS.outlineDashed}`,
        borderRadius: 2,
        boxSizing: "border-box",
      }}
    />

    {/* Tiny label */}
    <div
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top - 18,
        background: COLORS.label,
        color: COLORS.labelText,
        padding: "2px 6px",
        borderRadius: 3,
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        whiteSpace: "nowrap",
        opacity: 0.9,
      }}
    >
      {info.friendlyName}
    </div>

    {/* Small drag handle (4x4) */}
    <DragHandle rect={rect} elementId={hoveredElementId || ""} size="small" />
  </>
);

// =============================================================================
// LEVEL 3: Hierarchy Overlay (Alt+Hover)
// =============================================================================

interface HierarchyOverlayProps {
  rect: DOMRect;
  info: ElementInfo;
  parentHierarchy: Array<{ id: string; type: string; label: string }>;
  hoveredElementId: string | null;
}

const HierarchyOverlay: React.FC<HierarchyOverlayProps> = ({
  rect,
  info,
  parentHierarchy,
  hoveredElementId,
}) => (
  <>
    {/* Solid outline */}
    <div
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        border: `1px solid ${COLORS.outline}`,
        borderRadius: 2,
        boxSizing: "border-box",
      }}
    />

    {/* Hierarchy breadcrumb */}
    <div
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top - 28,
        background: COLORS.hierarchyBg,
        color: COLORS.hierarchyText,
        padding: "4px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 4,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      }}
    >
      {parentHierarchy.length > 0 ? (
        <>
          {parentHierarchy.map((parent) => (
            <React.Fragment key={parent.id}>
              <span style={{ opacity: 0.6 }}>{parent.label}</span>
              <span style={{ opacity: 0.4 }}>›</span>
            </React.Fragment>
          ))}
          <span style={{ color: COLORS.hierarchyCurrent, fontWeight: 600 }}>
            {info.friendlyName}
          </span>
        </>
      ) : (
        <>
          {info.parentName && (
            <>
              <span style={{ opacity: 0.6 }}>{info.parentName}</span>
              <span style={{ opacity: 0.4 }}>›</span>
            </>
          )}
          <span style={{ color: COLORS.hierarchyCurrent, fontWeight: 600 }}>
            {info.friendlyName}
          </span>
        </>
      )}
    </div>

    {/* Drag handle */}
    <DragHandle rect={rect} elementId={hoveredElementId || ""} />
  </>
);

// =============================================================================
// LEVEL 4: Box Model Overlay (Alt+Shift or Inspector Mode)
// =============================================================================

interface BoxModelOverlayProps {
  rect: DOMRect;
  boxModel: BoxModel;
  info: ElementInfo;
  hoveredElementId: string | null;
}

const BoxModelOverlay: React.FC<BoxModelOverlayProps> = ({
  rect,
  boxModel,
  info,
  hoveredElementId,
}) => {
  const { margin, padding } = boxModel;

  return (
    <>
      {/* Margin boxes (orange) */}
      <MarginBoxes rect={rect} margin={margin} />

      {/* Padding boxes (green) */}
      <PaddingBoxes rect={rect} padding={padding} />

      {/* Content area (blue) */}
      <div
        style={{
          position: "absolute",
          left: rect.left + padding.left,
          top: rect.top + padding.top,
          width: Math.max(0, rect.width - padding.left - padding.right),
          height: Math.max(0, rect.height - padding.top - padding.bottom),
          background: COLORS.content,
        }}
      />

      {/* Element outline */}
      <div
        style={{
          position: "absolute",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          border: `1px solid ${COLORS.outline}`,
          boxSizing: "border-box",
        }}
      />

      {/* Full info badge */}
      <InfoBadge rect={rect} info={info} />

      {/* Drag handle */}
      <DragHandle rect={rect} elementId={hoveredElementId || ""} />

      {/* Spacing labels */}
      <SpacingLabels rect={rect} margin={margin} padding={padding} />

      {/* Double-click hint for text */}
      {info.isTextElement && <TextEditHint rect={rect} />}
    </>
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const MarginBoxes: React.FC<{ rect: DOMRect; margin: BoxModel["margin"] }> = ({ rect, margin }) => {
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
            background: COLORS.margin,
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
            background: COLORS.margin,
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
            background: COLORS.margin,
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
            background: COLORS.margin,
          }}
        />
      )}
    </>
  );
};

const PaddingBoxes: React.FC<{ rect: DOMRect; padding: BoxModel["padding"] }> = ({
  rect,
  padding,
}) => {
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
            background: COLORS.padding,
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
            background: COLORS.padding,
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
            background: COLORS.padding,
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
            background: COLORS.padding,
          }}
        />
      )}
    </>
  );
};

const InfoBadge: React.FC<{ rect: DOMRect; info: ElementInfo }> = ({ rect, info }) => (
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
      <span style={{ color: COLORS.hierarchyCurrent, fontWeight: 600 }}>{info.friendlyName}</span>
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

const TextEditHint: React.FC<{ rect: DOMRect }> = ({ rect }) => (
  <div
    style={{
      position: "absolute",
      left: rect.left + rect.width - 4,
      top: rect.top + rect.height + 4,
      transform: "translateX(-100%)",
      background: COLORS.outline,
      color: COLORS.labelText,
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

// Wrap with React.memo for performance - prevents re-renders when parent state changes
// but hover state (hoveredElementId, altHeld, shiftHeld) remains the same
export const ElementHoverOverlay = React.memo(ElementHoverOverlayComponent);

export default ElementHoverOverlay;
