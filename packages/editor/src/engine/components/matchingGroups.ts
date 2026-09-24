/**
 * matchingGroups — the Create component board's "Also convert N other
 * matching groups" (4418:142143, C5 G1-098).
 *
 * "Matching" means IDENTICAL apart from element ids: same types, tags,
 * content, styles, classes and attributes, all the way down. Only such a copy
 * can become an instance of the new master with no overrides, so converting
 * it changes nothing on screen — anything looser would silently rewrite a
 * group the user never looked at.
 *
 * The element registry holds the ACTIVE page only, so the scan is that page.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "../Composer";
import type { ElementData } from "../../shared/types";

/** A tree with its ids (and any instance bookkeeping) removed. */
function strip(el: ElementData): unknown {
  const { id: _id, children, data, ...rest } = el as ElementData & { data?: Record<string, unknown> };
  const ownData = data ? Object.fromEntries(Object.entries(data).filter(([k]) => k !== "componentInstance")) : undefined;
  return {
    ...rest,
    ...(ownData && Object.keys(ownData).length ? { data: ownData } : {}),
    children: (children ?? []).map((c) => strip(c as ElementData)),
  };
}

export function structureSignature(el: ElementData): string {
  return JSON.stringify(strip(el));
}

/** Other elements on the active page identical to `elementId`'s tree —
 *  excluding itself, anything inside it, and existing instances. */
export function findMatchingElements(composer: Composer, elementId: string): string[] {
  const source = composer.elements.getElement(elementId);
  const page = composer.elements.getActivePage();
  const root = page?.root?.id ? composer.elements.getElement(page.root.id) : null;
  if (!source || !root) return [];
  const want = structureSignature(source.toJSON());
  const inside = new Set(source.getDescendants().map((d) => d.getId()));
  return root
    .getDescendants()
    .filter(
      (el) =>
        el.getId() !== elementId &&
        !inside.has(el.getId()) &&
        el.getType() === source.getType() &&
        !composer.components?.isInstance(el.getId()) &&
        structureSignature(el.toJSON()) === want,
    )
    .map((el) => el.getId());
}
