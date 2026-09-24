/**
 * Where a placement actually lands — the engine side of the canvas drop's
 * nesting rule (shared/utils/nesting/placement.ts). The engine's own writes
 * used to skip it, and a heading saved inside a heading is hoisted out by the
 * browser when the canvas renders, so the model and the DOM disagree (walk,
 * /edit/:id, 2026-09-24). An illegal child goes right after the parent that
 * refuses it — climbing while that parent's parent refuses it too — which is
 * where the browser would render it. Null when no ancestor takes it.
 *
 * @license BSD-3-Clause
 */

import { engineMayPlaceInside } from "../../../shared/utils/nesting";
import type { Element } from "../Element";

export function resolvePlacement(
  child: Element,
  parent: Element,
  index?: number,
): { parent: Element; index?: number } | null {
  let target = parent;
  let at = index;
  while (!engineMayPlaceInside(child.getType(), target.getType())) {
    const up = target.getParent();
    if (!up) return null;
    at = up.getChildIndex(target) + 1;
    target = up;
  }
  return { parent: target, index: at };
}
