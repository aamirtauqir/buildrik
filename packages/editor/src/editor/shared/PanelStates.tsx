/**
 * Drawer state blocks shared by the v3 Layers and Pages boards, which draw
 * the same four: loading (4418:83074 / 4418:95114), load-error (4418:83295 /
 * 4418:94910), no-results (4418:83498 / 4418:95333) and the empty message.
 * Each panel binds its own copy and testIds.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Kbd, SkeletonBlock } from "@/editor/chrome-ui";

/* Five centred 12px pills on a 24px pitch, widths 232 / 200 / 220 / 176 /
   212 — a list arriving, not a tree drawn in grey. */
const SKELETON_BARS = ["tw:w-[232px]", "tw:w-[200px]", "tw:w-[220px]", "tw:w-[176px]", "tw:w-[212px]"];

export const PanelLoadingSkeleton: React.FC<{ label: string; testId: string; barTestId: string }> = ({ label, testId, barTestId }) => (
  <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:pt-[26px]" data-testid={testId} aria-busy="true" aria-label={label}>
    {SKELETON_BARS.map((w) => (
      <SkeletonBlock key={w} className={`tw:h-3 tw:rounded-full ${w}`} data-testid={barTestId} />
    ))}
  </div>
);

/* The glyph every v3 drawer state board draws: a 24px window outline, muted. */
const StateGlyph = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="tw:text-[var(--bk-ink-muted)]">
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M4 9h16" />
  </svg>
);

/** Glyph, "Nothing here yet", one line — and an optional action under it. */
export const PanelStateMessage: React.FC<{ message: string; padTop: string; testId: string; children?: React.ReactNode }> = ({
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

/* A 32px red-tint mark, the failure 14/600, then one 12/18 muted sentence
   that starts with "Try again" — the sentence's first words are the retry. */
export const PanelLoadError: React.FC<{ title: string; rest: string; testId: string; retryTestId: string; onRetry: () => void }> = ({
  title,
  rest,
  testId,
  retryTestId,
  onRetry,
}) => (
  <div className="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:px-6 tw:pt-7 tw:text-center" data-testid={testId} role="alert">
    <span className="tw:flex tw:size-8 tw:items-center tw:justify-center tw:rounded-lg tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01" />
      </svg>
    </span>
    <p className="tw:m-0 tw:text-[14px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]" data-testid={`${testId}-title`}>{title}</p>
    <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
      <Button
        type="button"
        size="xs"
        variant="link"
        className="tw:inline tw:min-h-0 tw:p-0 tw:text-[12px] tw:leading-[18px]"
        data-testid={retryTestId}
        onClick={onRetry}
      >
        Try again
      </Button>{" "}
      {rest}
    </p>
  </div>
);

/* The no-results block plus one outlined hand-off to ⌘K, "Search everywhere
   for “carousel”  ⌘K". Clearing the query is the topbar field's own ✕ /
   Escape. */
export const PanelNoResults: React.FC<{
  search: string;
  message: string;
  testId: string;
  everywhereTestId: string;
  /** Space above the hand-off: Layers 4418:83498 tucks it under the line
   *  (-4), Pages 4418:95333 sets it 24 lower. */
  actionOffset?: string;
  onSearchEverywhere?: (query: string) => void;
}> = ({ search, message, testId, everywhereTestId, actionOffset = "tw:-mt-1", onSearchEverywhere }) => (
  <PanelStateMessage message={message} padTop="tw:pt-10" testId={testId}>
    {onSearchEverywhere && (
      <Button
        type="button"
        color="light"
        size="sm"
        className={`${actionOffset} tw:h-8 tw:w-full tw:justify-between tw:px-3 tw:text-[12px] tw:font-normal tw:focus:ring-0`}
        data-testid={everywhereTestId}
        aria-label={`Search everywhere for “${search}”`}
        onClick={() => onSearchEverywhere(search)}
      >
        <span className="tw:truncate">Search everywhere for &ldquo;{search}&rdquo;</span>
        <Kbd>⌘K</Kbd>
      </Button>
    )}
  </PanelStateMessage>
);
