/**
 * Editor → dashboard CMS sync (redesign E7). The engine's CollectionManager
 * already persists collections + entries to IndexedDB (local); these mirror each
 * change to the server (cms.collections/entries) so the CMS is DB-backed and
 * syncs across devices/users.
 *
 * BEST-EFFORT BY DESIGN: the local IndexedDB write has already happened when
 * these fire, so a failed network/auth call must never throw into the engine.
 * A failure is QUEUED for retry + broadcast via onCmsSyncError so the editor
 * can surface a retryable toast (no longer a silent drop — #5/#6). The engine
 * stays pure (it emits; the editor persists).
 *
 * @license BSD-3-Clause
 */
import { omit } from "@shared/utils/helpers/object";
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import { getSiteIdFromUrl } from "./BuildrikSyncProvider";
import * as Storage from "../engine/cms/CollectionStorage";
import type { CMSCollection, CMSContentItem, CMSField } from "../shared/types/cms";
import {
  SyncRetryQueue,
  type SyncRetryInfo,
  registerPendingSource,
  forgetServerStamp,
  hasServerStamp,
  markStampMigrationDone,
  recordServerStamp,
  sameContent,
  serverCopyWins,
  serverStampOf,
  stampMigrationDue,
} from "./syncRetryQueue";

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

const iso = (d: Date | string): string => (typeof d === "string" ? d : d.toISOString());

/* A field stored without a slug (verify seed: { id, name, type }) rendered
   blank in every cell — the table reads data[field.slug]. Its id is the key
   those rows were written under. */
const withSlugs = (fields: unknown): CMSField[] =>
  ((fields as CMSField[]) ?? []).map((f) => (f.slug ? f : { ...f, slug: f.id }));

/** Server CMS rows as the /share draft carries them (`getShareDraftRows` →
 *  `getPublishedCmsForBindings`): the collections a site's bindings name and
 *  their published entries. */
export interface CmsRows {
  collections: ReadonlyArray<{
    id: string; name: string; slug: string; displayField?: string | null; fields: unknown;
    createdAt?: Date | string; updatedAt?: Date | string;
  }>;
  entries: ReadonlyArray<{
    id: string; collectionId: string; data: unknown; status?: string;
    createdAt?: Date | string; updatedAt: Date | string;
  }>;
}

/**
 * Server CMS rows in the engine's collection/record shapes — the mapping
 * `hydrateCmsFromServer` writes to IndexedDB, for a scratch composer that
 * must never read or write that store (`CollectionManager.loadSnapshot`).
 */
export function cmsFromRows(rows: CmsRows): { collections: CMSCollection[]; items: CMSContentItem[] } {
  return {
    collections: rows.collections.map((c) => ({
      id: c.id, name: c.name, slug: c.slug,
      displayField: c.displayField ?? undefined,
      fields: withSlugs(c.fields),
      createdAt: iso(c.createdAt ?? c.updatedAt ?? new Date(0)),
      updatedAt: iso(c.updatedAt ?? new Date(0)),
    })),
    items: rows.entries.map((e) => ({
      id: e.id, collectionId: e.collectionId,
      data: (e.data as Record<string, unknown>) ?? {},
      status: e.status === "PUBLISHED" ? "published" : "draft",
      createdAt: iso(e.createdAt ?? e.updatedAt), updatedAt: iso(e.updatedAt),
    })),
  };
}

// ── E7 reliability (#5/#6, 2026-06-24): stop the silent drop ────────────────
// The local IndexedDB write already happened when a sync fires, so a failed
// server mirror must never throw into the engine. But the old "console.warn +
// drop" left the user believing the CMS edit was saved everywhere when it
// wasn't. The shared SyncRetryQueue queues the failed op (latest-wins per
// target), notifies subscribers so the editor surfaces a retryable toast, and
// auto-retries on reconnect ('online'). Still never throws.
const queue = new SyncRetryQueue();
registerPendingSource("cms", () => queue.pendingCount());

/* C0a (Task 5): CONFLICT and GONE are answers, not failures. CONFLICT must
   not loop forever against a row that has moved on since; GONE means the
   server already removed the row, so retrying would resurrect it. Both are
   routed out of the retry queue and handed to their own handler instead. */
