/**
 * SessionExpiredModal — a 401 mid-session with unsaved work (board 813:4870,
 * redrawn 2026-08-28 on honest copy).
 *
 * The truths this surface tells, verified against the code:
 *  · Unsaved work lives in THIS TAB — the network save path writes no
 *    localStorage, so "cached locally, sign in within 24h" (the old board's
 *    line) had no code behind it and is not said.
 *  · Signing in from another same-origin tab restores the cookie; every tRPC
 *    call sends credentials fresh, so "Try saving again" then succeeds with
 *    no reload and no state loss.
 *  · Sign in opens a NEW tab — a same-tab redirect would destroy the very
 *    work this surface exists to protect.
 *
 * Scrim / Escape map to Keep editing — an explicit visible choice (SaveStatus
 * keeps showing the error), so the shared ModalRoot infra and its focus trap
 * are used as-is rather than hand-rolling blockingness (codex, plan review).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalContent, ModalFooter, ModalRoot, ModalTitle } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import type { SaveOutcome } from "../hooks/useSaveCallback";

export interface SessionExpiredModalProps {
  open: boolean;
  composer: Composer | null;
  /** Watermark for "changes since the last successful save". */
  lastSavedAt: number | null;
  onRetry: () => Promise<SaveOutcome>;
  onKeepEditing: () => void;
}

/** Top labels from the history stack since the watermark — the honest
 *  approximation of "what is at risk" (there is no per-change save marker). */
function changesAtRisk(
  composer: Composer | null,
  lastSavedAt: number | null
): { labels: string[]; total: number } {
  if (!composer) return { labels: [], total: 0 };
  try {
    const stack = composer.history.getHistoryStack();
    const since = lastSavedAt ? stack.filter((e) => e.timestamp > lastSavedAt) : stack;
    return { labels: since.slice(0, 3).map((e) => e.label), total: since.length };
  } catch {
    return { labels: [], total: 0 };
  }
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  open,
  composer,
  lastSavedAt,
  onRetry,
  onKeepEditing,
}) => {
  const [retrying, setRetrying] = React.useState(false);
  const [retryFailed, setRetryFailed] = React.useState(false);
  const risk = React.useMemo(
    () => (open ? changesAtRisk(composer, lastSavedAt) : { labels: [], total: 0 }),
    [open, composer, lastSavedAt]
  );

  const signIn = () => {
    window.open(`${DASHBOARD_URL}/auth?reason=session-expired`, "_blank", "noopener");
  };

  const retry = async () => {
    setRetrying(true);
    setRetryFailed(false);
    try {
      const outcome = await onRetry();
      // Success closes via the parent's saveState watcher; a still-dead
      // session lands back here with the inline hint.
      if (outcome !== "saved") setRetryFailed(true);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <ModalRoot open={open} onOpenChange={(o) => !o && onKeepEditing()}>
      <ModalContent size="question" srTitle="Your session expired">
        <ModalTitle>Your session expired</ModalTitle>
        <p className="tw:my-2 tw:text-[13px] tw:leading-normal tw:text-[var(--bk-ink-muted)]">
          You have unsaved changes — they live in this tab. Keep it open, sign
          in again, then save.
        </p>
        {risk.total > 0 && (
          <>
            <p className="tw:m-0 tw:mb-1.5 tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.04em] tw:text-[var(--bk-ink-muted)]">
              {risk.total} {risk.total === 1 ? "change" : "changes"} at risk
            </p>
            <div className="tw:mb-3 tw:flex tw:flex-col tw:gap-1.5">
              {risk.labels.map((label, i) => (
                <div
                  key={`${i}-${label}`}
                  className="tw:rounded-[var(--bk-radius-sm)] tw:bg-[var(--bk-warning-tint)] tw:px-2.5 tw:py-2 tw:text-[12px] tw:text-[var(--bk-warning-text)]"
                >
                  {label}
                </div>
              ))}
              {risk.total > risk.labels.length && (
                <div className="tw:text-[11px] tw:text-[var(--bk-ink-muted)]">
                  and {risk.total - risk.labels.length} more
                </div>
              )}
            </div>
          </>
        )}
        {retryFailed && (
          <p className="tw:my-2 tw:text-[12px] tw:text-[var(--bk-error-text)]">
            Still signed out — finish signing in first, then try again.
          </p>
        )}
        <ModalFooter>
          <Button color="light" size="sm" onClick={onKeepEditing}>
            Keep editing
          </Button>
          <Button color="light" size="sm" disabled={retrying} onClick={retry}>
            {retrying ? "Saving…" : "Try saving again"}
          </Button>
          <Button size="sm" onClick={signIn}>
            Sign in
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};
