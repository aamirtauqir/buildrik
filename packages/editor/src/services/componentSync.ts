/**
 * Editor → dashboard component-master sync (#4/27, 2026-06-24). The engine's
 * ComponentManager keeps the local IndexedDB cache (`aquibra-components`) and is
 * NOT touched — we subscribe to its COMPONENT_CREATED/UPDATED/DELETED events
 * (see useComponentSync) and mirror each master to the server so the library is
 * shared across an agency's client sites + survives device/cache loss.
 *
 * BEST-EFFORT BY DESIGN: the local IndexedDB write already happened, so a failed
 * mirror must never throw into the engine. Failures are logged + broadcast via
 * onComponentSyncError so the editor can surface a toast. siteId comes from the
 * /edit/<siteId> URL — the same id ComponentManager got via setProjectId.
 *
 * @license BSD-3-Clause
 */
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import { currentSiteId } from "./ReviewService";
import { loadComponents, saveComponent } from "../engine/components/ComponentStorage";
import type { ComponentDefinition } from "../shared/types/components";
import {
  SyncRetryQueue,
  hasServerStamp,
  markStampMigrationDone,
  recordServerStamp,
  registerPendingSource,
  sameContent,
  serverCopyWins,
  stampMigrationDue,
} from "./syncRetryQueue";

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

// A failed mirror used to be console.warn'd (upsert also one-shot-notified) and
// then dropped forever. Now it queues + retries on reconnect like cmsSync.
const queue = new SyncRetryQueue();
registerPendingSource("component", () => queue.pendingCount());

/** Subscribe to component-sync failures. Returns an unsubscribe fn. */
export function onComponentSyncError(cb: () => void): () => void {
  return queue.onError(cb);
}

/** How many component mirrors are queued for retry (not yet on the server). */
export function getComponentSyncPendingCount(): number {
  return queue.pendingCount();
}

/** Re-attempt every queued component mirror (called on reconnect + on demand). */
export function retryComponentSync(): Promise<void> {
  return queue.retry();
}

/** Mirror a created/updated component master to the server (upsert). */
export async function mirrorComponentUpsert(component: ComponentDefinition): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  await queue.run(
    `componentUpsert:${component.id}`,
    () =>
      client().siteComponents.upsert.mutate({
        siteId,
        componentId: component.id,
        name: component.name,
        payload: component as unknown as Record<string, unknown>,
        // Scope (board 6971:77663): null = the whole site.
        pageId: component.pageId ?? null,
      }).then((row) => {
        /* No row back is still a mirror that landed; reading updatedAt off
           undefined made it a "failure", queued and replayed forever. */
        if (row?.updatedAt) recordServerStamp(`component:${component.id}`, row.updatedAt, component.updatedAt);
      }),
    // eslint-disable-next-line no-console
    (e) => console.warn("[component-sync] upsert mirror failed (kept locally)", e)
  );
}

/** Mirror a component deletion to the server. */
export async function mirrorComponentDelete(componentId: string): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  // A pending upsert for the same component is moot — deletion wins, so drop it
  // to avoid resurrecting a deleted master on a reconnect retry.
  queue.drop(`componentUpsert:${componentId}`);
  await queue.run(
    `componentDelete:${componentId}`,
    () => client().siteComponents.delete.mutate({ siteId, componentId }),
    // eslint-disable-next-line no-console
    (e) => console.warn("[component-sync] delete mirror failed", e)
  );
}

/**
 * Hydration status (C-4), the CMS pattern: "could not ask" is told apart from
 * "nothing there" so the editor can say so and offer Retry — the hydrate used
 * to `console.warn` and leave the library looking empty. "ready" means nothing
 * is pending, so a surface that never hydrates is not stuck in "loading".
 */
export type ComponentHydrationStatus = "loading" | "ready" | "error";
let hydrationStatus: ComponentHydrationStatus = "ready";

export function getComponentHydrationStatus(): ComponentHydrationStatus {
  return hydrationStatus;
}

function setHydrationStatus(next: ComponentHydrationStatus): void {
  hydrationStatus = next;
}

/**
 * Cross-device load (C-4, PD-36): pull server components into the local
 * IndexedDB cache on editor open. SERVER-FIRST, on the server's clock (stamps,
 * see `serverCopyWins`): a master is written when it is missing locally or the
 * server moved past the copy it last confirmed — the old additive pass skipped every id already local, so a
 * teammate's edit to a shared master never arrived. A master with a mirror
 * still queued here is left alone (the local change is the newer one).
 * Nothing local is deleted. Returns how many masters were written.
 */
export async function hydrateComponentsFromServer(): Promise<number> {
  const siteId = currentSiteId();
  if (!siteId) return 0;
  let written = 0;
  setHydrationStatus("loading");
  try {
    const remote = await client().siteComponents.list.query({ siteId });
    const migrationScope = `component:${siteId}`;
    const firstPass = stampMigrationDue(migrationScope);
    if (!remote.length) {
      markStampMigrationDone(migrationScope);
      setHydrationStatus("ready");
      return 0;
    }
    const local = new Map((await loadComponents(siteId)).map((c) => [c.id, c]));
    const fetchPayload = async (key: string) =>
      (await client().siteComponents.get.query({ siteId, componentId: key })) as ComponentDefinition | null;
    for (const r of remote) {
      const key = r.componentId;
      const stampKey = `component:${key}`;
      if (queue.isPending(`componentUpsert:${key}`) || queue.isPending(`componentDelete:${key}`)) continue;
      const mine = local.get(key);
      if (!serverCopyWins(stampKey, r.updatedAt, mine?.updatedAt, !!mine, firstPass)) {
        /* Unstamped and equal to the server's copy → adopt it (one get), so
           the next server edit reaches this browser. */
        if (mine && !hasServerStamp(stampKey) && sameContent(mine, await fetchPayload(key))) {
          recordServerStamp(stampKey, r.updatedAt, mine.updatedAt);
        }
        continue;
      }
      const payload = await fetchPayload(key);
      if (!payload) continue;
      await saveComponent(payload, siteId);
      recordServerStamp(stampKey, r.updatedAt, payload.updatedAt);
      written++;
    }
    markStampMigrationDone(migrationScope);
    setHydrationStatus("ready");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[component-sync] hydrate from server failed", e);
    setHydrationStatus("error");
  }
  return written;
}

/** One entry of the workspace component library (FROM LIBRARY, board 4418:99857). */
export interface LibraryComponentEntry {
  componentId: string;
  name: string;
  /** Sites in the workspace that carry it, this one included. */
  siteCount: number;
  /** Already linked on this site (it then lists under LINKED FROM LIBRARY). */
  onThisSite: boolean;
}

/** The workspace's shared masters as seen from this site; [] when there is no
 *  site (demo) or the read fails — the group then simply has no rows. */
export async function fetchComponentLibrary(): Promise<LibraryComponentEntry[]> {
  const siteId = currentSiteId();
  if (!siteId) return [];
  try {
    const rows = await client().siteComponents.library.query({ siteId });
    return rows.map(({ componentId, name, siteCount, onThisSite }) => ({ componentId, name, siteCount, onThisSite }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[component-sync] library read failed", e);
    return [];
  }
}

/** A library master's full definition, to bring onto this site. */
export async function fetchLibraryComponent(componentId: string): Promise<ComponentDefinition | null> {
  const siteId = currentSiteId();
  if (!siteId) return null;
  const payload = await client().siteComponents.libraryGet.query({ siteId, componentId });
  return (payload as ComponentDefinition | null) ?? null;
}
