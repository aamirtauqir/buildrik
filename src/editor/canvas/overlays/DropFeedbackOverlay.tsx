/**
 * Drop Feedback Overlay
 * Professional visual feedback for drag & drop operations
 * Inspired by GrapesJS and industry best practices
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Z_LAYERS } from "../../../shared/constants/canvas";
import type { InvalidDropReason } from "../../../shared/utils/dragDrop/dropValidation";
import type { DropSlotRect, BreadcrumbItem } from "../hooks/useDragSession";
import { getFriendlyName } from "../utils/elementInfo";

// Re-export for convenience (types come from useDragSession)
export type { InvalidDropReason, DropSlotRect, BreadcrumbItem };

/** Human-readable messages for invalid drop reasons */
const INVALID_DROP_MESSAGES: Record<NonNullable<InvalidDropReason>, string> = {
  VOID_ELEMENT: "Cannot have children",
  TEXT_ELEMENT: "Text cannot contain elements",
  SELF_DROP: "Cannot drop inside itself",
  ANCESTOR_DROP: "Cannot drop inside child",
  MAX_DEPTH: "Max depth reached",
  SAME_POSITION: "Already in position",
  NESTING_FORBIDDEN: "Not allowed here",
  INTERACTIVE_NESTING: "Cannot nest interactive",
  CANNOT_NEST_IN_TARGET: "Cannot place here", // GAP-FIX: Added for block drags
};

export interface DropFeedbackOverlayProps {
  /** Whether drag is currently over canvas */
  isDragOver: boolean;
  /** Current drop target element ID */
  dropTargetId: string | null;
  /** Current drop position */
  dropPosition: "before" | "after" | "inside" | null;
  /** Whether this is a valid drop target */
  isValidDrop: boolean;
  /** Reason for invalid drop (if not valid) */
  invalidReason: InvalidDropReason;
  /** Reference to canvas element */
  canvasRef: React.RefObject<HTMLDivElement>;
  /** Animated drop slot preview rect */
  dropSlotRect?: DropSlotRect | null;
  /** Breadcrumb path (kept for API compatibility but not rendered) */
  dropTargetPath?: BreadcrumbItem[];
}

/** Professional color palette - using CSS variables from Canvas.css */
const COLORS = {
  valid: {
    border: "var(--aqb-drop-valid-border)", // Green for valid drops
    bg: "var(--aqb-drop-valid-bg)",
    text: "#1e293b",
    badgeBg: "#1e1e2e",
    badgeText: "var(--aqb-primary-light)",
  },
  invalid: {
    border: "var(--aqb-drop-invalid-border)", // Red for invalid drops
    bg: "var(--aqb-drop-invalid-bg)",
    text: "#ffffff",
  },
};

/* NOTE: Local getElementName function REMOVED
   Now using getFriendlyName from ../utils/elementInfo.ts
   This ensures a single source of truth for element naming across the app */

/** Wrapper for getFriendlyName that handles null safely */
function getElementName(element: HTMLElement | null): string {
  if (!element) return "element";
  return getFriendlyName(element);
}

