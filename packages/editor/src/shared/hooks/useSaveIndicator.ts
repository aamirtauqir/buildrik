/**
 * Save Indicator Hook
 * Provides save status for header indicator (Phase 6 - 3-Level Feedback)
 *
 * @license BSD-3-Clause
 */

import { useState, useEffect, useCallback } from "react";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants/events";

export type SaveStatus = "saved" | "saving" | "error" | "offline";

export interface SaveIndicatorState {
  /** Current save status */
  status: SaveStatus;
  /** Last successful save timestamp */
  lastSaved: Date | null;
  /** Retry save operation */
  retry: () => void;
  /** Whether the status is an error state */
  isError: boolean;
}

/**
 * Hook to track project save status for UI feedback
 * Listens to composer events for save lifecycle
 */
export function useSaveIndicator(composer: Composer | null): SaveIndicatorState {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!composer) return;

    // Handle save start
    const handleSaveStart = () => {
      setStatus("saving");
    };

    // Handle save success
    const handleSaveSuccess = () => {
      setStatus("saved");
      setLastSaved(new Date());
    };

    // Handle save error
    const handleSaveError = () => {
      setStatus("error");
    };

    // Handle network status
    const handleOnline = () => {
      if (status === "offline") {
        setStatus("saved");
      }
    };

    const handleOffline = () => {
      setStatus("offline");
    };

    // Subscribe to composer events
    composer.on(EVENTS.PROJECT_SAVING, handleSaveStart);
    composer.on(EVENTS.PROJECT_SAVED, handleSaveSuccess);
    composer.on(EVENTS.SYNC_ERROR, handleSaveError);
    composer.on(EVENTS.NETWORK_ONLINE, handleOnline);
    composer.on(EVENTS.NETWORK_OFFLINE, handleOffline);

    // Also listen to browser online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial offline status if not online
    if (!navigator.onLine) {
      setStatus("offline");
    }

    return () => {
      composer.off(EVENTS.PROJECT_SAVING, handleSaveStart);
      composer.off(EVENTS.PROJECT_SAVED, handleSaveSuccess);
      composer.off(EVENTS.SYNC_ERROR, handleSaveError);
      composer.off(EVENTS.NETWORK_ONLINE, handleOnline);
      composer.off(EVENTS.NETWORK_OFFLINE, handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [composer, status]);

  const retry = useCallback(() => {
    if (composer && status === "error") {
      setStatus("saving");
      composer.saveProject?.().catch(() => {
        setStatus("error");
      });
    }
  }, [composer, status]);

  return {
    status,
    lastSaved,
    retry,
    isError: status === "error" || status === "offline",
  };
}

export default useSaveIndicator;
