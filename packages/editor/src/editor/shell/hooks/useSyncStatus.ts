/**
 * Sync Status Hook
 * Provides sync status from composer's SyncManager
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { SyncManagerState } from "../../../engine/sync/SyncManager";
import type { SyncStatus } from "../../../services/CloudSyncService";
import { FEATURES } from "../../../shared/utils/featureFlags";

export interface UseSyncStatusResult {
  status: SyncStatus;
  managerState: SyncManagerState;
  sync: () => Promise<void>;
}

const DEFAULT_STATUS: SyncStatus = {
  isSyncing: false,
  hasLocalChanges: false,
  hasRemoteChanges: false,
  lastSyncedAt: null,
  error: null,
};

const DEFAULT_STATE: SyncManagerState = {
  isOnline: true,
  isConfigured: false,
  pendingOperations: 0,
  activeConflict: null,
};

export function useSyncStatus(composer: Composer | null): UseSyncStatusResult {
  const [managerState, setManagerState] = React.useState<SyncManagerState>(DEFAULT_STATE);
  const [status, setStatus] = React.useState<SyncStatus>(DEFAULT_STATUS);

  // E-010: SCAFFOLD gate. SyncManager + CloudSyncService are wired but inert
  // (configure() never called). When the flag is off we skip subscriptions
  // entirely so the 5-second poll interval doesn't run in production.
  React.useEffect(() => {
    if (!FEATURES.sync) return;
    if (!composer?.collab.sync) return;

    // Get initial state
    setManagerState(composer.collab.sync.getState());

    // Subscribe to state changes
    const unsubscribe = composer.collab.sync.onStateChange((state) => {
      setManagerState(state);
    });

    return () => {
      unsubscribe();
    };
  }, [composer]);

  // Poll sync status periodically (status comes from cloud service).
  // E-010: gated on FEATURES.sync to avoid an always-on 5s setInterval in
  // production where the underlying service is intentionally inert.
  React.useEffect(() => {
    if (!FEATURES.sync) return;
    if (!composer?.collab.sync) return;

    const updateStatus = () => {
      try {
        const syncStatus = composer.collab.sync.getSyncStatus();
        if (syncStatus) {
          setStatus(syncStatus);
        }
      } catch {
        // Status unavailable
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, [composer]);

  // Sync callback. E-010: gated on FEATURES.sync.
  const sync = React.useCallback(async () => {
    if (!FEATURES.sync) return;
    if (!composer?.collab.sync) return;
    try {
      await composer.collab.sync.syncCurrentProject();
    } catch {
      // Sync failed - handled by status
    }
  }, [composer]);

  return {
    status,
    managerState,
    sync,
  };
}

export default useSyncStatus;
