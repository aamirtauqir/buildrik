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
import {
  MarginBoxes,
  PaddingBoxes,
  InfoBadge,
  TextEditHint,
} from "./ElementHoverOverlaySubComponents";
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
  /** Ctrl/Cmd held — signals that drag will clone instead of move */
  isCloneMode?: boolean;
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

  // Clone mode badge background
  cloneMode: "var(--aqb-success, #22c55e)",
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
  isCloneMode = false,
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
        <MinimalOverlay
          rect={rect}
          info={info}
          hoveredElementId={hoveredElementId}
          isCloneMode={isCloneMode}
        />
      )}

      {/* Level 3: Hierarchy - Show parent chain */}
      {hoverLevel === "hierarchy" && (
        <HierarchyOverlay
          rect={rect}
          info={info}
          parentHierarchy={parentHierarchy}
          hoveredElementId={hoveredElementId}
          isCloneMode={isCloneMode}
        />
      )}

      {/* Level 4: Box Model - Full DevTools-style */}
      {hoverLevel === "boxmodel" && (
        <BoxModelOverlay
          rect={rect}
          boxModel={boxModel}
          info={info}
          hoveredElementId={hoveredElementId}
          isCloneMode={isCloneMode}
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
  isCloneMode: boolean;
}

const MinimalOverlay: React.FC<MinimalOverlayProps> = ({
  rect,
  info,
  hoveredElementId,
  isCloneMode,
}) => (
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
        fontSize: 12,
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

    {/* Clone mode badge — visible when Ctrl/Cmd held, signals Ctrl/Cmd+drag will clone */}
    {isCloneMode && <CloneBadge rect={rect} />}
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
  isCloneMode: boolean;
}

const HierarchyOverlay: React.FC<HierarchyOverlayProps> = ({
  rect,
  info,
  parentHierarchy,
  hoveredElementId,
  isCloneMode,
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
        fontSize: 12,
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

    {/* Clone mode badge */}
    {isCloneMode && <CloneBadge rect={rect} />}
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
  isCloneMode: boolean;
}

const BoxModelOverlay: React.FC<BoxModelOverlayProps> = ({
  rect,
  boxModel,
  info,
  hoveredElementId,
  isCloneMode,
}) => {
  const { margin, padding } = boxModel;

  return (
    <>
      {/* Margin boxes (orange) */}
      <MarginBoxes rect={rect} margin={margin} colors={COLORS} />

      {/* Padding boxes (green) */}
      <PaddingBoxes rect={rect} padding={padding} colors={COLORS} />

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
      <InfoBadge rect={rect} info={info} colors={COLORS} />

      {/* Drag handle */}
      <DragHandle rect={rect} elementId={hoveredElementId || ""} />

      {/* Spacing labels */}
      <SpacingLabels rect={rect} margin={margin} padding={padding} />

      {/* Double-click hint for text */}
      {info.isTextElement && <TextEditHint rect={rect} colors={COLORS} />}

      {/* Clone mode badge */}
      {isCloneMode && <CloneBadge rect={rect} />}
    </>
  );
};

/**
 * CloneBadge — small "⊕" pill rendered at the top-right corner of the
 * hovered element's bounding box when Ctrl/Cmd is held (clone mode).
 * Signals that the upcoming drag will clone the element rather than move it.
 */
const CloneBadge: React.FC<{ rect: DOMRect }> = ({ rect }) => (
  <div
    data-testid="clone-badge"
    aria-label="Clone mode"
    style={{
      position: "absolute",
      top: rect.top - 9,
      left: rect.left + rect.width - 9,
      width: 18,
      height: 18,
      background: COLORS.cloneMode,
      color: "var(--aqb-text-on-color, #ffffff)",
      borderRadius: "50%",
      fontSize: 12,
      fontWeight: 700,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
      userSelect: "none",
    }}
  >
    ⊕
  </div>
);

// Wrap with React.memo for performance - prevents re-renders when parent state changes
// but hover state (hoveredElementId, altHeld, shiftHeld) remains the same
export const ElementHoverOverlay = React.memo(ElementHoverOverlayComponent);

export default ElementHoverOverlay;
