/**
 * Layers panel state blocks — v3 boards 4418:83074 (loading), 4418:83295
 * (load-error) — shared with Pages (`@/editor/shared/PanelStates`), bound
 * here to the Layers copy and testIds — and design-2l9 147:79328
 * (no search matches).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { PanelLoadError, PanelLoadingSkeleton } from "@/editor/shared/PanelStates";

export const LayersLoadingSkeleton: React.FC = () => (
  <PanelLoadingSkeleton label="Loading layers" testId="layers-loading" barTestId="layers-sk-bar" />
);

export const LayersLoadError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <PanelLoadError
    title="Couldn’t load layers"
    rest="to load this page’s layer tree."
    testId="layers-load-error"
    retryTestId="layers-load-retry"
    onRetry={onRetry}
  />
);

/* design-2l9 147:79328: the failed query as a left-aligned heading, the
   search's scope under it, and Clear search as a link — no glyph and no ⌘K
   hand-off (⌘K itself still opens the palette), as Pages' 63:22616. */
export const LayersNoResults: React.FC<{ search: string; onClear?: () => void }> = ({ search, onClear }) => (
  <div className="tw:flex tw:flex-col tw:items-start tw:px-3 tw:pt-2" role="status" data-testid="layers-no-results">
    <p className="tw:m-0 tw:text-[12px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]" data-testid="layers-no-results-title">
      {`No layers match “${search}”`}
    </p>
    <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="layers-no-results-text">
      Search by name, type, tag or ID.
    </p>
    {onClear && (
      <Button
        size="xs"
        variant="link"
        className="tw:mt-1 tw:h-7 tw:min-h-0 tw:px-6 tw:text-[13px] tw:font-medium"
        data-testid="layers-no-results-clear"
        onClick={onClear}
      >
        Clear search
      </Button>
    )}
  </div>
);
