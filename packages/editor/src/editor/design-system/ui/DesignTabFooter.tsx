/**
 * DesignTabFooter — bottom bar with Revert and Review & Save buttons
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";

/* The footer's primary action, named once. The first-load hint in
   DesignSystemTab used to tell people to click "Review & Apply" — the name
   this button had before it was renamed — so the instruction pointed at a
   control that does not exist. (The prop is still `onReview`, and four
   comments around the design-system state still say "Review & Apply", which
   is how the rename is visible in the source.) */
/* Board 154:78 draws this bar and names the button "Save". CLAUDE.md's
   precedence is explicit that copy on screen is the BOARD's call, and the
   census row for that board was `open:footer-copy` — the question was what this
   said, and the board had the answer all along. One constant, so the footer and
   the hint sentence that quotes it cannot drift apart. */
export const APPLY_CHANGES_LABEL = "Save";

export interface FooterProps {
  isDirty: boolean;
  dirtyCount: number;
  onDiscard: () => void;
  onReview: () => void;
}

export const DesignTabFooter: React.FC<FooterProps> = ({
  isDirty,
  dirtyCount,
  onDiscard,
  onReview,
}) => (
  <div
    data-screen-savebar="true"
    data-testid="brand-save-bar"
    /* Board 154:78: a 44-tall warning-tint bar, status and both actions on
       one line as text — no bordered buttons, no grey plate. 154:128 sets the
       type for all three at 12/18; they shipped at 11 with the line inherited,
       which put the status and its two actions a size below every other label
       in the panel. */
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      height: 44,
      padding: "0 16px",
      fontSize: 12,
      lineHeight: "18px",
      background: isDirty ? "var(--bk-warning-tint)" : "var(--bk-bg-subtle)",
      flexShrink: 0,
      whiteSpace: "nowrap",
    }}
  >
    {/* --bk-ink-soft, not --bk-ink-muted: this footer sits on --bk-bg-subtle,
        where muted measures 4.39:1 at 12px — under AA. Measured with axe. */}
    {/* "All changes saved" is what the TOPBAR says about the document, and this
        footer sits under a panel whose changes are staged behind Apply. Two
        controls saying "saved" about two different buffers, six hundred pixels
        apart, is a question the user should not have to answer. This one names
        its own subject; the topbar keeps the document. */}
    <div
      data-testid="brand-save-bar-status"
      style={{ flex: 1, fontSize: 12, lineHeight: "18px", color: isDirty ? "var(--bk-warning-text)" : "var(--bk-ink-soft)" }}
    >
      {/* "Unsaved brand changes" is board 154:78's wording, and it replaces
          "N previewing". The count is not lost: the root list still marks each
          dirty destination with its own dot, which is where a number belongs —
          beside the thing it counts. The CLEAN half has no board (154:78 draws
          only the dirty state), so it keeps the wording that stops it colliding
          with the topbar's own "Saved". */}
      {isDirty ? "Unsaved brand changes" : "Brand is up to date"}
    </div>
    {/* A clean panel used to show BOTH buttons disabled — two dead controls
        announcing nothing (designer walk 2026-08-28). Board 154:78 draws only
        the dirty state, so the clean footer is the status line alone; the
        buttons appear when there is something for them to do. */}
    {isDirty && (
      <>
        <Button
          color="light"
          size="xs"
          variant="link"
          onClick={onDiscard}
          data-testid="brand-save-bar-discard"
          className="tw:h-auto tw:p-0 tw:border-0 tw:bg-transparent tw:text-[12px] tw:leading-[18px] tw:font-normal tw:text-[var(--bk-ink-muted)] tw:hover:text-[var(--bk-ink)]"
        >
          Discard
        </Button>
        <Button
          size="xs"
          variant="link"
          onClick={onReview}
          data-testid="brand-save-bar-save"
          /* `font-normal`: 154:131 is Inter Regular like the other two. The
             medium weight made "Save" the only bold word on a bar the board
             draws in one voice. */
          className="tw:h-auto tw:p-0 tw:border-0 tw:bg-transparent tw:text-[12px] tw:leading-[18px] tw:font-normal tw:text-[var(--bk-accent-text)]"
        >
          {APPLY_CHANGES_LABEL}
        </Button>
      </>
    )}
  </div>
);
