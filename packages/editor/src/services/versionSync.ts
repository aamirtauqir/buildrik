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

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

const errorSubscribers = new Set<() => void>();

/** Subscribe to version-sync failures. Returns an unsubscribe fn. */
export function onVersionSyncError(cb: () => void): () => void {
  errorSubscribers.add(cb);
  return () => {
    errorSubscribers.delete(cb);
  };
}

function notifyError(): void {
  errorSubscribers.forEach((cb) => {
    try {
      cb();
    } catch {
      // A subscriber throwing must not break the sync layer.
    }
  });
}

/** Mirror a newly-created (named or auto) version to the server. */
export async function mirrorVersionCreate(version: NamedVersion, isAuto: boolean): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  try {
    await client().siteVersions.create.mutate({
      siteId,
      versionId: version.id,
      name: version.name,
      isAuto,
      payload: version as unknown as Record<string, unknown>,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[version-sync] create mirror failed (kept locally)", e);
    notifyError();
  }
}

/** Mirror a version deletion to the server. */
export async function mirrorVersionDelete(versionId: string): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  try {
    await client().siteVersions.delete.mutate({ siteId, versionId });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[version-sync] delete mirror failed", e);
  }
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
