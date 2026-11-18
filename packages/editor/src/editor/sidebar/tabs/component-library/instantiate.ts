/**
 * instantiateComponentAtSelection — A-15: the one insert algorithm for a
 * saved component. It used to live three times (BuildTab's `insertMine`,
 * useComponentsState's `handleInstantiate`, ComponentDetailScreen's Insert):
 * selected element as parent, else the active page root, else "Open a page
 * first to add this component." — one "insert-component" history step, and a
 * null id from the engine (a refused placement) is an error, not "ok".
 *
 * `INSTANTIATE_TOASTS` is the one copy for the outcome. The detail screen
 * carried its own copy of the insert and said nothing on success, so the
 * Components panel's Insert was silent while Add said "Component added to
 * canvas" (verify pass 3). Each caller keeps its own toast mechanism
 * (BuildTab and the detail screen use `useToast()`, the Components tab queues
 * a `pendingToast` for its own render cycle) but reads the words from here.
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";
import type { ToastInput } from "@/editor/chrome-ui";
import type { ComponentDefinition } from "@/shared/types/components";

export type InstantiateResult = "ok" | "no-parent" | "error";

export const INSTANTIATE_TOASTS: Record<InstantiateResult, { description: string; tone: "success" | "warning" | "error" }> = {
  ok: { description: "Component added to canvas", tone: "success" },
  "no-parent": { description: "Open a page first to add this component.", tone: "warning" },
  error: { description: "Couldn't add component. Try again.", tone: "error" },
};

export async function instantiateComponentAtSelection(
  composer: Composer,
  componentId: string,
): Promise<InstantiateResult> {
  let parentId = composer.selection.getSelectedIds()[0];
  if (!parentId) parentId = composer.elements.getActivePage()?.root?.id ?? "";
  if (!parentId) return "no-parent";

  composer.beginTransaction("insert-component");
  try {
    const id = await composer.components.instantiateComponent(componentId, parentId);
    return id ? "ok" : "error";
  } catch {
    return "error";
  } finally {
    composer.endTransaction();
  }
}

export const LIBRARY_TOASTS = {
  gone: { description: "That component is no longer in the library.", tone: "warning" },
  /* A damaged library copy fails the same way every time — retrying won't help. */
  damaged: { description: "This library component is damaged and can't be added.", tone: "error" },
} as const;

type InsertToast = { description: string; tone: "success" | "warning" | "error" };

/**
 * Bring a workspace library master onto this site under its shared id
 * (ComponentManager.adoptLibraryComponent — mirrored as this site's copy,
 * which is what "linked" means), then insert it like a saved one. This site's
 * copy is reused when it already has one. The one path behind Add's FROM
 * LIBRARY rows and the Components area's "Insert on this site" (2L9 215:44300).
 */
export async function insertLibraryComponent(
  composer: Composer,
  componentId: string,
  fetchDefinition: (componentId: string) => Promise<ComponentDefinition | null>,
): Promise<InsertToast> {
  try {
    const existing = composer.components.getComponent(componentId);
    const definition = existing ?? (await fetchDefinition(componentId));
    if (!definition) return LIBRARY_TOASTS.gone;
    const adopted = existing ?? (await composer.components.adoptLibraryComponent(definition));
    return INSTANTIATE_TOASTS[await instantiateComponentAtSelection(composer, adopted.id)];
  } catch (err) {
    const damaged = err instanceof Error && err.message === "LIBRARY_MASTER_MALFORMED";
    return damaged ? LIBRARY_TOASTS.damaged : INSTANTIATE_TOASTS.error;
  }
}

/** Detach one instance — the Inspector's Detach and Layers' "Detach instance"
 *  (2L9 B6-K22) — with the one receipt: "{name} detached" + Undo. */
export async function detachInstanceWithUndo(
  composer: Composer,
  instanceId: string,
  name: string,
): Promise<{ ok: boolean; toast: ToastInput }> {
  try {
    if (await composer.components.detachInstance(instanceId)) {
      return { ok: true, toast: { description: `${name} detached`, tone: "info", action: { label: "Undo", onClick: composer.history.captureUndo() } } };
    }
    return { ok: false, toast: { description: "Couldn't detach this instance. It may already be detached.", tone: "error" } };
  } catch {
    return { ok: false, toast: { description: "Couldn't detach this instance. Try again.", tone: "error" } };
  }
}
