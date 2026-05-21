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

export interface UsePublishJobResult {
  uiState: PublishUiState;
  jobId: string | null;
  progress: number;
  publishedUrl: string | null;
  error: string | null;
  publish: (siteId: string, pages: PublishPagePayload[]) => Promise<void>;
  cancel: () => Promise<void>;
  reset: () => void;
}

export function usePublishJob(): UsePublishJobResult {
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<PublishStatus | null>(null);
  const [error, setError] = React.useState<string | null>(null);
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
    async (siteId: string, pages: PublishPagePayload[]) => {
      // Block only when a job is still in-flight. After a terminal state
      // (COMPLETED/FAILED/CANCELLED), allow republish.
      if (jobId && statusRef.current && !TERMINAL.has(statusRef.current.status)) return;
      setError(null);
      try {
        const { jobId: id } = await publishSite(siteId, pages);
        setJobId(id);
        setStatus({
          jobId: id,
          status: "QUEUED",
          progress: 0,
        });
        startPolling(id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Publish failed";
        setError(msg);
      }
    },
    [jobId, startPolling],
  );

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

  const uiState: PublishUiState = jobId
    ? status?.status === "COMPLETED"
      ? "published"
      : status?.status === "FAILED"
        ? "failed"
        : status?.status === "CANCELLED"
          ? "cancelled"
          : "publishing"
    : hydratedUrl
      ? "published"
      : "idle";

  return {
    uiState,
    jobId,
    progress: status?.progress ?? 0,
    publishedUrl: status?.publishedUrl ?? hydratedUrl,
    error,
    publish,
    cancel,
    reset,
  };
}
