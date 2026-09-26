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
