/**
 * usePublishJob — React hook to drive the editor publish flow.
 *
 * - `publish(pages)` triggers `sites.publish` and starts polling.
 * - Polls `sites.publishStatus` every 2s until terminal state.
 * - Returns latest job state for the Topbar / PublishDropdown.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  publishSite,
  fetchPublishStatus,
  cancelPublish as cancelPublishCall,
  fetchSitePublishState,
  type PublishPagePayload,
  type PublishStatus,
  type PublishStep,
} from "@/services/PublishService";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";

const POLL_INTERVAL_MS = 2000;
const TERMINAL = new Set(["COMPLETED", "FAILED", "CANCELLED"]);

export type PublishUiState =
  | "idle"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled";

/**
 * Why the approval gate stopped a publish before a job was even created
 * (contracts §1.5 / §2). Kept separate from `error` because these are not
 * failures to surface as a red toast — they need a decision from the user:
 * `stale-approval` offers an acknowledge-and-ship path, `needs-approval` does
 * not (there is no review to over-ride).
 */
export type PublishBlockReason = "stale-approval" | "needs-approval" | null;

/**
 * Classify the server's approval-gate rejection from its message. Both come
 * back as tRPC PRECONDITION_FAILED (`server/trpc/routers/sites.ts`), so the
 * message is the only discriminator. Anything else is a real error.
 */
function classifyPublishBlock(msg: string): PublishBlockReason {
  if (/acknowledge|changed after it was approved/i.test(msg)) return "stale-approval";
  if (/needs an approved review/i.test(msg)) return "needs-approval";
  return null;
}

export interface UsePublishJobResult {
  uiState: PublishUiState;
  jobId: string | null;
  progress: number;
  publishedUrl: string | null;
  error: string | null;
  /** The failed job's per-step build log — board 784:4403's "View log". */
  steps: PublishStep[] | null;
  /** Set when the approval gate blocked the publish; drives the acknowledge UX. */
  blockedReason: PublishBlockReason;
  publish: (
    siteId: string,
    pages: PublishPagePayload[],
    opts?: { acknowledgeStale?: boolean },
  ) => Promise<void>;
  cancel: () => Promise<void>;
  /**
   * Adopt a publish job this hook did not start — a rollback, which the
   * server creates through `sites.rollback`.
   *
   * Without it the rollback panel had no job to watch and drove boards
   * 184:37 / 184:45 / 453:4064 off `uiState` alone. `uiState` is "published"
   * for any already-live site with nothing in flight, so the rollback confirm
   * announced success the moment it was clicked — including when the request
   * never reached the server. Adopting resets the status to QUEUED and starts
   * polling, so the panel watches a real job from a real starting point.
   */
  track: (jobId: string) => void;
  reset: () => void;
  /** Dismiss an approval block without publishing (Cancel / after a toast). */
  dismissBlock: () => void;
}

