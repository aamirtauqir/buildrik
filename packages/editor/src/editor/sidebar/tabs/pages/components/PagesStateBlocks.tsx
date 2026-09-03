/**
 * Pages panel state blocks — board 774:4044 (Pages · loading), fetched
 * 2026-08-07.
 *
 * This said "pages hydrate synchronously from the composer today, so the probe
 * is this block's only mount until the source goes async". That premise was
 * false for every server-backed site and it is what made the skeleton look
 * optional: the composer becomes non-null and the page list syncs EMPTY while
 * `loadProject` is still in flight, so the panel showed "No pages yet · Create
 * blank page" over a real project. Accepting cost the user the page —
 * `importProject` replaces the whole set and ⌘Z reports nothing to undo.
 * Mounted by PageList since 2026-09-03; the standalone demo, which really is
 * synchronous, was the case the note generalised from.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { SkeletonBlock } from "@/editor/chrome-ui";

/*
  Board 774:4044: seven 32h rows on the page-row grid — a 16px checkbox
  square + a bar, with the folder-child rows indented one step. Bar widths
  are the board's own uneven set.
*/
const ROWS: ReadonlyArray<{ pl: string; bar: string }> = [
  { pl: "tw:pl-4", bar: "tw:w-[128px]" },
  { pl: "tw:pl-9", bar: "tw:w-[96px]" },
  { pl: "tw:pl-4", bar: "tw:w-[150px]" },
  { pl: "tw:pl-4", bar: "tw:w-[110px]" },
  { pl: "tw:pl-9", bar: "tw:w-[86px]" },
  { pl: "tw:pl-4", bar: "tw:w-[124px]" },
];

const SK_BOX =
  "tw:size-4 tw:shrink-0 tw:animate-pulse tw:rounded-[4px] tw:bg-[var(--bk-gray-100)] tw:motion-reduce:animate-none";

export const PagesLoadingSkeleton: React.FC = () => (
  <div data-testid="pages-loading" aria-busy="true" aria-label="Loading pages">
    {/* Row 0 literal: check-anchors greps for the exact testid strings. */}
    <div className={`tw:flex tw:h-8 tw:items-center tw:gap-2 ${ROWS[0].pl}`} data-testid="pages-sk-row">
      <div aria-hidden="true" className={SK_BOX} data-testid="pages-sk-box" />
      <SkeletonBlock className={`tw:h-2.5 ${ROWS[0].bar}`} data-testid="pages-sk-bar" />
    </div>
    {ROWS.slice(1).map((row, i) => (
      <div key={i} className={`tw:flex tw:h-8 tw:items-center tw:gap-2 ${row.pl}`}>
        <div aria-hidden="true" className={SK_BOX} />
        <SkeletonBlock className={`tw:h-2.5 ${row.bar}`} />
      </div>
    ))}
  </div>
);
