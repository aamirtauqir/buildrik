/**
 * useCallout — Build Tab v4 transition callout lifecycle.
 *
 * Shows a one-time "Quick Picks removed" notice to users who had picks saved
 * from prior versions. Auto-dismisses after a configurable timer and cleans
 * up obsolete storage keys. Never shows to first-time users.
 */

import { useCallback, useEffect, useState } from "react";
import { safeGet, safeRemove, safeSet } from "../../../../../shared/utils/safeStorage";
import { STORAGE_KEYS } from "../../../../../shared/constants/storageKeys";

const DEFAULT_AUTO_DISMISS_MS = 8000;

function hasSavedPicks(): boolean {
  const raw = safeGet(STORAGE_KEYS.BUILD_PICKS);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

export interface UseCalloutResult {
  visible: boolean;
  dismiss: () => void;
}

export function useCallout(autoDismissMs: number = DEFAULT_AUTO_DISMISS_MS): UseCalloutResult {
  const [visible, setVisible] = useState<boolean>(() => {
    const seen = safeGet(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN) === "1";
    return hasSavedPicks() && !seen;
  });

  const dismiss = useCallback(() => {
    safeRemove(STORAGE_KEYS.BUILD_PICKS);
    safeRemove(STORAGE_KEYS.BUILD_FTUE_SEEN);
    safeSet(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN, "1");
    setVisible(false);
    if (typeof console !== "undefined" && console.debug) {
      console.debug("[buildtab] callout dismissed", { source: "dismiss" });
    }
  }, []);

  // First-time user silent flag set
  useEffect(() => {
    if (!visible) {
      const seen = safeGet(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN) === "1";
      if (!seen) {
        safeSet(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN, "1");
        if (typeof console !== "undefined" && console.debug) {
          console.debug("[buildtab] callout not shown (new user or no picks)");
        }
      }
    } else if (typeof console !== "undefined" && console.debug) {
      console.debug("[buildtab] callout shown (user had picks)");
    }
    // Intentionally run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      dismiss();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [visible, autoDismissMs, dismiss]);

  return { visible, dismiss };
}
