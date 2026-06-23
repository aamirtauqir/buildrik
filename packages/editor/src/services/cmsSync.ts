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

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

const iso = (d: Date | string): string => (typeof d === "string" ? d : d.toISOString());

// ── E7 reliability (#5/#6, 2026-06-24): stop the silent drop ────────────────
// The local IndexedDB write already happened when a sync fires, so a failed
// server mirror must never throw into the engine. But the old "console.warn +
// drop" left the user believing the CMS edit was saved everywhere when it
// wasn't. We now queue the failed op (latest-wins per target), notify
// subscribers so the editor surfaces a retryable toast, and auto-retry on
// reconnect. Still never throws.
type QueuedCmsOp =
  | { kind: "collectionUpsert"; collection: CMSCollection }
  | { kind: "collectionDelete"; id: string }
  | { kind: "entryUpsert"; item: CMSContentItem }
  | { kind: "entryDelete"; id: string };

const syncQueue = new Map<string, QueuedCmsOp>();
const errorSubscribers = new Set<(info: CmsSyncErrorInfo) => void>();

export interface CmsSyncErrorInfo {
  /** Number of CMS changes still not mirrored to the server. */
  pending: number;
}

/** Subscribe to CMS sync failures. Returns an unsubscribe fn. */
export function onCmsSyncError(cb: (info: CmsSyncErrorInfo) => void): () => void {
  errorSubscribers.add(cb);
  return () => {
    errorSubscribers.delete(cb);
  };
}

/** How many CMS changes are queued for retry (not yet on the server). */
export function getCmsSyncPendingCount(): number {
  return syncQueue.size;
}

function notifyError(): void {
  const info: CmsSyncErrorInfo = { pending: syncQueue.size };
  errorSubscribers.forEach((cb) => {
    try {
      cb(info);
    } catch {
      // A subscriber throwing must not break the sync layer.
    }
  });
}

/**
 * Re-attempt every queued CMS op. Each op's own sync fn removes it from the
 * queue on success or re-queues on failure, so a partial reconnect makes
 * partial progress. Best-effort; never throws.
 */
export async function retryCmsSync(): Promise<void> {
  for (const op of Array.from(syncQueue.values())) {
    switch (op.kind) {
      case "collectionUpsert":
        await syncCollectionUpsert(op.collection);
        break;
      case "collectionDelete":
        await syncCollectionDelete(op.id);
        break;
      case "entryUpsert":
        await syncEntryUpsert(op.item);
        break;
      case "entryDelete":
        await syncEntryDelete(op.id);
        break;
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void retryCmsSync());
}

/**
 * Cross-device load (E7): pull server collections + entries into the engine's
 * IndexedDB on editor open. ADDITIVE — only collections whose id isn't already
 * local are written, so a local unsynced edit is never clobbered. Best-effort.
 * Populates local storage; the engine reads it (immediately on a fresh device
 * whose store was empty, otherwise on the next load).
 */
export async function hydrateCmsFromServer(): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId || !Storage.isStorageAvailable()) return;
  try {
    const remote = (await client().cms.collections.list.query({ siteId })) as Array<{
      id: string; name: string; slug: string; description: string | null; icon: string | null;
      displayField: string | null; fields: unknown; createdAt: Date | string; updatedAt: Date | string;
      pageSlugPattern: string | null; pageSeoTitle: string | null; pageSeoDescription: string | null; pageTemplatePath: string | null;
    }>;
    if (!remote.length) return;
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
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[cms-sync] hydrate from server failed", err);
  }
}

export async function syncCollectionUpsert(c: CMSCollection): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  const key = `collectionUpsert:${c.id}`;
  try {
    await client().cms.collections.upsert.mutate({
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
    });
    syncQueue.delete(key);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[cms-sync] collection upsert failed (kept locally, queued)", e);
    syncQueue.set(key, { kind: "collectionUpsert", collection: c });
    notifyError();
  }
}

export async function syncCollectionDelete(id: string): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  const key = `collectionDelete:${id}`;
  // A pending upsert for the same collection is now moot — deletion wins, so
  // drop it to avoid resurrecting a deleted collection on retry.
  syncQueue.delete(`collectionUpsert:${id}`);
  try {
    await client().cms.collections.delete.mutate({ siteId, id });
    syncQueue.delete(key);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[cms-sync] collection delete failed (queued)", e);
    syncQueue.set(key, { kind: "collectionDelete", id });
    notifyError();
  }
}

export async function syncEntryUpsert(item: CMSContentItem): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  const key = `entryUpsert:${item.id}`;
  try {
    await client().cms.entries.upsert.mutate({
      id: item.id,
      siteId,
      collectionId: item.collectionId,
      data: item.data,
      status: item.status === "published" ? "PUBLISHED" : "DRAFT",
    });
    syncQueue.delete(key);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[cms-sync] entry upsert failed (kept locally, queued)", e);
    syncQueue.set(key, { kind: "entryUpsert", item });
    notifyError();
  }
}

export async function syncEntryDelete(id: string): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  const key = `entryDelete:${id}`;
  syncQueue.delete(`entryUpsert:${id}`);
  try {
    await client().cms.entries.delete.mutate({ siteId, id });
    syncQueue.delete(key);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[cms-sync] entry delete failed (queued)", e);
    syncQueue.set(key, { kind: "entryDelete", id });
    notifyError();
  }
}
