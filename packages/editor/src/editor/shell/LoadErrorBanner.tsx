/**
 * LoadErrorBanner (S1.5, Task 1.6) — the one primary signal that the site did
 * not load. Everything else (the save status, the inspector's view-only line,
 * the canvas's neutral empty state) is a quiet echo of it, and the engine's
 * `not-loaded` lock keeps every write refused until a load lands.
 *
 * Copy is the board's, per cause (07-recovery.md, page 3:8):
 *   network   → B7-G02 225:2821
 *   auth      → B7-G04 225:3888
 *   missing   → B7-G22 227:9531. The server keeps a deleted site restorable
 *               (`sites.restore`, Recently deleted for 30 days), so the old
 *               "there is no trash to restore from" text was wrong.
 *   forbidden → B7-G18 227:7411 (the closest board; warning tone)
 *   offline   → no board words a load-time offline; the plan's fallback.
 *
 * Retry re-runs the load in place when the load path has published a retry
 * (`siteLoadStatus`): 1 s, 2 s, 4 s apart, at most three times, after which
 * the only honest actions are a page reload and the dashboard. With no
 * published retry it falls back to `onRetry` (a page reload).
 *
 * "Copy details" carries the error code and the server's request id — what
 * support needs to find the request — and nothing else: never a URL, never a
 * token.
 *
 * Board 297:2139 (`state-banner`) is the visual contract: 14 medium on the
 * tone's tint, 20/12 insets, radius 8, plain bordered actions (the accent fill
 * is reserved for the one CTA per screen, Button 9:102).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { X } from "lucide-react";
import { Button, CopyButton, IconButton } from "@/editor/chrome-ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { useSiteLoadStatus, type SiteLoadErrorKind, type SiteLoadFailure } from "./siteLoadStatus";

export type LoadErrorKind = SiteLoadErrorKind | null;

export interface LoadErrorBannerProps {
  kind: LoadErrorKind;
  /** Fallback Retry when the load path published none: a page reload. */
  onRetry: () => void;
  onSignIn: () => void;
  onDismiss?: () => void;
}

const COPY: Record<SiteLoadErrorKind, string> = {
  network: "Couldn’t load this site. You can look around; editing waits until it loads.",
  offline: "You’re offline. Your saved work is safe.",
  auth: "Session expired — changes aren’t saving. They’re kept in this tab.",
  missing:
    "This site was deleted. Your unsaved changes are kept in this browser. A site owner can restore it from Recently deleted for 30 days.",
  forbidden: "Your role changed to Viewer — editing is off. Changes that weren’t saved are kept in this browser.",
};

const LABEL: Record<SiteLoadErrorKind, string> = {
  network: "Load failed",
  offline: "Offline",
  auth: "Session expired",
  missing: "Site deleted",
  forbidden: "No access",
};

/** A retry can succeed for these; a deleted or refused site cannot. */
const RETRYABLE: ReadonlySet<SiteLoadErrorKind> = new Set(["network", "offline", "auth"]);

const RETRY_BACKOFF_MS: readonly number[] = [1000, 2000, 4000];
const MAX_RETRIES = RETRY_BACKOFF_MS.length;

/* `leading-[normal]`, not `leading-normal`: the second is Tailwind's 1.5,
   which computes to 21px, and board 297:2244 says the keyword. */
const BAR =
  "tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:px-5 tw:py-3 tw:rounded-lg " +
  "tw:text-sm tw:font-medium tw:leading-[normal] tw:[font-family:var(--bk-font-ui)]";
const TONE = {
  error: "tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]",
  warning: "tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]",
};

/** Board 297:2246 — white surface, hairline, 13 on radius 6 with 12/6 insets.
 *  flowbite's `size="xs"` supplies h-8, text-xs and rounded-lg, each yielding
 *  only to a SAME-property utility — `h-auto` for the height. */
const ACTION = "tw:h-auto tw:px-3 tw:py-1.5 tw:rounded-md tw:text-[13px] tw:leading-[normal] tw:text-current";

