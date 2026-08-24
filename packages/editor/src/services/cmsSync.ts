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
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import { currentSiteId } from "./ReviewService";
import * as Storage from "../engine/cms/CollectionStorage";
import type { CMSCollection, CMSContentItem, CMSField } from "../shared/types/cms";
import { SyncRetryQueue, type SyncRetryInfo, registerPendingSource } from "./syncRetryQueue";

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

const iso = (d: Date | string): string => (typeof d === "string" ? d : d.toISOString());

// ── E7 reliability (#5/#6, 2026-06-24): stop the silent drop ────────────────
// The local IndexedDB write already happened when a sync fires, so a failed
// server mirror must never throw into the engine. But the old "console.warn +
// drop" left the user believing the CMS edit was saved everywhere when it
// wasn't. The shared SyncRetryQueue queues the failed op (latest-wins per
// target), notifies subscribers so the editor surfaces a retryable toast, and
// auto-retries on reconnect ('online'). Still never throws.
const queue = new SyncRetryQueue();
registerPendingSource("cms", () => queue.pendingCount());

export type CmsSyncErrorInfo = SyncRetryInfo;

/** Subscribe to CMS sync failures. Returns an unsubscribe fn. */
export function onCmsSyncError(cb: (info: CmsSyncErrorInfo) => void): () => void {
  return queue.onError(cb);
}

/** How many CMS changes are queued for retry (not yet on the server). */
export function getCmsSyncPendingCount(): number {
  return queue.pendingCount();
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
 * Cross-device load (E7): pull server collections + entries into the engine's
 * IndexedDB on editor open. ADDITIVE — only collections whose id isn't already
 * local are written, so a local unsynced edit is never clobbered. Best-effort.
 * Populates local storage; the engine reads it (immediately on a fresh device
 * whose store was empty, otherwise on the next load).
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

export async function hydrateCmsFromServer(): Promise<void> {
  const siteId = currentSiteId();
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
    if (!remote.length) {
      setHydrationStatus("ready");
      return;
    }
    const localIds = new Set((await Storage.loadCollections()).map((c) => c.id));
    for (const rc of remote) {
      if (localIds.has(rc.id)) continue;
      const collection: CMSCollection = {
        id: rc.id, name: rc.name, slug: rc.slug,
        description: rc.description ?? undefined, icon: rc.icon ?? undefined,
        displayField: rc.displayField ?? undefined,
        fields: (rc.fields as CMSField[]) ?? [],
        pageSlugPattern: rc.pageSlugPattern ?? undefined,
        pageSeoTitle: rc.pageSeoTitle ?? undefined,
        pageSeoDescription: rc.pageSeoDescription ?? undefined,
        pageTemplatePath: rc.pageTemplatePath ?? undefined,
        createdAt: iso(rc.createdAt), updatedAt: iso(rc.updatedAt),
      };
      await Storage.saveCollection(collection);
      const entries = (await client().cms.entries.list.query({ siteId, collectionId: rc.id })) as Array<{
        id: string; data: Record<string, unknown>; status: string; createdAt: Date | string; updatedAt: Date | string;
      }>;
      for (const e of entries) {
        await Storage.saveContentItem({
          id: e.id, collectionId: rc.id, data: e.data,
          status: e.status === "PUBLISHED" ? "published" : "draft",
          createdAt: iso(e.createdAt), updatedAt: iso(e.updatedAt),
        });
      }
    }
    setHydrationStatus("ready");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[cms-sync] hydrate from server failed", err);
    setHydrationStatus("error");
  }
}

export async function syncCollectionUpsert(c: CMSCollection): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  await queue.run(
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
      }),
    // eslint-disable-next-line no-console
    (e) => console.warn("[cms-sync] collection upsert failed (kept locally, queued)", e)
  );
}

export async function syncCollectionDelete(id: string): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  // A pending upsert for the same collection is now moot — deletion wins, so
  // drop it to avoid resurrecting a deleted collection on retry.
  queue.drop(`collectionUpsert:${id}`);
  await queue.run(
    `collectionDelete:${id}`,
    () => client().cms.collections.delete.mutate({ siteId, id }),
    // eslint-disable-next-line no-console
    (e) => console.warn("[cms-sync] collection delete failed (queued)", e)
  );
}

export async function syncEntryUpsert(item: CMSContentItem): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  await queue.run(
    `entryUpsert:${item.id}`,
    () =>
      client().cms.entries.upsert.mutate({
        id: item.id,
        siteId,
        collectionId: item.collectionId,
        data: item.data,
        status: item.status === "published" ? "PUBLISHED" : "DRAFT",
      }),
    // eslint-disable-next-line no-console
    (e) => console.warn("[cms-sync] entry upsert failed (kept locally, queued)", e)
  );
}

export async function syncEntryDelete(id: string): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  queue.drop(`entryUpsert:${id}`);
  await queue.run(
    `entryDelete:${id}`,
    () => client().cms.entries.delete.mutate({ siteId, id }),
    // eslint-disable-next-line no-console
    (e) => console.warn("[cms-sync] entry delete failed (queued)", e)
  );
}
