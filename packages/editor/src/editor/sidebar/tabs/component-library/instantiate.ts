/**
 * instantiateComponentAtSelection — A-15: the exact same algorithm used to
 * live twice (BuildTab's `insertMine` and useComponentsState's
 * `handleInstantiate`): selected element as parent, else the active page
 * root, else "Open a page first to add this component." — same
 * instantiateComponent call, same success/error copy. One source now; each
 * caller keeps its own toast mechanism (BuildTab uses `useToast()` directly,
 * the Components tab queues a `pendingToast` for its own render cycle).
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "../../../../engine";

export type InstantiateResult = "ok" | "no-parent" | "error";

export async function instantiateComponentAtSelection(
  composer: Composer,
  componentId: string,
): Promise<InstantiateResult> {
  let parentId = composer.selection.getSelectedIds()[0];
  if (!parentId) parentId = composer.elements.getActivePage()?.root?.id ?? "";
  if (!parentId) return "no-parent";

  try {
    await composer.components.instantiateComponent(componentId, parentId);
    return "ok";
  } catch {
    return "error";
  }
}
