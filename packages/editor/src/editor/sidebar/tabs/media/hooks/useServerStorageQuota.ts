/**
 * Phase C: server-side storage quota hook.
 *
 * Wraps `media.checkStorageQuota` tRPC. Returns null when offline, dashboard URL
 * unconfigured, or auth fails — caller falls back to local IndexedDB sum.
 *
 * Re-fetches when MEDIA_ADDED / MEDIA_DELETED fire so the UploadZone state
 * machine (idle / near-limit / full) reflects post-upload reality.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createBuildrikApiClient } from "@buildrik/shared";
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

  const fetchQuota = React.useCallback(async () => {
    try {
      const result = (await getClient().media.checkStorageQuota.query({})) as ServerStorageQuota;
      if (!aliveRef.current) return;
      setQuota(result);
      setIsAvailable(true);
    } catch {
      if (!aliveRef.current) return;
      // Auth fail / offline / unconfigured — caller falls back to local sum.
      setQuota(null);
      setIsAvailable(false);
    } finally {
      if (aliveRef.current) setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    aliveRef.current = true;
    fetchQuota();

    const onChange = () => fetchQuota();
    composer.media.on(MEDIA_EVENTS.MEDIA_ADDED, onChange);
    composer.media.on(MEDIA_EVENTS.MEDIA_DELETED, onChange);
    composer.media.on(MEDIA_EVENTS.UPLOAD_COMPLETE, onChange);

    return () => {
      aliveRef.current = false;
      composer.media.off(MEDIA_EVENTS.MEDIA_ADDED, onChange);
      composer.media.off(MEDIA_EVENTS.MEDIA_DELETED, onChange);
      composer.media.off(MEDIA_EVENTS.UPLOAD_COMPLETE, onChange);
    };
  }, [composer, fetchQuota]);

  return { quota, isLoading, isAvailable, refetch: fetchQuota };
}