export interface CmsConflict {
  kind: "collection" | "entry";
  id: string;
  /** Overwrite the server with this device's copy. */
  keepMine(): Promise<void>;
  /** Replace this device's copy with the server's. */
  useTheirs(): Promise<void>;
}
const conflictListeners = new Set<(c: CmsConflict) => void>();
export function onCmsConflict(cb: (c: CmsConflict) => void): () => void {
  conflictListeners.add(cb);
  return () => conflictListeners.delete(cb);
}

type Outcome = "ok" | "conflict" | "gone";
function classify(e: unknown): Outcome | null {
  const msg = e instanceof Error ? e.message : "";
  if (msg.startsWith("CMS_CONFLICT:")) return "conflict";
  if (msg.startsWith("CMS_GONE:")) return "gone";
  return null;
}

/* The editor-shell hook passes the composer's CollectionManager once, via
   bindCmsEngine. Hydrate uses it to remove rows the server no longer lists
   without firing a delete mirror (forgetLocal emits a store refresh, not the
   *_DELETED event the sync layer listens to). */
type CmsEngine = Pick<
  import("../engine/cms/CollectionManager").CollectionManager,
  "forgetLocal" | "refreshFromStorage"
>;
let engine: CmsEngine | null = null;
export function bindCmsEngine(cm: CmsEngine | null): void {
  engine = cm;
}

/* `useTheirs` adds the row's key here before re-hydrating so the
   server's copy wins unconditionally even when a stamp exists. */
const forceServer = new Set<string>();

/* Wrap a mirror task so CONFLICT and GONE leave the queue instead of being
   retried forever. queue.run still drives the lifecycle — it tracks the
   pending count, fires subscribers, and replays on reconnect — but for the
   two outcomes that can never succeed on retry, the task succeeds from the
   queue's view and the outcome is dispatched to the caller instead. */
async function mirror(
  key: string,
  task: () => Promise<unknown>,
  onWarn: (e: unknown) => void,
  on: Record<"conflict" | "gone", () => void>,
): Promise<boolean> {
  let outcome: Outcome = "ok";
  const reached = await queue.run(key, async () => {
    try {
      await task();
    } catch (e) {
      const kind = classify(e);
      if (!kind) throw e;
      outcome = kind;
    }
  }, onWarn);
  if (outcome !== "ok") (on[outcome] as () => void)();
  return reached && outcome === "ok";
}

/* A delete the server answers NOT_FOUND has reached its goal: another device
   deleted the row first, or it never reached the server (made and deleted
   while offline). Retried as a failure it stayed queued for the session — a
   permanent "didn't sync" notice and a publish blocked on "1 CMS change
   hasn't reached the server" (two tabs deleting one record, live 2026-10-02).
   Re-thrown as GONE so `mirror` resolves it like any other already-gone row. */
function deleteAlreadyDone(e: unknown): never {
  if ((e as { data?: { code?: string } } | null)?.data?.code === "NOT_FOUND") {
    throw new Error(`CMS_GONE:${e instanceof Error ? e.message : "not found"}`);
  }
  throw e;
}

export type CmsSyncErrorInfo = SyncRetryInfo;

/** Subscribe to CMS sync failures. Returns an unsubscribe fn. */
export function onCmsSyncError(cb: (info: CmsSyncErrorInfo) => void): () => void {
  return queue.onError(cb);
}

/** How many CMS changes are queued for retry (not yet on the server). Excludes
 *  in-flight mirrors — use `cmsSyncBlocker` for the publish-gate count, which
 *  includes both queued and in-flight work. */
export function getCmsSyncPendingCount(): number {
  return queue.pendingCount();
}

/* P0-B audit 2026-09-30 — the sheet's save needs to know whether the mirror
   landed on the server so it can close on success or stay open with
   "Saved on this device only…" when the network is down. The event-driven
   mirror in `useCmsSync` is fire-and-forget (no return signal), so the sheet
   calls the mirror directly and the event handler skips an entry whose id is
   on the in-flight direct-sync list. Without the skip the sheet's call and the
   event-driven call would both POST; both succeed against the same stamp, but
   it's two round-trips for one save and one of them lights up the
   conflict-listener path with stale `keepMine`/`useTheirs` affordances. */
