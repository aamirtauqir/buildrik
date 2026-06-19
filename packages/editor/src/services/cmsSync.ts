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
import type { CMSCollection, CMSContentItem } from "../shared/types/cms";

function client() {
  return getBuildrikClient(DASHBOARD_URL);
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
