/**
 * Saved-template trash (design-2l9 B6-T16, T24…T33) — the editor's side of
 * `userTemplates.delete` / `userTemplates.trash.*`. A saved template lives in
 * this device's MY_TEMPLATES cache and, mirrored, on the server; deleting it
 * takes it off both, and the server keeps it in "Recently deleted" for 30
 * days. Restore puts the same template (same id) back in the cache.
 *
 * @license BSD-3-Clause
 */
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import { getSiteIdFromUrl } from "./BuildrikSyncProvider";
import { STORAGE_KEYS } from "../shared/constants/storageKeys";
import { readLocalTemplates, type MyTemplateRow } from "./templateSync";
import type { TrashedUserTemplate } from "@buildrik/shared/schemas/user-template";

/* Full `userTemplates.<proc>` chains: the tRPC orphan gate finds callers by
   that dotted path. */
const api = () => getBuildrikClient(DASHBOARD_URL);

export type TemplateTrashResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "no-site" | "not-found" | "forbidden" | "failed"; message: string };

async function run<T>(call: (siteId: string) => Promise<T>): Promise<TemplateTrashResult<T>> {
  const siteId = getSiteIdFromUrl();
  if (!siteId) return { ok: false, reason: "no-site", message: "Recently deleted needs a saved site." };
  try {
    return { ok: true, value: await call(siteId) };
  } catch (e) {
    const err = e as { message?: string; data?: { code?: string } };
    const code = err?.data?.code;
    const reason = code === "NOT_FOUND" ? "not-found" : code === "FORBIDDEN" ? "forbidden" : "failed";
    return { ok: false, reason, message: err?.message ?? "" };
  }
}

function writeLocal(rows: MyTemplateRow[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MY_TEMPLATES, JSON.stringify(rows));
  } catch {
    /* storage full / blocked: the server copy is still the record */
  }
}

export const templateTrash = {
  /** Delete a saved template: off this device's list and, on the server, into
   *  Recently deleted. A refused server delete puts the local row back. */
  async remove(templateId: string): Promise<TemplateTrashResult<null>> {
    const before = readLocalTemplates();
    writeLocal(before.filter((t) => t.id !== templateId));
    if (!getSiteIdFromUrl()) return { ok: true, value: null };
    const r = await run((siteId) => api().userTemplates.delete.mutate({ siteId, templateId }));
    if (!r.ok) {
      writeLocal(before);
      return r;
    }
    return { ok: true, value: null };
  },
  list: (): Promise<TemplateTrashResult<TrashedUserTemplate[]>> =>
    run((siteId) => api().userTemplates.trash.list.query({ siteId })),
  /** Back in the saved templates, the same id; added to this device's list. */
  async restore(templateId: string): Promise<TemplateTrashResult<MyTemplateRow>> {
    const r = await run((siteId) => api().userTemplates.trash.restore.mutate({ siteId, templateId }));
    if (!r.ok) return r;
    const row: MyTemplateRow = {
      id: r.value.templateId,
      name: r.value.name,
      category: r.value.category ?? undefined,
      description: r.value.description ?? undefined,
      html: r.value.html,
      css: r.value.css ?? undefined,
      thumbnail: r.value.thumbnail ?? undefined,
    };
    writeLocal([...readLocalTemplates().filter((t) => t.id !== row.id), row]);
    return { ok: true, value: row };
  },
  purge: (templateId: string, confirmName: string): Promise<TemplateTrashResult<{ success: true }>> =>
    run((siteId) => api().userTemplates.trash.purge.mutate({ siteId, templateId, confirmName })),
};
