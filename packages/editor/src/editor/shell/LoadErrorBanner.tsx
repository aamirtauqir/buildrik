/**
 * LoadErrorBanner (S1.5) — a persistent surface when the site fails to load
 * from the dashboard. The old behaviour was a toast that vanished in seconds,
 * leaving the user on a local-only fallback with no idea their real site
 * didn't load. This banner stays until they act.
 *
 *   auth     → the session expired; Sign in (→ dashboard) or Retry.
 *   network  → the dashboard didn't answer; Retry.
 *   missing  → the server says this site does not exist (deleted, a stale
 *              link, or someone else's site). "You're seeing local changes for
 *              now" is the wrong story here: there is no "for now", nothing can
 *              ever save, and Retry cannot succeed — so it is not offered.
 *              Verified live against a deleted site, where the editor showed a
 *              blank "Page 1" and invited the user to start building.
 *              The copy does NOT offer a trash: `deleteSite` soft-deletes for a
 *              purge cron, no route restores it, no screen lists it, and the
 *              delete dialog itself says "This action cannot be undone".
 *
 * Retry is a full reload (re-runs the load fresh) — honest and side-effect-free.
 *
 * Board 297:2139 (`state-banner`, 297:2243) is the visual contract: the ERROR
 * tint, not the warning one — a site that did not load is a failure, and the
 * amber pill in the topbar already means "unsaved". One type size (14 medium)
 * in `--bk-error-text` across the whole line, 20/12 insets, radius 8, and a
 * plain bordered Retry rather than a filled accent button, because the accent
 * fill is reserved for the one CTA per screen (Button 9:102's own note).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
export type LoadErrorKind = "auth" | "network" | "missing" | null;

export interface LoadErrorBannerProps {
  kind: LoadErrorKind;
  onRetry: () => void;
  onSignIn: () => void;
  onDismiss?: () => void;
}

const BAR =
  "tw:flex tw:items-center tw:gap-3 tw:px-5 tw:py-3 tw:rounded-lg " +
  "tw:bg-[var(--bk-error-tint)] tw:text-sm tw:font-medium tw:leading-normal " +
  "tw:text-[var(--bk-error-text)] tw:[font-family:var(--bk-font-ui)]";

/** Board 297:2246 — white surface, `--bk-border-medium` hairline, error label. */
const ACTION = "tw:text-[var(--bk-error-text)]";

const QUIET =
  "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

export const LoadErrorBanner: React.FC<LoadErrorBannerProps> = ({ kind, onRetry, onSignIn, onDismiss }) => {
  if (!kind) return null;

  const isAuth = kind === "auth";
  const isMissing = kind === "missing";
  const label = isAuth ? "Session expired" : isMissing ? "Site not found" : "Load failed";
  return (
    <div className={BAR} role="alert" aria-label={label}>
      <div className="tw:flex-1">
        {isAuth
          ? "Session expired. Sign in to load this site from the dashboard — you're seeing local changes for now."
          : isMissing
            ? "This site isn't there anymore. It was deleted, or it isn't yours to open. Deleting is permanent — there is no trash to restore from — so nothing you do here can be saved."
            : "Couldn't load the latest version of this site. You're seeing local changes for now."}
      </div>
      <div className="tw:flex tw:items-center tw:gap-2">
        {onDismiss && <Button color="light" size="xs" onClick={onDismiss} className={QUIET}>Dismiss</Button>}
        {isAuth && <Button color="light" size="xs" onClick={onSignIn} className={ACTION}>Sign in</Button>}
        {isMissing ? (
          <Button color="light" size="xs" onClick={onSignIn} className={ACTION}>Go to dashboard</Button>
        ) : (
          <Button color="light" size="xs" onClick={onRetry} className={ACTION}>Retry</Button>
        )}
      </div>
    </div>
  );
};

export default LoadErrorBanner;
