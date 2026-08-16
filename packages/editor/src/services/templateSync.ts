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

/*
  Hydration status, so the panel can say what happened.

  The MIRROR path (editor → server) has had an error channel since E7 — the
  queue below notifies and retries. The HYDRATE path (server → editor) had
  none: it caught, console.warn'd, and returned, so a workspace whose saved
  templates failed to load looked identical to a workspace that has none. Same
  silent-drop the mirror was fixed for, on the other direction of the same wire.

  Boards 778:4102 (loading) and 781:4372 (load-error) draw both states, and the
  error copy — "You can keep building from Insert." — is written for exactly
  this: the built-in catalog is a static module array and never fails, so only
  the user's saved templates are missing.
*/
export type TemplateHydrateState = "idle" | "loading" | "error" | "ready";

let hydrateState: TemplateHydrateState = "idle";
const hydrateSubscribers = new Set<() => void>();

function setHydrateState(next: TemplateHydrateState): void {
  if (hydrateState === next) return;
  hydrateState = next;
  for (const cb of hydrateSubscribers) cb();
}

export function getTemplateHydrateState(): TemplateHydrateState {
  return hydrateState;
}

/** Subscribe to hydrate-state changes. Returns an unsubscribe fn. */
export function onTemplateHydrateChange(cb: () => void): () => void {
  hydrateSubscribers.add(cb);
  return () => hydrateSubscribers.delete(cb);
}

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
  // No siteId means the standalone demo, where there is no server to be down.
  // "ready" rather than "error": nothing failed, there was nothing to fetch.
  if (!siteId) { setHydrateState("ready"); return; }
  setHydrateState("loading");
  try {
    const remote = await client().userTemplates.list.query({ siteId });
    if (!remote.length) { setHydrateState("ready"); return; }
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
    setHydrateState("ready");
  } catch (e) {
    setHydrateState("error");
    // eslint-disable-next-line no-console
    console.warn("[template-sync] hydrate from server failed", e);
  }
}
