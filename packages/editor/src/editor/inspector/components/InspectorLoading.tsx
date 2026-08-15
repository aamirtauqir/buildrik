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
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SkeletonBlock } from "@/editor/chrome-ui";

/** Board: label bar + field bar, seven times. */
const ROWS = 7;

export function InspectorLoading(): React.ReactElement {
  return (
    <div
      className="bdi-panel tw:flex tw:flex-col tw:gap-3 tw:p-4"
      role="status"
      aria-live="polite"
      aria-label="Loading"
      data-testid="inspector-loading"
    >
      <SkeletonBlock style={{ width: 72, height: 14 }} />
      <div className="tw:flex tw:flex-col tw:gap-2">
        {Array.from({ length: ROWS }, (_, i) => (
          <div key={i} className="tw:flex tw:items-center tw:gap-2">
            <SkeletonBlock style={{ width: 72, height: 12, flexShrink: 0 }} />
            <SkeletonBlock style={{ height: 12, flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default InspectorLoading;
