/**
 * Subscribes the editor to the engine's CMS change events and mirrors each to
 * the dashboard (server CMS persistence, redesign E7). Engine stays pure — it
 * emits; this editor-layer hook persists. Best-effort (see cmsSync).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ToastInput } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import type { CMSCollection, CMSContentItem } from "../../../shared/types/cms";
import {
  syncCollectionUpsert,
  syncCollectionDelete,
  syncEntryUpsert,
  syncEntryDelete,
  hydrateCmsFromServer,
  onCmsSyncError,
  retryCmsSync,
} from "../../../services/cmsSync";

export function useCmsSync(
  composer: Composer | null,
  addToast?: (input: ToastInput) => string
): void {
  React.useEffect(() => {
    if (!composer) return;
    const cm = composer.cms.collections;

    /* Pull any server-side collections into local storage (cross-device), then
       make the manager re-read it: the hydrate writes to IndexedDB behind the
       manager's back, and the manager loads that store exactly once. Without
       the refresh, a device opening this site for the first time saw an empty
       CMS all session while the rows sat in its own IndexedDB. */
    void hydrateCmsFromServer().then(() => cm.refreshFromStorage());

    // #5/#6 (2026-06-24): CMS server-sync failures used to be logged + dropped
    // silently — the user thought their content was saved everywhere. Surface a
    // single retryable toast when a mirror fails (coalesced so a burst of
    // failures doesn't spam). Retry re-flushes the whole queue.
    let toastShown = false;
    const unsubscribe = addToast
      ? onCmsSyncError(({ pending }) => {
          if (toastShown || pending === 0) return;
          toastShown = true;
          addToast({
            title: "Some content changes didn't sync",
            /* Two fixes, both read off the live toast: "1 CMS change ARE
               saved" (the noun pluralised, the verb did not), and a promise of
               an automatic retry that only fires on a reconnect — this toast
               also appears when the server itself errors while you are online,
               and then nothing retries until the button is pressed. */
            description:
              `${pending} CMS change${pending === 1 ? " is" : "s are"} saved on this device but ` +
              `not yet on the server. Retry now, or leave it — a reconnect replays the queue.`,
            tone: "error",
            duration: Infinity,
            action: {
              label: "Retry now",
              onClick: () => {
                toastShown = false;
                void retryCmsSync();
              },
            },
          });
        })
      : undefined;

    const onColUpsert = (c: CMSCollection) => void syncCollectionUpsert(c);
    const onColDelete = (id: string) => void syncCollectionDelete(id);
    const onEntryUpsert = (it: CMSContentItem) => void syncEntryUpsert(it);
    const onEntryDelete = (id: string) => void syncEntryDelete(id);

    cm.on(EVENTS.CMS_COLLECTION_CREATED, onColUpsert);
    cm.on(EVENTS.CMS_COLLECTION_UPDATED, onColUpsert);
    cm.on(EVENTS.CMS_COLLECTION_DELETED, onColDelete);
    cm.on(EVENTS.CMS_CONTENT_CREATED, onEntryUpsert);
    cm.on(EVENTS.CMS_CONTENT_UPDATED, onEntryUpsert);
    cm.on(EVENTS.CMS_CONTENT_PUBLISHED, onEntryUpsert);
    cm.on(EVENTS.CMS_CONTENT_UNPUBLISHED, onEntryUpsert);
    cm.on(EVENTS.CMS_CONTENT_DELETED, onEntryDelete);

    return () => {
      cm.off(EVENTS.CMS_COLLECTION_CREATED, onColUpsert);
      cm.off(EVENTS.CMS_COLLECTION_UPDATED, onColUpsert);
      cm.off(EVENTS.CMS_COLLECTION_DELETED, onColDelete);
      cm.off(EVENTS.CMS_CONTENT_CREATED, onEntryUpsert);
      cm.off(EVENTS.CMS_CONTENT_UPDATED, onEntryUpsert);
      cm.off(EVENTS.CMS_CONTENT_PUBLISHED, onEntryUpsert);
      cm.off(EVENTS.CMS_CONTENT_UNPUBLISHED, onEntryUpsert);
      cm.off(EVENTS.CMS_CONTENT_DELETED, onEntryDelete);
      unsubscribe?.();
    };
  }, [composer, addToast]);
}
