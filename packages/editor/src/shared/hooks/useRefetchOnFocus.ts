/**
 * useRefetchOnFocus — re-run a fetch when the user comes back to the tab.
 *
 * Freshness for ambient state (review pill, unread badge) that changes while
 * the editor is backgrounded — approval happens in another tab, the refetch
 * happens when the user returns, which is the only moment staleness is
 * visible. Throttled so rapid focus flapping (devtools, palette overlays)
 * doesn't spam the network.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export function useRefetchOnFocus(fn: () => void, minIntervalMs = 30_000): void {
  const lastRun = React.useRef(-Infinity);
  const fnRef = React.useRef(fn);
  fnRef.current = fn;

  React.useEffect(() => {
    const maybeRun = () => {
      const now = Date.now();
      if (now - lastRun.current < minIntervalMs) return;
      lastRun.current = now;
      fnRef.current();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") maybeRun();
    };
    window.addEventListener("focus", maybeRun);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", maybeRun);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [minIntervalMs]);
}
