/**
 * Phase C: server-side storage quota hook.
 *
 * Wraps `media.checkStorageQuota` tRPC. Returns null when offline, dashboard URL
 * unconfigured, or auth fails — caller falls back to local IndexedDB sum.
 *
 * Refetch policy: only on MEDIA_DELETED + UPLOAD_COMPLETE. MEDIA_ADDED is
 * intentionally NOT subscribed because every upload emits both MEDIA_ADDED
 * and UPLOAD_COMPLETE — listening to both would double-fire the RPC and
 * race two responses into the same setQuota (stale-wins risk). Per codex
 * review of 3bdafc6f finding [P2A].
 *
 * Stale-response guard: a generation counter snapshots the request; an older
 * response that resolves after a newer one is dropped instead of overwriting
 * fresh state.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createBuildrikApiClient } from "@/services/api-client";
import type { Composer } from "@/engine/Composer";
import { MEDIA_EVENTS } from "@/shared/constants/media";

interface ServerStorageQuota {
  ok: boolean;
  usedBytes: number;
  totalBytes: number; // -1 for unlimited
  tier: "FREE" | "PRO" | "BUSINESS";
  warningAt80Percent: boolean;
}

interface UseServerStorageQuota {
  quota: ServerStorageQuota | null;
  /** True until first fetch resolves or fails. After that it stays false. */
  isLoading: boolean;
  /** True if we've ever successfully fetched (used to decide local-fallback). */
  isAvailable: boolean;
  refetch: () => void;
}

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

export function useServerStorageQuota(composer: Composer): UseServerStorageQuota {
  const [quota, setQuota] = React.useState<ServerStorageQuota | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAvailable, setIsAvailable] = React.useState(false);
  const aliveRef = React.useRef(true);
  // Generation counter: each fetch increments; only the LATEST fetch commits state.
  // Earlier requests resolving after a newer one are silently dropped.
  const fetchGenRef = React.useRef(0);

  const fetchQuota = React.useCallback(async () => {
    const myGen = ++fetchGenRef.current;
    try {
      const result = (await getClient().media.checkStorageQuota.query({})) as ServerStorageQuota;
      if (!aliveRef.current || myGen !== fetchGenRef.current) return;
      setQuota(result);
      setIsAvailable(true);
    } catch {
      if (!aliveRef.current || myGen !== fetchGenRef.current) return;
      // Auth fail / offline / unconfigured — caller falls back to local sum.
      setQuota(null);
      setIsAvailable(false);
    } finally {
      if (aliveRef.current && myGen === fetchGenRef.current) setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    aliveRef.current = true;
    fetchQuota();

    const onChange = () => fetchQuota();
    // Subscribe to MEDIA_DELETED (decrements usage) and UPLOAD_COMPLETE
    // (increments usage). Skip MEDIA_ADDED — UPLOAD_COMPLETE fires for the
    // same event and avoids double-RPC + race per [P2A].
    composer.media.on(MEDIA_EVENTS.MEDIA_DELETED, onChange);
    composer.media.on(MEDIA_EVENTS.UPLOAD_COMPLETE, onChange);

    return () => {
      aliveRef.current = false;
      composer.media.off(MEDIA_EVENTS.MEDIA_DELETED, onChange);
      composer.media.off(MEDIA_EVENTS.UPLOAD_COMPLETE, onChange);
    };
  }, [composer, fetchQuota]);

  return { quota, isLoading, isAvailable, refetch: fetchQuota };
}
