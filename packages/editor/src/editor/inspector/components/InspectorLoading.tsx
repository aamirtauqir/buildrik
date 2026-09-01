/**
 * InspectorLoading — board 159:102 (Inspector · loading).
 *
 * What the right-hand panel shows while the site is still arriving: a title
 * and rows where the controls will be. It exists because the alternative was
 * worse than nothing — with no selection and no project yet, the panel said
 * "Select something on the canvas to edit it." over a canvas that had nothing
 * on it to select, which reads as "your site is empty".
 *
 * The row count is the board's shape, not a measurement: nothing here knows
 * what will be selected, or whether anything will be.
 *
 * The board's header reads "Section". That is sample data: the header this
 * stands in for (board 32:2) names the SELECTED element, and at this moment
 * nothing is selected. So the 48-tall bar is drawn for real — it is chrome,
 * like the day band in the notifications skeleton — and only the name inside
 * it stays a placeholder. Before this the title was a bare grey bar floating
 * in the panel's padding, with no header bar at all.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SkeletonBlock } from "@/editor/chrome-ui";

/** Board 159:102 draws six rows, not seven. */
const ROWS = 6;

export function InspectorLoading(): React.ReactElement {
  return (
    <div
      className="bdi-panel"
      role="status"
      aria-live="polite"
      aria-label="Loading"
      data-testid="inspector-loading"
    >
      <div className="tw:flex tw:h-12 tw:items-center tw:border-b tw:border-[var(--bk-border)] tw:px-4">
        <SkeletonBlock className="tw:h-2.5 tw:w-[52px]" />
      </div>
      {/* 32-tall rows, butted together the way the board stacks them: an 88
          label bar at the 16 gutter, then the field bar out to the matching
          gutter on the right. */}
      {Array.from({ length: ROWS }, (_, i) => (
        <div key={i} className="tw:flex tw:h-8 tw:items-center tw:gap-2 tw:px-4">
          <SkeletonBlock className="tw:h-2.5 tw:w-[88px] tw:shrink-0" />
          <SkeletonBlock className="tw:h-2.5 tw:flex-1" />
        </div>
      ))}
    </div>
  );
}

export default InspectorLoading;
