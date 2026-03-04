/**
 * Selection Styled Components
 * Shared styles for selection UI elements
 * @license BSD-3-Clause
 */

import styled from "@emotion/styled";
import { canvasTokens, cssFragments } from "../../../styles/tokens";

const { colors, selection, shadows, spacing, radius, zIndex } = canvasTokens;

// ============================================================================
// RESIZE HANDLE
// ============================================================================

export interface ResizeHandleProps {
  position: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "rotate" | "move";
  isActive?: boolean;
  isHovered?: boolean;
}

const getCursorForPosition = (position: ResizeHandleProps["position"]) => {
  const cursors: Record<ResizeHandleProps["position"], string> = {
    nw: "nwse-resize",
    n: "ns-resize",
    ne: "nesw-resize",
    e: "ew-resize",
    se: "nwse-resize",
    s: "ns-resize",
    sw: "nesw-resize",
    w: "ew-resize",
    rotate: "grab",
    move: "move",
  };
  return cursors[position];
};

export const ResizeHandle = styled.div<ResizeHandleProps>`
  position: absolute;
  width: 10px;
  height: 10px;
  background: ${selection.handleGradient};
  border: 2px solid white;
  border-radius: ${radius.sm}px;
  box-shadow: ${shadows.glowSm};
  cursor: ${(props) => getCursorForPosition(props.position)};
  z-index: ${zIndex.selectionHandle};
  transform: translate(-50%, -50%);
  ${cssFragments.transition}

  &:hover {
    transform: translate(-50%, -50%) scale(1.15);
    box-shadow: ${shadows.glowMd};
  }

  &:active {
    transform: translate(-50%, -50%) scale(0.95);
  }
`;

// ============================================================================
// SELECTION BORDER
// ============================================================================

export interface SelectionBorderProps {
  isMultiSelect?: boolean;
  isPrimary?: boolean;
}

export const SelectionBorder = styled.div<SelectionBorderProps>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 2px solid ${colors.primary.default};
  border-radius: ${radius.sm}px;
  box-shadow: ${(props) => (props.isPrimary ? selection.glowStrong : selection.glow)};
  z-index: ${zIndex.selectionBox};

  ${(props) =>
    props.isMultiSelect &&
    `
    border-style: dashed;
    border-color: ${colors.primary.alpha40};
  `}
`;

// ============================================================================
// SELECTION BADGE (SIZE INDICATOR)
// ============================================================================

export const SelectionBadge = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.xs}px ${spacing.sm}px;
  background: ${selection.handleGradient};
  border-radius: ${radius.md}px;
  color: ${colors.text.onPrimary};
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: ${shadows.badge};
  z-index: ${zIndex.selectionBadge};
  pointer-events: none;
  ${cssFragments.transition}
`;

// ============================================================================
// MULTI-SELECT BADGE
// ============================================================================

export const MultiSelectBadgeContainer = styled.div`
  position: absolute;
  top: ${spacing.lg}px;
  right: ${spacing.lg}px;
  display: flex;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px ${spacing.lg}px;
  background: ${selection.handleGradient};
  border-radius: ${radius.md}px;
  color: ${colors.text.onPrimary};
  font-size: 13px;
  font-weight: 600;
  box-shadow: ${shadows.badge};
  z-index: 9600;
  pointer-events: auto;
  backdrop-filter: blur(8px);
`;

export const MultiSelectClearButton = styled.button<{ isHovered?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: ${spacing.xs}px;
  padding: 0;
  border: none;
  border-radius: ${radius.sm}px;
  background: ${(props) =>
    props.isHovered ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.2)"};
  color: ${colors.text.onPrimary};
  font-size: 12px;
  cursor: pointer;
  ${cssFragments.transition}
`;

// ============================================================================
// PRIMARY INDICATOR
// ============================================================================

export const PrimaryIndicator = styled.span`
  font-size: 14px;
  color: #fbbf24;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;