const directSync = new Set<string>();
export function markDirectSync(kind: "entry" | "collection", id: string): void {
  directSync.add(`${kind}:${id}`);
}
export function consumeDirectSync(kind: "entry" | "collection", id: string): boolean {
  return directSync.delete(`${kind}:${id}`);
}

/* Publish-gate seam (Task 8). Refuse publish when there are queued retries OR
   an in-flight mirror — an in-flight mirror has to count, or publish can hand
   off a row that hasn't landed (P1-A audit 2026-09-30; the original
   `pendingCount()`-only read let publish race a mirror call). */
export function cmsSyncBlocker(): string | null {
  const pending = queue.outstandingCount();
  if (pending > 0) {
    const noun = pending === 1 ? "change hasn't" : "changes haven't";
    return `${pending} CMS ${noun} reached the server yet. Retry the sync, then publish.`;
  }
  if (getCmsHydrationStatus() === "loading") {
    return "CMS is still syncing from the server. Retry once it finishes.";
  }
  return null;
}

/** The server's CMS rows a publish renders from (the collections the project
 *  binds). The browser's store can hold rows another device deleted, edits
 *  that never synced, or a rename the server never saw — publish has to read
 *  what the SERVER says, not what THIS device last mirrored. */
export async function fetchPublishSnapshot(
  siteId: string,
  collectionIds: string[]
): Promise<{ cms: CmsRows; siteFonts: ReadonlyArray<{ filename: string; url: string }> }> {
  return (await client().cms.publishSnapshot.mutate({ siteId, collectionIds })) as {
    cms: CmsRows;
    siteFonts: ReadonlyArray<{ filename: string; url: string }>;
  };
}

/**
 * Re-attempt every queued CMS op. Each op clears itself from the queue on
 * success or re-queues on failure, so a partial reconnect makes partial
 * progress. Best-effort; never throws.
 */
export function retryCmsSync(): Promise<void> {
  return queue.retry();
}

/**
 * Cross-device load (E7 / C-4, PD-36): pull server collections + entries into
 * the engine's IndexedDB on editor open. SERVER-FIRST, on the server's clock:
 * a row is written when it is missing locally, or when the server confirmed
 * this browser's copy (a stamp, see `serverCopyWins`), it has not changed
 * locally since, and the server's updatedAt moved past the stamp; every
 * collection's entries are re-read — the old additive pass skipped any
 * collection already local, so another member's entry edits never arrived. A
 * row with a mirror still queued here (upsert or delete) is left alone: that
 * local change is newer than anything the server holds. Nothing local is
 * deleted in this step. Best-effort. Populates local storage; the engine reads
 * it (immediately on a fresh device whose store was empty, otherwise on the
 * next load).
 */
/**
 * Hydration status, so the Content drawer can tell "no collections" from
 * "could not ask". The hydrate below used to `console.warn` and return, which
 * left the panel rendering its empty state — telling a user with a server full
 * of collections that they had none. Board `453:4010` says the quiet part out
 * loud: "This is a connection problem, not a change to your data."
 */
export type CmsHydrationStatus = "loading" | "ready" | "error";
/**
 * "ready" means NOTHING IS PENDING, not "hydrated successfully" — the initial
 * value matters. Starting at "loading" made the status a promise nobody had
 * made: any surface that never calls hydrate (a test, a probe, an editor with
 * no site) sat in a loading state forever, and the Content panel refused to
 * draw its own empty state. Hydration sets "loading" itself when it starts,
 * which is the only moment the word is true.
 */
let hydrationStatus: CmsHydrationStatus = "ready";
const hydrationListeners = new Set<(s: CmsHydrationStatus) => void>();

export function getCmsHydrationStatus(): CmsHydrationStatus {
  return hydrationStatus;
}

export function onCmsHydrationChange(cb: (s: CmsHydrationStatus) => void): () => void {
  hydrationListeners.add(cb);
  return () => hydrationListeners.delete(cb);
}

function setHydrationStatus(next: CmsHydrationStatus): void {
  hydrationStatus = next;
  for (const cb of hydrationListeners) cb(next);
}

/** Re-run hydration after a failure. */
export async function retryCmsHydration(): Promise<void> {
  setHydrationStatus("loading");
  await hydrateCmsFromServer();
}

function hasQueuedMirror(kind: "collection" | "entry", id: string): boolean {
  return queue.isPending(`${kind}Upsert:${id}`) || queue.isPending(`${kind}Delete:${id}`);
}

