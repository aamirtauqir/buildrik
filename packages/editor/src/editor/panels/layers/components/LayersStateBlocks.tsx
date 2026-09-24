/**
 * Layers panel state blocks — v3 boards 4418:83074 (loading), 4418:83295
 * (load-error), 4418:83498 (no-results), 4418:83911 (empty). One home so LayersTab, LayersPanel and the probe all
 * render the same block — the conformance recipes measure these testIds.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Kbd, SkeletonBlock } from "@/editor/chrome-ui";

/*
  v3 board 4418:83074: five centred 12px pills on a 24px pitch, widths
  232 / 200 / 220 / 176 / 212 — a list arriving, not a tree drawn in grey.
*/
const SKELETON_BARS = ["tw:w-[232px]", "tw:w-[200px]", "tw:w-[220px]", "tw:w-[176px]", "tw:w-[212px]"];

export const LayersLoadingSkeleton: React.FC = () => (
  <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:pt-[26px]" data-testid="layers-loading" aria-busy="true" aria-label="Loading layers">
    {SKELETON_BARS.map((w) => (
      <SkeletonBlock key={w} className={`tw:h-3 tw:rounded-full ${w}`} data-testid="layers-sk-bar" />
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
