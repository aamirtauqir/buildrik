/**
 * What uses each field of a collection — the Fields table's USED BY column
 * (4428:147552) and the delete lock (4418:165439). Two things depend on a
 * field: an element bound to it (`cms.bindings`, keyed by element) and the
 * collection's own URL pattern, which names fields as {slug} and would
 * resolve to "" for every record once the field is gone.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import type { CMSCollection } from "@/shared/types/cms";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";

export interface FieldUse {
  label: string;
  /** Set for an element binding — the lock dialog's "Open the binding". */
  elementId?: string;
}

/** The element's name as Layers shows it — its custom layer name, else its
 *  type. Not its text: a bound element's text IS the field's value, so the
 *  column would read "Margherita" for a heading bound to Name. */
function usedByLabel(composer: Composer, elementId: string): string {
  const el = composer.elements.getElement(elementId);
  if (!el) return elementId;
  const type = el.getType?.() ?? "element";
  return getLayerName(el) ?? elementTypeLabel(type);
}

export function fieldUsage(composer: Composer | null, collection: CMSCollection): Map<string, FieldUse[]> {
  const uses = new Map<string, FieldUse[]>();
  const add = (slug: string, use: FieldUse) => {
    const list = uses.get(slug) ?? [];
    if (!list.some((u) => u.label === use.label && u.elementId === use.elementId)) list.push(use);
    uses.set(slug, list);
  };
  if (composer) {
    for (const [elementId, bindings] of Object.entries(composer.cms.bindings.export())) {
      for (const b of bindings) {
        if (b.collectionId === collection.id) add(b.fieldSlug, { label: usedByLabel(composer, elementId), elementId });
      }
    }
  }
  for (const m of (collection.pageSlugPattern ?? "").matchAll(/\{([a-zA-Z0-9_-]+)\}/g)) {
    add(m[1], { label: "Dynamic pages" });
  }
  return uses;
}