export function usePublishJob(): UsePublishJobResult {
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<PublishStatus | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [blockedReason, setBlockedReason] = React.useState<PublishBlockReason>(null);
  // Server-hydrated state separate from in-session job state so a returning
  // user sees the correct "Published" Topbar without poisoning the publish()
  // re-entrancy guard (which keys on jobId).
  const [hydratedUrl, setHydratedUrl] = React.useState<string | null>(null);
  const pollTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = React.useRef(false);
  // Mirror status into a ref so publish()'s re-entrancy guard can read latest
  // status without rotating useCallback identity per poll tick.
  const statusRef = React.useRef<PublishStatus | null>(null);
  React.useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const stopPolling = React.useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const tick = React.useCallback(async (id: string) => {
    if (abortRef.current) return;
    try {
      const next = await fetchPublishStatus(id);
      if (abortRef.current) return;
      setStatus(next);
      if (TERMINAL.has(next.status)) {
        stopPolling();
        if (next.status === "FAILED" && next.error) setError(next.error);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to poll publish status";
      setError(msg);
      stopPolling();
    }
  }, [stopPolling]);

  const startPolling = React.useCallback((id: string) => {
    stopPolling();
    abortRef.current = false;
    // Immediate first poll, then interval.
    void tick(id);
    pollTimer.current = setInterval(() => void tick(id), POLL_INTERVAL_MS);
  }, [stopPolling, tick]);

  const publish = React.useCallback(
    async (
      siteId: string,
      pages: PublishPagePayload[],
      opts?: { acknowledgeStale?: boolean },
    ) => {
      // Block only when a job is still in-flight. After a terminal state
      // (COMPLETED/FAILED/CANCELLED), allow republish.
      if (jobId && statusRef.current && !TERMINAL.has(statusRef.current.status)) return;
      setError(null);
      setBlockedReason(null);
      try {
        // Only pass the 3rd arg when acknowledging — a normal publish stays a
        // two-arg call so the server gate can still block.
        const { jobId: id } = opts?.acknowledgeStale
          ? await publishSite(siteId, pages, true)
          : await publishSite(siteId, pages);
        setJobId(id);
        setStatus({
          jobId: id,
          status: "QUEUED",
          progress: 0,
        });
        startPolling(id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Publish failed";
        // An approval-gate block is a decision to surface, not a red error.
        // Without this, the pre-job rejection landed in `error` while uiState
        // stayed "idle", so the toast effect never fired and Publish appeared
        // to do nothing at all.
        const reason = classifyPublishBlock(msg);
        if (reason) setBlockedReason(reason);
        else setError(msg);
      }
    },
    [jobId, startPolling],
  );

  const track = React.useCallback((id: string) => {
    setError(null);
    setBlockedReason(null);
    setJobId(id);
    setStatus({ jobId: id, status: "QUEUED", progress: 0 });
    startPolling(id);
  }, [startPolling]);

  const dismissBlock = React.useCallback(() => setBlockedReason(null), []);

  const cancel = React.useCallback(async () => {
    if (!jobId) return;
    try {
      await cancelPublishCall(jobId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Cancel failed";
      setError(msg);
    }
  }, [jobId]);

  const reset = React.useCallback(() => {
    abortRef.current = true;
    stopPolling();
    setJobId(null);
    setStatus(null);
    setError(null);
    setBlockedReason(null);
  }, [stopPolling]);

  // Cleanup on unmount.
  React.useEffect(() => {
    return () => {
      abortRef.current = true;
      stopPolling();
    };
  }, [stopPolling]);

  // Hydrate Topbar state from server on mount. Without this, every editor
  // reload of a previously published site shows "Publish" (draft) until the
  // user republishes — misleading because the site IS live.
  React.useEffect(() => {
    const siteId = getSiteIdFromUrl();
    if (!siteId) return;
    let cancelled = false;
    void (async () => {
      try {
        const state = await fetchSitePublishState(siteId);
        if (cancelled) return;
        if (state.isPublished) setHydratedUrl(state.publishedUrl);
      } catch {
        // Hydration is best-effort — failures fall back to draft UI.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /*
    A publish that dies BEFORE a job id comes back — the server refusing the
    request, a dispatch that never reached the worker — is still a failed
    publish. `publish()` catches it into `error` and returns, leaving `jobId`
    null, and this used to fall straight through to `hydratedUrl ? "published"
    : "idle"`. Both readers of the failure gate on `uiState === "failed"`
    (PublishTab's board 784:4403 branch, and the outcome toast in
    useExportHandlers), so the whole thing was silent: walked live on
    2026-08-17, the wizard closed, the row in publish_build_jobs said
    WORKER_DISPATCH_FAILED, and the panel showed no failure of any kind.

    The same defect was already fixed one level up for the approval-gate case
    by routing it to `blockedReason` — see the comment in `publish()`, which
    describes this exact shape ("landed in `error` while uiState stayed idle").
    That fix only covered the block; a plain error still lied.

    `error` is only otherwise set from a poll or a cancel, and both of those
    have a `jobId`, so this branch is reached only by a pre-job failure.
  */
  const uiState: PublishUiState = jobId
    ? status?.status === "COMPLETED"
      ? "published"
      : status?.status === "FAILED"
        ? "failed"
        : status?.status === "CANCELLED"
          ? "cancelled"
          : "publishing"
    : error
      ? "failed"
      : hydratedUrl
        ? "published"
        : "idle";

  return {
    uiState,
    jobId,
    progress: status?.progress ?? 0,
    publishedUrl: status?.publishedUrl ?? hydratedUrl,
    error,
    steps: status?.steps ?? null,
    blockedReason,
    publish,
    cancel,
    track,
    reset,
    dismissBlock,
  };
}
