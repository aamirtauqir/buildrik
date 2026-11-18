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
import { findItemFieldRefs } from "@/engine/cms/CMSBindingManager";
import { pageFileNames } from "@/engine/export";

export interface FieldUse {
  label: string;
  /** Set for an element binding — the lock dialog's "Open the binding". */
  elementId?: string;
}

/** The element's name as Layers shows it — its custom layer name, else its
 *  type. Not its text: a bound element's text IS the field's value, so the
 *  column would read "Margherita" for a heading bound to Name. */
function layerLabel(composer: Composer, elementId: string): string {
  const el = composer.elements.getElement(elementId);
  if (!el) return elementId;
  const type = el.getType?.() ?? "element";
  return getLayerName(el) ?? elementTypeLabel(type);
}

/* 165:3173 — an exact usage: "{page} · {parent} / {element}" ("Blog post ·
   Heading / Text"), the parent left out when the element sits at the page
   root. */
function usedByLabel(composer: Composer, elementId: string): string {
  const el = composer.elements.getElement(elementId);
  const own = layerLabel(composer, elementId);
  if (!el) return own;
  let top = el;
  while (top.getParent?.()) top = top.getParent!()!;
  const page = composer.elements.getAllPages?.().find((p) => p.root?.id === top.getId());
  const parent = el.getParent?.();
  const path = parent && parent.getId() !== top.getId() ? `${layerLabel(composer, parent.getId())} / ${own}` : own;
  return page ? `${page.name} · ${path}` : path;
}

/** The collection page's name, for "{page} · SEO title pattern". */
function templateName(composer: Composer | null, collection: CMSCollection): string {
  if (!composer || !collection.pageTemplatePath) return "Dynamic pages";
  const pages = composer.elements.getAllPages?.() ?? [];
  const id = [...pageFileNames(pages).entries()].find(([, file]) => file === collection.pageTemplatePath)?.[0];
  return pages.find((p) => p.id === id)?.name ?? "Dynamic pages";
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
    /* A Collection-bound repeater/list never registers a field-level binding
       above — its records fill in `{{item.<field>}}` placeholders on the
       template element (`repeat: "self"`) or its children (`repeat:
       "children"`, the Collection list). Without this, deleting a field
       still referenced by one of those templates passed the "unbound" path
       in DeleteFieldDialog and silently broke the repeat (fallback/blank on
       every record) instead of being locked. */
    for (const cb of composer.cms.bindings.getAllCollectionBindings?.() ?? []) {
      if (cb.collectionId !== collection.id) continue;
      const root = composer.elements.getElement(cb.elementId);
      if (!root) continue;
      const templates = cb.repeat === "children" ? root.getDescendants?.() ?? [] : [root];
      for (const el of templates) {
        for (const slug of findItemFieldRefs(el.getContent?.() ?? "")) {
          if (collection.fields.some((f) => f.slug === slug)) {
            add(slug, { label: usedByLabel(composer, cb.elementId), elementId: cb.elementId });
          }
        }
      }
    }
  }
  /* The collection's own patterns name fields as {slug} too: the URL and
     each generated page's <title> / description (and og: tags from them). */
  const page = templateName(composer, collection);
  const patterns: Array<[string | undefined, string]> = [
    [collection.pageSlugPattern, "URL pattern"],
    [collection.pageSeoTitle, "SEO title pattern"],
    [collection.pageSeoDescription, "SEO description pattern"],
  ];
  for (const [pattern, what] of patterns) {
    for (const m of (pattern ?? "").matchAll(/\{([a-zA-Z0-9_-]+)\}/g)) {
      if (collection.fields.some((f) => f.slug === m[1])) add(m[1], { label: `${page} · ${what}` });
    }
  }
  return uses;
}
