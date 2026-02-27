/**
 * Overlay Styled Components
 * Shared styles for canvas overlay elements
 * @license BSD-3-Clause
 */

import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { canvasTokens, cssFragments, animations } from "../../../styles/tokens";

const { colors, shadows, animation, spacing, radius, zIndex, sizing } = canvasTokens;

// ============================================================================
// OVERLAY CONTAINER
// ============================================================================

export const OverlayContainer = styled.div<{ isVisible?: boolean }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: ${zIndex.overlay};
  opacity: ${(props) => (props.isVisible === false ? 0 : 1)};
  ${cssFragments.transition}
`;

// ============================================================================
// INFO BADGE (HOVER/SELECTION)
// ============================================================================

export const InfoBadge = styled.div<{ variant?: "primary" | "secondary" }>`
  position: absolute;
  display: flex;
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.xs}px ${spacing.md}px;
  background: ${(props) =>
    props.variant === "secondary" ? colors.surface.background : colors.primary.default};
  border-radius: ${radius.md}px;
  color: ${colors.text.onPrimary};
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: ${shadows.badge};
  pointer-events: none;
  animation: ${animations.fadeIn} ${animation.duration.fast} ${animation.easing.default};
  z-index: ${zIndex.badge};
`;

// ============================================================================
// DRAG HANDLE (6-DOT GRIP)
// ============================================================================

export const DragHandleContainer = styled.div<{ isHovered?: boolean }>`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: ${sizing.dragHandle.width}px;
  height: ${sizing.dragHandle.height}px;
  background: ${(props) => (props.isHovered ? colors.primary.light : colors.primary.default)};
  border-radius: ${radius.sm}px;
  cursor: grab;
  box-shadow: ${shadows.glowSm};
  ${cssFragments.transition}

  &:active {
    cursor: grabbing;
  }

  &:hover {
    background: ${colors.primary.light};
    transform: scale(1.05);
  }
`;

export const DragHandleDots = styled.div`
  display: flex;
  gap: 3px;
`;

export const DragHandleDot = styled.div`
  width: 3px;
  height: 3px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
`;

// ============================================================================
// DROP FEEDBACK
// ============================================================================

export const DropIndicator = styled.div<{ isValid?: boolean }>`
  position: absolute;
  border: 2px dashed ${(props) => (props.isValid ? colors.dropZone.valid : colors.dropZone.invalid)};
  background: ${(props) => (props.isValid ? colors.dropZone.validBg : colors.dropZone.invalidBg)};
  border-radius: ${radius.md}px;
  pointer-events: none;
  ${cssFragments.transition}
`;

export const DropLine = styled.div<{
  orientation: "horizontal" | "vertical";
  isValid?: boolean;
}>`
  position: absolute;
  background: ${(props) => (props.isValid ? colors.dropZone.valid : colors.dropZone.invalid)};
  border-radius: 2px;
  pointer-events: none;

  ${(props) =>
    props.orientation === "horizontal"
      ? css`
          height: 3px;
          left: 0;
          right: 0;
        `
      : css`
          width: 3px;
          top: 0;
          bottom: 0;
        `}
`;

// ============================================================================
// GRID OVERLAY
// ============================================================================

export const GridPattern = styled.div<{ gridSize?: number }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, ${colors.primary.alpha10} 1px, transparent 1px),
    linear-gradient(to bottom, ${colors.primary.alpha10} 1px, transparent 1px);
  background-size: ${(props) => props.gridSize || 10}px ${(props) => props.gridSize || 10}px;
  border-radius: ${radius.xl}px;
  z-index: 10;
`;

// ============================================================================
// PARENT HIGHLIGHT
// ============================================================================

export const ParentHighlightBox = styled.div<{ isLocked?: boolean }>`
  position: absolute;
  border: 1px dashed rgba(139, 92, 246, 0.5);
  border-radius: ${radius.sm}px;
  background: rgba(139, 92, 246, 0.03);
  pointer-events: none;
  ${cssFragments.transition}

  ${(props) =>
    props.isLocked &&
    css`
      border-color: ${colors.status.warning};
      opacity: 0.5;
    `}
`;

export const ParentHighlightBadge = styled.div`
  position: absolute;
  top: -20px;
  left: 0;
  display: flex;
  align-items: center;
  gap: ${spacing.xs}px;
  padding: 2px ${spacing.md}px;
  background: ${colors.primary.alpha15};
  border-radius: ${radius.sm}px;
  font-size: 10px;
  color: rgba(139, 92, 246, 0.8);
  font-weight: 500;
  white-space: nowrap;
`;

// ============================================================================
// GUIDE LINE
// ============================================================================

export const GuideLine = styled.div<{
  orientation: "horizontal" | "vertical";
  isDragging?: boolean;
  color?: string;
}>`
  position: absolute;
  background: ${(props) => props.color || colors.primary.default};
  opacity: ${(props) => (props.isDragging ? 1 : 0.8)};
  box-shadow: ${(props) =>
    props.isDragging ? `0 0 4px ${props.color || colors.primary.default}` : "none"};
  ${cssFragments.transition}

  ${(props) =>
    props.orientation === "horizontal"
      ? css`
          left: 0;
          right: 0;
          height: 1px;
        `
      : css`
          top: 0;
          bottom: 0;
          width: 1px;
        `}
`;

// ============================================================================
// BREADCRUMB
// ============================================================================

export const BreadcrumbContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing.sm}px ${spacing.lg}px;
  background: rgba(30, 30, 46, 0.95);
  border-top: 1px solid ${colors.surface.border};
  backdrop-filter: blur(8px);
  z-index: ${zIndex.floatingToolbar};
`;

export const BreadcrumbSegment = styled.button<{
  isCurrent?: boolean;
  isRoot?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.xs}px ${spacing.md}px;
  background: ${(props) => (props.isCurrent ? colors.primary.alpha20 : "transparent")};
  border: none;
  border-radius: ${radius.sm}px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: ${(props) =>
    props.isCurrent
      ? colors.primary.light
      : props.isRoot
        ? colors.text.muted
        : colors.text.primary};
  cursor: ${(props) => (props.isRoot ? "default" : "pointer")};
  ${cssFragments.transition}

  &:hover:not(:disabled) {
    background: ${colors.primary.alpha15};
  }
`;

export const BreadcrumbSeparator = styled.span`
  display: flex;
  align-items: center;
  color: #45475a;
`;

export const BreadcrumbHint = styled.div`
  display: flex;
  gap: ${spacing.lg}px;
  font-size: 10px;
  color: ${colors.text.muted};
  white-space: nowrap;
`;
