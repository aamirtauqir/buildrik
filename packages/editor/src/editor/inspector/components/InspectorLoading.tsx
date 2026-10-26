/**
 * InspectorLoading — board 159:102 / 2L9 S01 (Inspector · loading).
 *
 * What the right-hand panel shows while the site is still arriving: the
 * header bar and "Loading project · Your saved content is still arriving.
 * Editing controls will appear when it is ready." (2L9 replaced the six
 * field-shaped rows). It exists because the alternative was
 * worse than nothing — with no selection and no project yet, the panel said
 * "Select something on the canvas to edit it." over a canvas that had nothing
 * on it to select, which reads as "your site is empty".
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
      {/* 2L9 S01: what is happening, not a field-shaped skeleton that reads
          as controls about to appear with defaults in them. */}
      <div className="tw:flex tw:flex-col tw:gap-1 tw:px-4 tw:py-3">
        <div className="tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">Loading project</div>
        <div className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
          Your saved content is still arriving. Editing controls will appear when it is ready.
        </div>
      </div>
    </div>
  );
}

export default InspectorLoading;
