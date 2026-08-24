/**
 * Subscribes the editor to the engine's version-history events and mirrors each
 * to the dashboard (server version persistence, #3/26). Engine stays pure — it
 * emits; this editor-layer hook persists. Best-effort (see versionSync). Also
 * hydrates server versions into the local cache on open (cross-device).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ToastInput, dismissToast } from "@/editor/chrome-ui";
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
  getVersionSyncPendingCount,
  retryVersionSync,
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
    let toastId: string | null = null;
    /* Retract, don't just stop repeating. This toast is `duration: Infinity`
       and asserts the change is not on the server; when the queue drains — by
       the button below, or by `SyncRetryQueue`'s own `online` replay with no UI
       involved — it has to come off, or it keeps saying so after it stopped
       being true. */
    const clear = () => {
      if (toastId) dismissToast(toastId);
      toastId = null;
      toastShown = false;
    };
    const unsubscribe = addToast
      ? onVersionSyncError(() => {
          if (getVersionSyncPendingCount() === 0) return clear();
          if (toastShown) return;
          toastShown = true;
          toastId = addToast({
            title: "A saved version didn't sync to the cloud",
            /* "It'll retry when you save the next version" was not true:
               `SyncRetryQueue.run` replays only the op it is given, so a later
               save mirrors itself and leaves the failed one queued until a
               reconnect. `retryVersionSync` existed and nothing in the UI
               called it — the user was told to wait for something that would
               not happen. */
            description:
              "It's saved on this device but not yet on the server. Retry now, or leave it — a reconnect replays the queue.",
            tone: "error",
            duration: Infinity,
            action: {
              label: "Retry now",
              onClick: () => {
                /* Take this one down before retrying, not after. On success
                   there is nothing left to correct it with; on a second
                   failure the subscriber raises a fresh one, and leaving this
                   one up stacked two identical Infinity toasts. */
                clear();
                void retryVersionSync();
              },
            },
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
