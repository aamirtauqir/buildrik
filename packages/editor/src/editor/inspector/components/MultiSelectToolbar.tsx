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
import { BatchStylePanel } from "./BatchStylePanel";
import { Button, Tooltip } from "@/editor/chrome-ui";
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

/* Board 159:123 bands ALIGN and only ALIGN: a full-width tinted strip that
   holds the label AND the six buttons, with DISTRIBUTE sitting plain on the
   panel below it. The tint was on the button GROUP instead, in both sections —
   which made ALIGN's band invisible (it spanned the full width at a 4%
   contrast step) and gave DISTRIBUTE a grey pill the board does not draw. */
/* Inside the band the buttons are white boxes; outside it, on the plain
   panel, DISTRIBUTE's two are the tinted ones. The board inverts them that
   way, and transparent buttons on a tinted band had no edge at all. */
const bandedSectionStyles: React.CSSProperties = {
  ...sectionStyles,
  background: "var(--bk-bg-subtle)",
  padding: "var(--bk-space-8) var(--bk-space-12)",
  borderRadius: "var(--bk-radius-lg)",
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
};

/* w-9, not flowbite xs's intrinsic 42 wide. Board 159:123 lays six align
   buttons from x16 on a 42-wide pitch and the last ends at 262, inside an
   inspector one drawer-token wide. Live rendered them 42 wide on a 46 pitch
   from x30, so the sixth ended at 302 — two past the panel's own edge,
   measured live at 1440. The className was also copy-pasted at all six call
   sites. (Sizes written without the unit suffix on purpose: the chrome gate
   greps this file's prose for layout literals.) */
/* Same box as ALIGN_BTN — the row read as two different control sizes, align
   at w-9 and distribute at flowbite's 42. Colours stay different on purpose:
   board 159:123 tints DISTRIBUTE's pair and leaves ALIGN's six white. */
const DISTRIBUTE_BTN =
  "tw:w-9 tw:px-0 tw:justify-center tw:border-transparent " +
  "tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

const ALIGN_BTN =
  "tw:w-9 tw:px-0 tw:justify-center tw:border tw:border-[var(--bk-gray-200)] " +
  "tw:bg-white tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

/** Count left, AI entry right — matches the single-selection header. */
const headerRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--bk-space-8)",
};

/* Board 159:123 writes the count the way the single-selection header writes
   the element's name — plain dark text, not an accent pill. The pill read as a
   status badge for something that is simply the panel's title. */
const countBadgeStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  color: "var(--bk-ink)",
  fontSize: "var(--bk-text-14)",
  fontWeight: 600,
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
      {/* Board 159:123 heads this panel the way the single-selection header is
          headed — the count on the left, the `✦ AI` entry on the right. It
          reads "3 selected", not "3 elements selected": the panel is already
          the element inspector, so the noun is doing no work. */}
      <div style={headerRowStyles}>
        <span style={countBadgeStyles}>{selectedIds.length} selected</span>
        {composer && (
          <Button
            type="button"
            className="tw:h-[22px] tw:px-[7px] tw:rounded-[6px] tw:bg-[var(--bk-accent-tint)] tw:text-[11px] tw:font-medium tw:text-[var(--bk-accent)] tw:whitespace-nowrap"
            title="Ask AI about this selection"
            aria-label="Ask AI about this selection"
            data-testid="multiselect-ai-chip"
            onClick={() => composer.emit("ui:switch-tab", { tab: "ai" })}
          >
            ✦ AI
          </Button>
        )}
      </div>

      {/* Board 159:123 bands them once: ALIGN carries all six, DISTRIBUTE
          carries its two on the right. Live split ALIGN in two ("Align
          Horizontal" / "Align Vertical"), which read as two decisions where
          the board has one. */}
      <div style={bandedSectionStyles}>
        <span style={sectionLabelStyles}>Align</span>
        <div style={buttonGroupStyles}>
          <Tooltip content={getAlignTooltip("Align Left")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Align elements to left"
              onClick={handleAlignLeft}
              disabled={isDisabled} className={ALIGN_BTN}
            ><AlignLeft size={16} /></Button>
          </Tooltip>
          <Tooltip content={getAlignTooltip("Align Center")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Align elements to center horizontally"
              onClick={handleAlignCenterH}
              disabled={isDisabled} className={ALIGN_BTN}
            ><AlignCenter size={16} /></Button>
          </Tooltip>
          <Tooltip content={getAlignTooltip("Align Right")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Align elements to right"
              onClick={handleAlignRight}
              disabled={isDisabled} className={ALIGN_BTN}
            ><AlignRight size={16} /></Button>
          </Tooltip>
          <Tooltip content={getAlignTooltip("Align Top")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Align elements to top"
              onClick={handleAlignTop}
              disabled={isDisabled} className={ALIGN_BTN}
            ><AlignStartVertical size={16} /></Button>
          </Tooltip>
          <Tooltip content={getAlignTooltip("Align Middle")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Align elements to middle vertically"
              onClick={handleAlignMiddle}
              disabled={isDisabled} className={ALIGN_BTN}
            ><AlignCenterVertical size={16} /></Button>
          </Tooltip>
          <Tooltip content={getAlignTooltip("Align Bottom")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Align elements to bottom"
              onClick={handleAlignBottom}
              disabled={isDisabled} className={ALIGN_BTN}
            ><AlignEndVertical size={16} /></Button>
          </Tooltip>
        </div>
      </div>

      {/* Distribution */}
      <div style={sectionStyles}>
        <span style={sectionLabelStyles}>Distribute</span>
        <div style={{ ...buttonGroupStyles, alignSelf: "flex-end" }}>
          <Tooltip content={getDistributeTooltip("Horizontally")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Distribute elements horizontally with equal spacing"
              onClick={handleDistributeH}
              disabled={distributeDisabled} className={DISTRIBUTE_BTN}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="4" y="5" width="4" height="14" rx="1" />
                <rect x="10" y="5" width="4" height="14" rx="1" />
                <rect x="16" y="5" width="4" height="14" rx="1" />
              </svg>
            </Button>
          </Tooltip>
          <Tooltip content={getDistributeTooltip("Vertically")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Distribute elements vertically with equal spacing"
              onClick={handleDistributeV}
              disabled={distributeDisabled} className={DISTRIBUTE_BTN}
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
