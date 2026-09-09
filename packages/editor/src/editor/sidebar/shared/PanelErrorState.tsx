/**
 * PanelErrorState — the load-error block the Brand and Components panels show
 * when their own data will not load.
 *
 * Board 781:4368 (`Brand · load-error`) draws it, and board 781:4545
 * (`Publish · load-error`) draws the same block one frame over: a left-aligned
 * column at the panel's full width on 24px gutters, 36 above and 32 below,
 * three lines 6px apart — the headline in `--color/error-text` at 13, what was
 * NOT lost in `--color/ink-muted` at 12, and `Try again` as a link in
 * `--color/accent-text` at 13.
 *
 * It used to compose chrome-ui's `EmptyState` inside a centred 16px box, which
 * put a centred illustration-style empty state under a headline about a
 * failure, and a bordered button where the board draws a link. `PublishTab`
 * already renders the board's shape inline (`PublishTab.tsx:456`); this is the
 * same block for the two panels that reach it through a component.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";

export interface PanelErrorStateProps {
  /**
   * The headline. Every panel's load-error board writes its own — Brand's
   * 781:4311 says "Couldn't load your brand system." — because "Something
   * went wrong" names nothing the reader can act on or reason about.
   */
  title?: string;
  /** Error message to display */
  message?: string;
  /** Retry callback — shows "Try again" button when provided */
  onRetry?: () => void;
}

export const PanelErrorState: React.FC<PanelErrorStateProps> = ({
  title = "Something went wrong",
  message = "Something went wrong",
  onRetry,
}) => (
  <div
    className="tw:flex tw:flex-col tw:gap-1.5 tw:px-6 tw:pt-9 tw:pb-8 tw:leading-[normal]"
    role="alert"
    aria-live="polite"
    data-testid="panel-load-error"
  >
    <p
      className="tw:m-0 tw:text-[13px] tw:text-[var(--bk-error-text)]"
      data-testid="panel-load-error-title"
    >
      {title}
    </p>
    <p
      className="tw:m-0 tw:text-[12px] tw:text-[var(--bk-ink-muted)]"
      data-testid="panel-load-error-desc"
    >
      {message}
    </p>
    {onRetry ? (
      <Button
        color="light"
        size="xs"
        variant="link"
        onClick={onRetry}
        data-testid="panel-load-error-retry"
        className="tw:min-h-5 tw:self-start tw:p-0 tw:text-[13px] tw:font-normal tw:text-[var(--bk-accent-text)]"
      >
        Try again
      </Button>
    ) : null}
  </div>
);
