/**
 * LoadCard + SaveErrorBanner — the two server-state pieces every S1 screen
 * draws (Clone 3953:26363 / 3953:26503 / 3950:26309 and their SEO and Custom
 * code twins).
 *
 * The S1 brief homes these in `settings/shared.tsx` (E1 owns it, and is
 * adding them under exactly these names and props). They live here only
 * because E1's tree and this one have not met yet; at merge, main folds
 * this file into `shared.tsx` and repoints the three screens' imports.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";

interface LoadCardProps {
  /** The card's caption — the screen's card name in caps (`SITE IDENTITY`). */
  title: string;
  /** What the screen holds, one line (`Site name, favicon, language and social profiles.`). */
  line: string;
  state: "loading" | "error";
  /** The error frame's line (`Couldn't load your site settings. Check your connection, then try again.`). */
  errorLine: string;
  onRetry: () => void;
}

/**
 * One white card standing in for the screen's cards while its row is not
 * here: caption, the one-line description, then `Loading…` or the error
 * line with `Try again` at the right. Same card box as a settings card, so
 * the swap to the real cards does not jump.
 */
export const LoadCard: React.FC<LoadCardProps> = ({ title, line, state, errorLine, onRetry }) => (
  <div
    data-testid="set-load-card"
    role="status"
    aria-live="polite"
    className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:rounded-lg tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:p-4"
  >
    <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-1.5">
      <div
        data-testid="set-load-title"
        className="tw:text-[length:var(--bk-text-11)] tw:font-medium tw:uppercase tw:tracking-wide tw:leading-4 tw:text-[var(--bk-ink-muted)]"
      >
        {title}
      </div>
      <div className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]">{line}</div>
      <div
        data-testid="set-load-line"
        className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
      >
        {state === "loading" ? "Loading…" : errorLine}
      </div>
    </div>
    {state === "error" ? (
      <Button
        type="button"
        variant="primary"
        size="xs"
        data-testid="set-load-retry"
        onClick={onRetry}
        className="tw:shrink-0 tw:text-[length:var(--bk-text-13)]"
      >
        Try again
      </Button>
    ) : null}
  </div>
);

/**
 * The danger strip above the cards after a refused Save (3950:26309). The
 * typed values are still in the fields — the copy says so — and the shell's
 * footer carries `Retry save`; this only names what did not land.
 */
export const SaveErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div
    data-testid="set-save-error"
    role="alert"
    className="tw:rounded-lg tw:border tw:border-[var(--bk-error)] tw:bg-[var(--bk-error-tint)] tw:px-3 tw:py-2 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:leading-4 tw:text-[var(--bk-error-text)]"
  >
    {message}
  </div>
);
