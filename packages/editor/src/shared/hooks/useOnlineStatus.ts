/**
 * useOnlineStatus — whether the browser has a connection, kept current from
 * its `online` / `offline` events. One reader for every surface whose save
 * needs the network: Settings (B8-S05 / SH04) and a form's service settings
 * (2L9 F14).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

function subscribe(notify: () => void): () => void {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}

export function useOnlineStatus(): boolean {
  return React.useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
