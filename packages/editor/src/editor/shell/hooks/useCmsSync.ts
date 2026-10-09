/**
 * Subscribes the editor to the engine's CMS change events and mirrors each to
 * the dashboard (server CMS persistence, redesign E7). Engine stays pure — it
 * emits; this editor-layer hook persists. Best-effort (see cmsSync).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ToastInput, dismissToast } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import type { CMSCollection, CMSContentItem } from "../../../shared/types/cms";
import {
  syncCollectionUpsert,
  syncCollectionDelete,
  syncEntryUpsert,
  syncEntryDelete,
  hydrateCmsFromServer,
  flushCmsOutbox,
  onCmsSyncError,
  onCmsConflict,
  onCmsGone,
  onCmsInvalid,
  retryCmsSync,
  bindCmsEngine,
  consumeDirectSync,
} from "../../../services/cmsSync";

export function useCmsSync(
  composer: Composer | null,
  addToast?: (input: ToastInput) => string
): void {
  React.useEffect(() => {
    if (!composer) return;
    const cm = composer.cms.collections;
    /* C0a (Task 5): the cmsSync layer needs the manager to drop rows the
       server no longer lists and to ask consumers to re-read after a hydrate
       writes past it. Bind it for the lifetime of this composer; unbind on
       cleanup so a hot-reloaded manager isn't left answering to a stale hook. */
    bindCmsEngine(cm);

    /* Pull any server-side collections into local storage (cross-device), then
       make the manager re-read it: the hydrate writes to IndexedDB behind the
       manager's back, and the manager loads that store exactly once. Without
       the refresh, a device opening this site for the first time saw an empty
       CMS all session while the rows sat in its own IndexedDB.
       C0.5: first replay what an earlier load left in the outbox, so a change
       that never reached the server goes up before the server's copy is
       read (hydration also leaves any row still in the outbox alone). */
    void flushCmsOutbox()
      .then(() => hydrateCmsFromServer())
      .then(() => cm.refreshFromStorage());

    // #5/#6 (2026-06-24): CMS server-sync failures used to be logged + dropped
    // silently — the user thought their content was saved everywhere. Surface a
    // single retryable toast when a mirror fails (coalesced so a burst of
    // failures doesn't spam). Retry re-flushes the whole queue.
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
      ? onCmsSyncError(({ pending }) => {
          if (pending === 0) return clear();
          if (toastShown) return;
          toastShown = true;
          toastId = addToast({
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
                /* Take this one down before retrying, not after. On success
                   there is nothing left to correct it with; on a second
                   failure the subscriber raises a fresh one, and leaving this
                   one up stacked two identical Infinity toasts. */
                clear();
                void retryCmsSync();
              },
            },
          });
        })
      : undefined;

    /* C0a (Task 5): a server conflict (someone else moved the row on since)
       can't be resolved silently — the user has to choose whose copy wins.
       Keep-mine forces the next upsert with no precondition (the local stamp
       was forgotten by the sync layer on the way in), use-theirs rehydrates
       the server's copy. The toast is `duration: Infinity`, so each button
       takes it down itself — it stayed up after either choice (C0.3 live,
       2026-10-02). */
    const offConflict = addToast
      ? onCmsConflict((c) => {
          const what = c.kind === "collection" ? "Collection" : "Entry";
          const id = addToast({
            title: `${what} changed elsewhere`,
            description:
              "Another device updated this row. Keep your changes, or replace them with the server's copy.",
            tone: "warning",
            duration: Infinity,
            action: {
              label: "Use theirs",
              onClick: () => {
                dismissToast(id);
                void c.useTheirs();
              },
            },
            secondaryAction: {
              label: "Keep mine",
              onClick: () => {
                dismissToast(id);
                void c.keepMine();
              },
            },
          });
        })
      : undefined;

    /* An edit to a row another device deleted is dropped with the row; say
       so, in the server's own words, instead of letting it vanish. The title
       names what is gone — the server's sentence alone was a title-less
       toast (QA 2026-10-02). An entry written into a deleted COLLECTION is
       answered "This collection was deleted.", so the title follows the
       sentence, not the row's kind. Boards 8139:217711 / 8139:217890 draw it
       with no tone dot. */
    const offGone = addToast
      ? onCmsGone((g) => {
          const collectionGone = g.kind === "collection" || /collection/i.test(g.message);
          addToast({
            tone: "neutral",
            title: collectionGone ? "Collection deleted" : "Record deleted",
            description: `${g.message} Your change to it wasn't saved.`,
          });
        })
      : undefined;

    /* L3-019: a collection the server refuses for its own rules (a plan's
       collection cap, an invalid field) is answered once and never retried,
       so it never reaches the server. Entry refusals surface in the record
       sheet that made them (`takeCmsInvalid`); a collection's is said here. */
    const offInvalid = addToast
      ? onCmsInvalid((i) => {
          if (i.kind !== "collection") return;
          const name = cm.getCollection?.(i.id)?.name ?? "This collection";
          addToast({
            tone: "error",
            title: `${name} wasn't saved to the server`,
            description: `${i.message} It stays on this device only.`,
          });
        })
      : undefined;

    const onColUpsert = (c: CMSCollection) => {
      if (consumeDirectSync("collection", c.id)) return;
      void syncCollectionUpsert(c);
    };
    const onColDelete = (id: string) => {
      if (consumeDirectSync("collection", id)) return;
      void syncCollectionDelete(id);
    };
    const onEntryUpsert = (it: CMSContentItem) => {
      if (consumeDirectSync("entry", it.id)) return;
      void syncEntryUpsert(it);
    };
    const onEntryDelete = (id: string) => {
      if (consumeDirectSync("entry", id)) return;
      void syncEntryDelete(id);
    };

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
      offConflict?.();
      offGone?.();
      offInvalid?.();
      bindCmsEngine(null);
    };
  }, [composer, addToast]);
}