/** What support needs to find this request: code and request id, no more. */
export function loadErrorDetails(kind: SiteLoadErrorKind, failure: SiteLoadFailure | null): string {
  const code = failure?.code ?? (failure?.status ? `HTTP ${failure.status}` : kind);
  return `Error code: ${code}\nRequest id: ${failure?.requestId ?? "none sent"}`;
}

export const LoadErrorBanner: React.FC<LoadErrorBannerProps> = ({ kind, onRetry, onSignIn, onDismiss }) => {
  const { failure, retry } = useSiteLoadStatus();
  /* Board 294:1992's "Reconnecting…" state, on the control. The ref, not the
     state, is what refuses a second click: two clicks in one frame both read
     the old state. */
  const [busy, setBusy] = React.useState(false);
  const busyRef = React.useRef(false);
  const [failedRetries, setFailedRetries] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!kind) return null;

  const exhausted = failedRetries >= MAX_RETRIES;
  const canRetry = RETRYABLE.has(kind) && !exhausted;
  const showLeaveActions = !RETRYABLE.has(kind) || exhausted;

  const runRetry = () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    if (!retry) {
      onRetry();
      return;
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void retry().then((loaded) => {
        if (!mountedRef.current) return;
        busyRef.current = false;
        setBusy(false);
        if (loaded) {
          setFailedRetries(0);
          onDismiss?.();
        } else {
          setFailedRetries((n) => n + 1);
        }
      });
    }, RETRY_BACKOFF_MS[Math.min(failedRetries, MAX_RETRIES - 1)]);
  };

  const reload = () => window.location.reload();
  const toDashboard = () => window.location.assign(`${DASHBOARD_URL}/dashboard`);

  return (
    <div
      className={`${BAR} ${kind === "forbidden" ? TONE.warning : TONE.error}`}
      role="alert"
      aria-label={LABEL[kind]}
      data-testid="load-error-banner"
      data-kind={kind}
    >
      <div className="tw:grow tw:basis-60" data-testid="load-error-message">
        {/* Board 227:7411 opens the warning line with a glyph. Decorative —
            the role and the label already name it. */}
        {kind === "forbidden" ? <span aria-hidden="true">⚠&nbsp;&nbsp;</span> : null}
        {COPY[kind]}
        {failedRetries > 0 ? (
          <span className="tw:block tw:mt-1 tw:text-[13px] tw:font-normal" data-testid="load-error-attempts">
            {exhausted
              ? `Tried ${MAX_RETRIES} times — it still didn’t load.`
              : `Retry ${failedRetries} of ${MAX_RETRIES} didn’t load.`}
          </span>
        ) : null}
      </div>
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
        <CopyButton content={loadErrorDetails(kind, failure)} label="Copy details" className={ACTION} />
        {kind === "auth" ? (
          <Button color="light" size="xs" onClick={onSignIn} className={ACTION}>
            Sign in ↗
          </Button>
        ) : null}
        {failedRetries > 0 ? (
          <Button color="light" size="xs" onClick={reload} className={ACTION} data-testid="load-error-reload">
            Reload page
          </Button>
        ) : null}
        {showLeaveActions ? (
          <Button color="light" size="xs" onClick={toDashboard} className={ACTION} data-testid="load-error-dashboard">
            {kind === "missing" ? "Go to dashboard ↗" : "Back to dashboard"}
          </Button>
        ) : null}
        {canRetry ? (
          <Button
            color="light"
            size="xs"
            disabled={busy}
            aria-busy={busy}
            /* Button 9:102: a disabled control names the reason. */
            title={busy ? "Reaching the server — this usually takes a moment." : undefined}
            onClick={runRetry}
            className={ACTION}
            data-testid="load-error-retry"
          >
            {busy ? "Reconnecting…" : "Retry"}
          </Button>
        ) : null}
        {onDismiss ? (
          <IconButton label="Dismiss" size="sm" onClick={onDismiss} className="tw:text-current">
            <X size={14} aria-hidden="true" />
          </IconButton>
        ) : null}
      </div>
    </div>
  );
};

export default LoadErrorBanner;
