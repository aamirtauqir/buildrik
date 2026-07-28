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
import type { PseudoStateId } from "../../../shared/types";
import type { BreakpointId } from "../../../shared/types/breakpoints";
import { Button, Tooltip } from "@/editor/ui";
import { BatchStylePanel } from "./BatchStylePanel";

// ============================================================================
// TYPES
// ============================================================================

export interface MultiSelectToolbarProps {
  /** Array of selected element IDs */
  selectedIds: string[];
  /** Composer instance for element manipulation */
  composer: Composer | null;
  /** Active responsive breakpoint — threaded into batch edits so writes land on the right layer */
  currentBreakpoint?: BreakpointId;
  /** Active pseudo-state — threaded into batch edits so writes land on the right layer */
  currentPseudoState?: PseudoStateId;
}

// ============================================================================
// STYLES
// ============================================================================

const toolbarStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--bk-space-16)",
  padding: "var(--bk-space-16)",
};

const sectionStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--bk-space-8)",
};

const sectionLabelStyles: React.CSSProperties = {
  fontSize: "var(--bk-text-11)",
  fontWeight: 600,
  color: "var(--bk-ink-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const buttonGroupStyles: React.CSSProperties = {
  display: "flex",
  gap: "var(--bk-space-4)",
  background: "var(--bk-bg-subtle)",
  padding: "var(--bk-space-4)",
  borderRadius: "var(--bk-radius-lg)",
};

const countBadgeStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--bk-accent-subtle)",
  color: "var(--bk-accent)",
  fontSize: "var(--bk-text-12)",
  fontWeight: 600,
  padding: "var(--bk-space-8)",
  borderRadius: "var(--bk-radius-lg)",
  marginBottom: "var(--bk-space-8)",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const MultiSelectToolbar: React.FC<MultiSelectToolbarProps> = ({
  selectedIds,
  composer,
  currentBreakpoint = "desktop",
  currentPseudoState = "normal",
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
          <Tooltip label={getAlignTooltip("Align Left")}>
            <Button
              kind="ghost"
              size="sm"
              aria-label="Align elements to left"
              onClick={handleAlignLeft}
              disabled={isDisabled}
            ><AlignLeft size={16} /></Button>
          </Tooltip>
          <Tooltip label={getAlignTooltip("Align Center")}>
            <Button
              kind="ghost"
              size="sm"
              aria-label="Align elements to center horizontally"
              onClick={handleAlignCenterH}
              disabled={isDisabled}
            ><AlignCenter size={16} /></Button>
          </Tooltip>
          <Tooltip label={getAlignTooltip("Align Right")}>
            <Button
              kind="ghost"
              size="sm"
              aria-label="Align elements to right"
              onClick={handleAlignRight}
              disabled={isDisabled}
            ><AlignRight size={16} /></Button>
          </Tooltip>
        </div>
      </div>

      {/* Vertical Alignment */}
      <div style={sectionStyles}>
        <span style={sectionLabelStyles}>Align Vertical</span>
        <div style={buttonGroupStyles}>
          <Tooltip label={getAlignTooltip("Align Top")}>
            <Button
              kind="ghost"
              size="sm"
              aria-label="Align elements to top"
              onClick={handleAlignTop}
              disabled={isDisabled}
            ><AlignStartVertical size={16} /></Button>
          </Tooltip>
          <Tooltip label={getAlignTooltip("Align Middle")}>
            <Button
              kind="ghost"
              size="sm"
              aria-label="Align elements to middle vertically"
              onClick={handleAlignMiddle}
              disabled={isDisabled}
            ><AlignCenterVertical size={16} /></Button>
          </Tooltip>
          <Tooltip label={getAlignTooltip("Align Bottom")}>
            <Button
              kind="ghost"
              size="sm"
              aria-label="Align elements to bottom"
              onClick={handleAlignBottom}
              disabled={isDisabled}
            ><AlignEndVertical size={16} /></Button>
          </Tooltip>
        </div>
      </div>

      {/* Distribution */}
      <div style={sectionStyles}>
        <span style={sectionLabelStyles}>Distribute</span>
        <div style={buttonGroupStyles}>
          <Tooltip label={getDistributeTooltip("Horizontally")}>
            <Button
              kind="ghost"
              size="sm"
              aria-label="Distribute elements horizontally with equal spacing"
              onClick={handleDistributeH}
              disabled={distributeDisabled}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="4" y="5" width="4" height="14" rx="1" />
                <rect x="10" y="5" width="4" height="14" rx="1" />
                <rect x="16" y="5" width="4" height="14" rx="1" />
              </svg>
            </Button>
          </Tooltip>
          <Tooltip label={getDistributeTooltip("Vertically")}>
            <Button
              kind="ghost"
              size="sm"
              aria-label="Distribute elements vertically with equal spacing"
              onClick={handleDistributeV}
              disabled={distributeDisabled}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="5" y="4" width="14" height="4" rx="1" />
                <rect x="5" y="10" width="14" height="4" rx="1" />
                <rect x="5" y="16" width="14" height="4" rx="1" />
              </svg>
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Batch style editor — apply common style changes to all selected elements */}
      <BatchStylePanel
        composer={composer}
        selectedIds={selectedIds}
        currentBreakpoint={currentBreakpoint}
        currentPseudoState={currentPseudoState}
      />
    </div>
  );
};

export default MultiSelectToolbar;