export async function hydrateCmsFromServer(): Promise<void> {
  const siteId = getSiteIdFromUrl();
  // No site or no storage is not a failure — there is nothing to hydrate FROM,
  // and the local collections (if any) are the whole truth.
  if (!siteId || !Storage.isStorageAvailable()) {
    setHydrationStatus("ready");
    return;
  }
  setHydrationStatus("loading");
  try {
    const remote = (await client().cms.collections.list.query({ siteId })) as Array<{
      id: string; name: string; slug: string; description: string | null; icon: string | null;
      displayField: string | null; fields: unknown; createdAt: Date | string; updatedAt: Date | string;
      pageSlugPattern: string | null; pageSeoTitle: string | null; pageSeoDescription: string | null; pageTemplatePath: string | null;
    }>;
    const migrationScope = `cms:${siteId}`;
    const firstPass = stampMigrationDue(migrationScope);
    const localCollections = new Map((await Storage.loadCollections()).map((c) => [c.id, c]));
    /* A row passed over for a queued mirror was not reconciled, so the scope's
       one-time pass is not done — it re-runs on the next hydrate. */
    let skippedQueued = false;
    const markSkipped = () => {
      skippedQueued = true;
    };

    /* D-11: collections used to reconcile one at a time — each one's entries
       fetch waited for the previous collection's writes to finish, an N+1
       sequential fan-out. Every collection is now reconciled concurrently
       (tRPC batches the parallel `entries.list.query` calls into one
       request), and a collection's own entry writes run as one Promise.all
       instead of a sequential per-entry await. */
    await Promise.all(
      remote.map(async (rc) => {
        /* A queued DELETE: the collection is going away here — nothing of it
           is written. A queued UPSERT only protects the collection row
           itself; its entries are separate rows and still reconcile below. */
        if (queue.isPending(`collectionDelete:${rc.id}`)) {
          markSkipped();
          return;
        }
        const collectionQueued = queue.isPending(`collectionUpsert:${rc.id}`);
        if (collectionQueued) markSkipped();
        const localCollection = localCollections.get(rc.id);
        const collection: CMSCollection = {
          id: rc.id,
          /* Stamped with the site it came FROM. Hydration writes straight into
             IndexedDB, past `CollectionManager`, so without this the rows would
             land unscoped and keep showing on every other site in this browser —
             the store is browser-global. (2026-08-24.) */
          siteId,
          name: rc.name, slug: rc.slug,
          description: rc.description ?? undefined, icon: rc.icon ?? undefined,
          displayField: rc.displayField ?? undefined,
          fields: withSlugs(rc.fields),
          pageSlugPattern: rc.pageSlugPattern ?? undefined,
          pageSeoTitle: rc.pageSeoTitle ?? undefined,
          pageSeoDescription: rc.pageSeoDescription ?? undefined,
          pageTemplatePath: rc.pageTemplatePath ?? undefined,
          createdAt: iso(rc.createdAt), updatedAt: iso(rc.updatedAt),
        };
        // A queued upsert: the local change is newer and still on its way.
        if (!collectionQueued) {
          const colKey = `collection:${rc.id}`;
          if (forceServer.has(colKey) || serverCopyWins(colKey, rc.updatedAt, localCollection?.updatedAt, !!localCollection, firstPass)) {
            await Storage.saveCollection(collection);
            recordServerStamp(colKey, rc.updatedAt, collection.updatedAt);
            forceServer.delete(colKey);
          } else if (
            localCollection && !hasServerStamp(colKey) &&
            sameContent(omit(localCollection, ["createdAt", "updatedAt"]), omit(collection, ["createdAt", "updatedAt"]))
          ) {
            recordServerStamp(colKey, rc.updatedAt, localCollection.updatedAt);
          }
        }
        const [entries, localEntriesList] = await Promise.all([
          client().cms.entries.list.query({ siteId, collectionId: rc.id }) as Promise<Array<{
            id: string; data: Record<string, unknown>; status: string; createdAt: Date | string; updatedAt: Date | string;
          }>>,
          Storage.loadContentItems(rc.id),
        ]);
        const localEntries = new Map(localEntriesList.map((i) => [i.id, i]));
        await Promise.all(
          entries.map(async (e) => {
            if (hasQueuedMirror("entry", e.id)) {
              markSkipped();
              return;
            }
            const localEntry = localEntries.get(e.id);
            const status = e.status === "PUBLISHED" ? "published" : "draft";
            const eKey = `entry:${e.id}`;
            if (!(forceServer.has(eKey) || serverCopyWins(eKey, e.updatedAt, localEntry?.updatedAt, !!localEntry, firstPass))) {
              if (
                localEntry && !hasServerStamp(eKey) &&
                localEntry.status === status && sameContent(localEntry.data, e.data)
              ) {
                recordServerStamp(eKey, e.updatedAt, localEntry.updatedAt);
              }
              return;
            }
            await Storage.saveContentItem({
              id: e.id, collectionId: rc.id, data: e.data, status,
              createdAt: iso(e.createdAt), updatedAt: iso(e.updatedAt),
            });
            recordServerStamp(eKey, e.updatedAt, iso(e.updatedAt));
            forceServer.delete(eKey);
          }),
        );

        /* C0a (Task 5): entries the server no longer lists are deleted on
           this device too, but only when the server ever confirmed them — an
           unstamped row is a brand-new local edit still on its way. A queued
           mirror (the local change hasn't reached the server yet) is left
           alone; the matching `_Delete` op will resolve the row on the server
           side. Goes via Storage directly: forgetLocal would emit
           CMS_STORE_REFRESHED, which the sync layer does not subscribe to. */
        const remoteEntryIds = new Set(entries.map((e) => e.id));
        for (const le of localEntriesList) {
          if (remoteEntryIds.has(le.id)) continue;
          if (!hasServerStamp(`entry:${le.id}`) || hasQueuedMirror("entry", le.id)) continue;
          await Storage.deleteContentItem(le.id);
          forgetServerStamp(`entry:${le.id}`);
        }
      }),
    );

    /* Collections the server no longer lists — same rules as entries. Engine
       path (forgetLocal) is preferred when bound so the in-memory cache clears
       and CMS_STORE_REFRESHED fires; the unbound fallback goes through
       Storage directly. */
    const remoteIds = new Set(remote.map((r) => r.id));
    for (const local of localCollections.values()) {
      if (remoteIds.has(local.id) || local.siteId !== siteId) continue;
      if (!hasServerStamp(`collection:${local.id}`) || hasQueuedMirror("collection", local.id)) continue;
      if (engine) {
        await engine.forgetLocal("collection", local.id);
      } else {
        await Storage.deleteCollection(local.id);
      }
      forgetServerStamp(`collection:${local.id}`);
    }
    if (!skippedQueued) markStampMigrationDone(migrationScope);
    /* Hydrate writes past the manager straight to IndexedDB. Ask the engine
       to re-read so every consumer (Content panel, RecordsTable, binding
       popover) sees the fresh rows in this session. */
    await engine?.refreshFromStorage();
    setHydrationStatus("ready");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[cms-sync] hydrate from server failed", err);
    setHydrationStatus("error");
  }
}