const DropFeedbackOverlayComponent: React.FC<DropFeedbackOverlayProps> = ({
  isDragOver,
  dropTargetId,
  dropPosition,
  isValidDrop,
  invalidReason,
  canvasRef,
  dropSlotRect,
  dropTargetPath = [],
}) => {
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);
  const [canvasRect, setCanvasRect] = React.useState<DOMRect | null>(null);

  // Update target rect when drop target changes
  React.useEffect(() => {
    if (!isDragOver || !dropTargetId || !canvasRef.current) {
      setTargetRect(null);
      setCanvasRect(null);
      return;
    }

    const targetEl = canvasRef.current.querySelector(
      `[data-aqb-id="${dropTargetId}"]`
    ) as HTMLElement | null;

    if (!targetEl) {
      setTargetRect(null);
      setCanvasRect(null);
      return;
    }

    const canvas = canvasRef.current.getBoundingClientRect();
    const target = targetEl.getBoundingClientRect();

    setCanvasRect(canvas);
    setTargetRect(target);
  }, [isDragOver, dropTargetId, canvasRef]);

  // Announcement text for screen readers (WCAG 4.1.3 — assertive for time-sensitive drag feedback)
  // Announce invalid reason when dragging over an invalid target; clear otherwise.
  const liveText =
    isDragOver && !isValidDrop && invalidReason ? INVALID_DROP_MESSAGES[invalidReason] : "";

  // Visual overlay is only rendered when there is a valid drag state with measured rects.
  const showVisual = isDragOver && dropTargetId && targetRect && canvasRect;

  const message = invalidReason ? INVALID_DROP_MESSAGES[invalidReason] : null;

  // Calculate relative position only when visual is shown
  const relativeRect = showVisual
    ? {
        left: targetRect.left - canvasRect.left,
        top: targetRect.top - canvasRect.top,
        width: targetRect.width,
        height: targetRect.height,
      }
    : null;

  // Get target element name for destination label (only when visual is needed)
  const targetElement = showVisual
    ? (canvasRef.current?.querySelector(`[data-aqb-id="${dropTargetId}"]`) as HTMLElement | null)
    : null;
  const targetName = getElementName(targetElement);

  return (
    <>
      {/* Aria-live region — always in DOM so screen readers observe it (WCAG 4.1.3).
          assertive priority because drop feedback is time-sensitive: once the user
          releases the mouse the moment to announce has passed. aria-atomic ensures
          the full message is read even if it changes rapidly. */}
      <div aria-live="assertive" aria-atomic="true" className="aqb-sr-only">
        {liveText}
      </div>

      {/* Visual overlay — only rendered when rects are measured */}
      {showVisual && relativeRect && (
        <div
          className="aqb-drop-feedback-overlay"
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
          {/* Target highlight overlay - 2px solid border */}
          {/* BUG-009 FIX: Added z-index and pointerEvents to prevent visual overlap with text */}
          <div
            className={`aqb-drop-feedback-target ${isValidDrop ? "valid" : "invalid"}`}
            style={{
              position: "absolute",
              left: relativeRect.left,
              top: relativeRect.top,
              width: relativeRect.width,
              height: relativeRect.height,
              border: `2px solid ${isValidDrop ? COLORS.valid.border : COLORS.invalid.border}`,
              backgroundColor: isValidDrop ? COLORS.valid.bg : COLORS.invalid.bg,
              borderRadius: 4,
              transition: "border-color 150ms ease, background-color 150ms ease",
              boxSizing: "border-box",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />

          {/* Drop position indicator line - 2px solid */}
          {dropPosition && dropPosition !== "inside" && (
            <DropPositionLine
              position={dropPosition}
              targetRect={relativeRect}
              isValid={isValidDrop}
            />
          )}

          {/* Animated drop slot preview - simple dashed outline */}
          {dropSlotRect && isValidDrop && <DropSlotPreview slotRect={dropSlotRect} />}

          {/* Destination label - for valid drops, shows where element will go */}
          {isValidDrop && dropPosition && (
            <DestinationLabel
              targetRect={relativeRect}
              targetName={targetName}
              position={dropPosition}
            />
          )}

          {/* Feedback badge - only for invalid drops, corner positioned */}
          {!isValidDrop && <DropFeedbackBadge targetRect={relativeRect} message={message} />}

          {/* Breadcrumb trail - shows element hierarchy during drag */}
          {isValidDrop && dropTargetPath.length > 1 && (
            <DropBreadcrumb path={dropTargetPath} targetRect={relativeRect} />
          )}

          {/* Depth badge - shows nesting level for deep drops */}
          {isValidDrop && dropTargetPath.length > 2 && (
            <DepthBadge depth={dropTargetPath.length} targetRect={relativeRect} />
          )}
        </div>
      )}
    </>
  );
};

/** Drop position line indicator - Professional 2px solid line */
interface DropPositionLineProps {
  position: "before" | "after";
  targetRect: { left: number; top: number; width: number; height: number };
  isValid: boolean;
}

const DropPositionLine: React.FC<DropPositionLineProps> = ({ position, targetRect, isValid }) => {
  const color = isValid ? COLORS.valid.border : COLORS.invalid.border;
  const top = position === "before" ? targetRect.top - 1 : targetRect.top + targetRect.height;

  return (
    <div
      className="aqb-drop-position-line"
      style={{
        position: "absolute",
        left: targetRect.left - 4,
        top,
        width: targetRect.width + 8,
        height: 2,
        backgroundColor: color,
        borderRadius: 1,
        animation: "dropLineFadeIn 150ms ease-out forwards",
        zIndex: Z_LAYERS.dropPositionLine,
      }}
    />
  );
};

/** Animated drop slot preview - Simple dashed outline */
interface DropSlotPreviewProps {
  slotRect: DropSlotRect;
}

const DropSlotPreview: React.FC<DropSlotPreviewProps> = ({ slotRect }) => {
  const animationName = slotRect.isHorizontal ? "slotFadeInHorizontal" : "slotFadeIn";

  return (
    <div
      className="aqb-drop-slot-preview"
      style={{
        position: "absolute",
        left: slotRect.x,
        top: slotRect.y,
        width: slotRect.width,
        height: slotRect.height,
        backgroundColor: "var(--aqb-drop-valid-bg)",
        border: "2px dashed var(--aqb-drop-valid-border)",
        borderRadius: 4,
        animation: `${animationName} 150ms ease-out forwards`,
        transformOrigin: slotRect.isHorizontal ? "left center" : "center top",
        pointerEvents: "none",
        zIndex: Z_LAYERS.dropSlot,
      }}
    />
  );
};

/** Feedback badge - Only for invalid drops, positioned at corner */
interface DropFeedbackBadgeProps {
  targetRect: { left: number; top: number; width: number; height: number };
  message: string | null;
}

const DropFeedbackBadge: React.FC<DropFeedbackBadgeProps> = ({ targetRect, message }) => {
  return (
    <div
      className="aqb-drop-feedback-badge invalid"
      style={{
        position: "absolute",
        left: targetRect.left + targetRect.width + 8,
        top: targetRect.top - 4,
        backgroundColor: COLORS.invalid.border,
        color: COLORS.invalid.text,
        padding: "4px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        animation: "badgeFadeIn 150ms ease-out forwards",
        zIndex: Z_LAYERS.dropBadge,
      }}
    >
      {message || "Cannot drop here"}
    </div>
  );
};

/** Destination label - Shows where element will be inserted for valid drops */
interface DestinationLabelProps {
  targetRect: { left: number; top: number; width: number; height: number };
  targetName: string;
  position: "before" | "after" | "inside";
}

const DestinationLabel: React.FC<DestinationLabelProps> = ({
  targetRect,
  targetName,
  position,
}) => {
  const positionText =
    position === "inside"
      ? `Insert inside ${targetName}`
      : position === "before"
        ? `Insert before ${targetName}`
        : `Insert after ${targetName}`;

  return (
    <div
      className="aqb-drop-destination-label"
      style={{
        position: "absolute",
        left: targetRect.left + targetRect.width + 8,
        top: targetRect.top - 4,
        backgroundColor: COLORS.valid.badgeBg,
        color: COLORS.valid.badgeText,
        padding: "4px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        animation: "badgeFadeIn 150ms ease-out forwards",
        zIndex: Z_LAYERS.dropDestinationLabel,
      }}
    >
      {positionText}
    </div>
  );
};

/** Breadcrumb trail - Shows element hierarchy during drag */
interface DropBreadcrumbProps {
  path: BreadcrumbItem[];
  targetRect: { left: number; top: number; width: number; height: number };
}

const DropBreadcrumb: React.FC<DropBreadcrumbProps> = ({ path, targetRect }) => {
  if (path.length === 0) return null;

  return (
    <div
      className="aqb-drop-breadcrumb"
      style={{
        position: "absolute",
        left: targetRect.left,
        top: targetRect.top - 28,
        display: "flex",
        alignItems: "center",
        gap: 2,
        backgroundColor: "var(--aqb-toolbar-bg, #252536)",
        padding: "4px 8px",
        borderRadius: 4,
        fontSize: 11,
        color: "var(--aqb-text-secondary, #a0a0b0)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        animation: "breadcrumbFadeIn 150ms ease-out forwards",
        zIndex: Z_LAYERS.dropBreadcrumb,
        whiteSpace: "nowrap",
        maxWidth: 300,
        overflow: "hidden",
      }}
    >
      {path.map((item, idx) => (
        <React.Fragment key={item.id}>
          <span
            style={{
              color: item.isCurrent
                ? "var(--aqb-text-primary, #f8fafc)"
                : "var(--aqb-text-secondary, #a0a0b0)",
              fontWeight: item.isCurrent ? 600 : 400,
            }}
          >
            {item.label}
          </span>
          {idx < path.length - 1 && (
            <span style={{ color: "var(--aqb-text-tertiary, #71717a)", margin: "0 2px" }}>›</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/** Depth badge - Shows nesting level for deep drops */
interface DepthBadgeProps {
  depth: number;
  targetRect: { left: number; top: number; width: number; height: number };
}

const DepthBadge: React.FC<DepthBadgeProps> = ({ depth, targetRect }) => {
  if (depth <= 2) return null;

  return (
    <div
      className="aqb-depth-badge"
      style={{
        position: "absolute",
        left: targetRect.left + targetRect.width - 40,
        top: targetRect.top + targetRect.height + 4,
        backgroundColor: "var(--aqb-toolbar-bg, #252536)",
        color: "var(--aqb-text-secondary, #a0a0b0)",
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 10,
        fontWeight: 600,
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        animation: "badgeFadeIn 150ms ease-out forwards",
        zIndex: Z_LAYERS.dropDepthBadge,
        whiteSpace: "nowrap",
      }}
    >
      Level {depth}
    </div>
  );
};

// Wrap with React.memo for performance - prevents re-renders when parent state changes
// but drop feedback state (isDragOver, dropTargetId, dropPosition) remains the same
export const DropFeedbackOverlay = React.memo(DropFeedbackOverlayComponent);

export default DropFeedbackOverlay;
