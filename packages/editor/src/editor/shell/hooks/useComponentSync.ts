/**
 * Subscribes the editor to the engine's component-master events and mirrors each
 * to the dashboard (server component persistence, #4/27). Engine stays pure — it
 * emits; this editor-layer hook persists. Best-effort (see componentSync). Also
 * hydrates server components into the local cache on open (cross-device).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ToastInput } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import type {
  ComponentCreatedPayload,
  ComponentUpdatedPayload,
  ComponentDeletedPayload,
} from "../../../shared/types/components";
import {
  mirrorComponentUpsert,
  mirrorComponentDelete,
  hydrateComponentsFromServer,
  onComponentSyncError,
  retryComponentSync,
} from "../../../services/componentSync";
import { currentSiteId } from "../../../services/ReviewService";

export function useComponentSync(
  composer: Composer | null,
  addToast?: (input: ToastInput) => string
): void {
  React.useEffect(() => {
    if (!composer) return;

    // Pull any server-side components into the local cache (cross-device). The
    // ComponentManager already loaded IndexedDB at init (before hydrate writes),
    // so when hydrate adds server items, re-read the store + emit the list-updated
    // event (setProjectId) so the panel shows them WITHOUT a second reload.
    void hydrateComponentsFromServer().then((added) => {
      if (added > 0) {
        const sid = currentSiteId();
        if (sid) void composer.components.setProjectId(sid);
      }
    });

    const onUpsert = (p: ComponentCreatedPayload | ComponentUpdatedPayload) =>
      void mirrorComponentUpsert(p.component);
    const onDeleted = (p: ComponentDeletedPayload) => void mirrorComponentDelete(p.componentId);
    composer.on(EVENTS.COMPONENT_CREATED, onUpsert);
    composer.on(EVENTS.COMPONENT_UPDATED, onUpsert);
    composer.on(EVENTS.COMPONENT_DELETED, onDeleted);

    // #4/27: a failed mirror means this master lives only on this device — not
    // shared across the agency's sites. Surface it once (coalesced) instead of
    // silently dropping.
    let toastShown = false;
    const unsubscribe = addToast
      ? onComponentSyncError(() => {
          if (toastShown) return;
          toastShown = true;
          addToast({
            title: "A component didn't sync to the cloud",
            /* Same correction as the version toast: editing another component
               mirrors THAT one and leaves this one queued (`SyncRetryQueue.run`
               replays a single op), and `retryComponentSync` had no caller. */
            description:
              "It's saved on this device but not yet shared across your sites. Retry now, or leave it — a reconnect replays the queue.",
            tone: "error",
            duration: Infinity,
            action: {
              label: "Retry now",
              onClick: () => {
                toastShown = false;
                void retryComponentSync();
              },
            },
          });
        })
      : undefined;

    return () => {
      composer.off(EVENTS.COMPONENT_CREATED, onUpsert);
      composer.off(EVENTS.COMPONENT_UPDATED, onUpsert);
      composer.off(EVENTS.COMPONENT_DELETED, onDeleted);
      unsubscribe?.();
    };
  }, [composer, addToast]);
}
