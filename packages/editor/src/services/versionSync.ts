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
import { getSiteIdFromUrl } from "./BuildrikSyncProvider";
import { loadVersions, saveVersion } from "../engine/storage/VersionHistoryStorage";
import type { NamedVersion } from "../shared/types/versions";
import { SyncRetryQueue, registerPendingSource, recordServerStamp, serverCopyWins } from "./syncRetryQueue";

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

// A failed mirror used to be console.warn'd (create also one-shot-notified) and
// then dropped forever. Now it queues + retries on reconnect like cmsSync.
const queue = new SyncRetryQueue();
registerPendingSource("version", () => queue.pendingCount());

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
  const siteId = getSiteIdFromUrl();
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

/** The persisted server stamp (`syncRetryQueue` C-4) for a cached version.
 *  Its "local" half is the version's NAME — the one field that syncs after
 *  create — so "unchanged since the stamp" means "not renamed here since". */
const stampKey = (versionId: string) => `version:${versionId}`;

/** Mirror a version rename ("Name this version…", board 6930:82577) to the server. */
export async function mirrorVersionRename(versionId: string, name: string): Promise<void> {
  const siteId = getSiteIdFromUrl();
  if (!siteId) return;
  await queue.run(
    `versionRename:${versionId}`,
    async () => {
      const res = await client().siteVersions.rename.mutate({ siteId, versionId, name });
      /* Confirmed: this browser's name is the server's as of this clock. A
         replay after a reload stamps the same way. */
      if (res.updatedAt) recordServerStamp(stampKey(versionId), res.updatedAt, name);
    },
    // eslint-disable-next-line no-console
    (e) => console.warn("[version-sync] rename mirror failed", e)
  );
}

/** Mirror a version deletion to the server. */
export async function mirrorVersionDelete(versionId: string): Promise<void> {
  const siteId = getSiteIdFromUrl();
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

/** How many missing server versions one open pulls down, newest first. */
export const HYDRATE_LIMIT = 20;
/** Payload reads per request — concurrent queries share one batched call. */
const HYDRATE_CHUNK = 10;

/**
 * Cross-device load: pull server versions into the local IndexedDB cache on
 * editor open. Only versionIds not already local are fetched. A cached
 * version's name is reconciled on the persisted server stamp (C-4): the
 * server's name wins only when this browser's copy was confirmed by the server
 * and not renamed here since; otherwise the local name stays and its rename is
 * mirrored again (a rename made offline survives a reload — the retry queue is
 * in memory and does not). Returns how many versions were added or renamed —
 * they surface on the next version-list read. Best-effort; never throws.
 *
 * Bounded (walk 2026-09-24): on a cold cache it fetched every missing payload
 * one after another — 50 sequential `siteVersions.get` in 6.7 s on open,
 * competing with the project load. Now the newest HYDRATE_LIMIT missing
 * versions (the list comes back newest-first), fetched concurrently in
 * chunks so tRPC batches each chunk into one request.
 */
export async function hydrateVersionsFromServer(): Promise<number> {
  const siteId = getSiteIdFromUrl();
  if (!siteId) return 0;
  let added = 0;
  try {
    const remote = await client().siteVersions.list.query({ siteId });
    if (!remote.length) return 0;
    const local = await loadVersions(siteId);
    const localIds = new Set(local.map((v) => v.id));
    /* Refresh versions already cached from their list row:
       - author names (G1-075): a version hydrated before the list carried
         them has only the id;
       - the version's own name (X-1): a rename updates `site_versions.name`
         only, so a rename made in another browser never reached this cache.
         Same name → confirmed, stamp it. Different → the server's wins only
         on a stamped, locally-unrenamed copy (`serverCopyWins`); an
         unstamped or renamed-here copy is an unconfirmed local rename, so it
         keeps its name and is mirrored again. */
    const rowById = new Map(remote.map((r) => [r.versionId, r]));
    for (const v of local) {
      const r = rowById.get(v.id);
      if (!r) continue;
      const authorName = !v.authorName && r.createdByName ? r.createdByName : v.authorName;
      let renamed = false;
      if (r.name === v.name) {
        recordServerStamp(stampKey(v.id), r.updatedAt, v.name);
      } else if (serverCopyWins(stampKey(v.id), r.updatedAt, v.name, true, false)) {
        renamed = true;
      } else {
        await mirrorVersionRename(v.id, v.name);
      }
      if (renamed || authorName !== v.authorName) {
        await saveVersion({ ...v, authorName, name: renamed ? r.name : v.name });
        if (renamed) {
          recordServerStamp(stampKey(v.id), r.updatedAt, r.name);
          added++;
        }
      }
    }
    const missing = remote.filter((r) => !localIds.has(r.versionId)).slice(0, HYDRATE_LIMIT);
    for (let i = 0; i < missing.length; i += HYDRATE_CHUNK) {
      const chunk = missing.slice(i, i + HYDRATE_CHUNK);
      const payloads = await Promise.all(
        chunk.map((r) => client().siteVersions.get.query({ siteId, versionId: r.versionId })),
      );
      for (let k = 0; k < chunk.length; k++) {
        const payload = payloads[k];
        const r = chunk[k];
        if (!payload) continue;
        /* Force projectId to this site so loadVersions(siteId) finds it regardless
           of what the originating device stored.

           `userId` comes off the LIST ROW, not the payload. The payload is
           whatever the originating client sent, and until 2026-08-25 that was
           always null — nothing ever called `setCurrentUserId`. The server does
           not trust it either way: `site-version.ts:30` stamps `createdBy` from
           the session and says so ("never trust a client-supplied createdBy —
           attribution spoofing in version history"). So the authoritative author
           was on the server the whole time and simply never read back; the editor
           has no other reference to `createdBy` anywhere. Taking it here is what
           gives a version made on someone else's machine an author at all. */
        /* `name` off the list row too: the payload keeps the name the version
           was created with, and a rename changes only the column (X-1). */
        await saveVersion({
          ...(payload as NamedVersion),
          name: r.name,
          projectId: siteId,
          userId: r.createdBy ?? null,
          authorName: r.createdByName ?? null,
        });
        recordServerStamp(stampKey(r.versionId), r.updatedAt, r.name);
        added++;
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[version-sync] hydrate from server failed", e);
  }
  return added;
}
