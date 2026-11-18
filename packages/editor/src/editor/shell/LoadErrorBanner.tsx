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
 * Wave 3 (owner: the board wins on visuals): B7-G02 `225:2821` draws the
 * full-bleed 40 px bar — ✕ glyph, the line, "Download local copy" and the
 * filled Retry — and nothing else, so "Copy details" and the trailing ✕
 * dismiss are gone (the request id still reaches the Sentry report). A
 * retry's attempt count rides the same line. For an expired session the
 * board's one action is Sign in; Retry stays beside it, unfilled, because
 * nothing else re-runs the load after signing in elsewhere
 * (`code:auth-retry-after-sign-in`).
 *
 * L-F (2026-10-26): the bar is the lead entry of the one global banner slot
 * (`GlobalBannerSlot`, board G31), so the other conditions wait behind its
 * "{n} more ⌄" instead of stacking. `LoadErrorBanner` is that composition,
 * mounted where AquibraStudio already mounts it. The download the board pairs
 * with each cause (G02 Download local copy, G22 Download changes, G18
 * Download them) saves the work there is (`workSnapshot`); with none, no
 * button. G18's "Ask an admin" opens the Permissions dialog — there is no
 * access-request API (`authority: code:no-access-request-api`).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { useSiteLoadStatus, type SiteLoadErrorKind } from "./siteLoadStatus";
import {
  BANNER_ACTION as ACTION,
  BANNER_ACTION_SECONDARY as ACTION_SECONDARY,
  BANNER_BAR as BAR,
  BANNER_TONE,
  GlobalBannerSlot,
  ToneGlyph,
} from "./GlobalBannerSlot";
import { BANNER_ID } from "./globalBanners";
import { currentWork, downloadProject } from "./workSnapshot";
import { PermissionsModal } from "./modals/PermissionsModal";

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

/** The board's download label per cause; causes it pairs with none get none. */
const DOWNLOAD_LABEL: Partial<Record<SiteLoadErrorKind, string>> = {
  network: "Download local copy",
  missing: "Download changes",
  forbidden: "Download them",
};

const LoadErrorBar: React.FC<LoadErrorBannerProps & { kind: SiteLoadErrorKind; more: React.ReactNode }> = ({
  kind,
  onRetry,
  onSignIn,
  onDismiss,
  more,
}) => {
  const { retry } = useSiteLoadStatus();
  const [permissionsOpen, setPermissionsOpen] = React.useState(false);
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
  const downloadLabel = DOWNLOAD_LABEL[kind];
  const work = downloadLabel ? currentWork(getSiteIdFromUrl()) : null;
  const toDashboard = () => window.location.assign(`${DASHBOARD_URL}/dashboard`);

  const tone = kind === "forbidden" ? "warning" : "error";
  const attempts =
    failedRetries > 0
      ? exhausted
        ? ` Tried ${MAX_RETRIES} times — it still didn’t load.`
        : ` Retry ${failedRetries} of ${MAX_RETRIES} didn’t load.`
      : "";

  return (
    <div
      className={`${BAR} ${BANNER_TONE[tone]}`}
      role="alert"
      aria-label={LABEL[kind]}
      data-testid="load-error-banner"
      data-kind={kind}
    >
      <ToneGlyph tone={tone} />
      <span className="tw:min-w-0 tw:flex-1 tw:truncate" data-testid="load-error-message" title={COPY[kind] + attempts}>
        {COPY[kind]}
        {attempts ? <span data-testid="load-error-attempts">{attempts}</span> : null}
      </span>
      <div className="tw:flex tw:flex-none tw:items-center tw:gap-2.5">
        {work && downloadLabel ? (
          <Button
            color="light"
            size="xs"
            onClick={() => downloadProject(work, "local-copy")}
            className={ACTION_SECONDARY}
            data-testid="load-error-download"
          >
            {downloadLabel}
          </Button>
        ) : null}
        {kind === "forbidden" ? (
          <Button
            color="light"
            size="xs"
            onClick={() => setPermissionsOpen(true)}
            className={ACTION_SECONDARY}
            data-testid="load-error-ask-admin"
          >
            Ask an admin
          </Button>
        ) : null}
        {failedRetries > 0 ? (
          <Button color="light" size="xs" onClick={reload} className={ACTION_SECONDARY} data-testid="load-error-reload">
            Reload page
          </Button>
        ) : null}
        {showLeaveActions ? (
          <Button color="light" size="xs" onClick={toDashboard} className={ACTION_SECONDARY} data-testid="load-error-dashboard">
            {kind === "missing" ? "Go to dashboard ↗" : "Back to dashboard"}
          </Button>
        ) : null}
        {canRetry ? (
          <Button
            color={kind === "auth" ? "light" : undefined}
            size="xs"
            disabled={busy}
            aria-busy={busy}
            /* Button 9:102: a disabled control names the reason. */
            title={busy ? "Reaching the server — this usually takes a moment." : undefined}
            onClick={runRetry}
            className={kind === "auth" ? ACTION_SECONDARY : ACTION}
            data-testid="load-error-retry"
          >
            {busy ? "Reconnecting…" : "Retry"}
          </Button>
        ) : null}
        {kind === "auth" ? (
          <Button size="xs" onClick={onSignIn} className={ACTION}>
            Sign in ↗
          </Button>
        ) : null}
        {more}
      </div>
      {kind === "forbidden" ? (
        <PermissionsModal open={permissionsOpen} role="VIEWER" onClose={() => setPermissionsOpen(false)} />
      ) : null}
    </div>
  );
};

/** The global banner slot, led by the load failure when there is one. */
export const LoadErrorBanner: React.FC<LoadErrorBannerProps> = ({ kind, ...props }) => (
  <GlobalBannerSlot
    lead={
      kind
        ? {
            id: kind === "offline" ? BANNER_ID.offline : `load-${kind}`,
            render: (more) => <LoadErrorBar kind={kind} {...props} more={more} />,
          }
        : null
    }
  />
);

export default LoadErrorBanner;
