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
export const APPLY_CHANGES_LABEL = "Apply Changes";

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
    <div style={{ flex: 1, fontSize: 12, color: "var(--bk-ink-muted)" }}>
      {isDirty ? `${dirtyCount} previewing` : "All changes saved"}
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