export async function syncCollectionUpsert(c: CMSCollection): Promise<boolean> {
  const siteId = getSiteIdFromUrl();
  if (!siteId) return true;
  return mirror(
    `collectionUpsert:${c.id}`,
    () =>
      client().cms.collections.upsert.mutate({
        id: c.id,
        siteId,
        name: c.name,
        slug: c.slug,
        description: c.description ?? null,
        icon: c.icon ?? null,
        displayField: c.displayField ?? null,
        fields: c.fields as unknown as never,
        pageSlugPattern: c.pageSlugPattern ?? null,
        pageSeoTitle: c.pageSeoTitle ?? null,
        pageSeoDescription: c.pageSeoDescription ?? null,
        pageTemplatePath: c.pageTemplatePath ?? null,
        expectedUpdatedAt: serverStampOf(`collection:${c.id}`) ?? null,
      }).then((row) => {
        /* No row back is still a mirror that landed; reading updatedAt off
           undefined made it a "failure", queued and replayed forever. */
        if (row?.updatedAt) recordServerStamp(`collection:${c.id}`, row.updatedAt, c.updatedAt);
      }),
    // eslint-disable-next-line no-console
    (e) => console.warn("[cms-sync] collection upsert failed (kept locally, queued)", e),
    {
      gone: () => {
        forgetServerStamp(`collection:${c.id}`);
        /* Engine path (forgetLocal) is preferred when bound so the in-memory
           cache clears and CMS_STORE_REFRESHED fires; the unbound fallback
           goes through Storage directly so this branch works in tests and
           in editors that never bound a manager. */
        if (engine) void engine.forgetLocal("collection", c.id);
        else void Storage.deleteCollection(c.id);
      },
      conflict: () => {
        for (const cb of conflictListeners) {
          cb({
            kind: "collection",
            id: c.id,
            keepMine: async () => {
              forgetServerStamp(`collection:${c.id}`);
              await syncCollectionUpsert(c);
            },
            useTheirs: async () => {
              forgetServerStamp(`collection:${c.id}`);
              await hydrateCmsFromServer();
              await engine?.refreshFromStorage();
            },
          });
        }
      },
    },
  );
}

