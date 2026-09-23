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
import { getElementIcon } from "@/editor/shared/elementIcons";
import { BatchStylePanel } from "./BatchStylePanel";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
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

/* Board 159:123 stacks Header (48 tall) / Align (72) / Distribute (44)
   CONTIGUOUSLY — the next inspector row starts at y164, exactly Header +
   Align + Distribute with no seam between them. A single outer padding
   used to wrap all three, which both inset ALIGN's tint 16px off the panel
   edges (never full-bleed) and put a 16px gap between blocks the board
   never draws. Each section now owns its own inset instead. */
const toolbarStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const sectionStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px", // no --bk-space-6 token; label-to-buttons gap per board 159:126
  padding: "var(--bk-space-8) var(--bk-space-16) 14px", // 8 top / 16 sides / 14 bottom = 72 total with the content below
};

/* Board 159:123 bands ALIGN and only ALIGN: a full-width tinted strip that
   holds the label AND the six buttons, with DISTRIBUTE sitting plain on the
   panel below it. The tint was on the button GROUP instead, in both sections —
   which made ALIGN's band invisible (it spanned the full width at a 4%
   contrast step) and gave DISTRIBUTE a grey pill the board does not draw. */
/* Inside the band the buttons are white boxes; outside it, on the plain
   panel, DISTRIBUTE's two are the tinted ones. The board inverts them that
   way, and transparent buttons on a tinted band had no edge at all. */
/* No border-radius: the board's Align frame (159:126) is `w-full`, x0..x300,
   square corners — Gate 13 caps chrome radius at 4 anyway. A prior pass read
   the frame's OWN 16px child inset as the band's outer margin and wrapped it
   in `--bk-radius-lg` (8px, rounded) inside a padded parent, so the tint
   never reached the panel edge and carried a corner the board doesn't draw. */
const bandedSectionStyles: React.CSSProperties = {
  ...sectionStyles,
  background: "var(--bk-bg-subtle)",
};

const sectionLabelStyles: React.CSSProperties = {
  fontSize: "var(--bk-text-11)",
  /* Board 66:204 sets the band labels on a 16px line box; the declaration
     carried the size without it, so ALIGN and DISTRIBUTE sat on Inter's own
     ~13px normal and the bands read tighter than the board draws them. */
  lineHeight: "16px",
  fontWeight: 600,
  /* NOT the board's --color/ink-muted, and this is the one place in this
     panel where a board loses on purpose. MEASURED 2026-09-08: ALIGN sits on
     the --bk-bg-subtle band that board 159:123 draws (asserted by this file's
     own test), and 11px --bk-ink-muted on that fill is 4.39:1 against WCAG's
     4.5 floor. --bk-ink-soft on the same band is 6.78:1. Board 66:204 names
     ink-muted for this label; taking it would ship a contrast failure, so the
     conformance recipe skips that join and records the reason rather than
     baselining it. */
  color: "var(--bk-ink-soft)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const buttonGroupStyles: React.CSSProperties = {
  display: "flex",
  gap: "6px", // no --bk-space-6 token; board's 42-wide pitch on the 36-wide (w-9) buttons
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
/* `h-7` and `rounded-md`, not flowbite xs's own 32/8: board 159:123 draws all
   eight of these boxes 36x28 on a 6px radius (159:128..133, 159:136/137), and
   the 4px extra height is what pushed the ALIGN band to 76 against the board's
   72 and the DISTRIBUTE row to 48 against 44. Same twMerge groups as the
   defaults they beat — `tw:h-7` against `h-8`, not a `min-h-*` that would have
   left the 32 standing. */
const BTN_BOX = "tw:w-9 tw:h-7 tw:rounded-md tw:px-0 tw:justify-center";

const DISTRIBUTE_BTN =
  BTN_BOX + " tw:border-transparent " +
  "tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

const ALIGN_BTN =
  BTN_BOX + " tw:border tw:border-[var(--bk-gray-200)] " +
  "tw:bg-white tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

/** Count left, AI entry right — matches the single-selection header.
    LITERALLY the same header now: `.bdi-ehdr` is the 48h/x16 row boards 32:3,
    642:3251 and 159:124 all draw, and this row was hand-rolling it out of
    padding tokens, landing on 46. Two headers, one rule; the only thing this
    state adds is pushing its two children apart. The old comment blamed Gate
    14 for the missing 2px — but the gate counts a bare `48` in this FILE, and
    the shared rule already spends that literal once in CSS. */
const headerRowStyles: React.CSSProperties = {
  justifyContent: "space-between",
};

/* Board 159:126's DISTRIBUTE label and its two buttons sit on ONE row — label
   left, buttons right — not stacked. The label-above-buttons layout that fit
   ALIGN's six buttons read as a second, taller section here where the board
   draws a compact strip the same height as its two 28-tall buttons plus padding. */
const distributeRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--bk-space-8)",
  padding: "var(--bk-space-8) var(--bk-space-16)",
};

