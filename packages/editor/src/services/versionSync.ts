/**
 * Editor → dashboard version-history sync (#3/26, 2026-06-24). The engine's
 * VersionTimelineManager still owns the local IndexedDB cache (`aquibra-versions`)
 * and is NOT touched — we subscribe to its VERSION_CREATED / VERSION_DELETED
 * events (see useVersionSync) and mirror each to the server so history is shared
 * per-site and survives a new device / cache clear (required before collab,
 * where per-browser histories would diverge).
 *
 * BEST-EFFORT BY DESIGN: the local IndexedDB write already happened, so a failed
 * mirror must never throw into the engine. Failures are logged + broadcast via
 * onVersionSyncError so the editor can surface a toast (no silent loss-of-cloud-
 * copy). The siteId comes from the /edit/<siteId> URL — the same id the manager
 * was given via setProjectId, so local + server keys align.
 *
 * @license BSD-3-Clause
 */
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import { currentSiteId } from "./ReviewService";
import { loadVersions, saveVersion } from "../engine/storage/VersionHistoryStorage";
import type { NamedVersion } from "../shared/types/versions";
import { SyncRetryQueue } from "./syncRetryQueue";

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

// A failed mirror used to be console.warn'd (create also one-shot-notified) and
// then dropped forever. Now it queues + retries on reconnect like cmsSync.
const queue = new SyncRetryQueue();

/** Subscribe to version-sync failures. Returns an unsubscribe fn. */
export function onVersionSyncError(cb: () => void): () => void {
  return queue.onError(cb);
}

/** How many version mirrors are queued for retry (not yet on the server). */
export function getVersionSyncPendingCount(): number {
  return queue.pendingCount();
}

/** Re-attempt every queued version mirror (called on reconnect + on demand). */
export function retryVersionSync(): Promise<void> {
  return queue.retry();
}

/** Mirror a newly-created (named or auto) version to the server. */
export async function mirrorVersionCreate(version: NamedVersion, isAuto: boolean): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  await queue.run(
    `versionCreate:${version.id}`,
    () =>
      client().siteVersions.create.mutate({
        siteId,
        versionId: version.id,
        name: version.name,
        isAuto,
        payload: version as unknown as Record<string, unknown>,
      }),
    // eslint-disable-next-line no-console
    (e) => console.warn("[version-sync] create mirror failed (kept locally)", e)
  );
}

/** Mirror a version deletion to the server. */
export async function mirrorVersionDelete(versionId: string): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  // A pending create for the same version is moot — deletion wins, so drop it
  // to avoid resurrecting a deleted version on a reconnect retry.
  queue.drop(`versionCreate:${versionId}`);
  await queue.run(
    `versionDelete:${versionId}`,
    () => client().siteVersions.delete.mutate({ siteId, versionId }),
    // eslint-disable-next-line no-console
    (e) => console.warn("[version-sync] delete mirror failed", e)
  );
}

/**
 * Cross-device load: pull server versions into the local IndexedDB cache on
 * editor open. ADDITIVE — only versionIds not already local are written, so a
 * local unsynced version is never clobbered. They surface on the next version-
 * list read. Best-effort; never throws.
 */
export async function hydrateVersionsFromServer(): Promise<number> {
  const siteId = currentSiteId();
  if (!siteId) return 0;
  let added = 0;
  try {
    const remote = await client().siteVersions.list.query({ siteId });
    if (!remote.length) return 0;
    const localIds = new Set((await loadVersions(siteId)).map((v) => v.id));
    for (const r of remote) {
      if (localIds.has(r.versionId)) continue;
      const payload = await client().siteVersions.get.query({ siteId, versionId: r.versionId });
      if (!payload) continue;
      // Force projectId to this site so loadVersions(siteId) finds it regardless
      // of what the originating device stored.
      await saveVersion({ ...(payload as NamedVersion), projectId: siteId });
      added++;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[version-sync] hydrate from server failed", e);
  }
  return added;
}
