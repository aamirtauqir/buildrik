/**
 * MultiSelectToolbar - Alignment and distribution controls for multi-selection
 * Provides quick access to common alignment operations when multiple elements are selected
 *
 * @license BSD-3-Clause
 */

import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
} from "lucide-react";
import * as React from "react";
import type { Composer } from "../../../engine";
import { AlignmentHandler } from "../../../engine/canvas/AlignmentHandler";
import { IconButton } from "../../../shared/ui/IconButton";

// ============================================================================
// TYPES
// ============================================================================

export interface MultiSelectToolbarProps {
  /** Array of selected element IDs */
  selectedIds: string[];
  /** Composer instance for element manipulation */
  composer: Composer | null;
}

// ============================================================================
// STYLES
// ============================================================================

const toolbarStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--aqb-space-4)",
  padding: "var(--aqb-space-4)",
};

const sectionStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--aqb-space-2)",
};

const sectionLabelStyles: React.CSSProperties = {
  fontSize: "var(--aqb-text-xs)",
  fontWeight: 600,
  color: "var(--aqb-text-tertiary)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const buttonGroupStyles: React.CSSProperties = {
  display: "flex",
  gap: "var(--aqb-space-1)",
  background: "var(--aqb-surface-3)",
  padding: "var(--aqb-space-1)",
  borderRadius: "var(--aqb-radius-md)",
};

const countBadgeStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--aqb-primary-light)",
  color: "var(--aqb-primary)",
  fontSize: "var(--aqb-text-sm)",
  fontWeight: 600,
  padding: "var(--aqb-space-2) var(--aqb-space-3)",
  borderRadius: "var(--aqb-radius-md)",
  marginBottom: "var(--aqb-space-2)",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const MultiSelectToolbar: React.FC<MultiSelectToolbarProps> = ({
  selectedIds,
  composer,
}) => {
  // Memoize alignment handler
  const alignmentHandler = React.useMemo(() => {
    if (!composer) return null;
    return new AlignmentHandler(composer);
  }, [composer]);

  // Alignment handlers
  const handleAlignLeft = React.useCallback(() => {
    alignmentHandler?.alignHorizontal(selectedIds, "left");
  }, [alignmentHandler, selectedIds]);

  const handleAlignCenterH = React.useCallback(() => {
    alignmentHandler?.alignHorizontal(selectedIds, "center");
  }, [alignmentHandler, selectedIds]);

  const handleAlignRight = React.useCallback(() => {
    alignmentHandler?.alignHorizontal(selectedIds, "right");
  }, [alignmentHandler, selectedIds]);

  const handleAlignTop = React.useCallback(() => {
    alignmentHandler?.alignVertical(selectedIds, "top");
  }, [alignmentHandler, selectedIds]);

  const handleAlignMiddle = React.useCallback(() => {
    alignmentHandler?.alignVertical(selectedIds, "middle");
  }, [alignmentHandler, selectedIds]);

  const handleAlignBottom = React.useCallback(() => {
    alignmentHandler?.alignVertical(selectedIds, "bottom");
  }, [alignmentHandler, selectedIds]);

  // Distribution handlers
  const handleDistributeH = React.useCallback(() => {
    alignmentHandler?.distribute(selectedIds, "horizontal");
  }, [alignmentHandler, selectedIds]);

  const handleDistributeV = React.useCallback(() => {
    alignmentHandler?.distribute(selectedIds, "vertical");
  }, [alignmentHandler, selectedIds]);

  const isDisabled = !alignmentHandler || selectedIds.length < 2;
  const distributeDisabled = isDisabled || selectedIds.length < 3;

  // Generate helpful tooltip text based on disabled state
  const getAlignTooltip = (action: string) => {
    if (!alignmentHandler) return `${action} (no composer available)`;
    if (selectedIds.length < 2) return `${action} (select 2+ elements)`;
    return action;
  };

  const getDistributeTooltip = (direction: string) => {
    if (!alignmentHandler) return `Distribute ${direction} (no composer available)`;
    if (selectedIds.length < 3) return `Distribute ${direction} (select 3+ elements)`;
    return `Distribute ${direction}`;
  };

  return (
    <div style={toolbarStyles}>
      {/* Selection count badge */}
      <div style={countBadgeStyles}>{selectedIds.length} elements selected</div>

      {/* Horizontal Alignment */}
      <div style={sectionStyles}>
        <span style={sectionLabelStyles}>Align Horizontal</span>
        <div style={buttonGroupStyles}>
          <IconButton
            icon={<AlignLeft size={16} />}
            tooltip={getAlignTooltip("Align Left")}
            ariaLabel="Align elements to left"
            size="sm"
            variant="ghost"
            onClick={handleAlignLeft}
            disabled={isDisabled}
          />
          <IconButton
            icon={<AlignCenter size={16} />}
            tooltip={getAlignTooltip("Align Center")}
            ariaLabel="Align elements to center horizontally"
            size="sm"
            variant="ghost"
            onClick={handleAlignCenterH}
            disabled={isDisabled}
          />
          <IconButton
            icon={<AlignRight size={16} />}
            tooltip={getAlignTooltip("Align Right")}
            ariaLabel="Align elements to right"
            size="sm"
            variant="ghost"
            onClick={handleAlignRight}
            disabled={isDisabled}
          />
        </div>
      </div>

      {/* Vertical Alignment */}
      <div style={sectionStyles}>
        <span style={sectionLabelStyles}>Align Vertical</span>
        <div style={buttonGroupStyles}>
          <IconButton
            icon={<AlignStartVertical size={16} />}
            tooltip={getAlignTooltip("Align Top")}
            ariaLabel="Align elements to top"
            size="sm"
            variant="ghost"
            onClick={handleAlignTop}
            disabled={isDisabled}
          />
          <IconButton
            icon={<AlignCenterVertical size={16} />}
            tooltip={getAlignTooltip("Align Middle")}
            ariaLabel="Align elements to middle vertically"
            size="sm"
            variant="ghost"
            onClick={handleAlignMiddle}
            disabled={isDisabled}
          />
          <IconButton
            icon={<AlignEndVertical size={16} />}
            tooltip={getAlignTooltip("Align Bottom")}
            ariaLabel="Align elements to bottom"
            size="sm"
            variant="ghost"
            onClick={handleAlignBottom}
            disabled={isDisabled}
          />
        </div>
      </div>

      {/* Distribution */}
      <div style={sectionStyles}>
        <span style={sectionLabelStyles}>Distribute</span>
        <div style={buttonGroupStyles}>
          <IconButton
            icon={
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="4" y="5" width="4" height="14" rx="1" />
                <rect x="10" y="5" width="4" height="14" rx="1" />
                <rect x="16" y="5" width="4" height="14" rx="1" />
              </svg>
            }
            tooltip={getDistributeTooltip("Horizontally")}
            ariaLabel="Distribute elements horizontally with equal spacing"
            size="sm"
            variant="ghost"
            onClick={handleDistributeH}
            disabled={distributeDisabled}
          />
          <IconButton
            icon={
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="5" y="4" width="14" height="4" rx="1" />
                <rect x="5" y="10" width="14" height="4" rx="1" />
                <rect x="5" y="16" width="14" height="4" rx="1" />
              </svg>
            }
            tooltip={getDistributeTooltip("Vertically")}
            ariaLabel="Distribute elements vertically with equal spacing"
            size="sm"
            variant="ghost"
            onClick={handleDistributeV}
            disabled={distributeDisabled}
          />
        </div>
      </div>

      {/* Hint text */}
      <p
        style={{
          fontSize: "var(--aqb-text-xs)",
          color: "var(--aqb-text-muted)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Select a single element to edit its properties, or use the alignment tools above.
      </p>
    </div>
  );
};

export default MultiSelectToolbar;