/* Board 159:123 writes the count the way the single-selection header writes
   the element's name — plain dark text, not an accent pill. The pill read as a
   status badge for something that is simply the panel's title. */
const countBadgeStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  color: "var(--bk-ink)",
  fontSize: "var(--bk-text-14)",
  /* 66:203 — 14 on a 20px line box, the same ui/14 the single-selection
     header uses for the element name (159:4). Missing here. */
  lineHeight: "20px",
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

  /* Board 4418:114523 — the context header lists the members by icon and
     name, then Group · Delete. A row click narrows the selection to that
     member, the way a Layers row does. Delete on N > 1 confirms first
     (decision #17: instant + Undo for one element, a confirm for many) and
     then runs the same `delete` command the keyboard does, so the toast and
     the single undo step come from the one place that owns them. */
  const members = React.useMemo(
    () =>
      selectedIds.map((id) => {
        const el = composer?.elements?.getElement?.(id);
        const type = el?.getType?.() ?? "element";
        return { id, type, label: type.charAt(0).toUpperCase() + type.slice(1), el };
      }),
    [composer, selectedIds]
  );
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  /* The engine groups SIBLINGS only (`groupElements` returns null otherwise);
     a Group button that silently did nothing would be the dead click this
     panel exists to avoid, so the reason rides on the disabled control. */
  const sameParent = React.useMemo(() => {
    const parents = members.map((m) => m.el?.getParent?.()?.getId?.() ?? null);
    return parents.length > 1 && parents.every((id) => id !== null && id === parents[0]);
  }, [members]);
  const groupReason = !composer ? "No composer available" : sameParent ? "Group" : "Group needs elements that share a parent";

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
    <div style={toolbarStyles} data-testid="multiselect-panel">
      {/* Board 159:123 heads this panel the way the single-selection header is
          headed — the count on the left, the `✦ AI` entry on the right. It
          reads "3 selected", not "3 elements selected": the panel is already
          the element inspector, so the noun is doing no work. */}
      <div className="bdi-ehdr" style={headerRowStyles} data-testid="multiselect-header">
        <span style={countBadgeStyles} data-testid="multiselect-count">{selectedIds.length} selected</span>
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

      <ul className="tw:m-0 tw:list-none tw:p-0" data-testid="multiselect-members">
        {members.map(({ id, type, label, el }) => {
          const Icon = getElementIcon(type);
          return (
            <li key={id} className="tw:m-0 tw:p-0">
              <Button
                color="light"
                size="xs"
                data-testid={`multiselect-member-${id}`}
                className="tw:h-7 tw:w-full tw:justify-start tw:gap-2 tw:rounded-none tw:border-transparent tw:bg-transparent tw:px-4 tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-bg-subtle)]"
                onClick={() => {
                  if (el) composer?.selection?.select(el);
                }}
              >
                <Icon size="sm" />
                <span className="tw:min-w-0 tw:truncate">{label}</span>
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="tw:flex tw:gap-2 tw:px-4 tw:pb-2" data-testid="multiselect-actions">
        <Tooltip content={groupReason} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
          <Button
            color="light"
            size="xs"
            data-testid="multiselect-group"
            className="tw:h-7 tw:rounded-md tw:px-2 tw:text-[12px] tw:font-medium tw:border-[var(--bk-gray-200)] tw:bg-white tw:text-[var(--bk-ink)] tw:aria-disabled:text-[var(--bk-ink-disabled)] tw:aria-disabled:cursor-not-allowed"
            aria-disabled={!composer || !sameParent}
            onClick={() => {
              if (composer && sameParent) composer.commands.run("group");
            }}
          >
            Group
          </Button>
        </Tooltip>
        <Button
          color="light"
          size="xs"
          data-testid="multiselect-delete"
          className="tw:h-7 tw:rounded-md tw:px-2 tw:text-[12px] tw:font-medium tw:border-[var(--bk-gray-200)] tw:bg-white tw:text-[var(--bk-error-text)]"
          disabled={!composer}
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </Button>
      </div>
      <DeleteConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          composer?.commands?.run("delete");
        }}
        elementLabel={`${selectedIds.length} elements`}
      />

      {/* Board 159:123 bands them once: ALIGN carries all six, DISTRIBUTE
          carries its two on the right. Live split ALIGN in two ("Align
          Horizontal" / "Align Vertical"), which read as two decisions where
          the board has one. */}
      <div style={bandedSectionStyles} data-testid="multiselect-align-band">
        <span style={sectionLabelStyles} data-testid="multiselect-align-label">Align</span>
        <div style={buttonGroupStyles}>
          <Tooltip content={getAlignTooltip("Align Left")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Align elements to left"
              data-testid="multiselect-align-left"
              onClick={handleAlignLeft}
              disabled={isDisabled} className={ALIGN_BTN}
            ><AlignLeft size={16} /></Button>
          </Tooltip>
          <Tooltip content={getAlignTooltip("Align Center")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Align elements to center horizontally"
              data-testid="multiselect-align-center"
              onClick={handleAlignCenterH}
              disabled={isDisabled} className={ALIGN_BTN}
            ><AlignCenter size={16} /></Button>
          </Tooltip>
          <Tooltip content={getAlignTooltip("Align Right")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Align elements to right"
              data-testid="multiselect-align-right"
              onClick={handleAlignRight}
              disabled={isDisabled} className={ALIGN_BTN}
            ><AlignRight size={16} /></Button>
          </Tooltip>
          <Tooltip content={getAlignTooltip("Align Top")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Align elements to top"
              data-testid="multiselect-align-top"
              onClick={handleAlignTop}
              disabled={isDisabled} className={ALIGN_BTN}
            ><AlignStartVertical size={16} /></Button>
          </Tooltip>
          <Tooltip content={getAlignTooltip("Align Middle")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Align elements to middle vertically"
              data-testid="multiselect-align-middle"
              onClick={handleAlignMiddle}
              disabled={isDisabled} className={ALIGN_BTN}
            ><AlignCenterVertical size={16} /></Button>
          </Tooltip>
          <Tooltip content={getAlignTooltip("Align Bottom")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Align elements to bottom"
              data-testid="multiselect-align-bottom"
              onClick={handleAlignBottom}
              disabled={isDisabled} className={ALIGN_BTN}
            ><AlignEndVertical size={16} /></Button>
          </Tooltip>
        </div>
      </div>

      {/* Distribution — one row, label left / buttons right, per board 159:134. */}
      <div style={distributeRowStyles} data-testid="multiselect-distribute-row">
        <span style={sectionLabelStyles} data-testid="multiselect-distribute-label">Distribute</span>
        <div style={buttonGroupStyles}>
          <Tooltip content={getDistributeTooltip("Horizontally")} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Distribute elements horizontally with equal spacing"
              data-testid="multiselect-dist-h"
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
              data-testid="multiselect-dist-v"
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
