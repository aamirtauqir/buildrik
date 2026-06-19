/**
 * Editor → dashboard CMS sync (redesign E7). The engine's CollectionManager
 * already persists collections + entries to IndexedDB (local); these mirror each
 * change to the server (cms.collections/entries) so the CMS is DB-backed and
 * syncs across devices/users.
 *
 * BEST-EFFORT BY DESIGN: the local IndexedDB write has already happened when
 * these fire, so a failed network/auth call must never throw into the engine —
 * it's logged and dropped. The engine stays pure (it emits; the editor persists).
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
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[cms-sync] collection upsert failed (kept locally)", e);
  }
}

export async function syncCollectionDelete(id: string): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  try {
    await client().cms.collections.delete.mutate({ siteId, id });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[cms-sync] collection delete failed", e);
  }
}

export async function syncEntryUpsert(item: CMSContentItem): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  try {
    await client().cms.entries.upsert.mutate({
      id: item.id,
      siteId,
      collectionId: item.collectionId,
      data: item.data,
      status: item.status === "published" ? "PUBLISHED" : "DRAFT",
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[cms-sync] entry upsert failed (kept locally)", e);
  }
}

export async function syncEntryDelete(id: string): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  try {
    await client().cms.entries.delete.mutate({ siteId, id });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[cms-sync] entry delete failed", e);
  }
}
