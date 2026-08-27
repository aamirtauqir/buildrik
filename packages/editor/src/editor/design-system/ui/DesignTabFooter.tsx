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
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      borderTop: "1px solid var(--bk-border)",
      background: "var(--bk-bg-subtle)",
      flexShrink: 0,
    }}
  >
    {/* --bk-ink-soft, not --bk-ink-muted: this footer sits on --bk-bg-subtle,
        where muted measures 4.39:1 at 12px — under AA. Measured with axe. */}
    {/* "All changes saved" is what the TOPBAR says about the document, and this
        footer sits under a panel whose changes are staged behind Apply. Two
        controls saying "saved" about two different buffers, six hundred pixels
        apart, is a question the user should not have to answer. This one names
        its own subject; the topbar keeps the document. */}
    <div style={{ flex: 1, fontSize: 12, color: "var(--bk-ink-soft)" }}>
      {/* "Unsaved brand changes" is board 154:78's wording, and it replaces
          "N previewing". The count is not lost: the root list still marks each
          dirty destination with its own dot, which is where a number belongs —
          beside the thing it counts. The CLEAN half has no board (154:78 draws
          only the dirty state), so it keeps the wording that stops it colliding
          with the topbar's own "Saved". */}
      {isDirty ? "Unsaved brand changes" : "Brand is up to date"}
    </div>
    <Button
      color="light"
      size="xs"
      onClick={onDiscard}
      disabled={!isDirty}
      style={{ color: isDirty ? /* @lint-hex-policy: discard-affordance red-500, off chrome palette */ "#ef4444" : undefined }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
    >
      Discard
    </Button>
    <Button
      size="xs"
      onClick={onReview}
      disabled={!isDirty}
    >
      {APPLY_CHANGES_LABEL}
    </Button>
  </div>
);
