/**
 * Subscribes the editor to the engine's version-history events and mirrors each
 * to the dashboard (server version persistence, #3/26). Engine stays pure — it
 * emits; this editor-layer hook persists. Best-effort (see versionSync). Also
 * hydrates server versions into the local cache on open (cross-device).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ToastInput } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
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
import { currentSiteId } from "../../../services/ReviewService";

export function useVersionSync(
  composer: Composer | null,
  addToast?: (input: ToastInput) => string
): void {
  React.useEffect(() => {
    if (!composer) return;

    // Pull any server-side versions into the local cache (cross-device). The
    // VersionTimelineManager already loaded IndexedDB at init (before hydrate
    // writes), so when hydrate adds server versions, re-read the store + emit
    // the list-updated event (setProjectId) so they show WITHOUT a 2nd reload.
    void hydrateVersionsFromServer().then((added) => {
      if (added > 0) {
        const sid = currentSiteId();
        if (sid) void composer.versions.setProjectId(sid);
      }
    });

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
