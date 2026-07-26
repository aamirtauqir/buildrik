/**
 * LoadErrorBanner (S1.5) — a persistent surface when the site fails to load
 * from the dashboard. The old behaviour was a toast that vanished in seconds,
 * leaving the user on a local-only fallback with no idea their real site
 * didn't load. This banner stays until they act.
 *
 *   auth     → the session expired; Sign in (→ dashboard) or Retry.
 *   network  → the dashboard didn't answer; Retry.
 *
 * Retry is a full reload (re-runs the load fresh) — honest and side-effect-free.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/shared/vibcoder/Button";

export type LoadErrorKind = "auth" | "network" | null;

export interface LoadErrorBannerProps {
  kind: LoadErrorKind;
  onRetry: () => void;
  onSignIn: () => void;
  onDismiss?: () => void;
}

const S: Record<string, React.CSSProperties> = {
  bar: { display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "var(--bk-warning-tint)", borderBottom: "1px solid var(--bk-border)", fontSize: 13, color: "var(--bk-ink)" },
  text: { flex: 1, lineHeight: 1.4 },
  strong: { fontWeight: 600 },
  actions: { display: "flex", alignItems: "center", gap: 8 },
};

export const LoadErrorBanner: React.FC<LoadErrorBannerProps> = ({ kind, onRetry, onSignIn, onDismiss }) => {
  if (!kind) return null;

  const isAuth = kind === "auth";
  return (
    <div style={S.bar} role="alert" aria-label={isAuth ? "Session expired" : "Load failed"}>
      <div style={S.text}>
        {isAuth ? (
          <>
            <span style={S.strong}>Session expired.</span> Sign in to load this site from the dashboard — you're seeing local changes for now.
          </>
        ) : (
          <>
            <span style={S.strong}>Couldn't load this site</span> from the dashboard. You're seeing local changes for now.
          </>
        )}
      </div>
      <div style={S.actions}>
        {onDismiss && <Button variant="ghost" size="sm" onClick={onDismiss}>Dismiss</Button>}
        {isAuth && <Button variant="secondary" size="sm" onClick={onSignIn}>Sign in</Button>}
        <Button variant="primary" size="sm" onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
};

export default LoadErrorBanner;
