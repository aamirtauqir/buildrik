/**
 * Layers panel state blocks — boards 775:4130 (loading), 781:4217 (load-error),
 * 782:4260 (no-results). One home so LayersTab, LayersPanel and the probe all
 * render the same block — the conformance recipes measure these testIds.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, SkeletonBlock } from "@/editor/chrome-ui";

/*
  Board `775:4130`. Seven rows on the tree's own row height (h-8), indent ladder
  16/32/48 so the placeholder reads as a nested tree, not a flat list. Bar
  widths deliberately uneven — identical bars read as a graphic, uneven ones
  read as text that is coming. Icon square is 12px radius 3 (board is EXACT on
  radius, so the icon carries its own rounded-[3px] instead of SkeletonBlock's
  default rounded 4).
*/
const SKELETON_ROWS: ReadonlyArray<{ pl: string; bar: string }> = [
  { pl: "tw:pl-4", bar: "tw:w-[132px]" },
  { pl: "tw:pl-8", bar: "tw:w-[96px]" },
  { pl: "tw:pl-12", bar: "tw:w-[150px]" },
  { pl: "tw:pl-12", bar: "tw:w-[110px]" },
  { pl: "tw:pl-8", bar: "tw:w-[86px]" },
  { pl: "tw:pl-4", bar: "tw:w-[124px]" },
  { pl: "tw:pl-8", bar: "tw:w-[104px]" },
];

const SK_ICON =
  "tw:size-3 tw:shrink-0 tw:animate-pulse tw:rounded-[3px] tw:bg-gray-100 tw:motion-reduce:animate-none";

export const LayersLoadingSkeleton: React.FC = () => (
  <div data-testid="layers-loading" aria-busy="true" aria-label="Loading layers">
    {/* Row 0 is written out (not mapped) because check-anchors greps for the
        literal data-testid strings the recipe names. */}
    <div className={`tw:flex tw:h-8 tw:items-center tw:gap-2 ${SKELETON_ROWS[0].pl}`} data-testid="layers-sk-row">
      <div aria-hidden="true" className={SK_ICON} data-testid="layers-sk-icon" />
      <SkeletonBlock className={`tw:h-2.5 ${SKELETON_ROWS[0].bar}`} data-testid="layers-sk-bar" />
    </div>
    {SKELETON_ROWS.slice(1).map((row, i) => (
      <div key={i} className={`tw:flex tw:h-8 tw:items-center tw:gap-2 ${row.pl}`}>
        <div aria-hidden="true" className={SK_ICON} />
        <SkeletonBlock className={`tw:h-2.5 ${row.bar}`} />
      </div>
    ))}
  </div>
);

/*
  Board `781:4307`. "The page is fine — only this list failed." carries the
  load: a failed tree read looks like the page lost its structure, and the
  first thing someone thinks is that their work is gone. Same copy shape as
  Media (453:3952) and Content (453:4013): error fact, harm scope, retry.
*/
export const LayersLoadError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="tw:flex tw:flex-col tw:gap-1.5 tw:px-6 tw:pb-8 tw:pt-9" data-testid="layers-load-error" role="alert">
    <p className="tw:text-[13px] tw:leading-5 tw:text-red-700">Couldn&rsquo;t load the layer tree.</p>
    <p className="tw:text-[12px] tw:text-gray-500">The page is fine &mdash; only this list failed.</p>
    <Button
      type="button"
      color="light"
      size="xs"
      className="tw:min-h-6 tw:self-start tw:border-0 tw:bg-transparent tw:px-0 tw:text-[13px] tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
      data-testid="layers-load-retry"
      onClick={onRetry}
    >
      Try again
    </Button>
  </div>
);

/*
  Board `782:4260`. Quotes the query back ("Nothing matches 'hero'.") so the
  user sees WHAT failed to match, and offers the one recovery that always
  works. Distinct from LayersEmptyState on purpose: an empty page is a fact
  about the document, a filtered-out tree is a fact about the search box.
*/
export const LayersNoResults: React.FC<{ search: string; onClear: () => void }> = ({ search, onClear }) => (
  <div className="tw:flex tw:flex-col tw:gap-2.5 tw:px-6 tw:pb-8 tw:pt-9 tw:text-[13px]" data-testid="layers-no-results" role="status">
    <p className="tw:leading-5 tw:text-gray-500">Nothing matches &lsquo;{search}&rsquo;.</p>
    <Button
      type="button"
      color="light"
      size="xs"
      className="tw:min-h-6 tw:self-start tw:border-0 tw:bg-transparent tw:px-0 tw:text-[13px] tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
      data-testid="layers-clear-search"
      onClick={onClear}
    >
      Clear search
    </Button>
  </div>
);
