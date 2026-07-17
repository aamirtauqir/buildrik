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
import { SyncRetryQueue } from "./syncRetryQueue";

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

// A failed mirror used to be console.warn'd (upsert also one-shot-notified) and
// then dropped forever. Now it queues + retries on reconnect like cmsSync.
const queue = new SyncRetryQueue();

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
 * Cross-device load: pull server components into the local IndexedDB cache on
 * editor open. ADDITIVE — only componentIds not already local are written, so a
 * local unsynced master is never clobbered. Best-effort; never throws.
 */
export async function hydrateComponentsFromServer(): Promise<number> {
  const siteId = currentSiteId();
  if (!siteId) return 0;
  let added = 0;
  try {
    const remote = await client().siteComponents.list.query({ siteId });
    if (!remote.length) return 0;
    const localIds = new Set((await loadComponents(siteId)).map((c) => c.id));
    for (const r of remote) {
      if (localIds.has(r.componentId)) continue;
      const payload = await client().siteComponents.get.query({ siteId, componentId: r.componentId });
      if (!payload) continue;
      await saveComponent(payload as ComponentDefinition, siteId);
      added++;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[component-sync] hydrate from server failed", e);
  }
  return added;
}
