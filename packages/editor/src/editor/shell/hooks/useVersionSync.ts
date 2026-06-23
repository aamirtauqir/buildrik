/**
 * Subscribes the editor to the engine's version-history events and mirrors each
 * to the dashboard (server version persistence, #3/26). Engine stays pure — it
 * emits; this editor-layer hook persists. Best-effort (see versionSync). Also
 * hydrates server versions into the local cache on open (cross-device).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import type { ToastInput } from "@/editor/shared/vibcoder/Toast";
import { EVENTS } from "../../../shared/constants/events";
import type {
  VersionCreatedPayload,
  VersionDeletedPayload,
} from "../../../shared/types/versions";
import {
  mirrorVersionCreate,
  mirrorVersionDelete,
  hydrateVersionsFromServer,
  onVersionSyncError,
} from "../../../services/versionSync";

export function useVersionSync(
  composer: Composer | null,
  addToast?: (input: ToastInput) => string
): void {
  React.useEffect(() => {
    if (!composer) return;

    // Pull any server-side versions into the local cache (cross-device).
    void hydrateVersionsFromServer();

    const onCreated = (p: VersionCreatedPayload) => void mirrorVersionCreate(p.version, p.isAuto);
    const onDeleted = (p: VersionDeletedPayload) => void mirrorVersionDelete(p.versionId);
    composer.on(EVENTS.VERSION_CREATED, onCreated);
    composer.on(EVENTS.VERSION_DELETED, onDeleted);

    // #3/26: a failed mirror means this saved version exists only on this device.
    // Surface it once (coalesced) instead of silently — version history is a
    // trust feature, and the whole point is that it's NOT browser-local anymore.
    let toastShown = false;
    const unsubscribe = addToast
      ? onVersionSyncError(() => {
          if (toastShown) return;
          toastShown = true;
          addToast({
            title: "A saved version didn't sync to the cloud",
            description:
              "It's saved on this device but not yet on the server. It'll retry when you save the next version or reconnect.",
            tone: "error",
            duration: Infinity,
          });
        })
      : undefined;

    return () => {
      composer.off(EVENTS.VERSION_CREATED, onCreated);
      composer.off(EVENTS.VERSION_DELETED, onDeleted);
      unsubscribe?.();
    };
  }, [composer, addToast]);
}
