/**
 * Editor → dashboard "My Templates" sync (#13/25, 2026-06-24). The editor's
 * handleSaveTemplate writes the local cache (localStorage MY_TEMPLATES); this
 * mirrors each saved template to the server (workspace-scoped) so the library
 * is shared across the agency's sites + survives device/cache loss, and
 * hydrates server templates back into the local cache on open.
 *
 * Best-effort: never throws (the local save already happened). siteId comes from
 * the /edit/<siteId> URL; the server resolves the workspace from it.
 *
 * @license BSD-3-Clause
 */
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import { currentSiteId } from "./ReviewService";
import { STORAGE_KEYS } from "../shared/constants/storageKeys";
import { SyncRetryQueue } from "./syncRetryQueue";

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

// A failed mirror used to be console.warn'd and then dropped forever — with no
// error channel at all (unlike version/component which at least notified). Now
// it queues + notifies + retries on reconnect like cmsSync.
const queue = new SyncRetryQueue();

/** Subscribe to template-sync failures. Returns an unsubscribe fn. */
export function onTemplateSyncError(cb: () => void): () => void {
  return queue.onError(cb);
}

/** How many template mirrors are queued for retry (not yet on the server). */
export function getTemplateSyncPendingCount(): number {
  return queue.pendingCount();
}

/** Re-attempt every queued template mirror (called on reconnect + on demand). */
export function retryTemplateSync(): Promise<void> {
  return queue.retry();
}

/** Shape the editor stores in localStorage MY_TEMPLATES (see handleSaveTemplate). */
export interface MyTemplateRow {
  id: string;
  name: string;
  category?: string;
  description?: string;
  html: string;
  css?: string;
  thumbnail?: string;
}

function readLocal(): MyTemplateRow[] {
  try {
    const s = localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES);
    return s ? (JSON.parse(s) as MyTemplateRow[]) : [];
  } catch {
    return [];
  }
}

/** Mirror a just-saved template to the server (called from handleSaveTemplate). */
export async function mirrorUserTemplate(t: MyTemplateRow): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  await queue.run(
    `templateUpsert:${t.id}`,
    () =>
      client().userTemplates.upsert.mutate({
        siteId,
        templateId: t.id,
        name: t.name,
        category: t.category ?? null,
        description: t.description ?? null,
        html: t.html,
        css: t.css ?? null,
        thumbnail: t.thumbnail ?? null,
      }),
    // eslint-disable-next-line no-console
    (e) => console.warn("[template-sync] mirror failed (kept locally)", e)
  );
}

/**
 * Pull server templates into the local cache on open. ADDITIVE — only ids not
 * already local are appended, so a local unsynced template is never clobbered.
 * They surface on the next My-Templates read. Best-effort; never throws.
 */
export async function hydrateUserTemplatesFromServer(): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) return;
  try {
    const remote = await client().userTemplates.list.query({ siteId });
    if (!remote.length) return;
    const local = readLocal();
    const localIds = new Set(local.map((t) => t.id));
    const merged = [...local];
    for (const r of remote) {
      if (localIds.has(r.templateId)) continue;
      merged.push({
        id: r.templateId,
        name: r.name,
        category: r.category ?? undefined,
        description: r.description ?? undefined,
        html: r.html,
        css: r.css ?? undefined,
        thumbnail: r.thumbnail ?? undefined,
      });
    }
    localStorage.setItem(STORAGE_KEYS.MY_TEMPLATES, JSON.stringify(merged));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[template-sync] hydrate from server failed", e);
  }
}
