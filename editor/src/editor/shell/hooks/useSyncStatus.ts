/**
 * Sync Status Hook
 * Provides sync status from composer's SyncManager
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { SyncManagerState } from "../../../engine/sync/SyncManager";
import type { SyncStatus } from "../../../services/CloudSyncService";

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

  // Subscribe to sync manager state changes
  React.useEffect(() => {
    if (!composer?.sync) return;

    // Get initial state
    setManagerState(composer.sync.getState());

    // Subscribe to state changes
    const unsubscribe = composer.sync.onStateChange((state) => {
      setManagerState(state);
    });

    return () => {
      unsubscribe();
    };
  }, [composer]);

  // Poll sync status periodically (status comes from cloud service)
  React.useEffect(() => {
    if (!composer?.sync) return;

    const updateStatus = () => {
      try {
        const syncStatus = composer.sync.getSyncStatus();
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

  // Sync callback
  const sync = React.useCallback(async () => {
    if (!composer?.sync) return;
    try {
      await composer.sync.syncCurrentProject();
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
