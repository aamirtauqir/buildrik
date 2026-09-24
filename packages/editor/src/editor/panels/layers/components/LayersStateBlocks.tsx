/**
 * Layers panel state blocks — boards 775:4130 (loading), 781:4217 (load-error),
 * 782:4260 (no-results). One home so LayersTab, LayersPanel and the probe all
 * render the same block — the conformance recipes measure these testIds.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Kbd, SkeletonBlock } from "@/editor/chrome-ui";

/*
  Board `775:4130`. Seven rows on the tree's own row height (h-8), indent ladder
  16/32/48 so the placeholder reads as a nested tree, not a flat list. Bar
  widths deliberately uneven — identical bars read as a graphic, uneven ones
  read as text that is coming. Icon square is 12px radius 3 (board is EXACT on
  radius, so the icon carries its own rounded-[3px] instead of SkeletonBlock's
  default rounded 4).
*/
const SKELETON_ROWS: ReadonlyArray<{ pl: string; bar: string }> = [
  /* Bar widths are board 775:4130's seven `sk` frames — 92 / 96 / 110 / 70 /
     86 / 124 / 104 — re-extracted 2026-09-02 after the drawer redraw. Rows 0,
     2 and 3 were 132 / 150 / 110, which the stale 320-era spec had hidden. */
  { pl: "tw:pl-4", bar: "tw:w-[92px]" },
  { pl: "tw:pl-8", bar: "tw:w-[96px]" },
  { pl: "tw:pl-12", bar: "tw:w-[110px]" },
  { pl: "tw:pl-12", bar: "tw:w-[70px]" },
  { pl: "tw:pl-8", bar: "tw:w-[86px]" },
  { pl: "tw:pl-4", bar: "tw:w-[124px]" },
  { pl: "tw:pl-8", bar: "tw:w-[104px]" },
];

const SK_ICON =
  "tw:size-3 tw:shrink-0 tw:animate-pulse tw:rounded-[3px] tw:bg-[var(--bk-gray-100)] tw:motion-reduce:animate-none";

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

/* The empty-state glyph every v3 Layers state board draws (4418:83498,
   4418:83911): a 24px window outline, muted. */
const StateGlyph = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="tw:text-[var(--bk-ink-muted)]">
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M4 9h16" />
  </svg>
);

/** v3 4418:83498 / 4418:83911's block: glyph, "Nothing here yet", one line. */
export const LayersStateMessage: React.FC<{ message: string; padTop: string; testId: string; children?: React.ReactNode }> = ({
  message,
  padTop,
  testId,
  children,
}) => (
  <div className={`tw:flex tw:flex-col tw:items-center tw:gap-2 tw:px-4 tw:text-center ${padTop}`} data-testid={testId} role="status">
    <StateGlyph />
    <p className="tw:m-0 tw:text-[13px] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink)]">Nothing here yet</p>
    <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]" data-testid={`${testId}-text`}>{message}</p>
    {children}
  </div>
);

/*
  v3 board 4418:83295: a 32px red-tint mark, "Couldn't load layers" 14/600,
  "Try again to load this page's layer tree." 12/18 muted. The board draws no
  button; "Try again" in that sentence is the retry — the tree's only way back.
*/
export const LayersLoadError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:px-6 tw:pt-7 tw:text-center" data-testid="layers-load-error" role="alert">
    <span className="tw:flex tw:size-8 tw:items-center tw:justify-center tw:rounded-lg tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01" />
      </svg>
    </span>
    <p className="tw:m-0 tw:text-[14px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">Couldn&rsquo;t load layers</p>
    <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
      <Button
        type="button"
        size="xs"
        variant="link"
        className="tw:inline tw:min-h-0 tw:p-0 tw:text-[12px] tw:leading-[18px]"
        data-testid="layers-load-retry"
        onClick={onRetry}
      >
        Try again
      </Button>{" "}
      to load this page&rsquo;s layer tree.
    </p>
  </div>
);

/* v3 board 4418:83498: the block above plus one outlined hand-off to ⌘K,
   "Search everywhere for “carousel”  ⌘K". Clearing the query is the topbar
   field's own ✕ / Escape. */
export const LayersNoResults: React.FC<{
  search: string;
  onSearchEverywhere?: (query: string) => void;
}> = ({ search, onSearchEverywhere }) => (
  <LayersStateMessage message="No layers match your search." padTop="tw:pt-10" testId="layers-no-results">
    {onSearchEverywhere && (
      <Button
        type="button"
        color="light"
        size="sm"
        className="tw:-mt-1 tw:h-8 tw:w-full tw:justify-between tw:px-3 tw:text-[12px] tw:font-normal tw:focus:ring-0"
        data-testid="layers-search-everywhere"
        aria-label={`Search everywhere for “${search}”`}
        onClick={() => onSearchEverywhere(search)}
      >
        <span className="tw:truncate">Search everywhere for &ldquo;{search}&rdquo;</span>
        <Kbd>⌘K</Kbd>
      </Button>
    )}
  </LayersStateMessage>
);
