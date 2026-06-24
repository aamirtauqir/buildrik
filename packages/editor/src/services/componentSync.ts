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

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

const errorSubscribers = new Set<() => void>();

/** Subscribe to component-sync failures. Returns an unsubscribe fn. */
export function onComponentSyncError(cb: () => void): () => void {
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

/** Mirror a created/updated component master to the server (upsert). */
export async function mirrorComponentUpsert(component: ComponentDefinition): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  try {
    await client().siteComponents.upsert.mutate({
      siteId,
      componentId: component.id,
      name: component.name,
      payload: component as unknown as Record<string, unknown>,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[component-sync] upsert mirror failed (kept locally)", e);
    notifyError();
  }
}

/** Mirror a component deletion to the server. */
export async function mirrorComponentDelete(componentId: string): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  try {
    await client().siteComponents.delete.mutate({ siteId, componentId });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[component-sync] delete mirror failed", e);
  }
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