export async function syncCollectionDelete(id: string): Promise<void> {
  const siteId = getSiteIdFromUrl();
  if (!siteId) return;
  // A pending upsert for the same collection is now moot — deletion wins, so
  // drop it to avoid resurrecting a deleted collection on retry.
  queue.drop(`collectionUpsert:${id}`);
  await mirror(
    `collectionDelete:${id}`,
    () => client().cms.collections.delete.mutate({ siteId, id }).catch(deleteAlreadyDone),
    // eslint-disable-next-line no-console
    (e) => console.warn("[cms-sync] collection delete failed (queued)", e),
    {
      /* Already gone is the goal of the delete — no resurrection on retry. */
      gone: () => forgetServerStamp(`collection:${id}`),
      /* The delete itself can't conflict against a newer version: the server's
         delete is the newer version. Nothing to reconcile. */
      conflict: () => {},
    },
  );
}

export async function syncEntryUpsert(item: CMSContentItem): Promise<boolean> {
  const siteId = getSiteIdFromUrl();
  if (!siteId) return true;
  /* A record made right after its collection must not reach the server
     first: the server answers "Collection not found" and the record sits
     queued until a reconnect. Wait for the collection's mirror in flight. */
  await queue.settled(`collectionUpsert:${item.collectionId}`);
  return mirror(
    `entryUpsert:${item.id}`,
    () =>
      client().cms.entries.upsert.mutate({
        id: item.id,
        siteId,
        collectionId: item.collectionId,
        data: item.data,
        status: item.status === "published" ? "PUBLISHED" : "DRAFT",
        expectedUpdatedAt: serverStampOf(`entry:${item.id}`) ?? null,
      }).then((row) => {
        /* No row back is still a mirror that landed; reading updatedAt off
           undefined made it a "failure", queued and replayed forever. */
        if (row?.updatedAt) recordServerStamp(`entry:${item.id}`, row.updatedAt, item.updatedAt);
      }),
    // eslint-disable-next-line no-console
    (e) => console.warn("[cms-sync] entry upsert failed (kept locally, queued)", e),
    {
      gone: () => {
        forgetServerStamp(`entry:${item.id}`);
        if (engine) void engine.forgetLocal("entry", item.id);
        else void Storage.deleteContentItem(item.id);
      },
      conflict: () => {
        for (const cb of conflictListeners) {
          cb({
            kind: "entry",
            id: item.id,
            keepMine: async () => {
              forgetServerStamp(`entry:${item.id}`);
              await syncEntryUpsert(item);
            },
            useTheirs: async () => {
              forgetServerStamp(`entry:${item.id}`);
              await hydrateCmsFromServer();
              await engine?.refreshFromStorage();
            },
          });
        }
      },
    },
  );
}

export async function syncEntryDelete(id: string): Promise<void> {
  const siteId = getSiteIdFromUrl();
  if (!siteId) return;
  queue.drop(`entryUpsert:${id}`);
  await mirror(
    `entryDelete:${id}`,
    () => client().cms.entries.delete.mutate({ siteId, id }).catch(deleteAlreadyDone),
    // eslint-disable-next-line no-console
    (e) => console.warn("[cms-sync] entry delete failed (queued)", e),
    {
      gone: () => forgetServerStamp(`entry:${id}`),
      conflict: () => {},
    },
  );
}
