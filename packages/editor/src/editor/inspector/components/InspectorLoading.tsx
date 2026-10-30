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
 * 2L9 S01 draws the header as it will read — "Opening project" and
 * "Loading {site}" — and the tab strip above the body. The board's path
 * ("… › Hero › Opening project") is sample data: nothing is selected yet.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SkeletonBlock } from "@/editor/chrome-ui";

export interface InspectorLoadingProps {
  /** The site's name, as far as it has loaded ("Loading Fieldwork Studio");
   *  absent until its metadata arrives. */
  siteName?: string | null;
  /** The Inspector's real tab strip (2L9 S01 draws it above the body). */
  tabs?: React.ReactNode;
}

export function InspectorLoading({ siteName, tabs }: InspectorLoadingProps): React.ReactElement {
  return (
    <div
      className="bdi-panel"
      role="status"
      aria-live="polite"
      aria-label="Loading"
      data-testid="inspector-loading"
    >
      {/* 2L9 S01: the header as it will read — a name line and what is
          arriving — then the tab strip, then the body. Nothing is selected
          yet, so there is no path. */}
      <div className="tw:flex tw:flex-col tw:gap-1 tw:px-3 tw:pt-3 tw:pb-2" data-testid="inspector-loading-header">
        <span className="tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink-soft)]">Opening project</span>
        <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">{siteName ? `Loading ${siteName}` : "Loading"}</span>
      </div>
      {tabs}
      <div className="tw:flex tw:flex-col tw:gap-1 tw:px-3 tw:py-3">
        <div className="tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">Loading project</div>
        <div className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
          Your saved content is still arriving. Editing controls will appear when it is ready.
        </div>
        {/* The board's four bars: content arriving, not controls with values. */}
        <div className="tw:flex tw:flex-col tw:gap-1.5 tw:pt-2" aria-hidden="true" data-testid="inspector-loading-bars">
          <SkeletonBlock className="tw:h-3.5 tw:w-[70%]" />
          <SkeletonBlock className="tw:h-3.5 tw:w-full" />
          <SkeletonBlock className="tw:h-3.5 tw:w-[52%]" />
          <SkeletonBlock className="tw:h-3.5 tw:w-full" />
        </div>
      </div>
    </div>
  );
}

export default InspectorLoading;
