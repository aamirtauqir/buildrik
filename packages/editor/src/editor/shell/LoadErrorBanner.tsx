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

const S: Record<string, React.CSSProperties> = {
  bar: { display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "var(--bk-warning-tint)", borderBottom: "1px solid var(--bk-border)", fontSize: 13, color: "var(--bk-ink)" },
  text: { flex: 1, lineHeight: 1.4 },
  actions: { display: "flex", alignItems: "center", gap: 8 },
};

export const LoadErrorBanner: React.FC<LoadErrorBannerProps> = ({ kind, onRetry, onSignIn, onDismiss }) => {
  if (!kind) return null;

  const isAuth = kind === "auth";
  const isMissing = kind === "missing";
  const label = isAuth ? "Session expired" : isMissing ? "Site not found" : "Load failed";
  return (
    <div style={S.bar} role="alert" aria-label={label}>
      <div style={S.text}>
        {isAuth ? (
          <>
            <strong className="tw:font-semibold">Session expired.</strong> Sign in to load this site from the dashboard — you're seeing local changes for now.
          </>
        ) : isMissing ? (
          <>
            <strong className="tw:font-semibold">This site isn't there anymore.</strong> It was deleted, or it isn't yours to open. Deleting is permanent — there is no trash to restore from — so nothing you do here can be saved.
          </>
        ) : (
          <>
            <strong className="tw:font-semibold">Couldn't load this site</strong> from the dashboard. You're seeing local changes for now.
          </>
        )}
      </div>
      <div style={S.actions}>
        {onDismiss && <Button color="light" size="xs" onClick={onDismiss} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">Dismiss</Button>}
        {isAuth && <Button color="light" size="xs" onClick={onSignIn}>Sign in</Button>}
        {isMissing ? (
          <Button size="xs" onClick={onSignIn}>Go to dashboard</Button>
        ) : (
          <Button size="xs" onClick={onRetry}>Retry</Button>
        )}
      </div>
    </div>
  );
};

export default LoadErrorBanner;
