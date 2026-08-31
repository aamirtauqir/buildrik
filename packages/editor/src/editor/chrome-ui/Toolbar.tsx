/**
 * Toolbar — the control strip under a panel header.
 *
 * Written after three panels had each built it separately (ReviewTab,
 * IssuesPanel, ApprovedCompareView). The three differed only in gap — 6px
 * against 8px — which is not a design decision anyone made; it is what happens
 * when the same strip is typed out three times.
 *
 * Distinct from PanelHeader, which is the panel's title row and owns pin/help/
 * close. A Toolbar carries filters, scope switches and view modes: controls
 * that change what the panel below is showing.
 *
 * It wraps rather than overflowing. A compare view can carry six controls, and
 * a strip that scrolls sideways hides the control the user is looking for.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Sits above the content it filters (default) or below it. */
  edge?: "bottom" | "top";
}

const BASE = "tw:flex tw:items-center tw:flex-wrap tw:gap-1.5 tw:px-3 tw:py-2 tw:border-[var(--bk-gray-200)]";

/* Each edge supplies its own single border side — never both at once, so no
   two utilities set a border-width for the same box edge (Row/PanelFrame
   precedent on same-property collisions). */
const EDGE: Record<"bottom" | "top", string> = {
  bottom: "tw:border-b",
  top: "tw:border-t",
};

export function Toolbar({ edge = "bottom", className, children, ...rest }: ToolbarProps) {
  return (
    <div className={[BASE, EDGE[edge], className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

/** Pushes everything after it to the far end of the strip. */
export function ToolbarSpacer() {
  return <span className="tw:flex-1" aria-hidden="true" />;
}
