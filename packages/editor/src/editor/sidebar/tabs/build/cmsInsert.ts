/**
 * The Add panel's CMS inserts (2L9 B5-D37 176:21119, D74 189:21741), one
 * path for both ways in: a row's Enter / Space (CmsAddSection, at the insert
 * target) and a drag onto the canvas (dropOperations, at the drop point —
 * the Add panel is drag-only, owner 2026-11-19).
 *
 *  - a field: the field's element, bound to the page's record;
 *  - "List of {Collection}": a list bound to the collection whose card is
 *    ordinary elements showing the first image, the title and one text field.
 *
 * Each is one history step: the elements and their bindings land together.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import { pageFieldPlan, type PageFieldPlan } from "@/editor/cms/createCollectionPage";
import { LAYER_NAME_KEY } from "@/shared/constants/elementTypeLabels";
import type { CMSCollection } from "@/shared/types/cms";

/** The drag payload: a field row carries its field, a list row none. */
export const CMS_INSERT_MIME = "application/x-buildrik-cms-insert";
export interface CmsInsertPayload {
  collectionId: string;
  fieldSlug?: string;
}

export interface CmsInsertAt {
  parentId: string;
  index?: number;
}

/** The field an inserted image's alt text reads: the collection's display field. */
export function altFieldOf(collection: CMSCollection): CMSCollection["fields"][number] | null {
  return collection.fields.find((f) => f.slug === collection.displayField) ?? null;
}

/** Insert one field's element at `at`; resolves with its id. */
export async function insertCmsField(composer: Composer, collection: CMSCollection, p: PageFieldPlan, at: CmsInsertAt): Promise<string> {
  composer.history?.flushPending?.();
  composer.beginTransaction(`Insert ${p.field.name}`);
  try {
    const el =
      p.element === "image"
        ? composer.elements.createElement("image", { attributes: { alt: p.field.name } })
        : composer.elements.createElement(p.element, { content: `{${p.field.name}}`, ...(p.element === "heading" ? { tagName: "h1" } : {}) });
    el.setData(LAYER_NAME_KEY, p.field.name);
    composer.elements.addElement(el, at.parentId, at.index);
    const id = el.getId();
    await composer.cms.bindings.bindToField(id, collection.id, undefined, p.field.slug, p.element === "image" ? "src" : "content");
    const alt = p.element === "image" ? altFieldOf(collection) : null;
    if (alt) await composer.cms.bindings.bindToField(id, collection.id, undefined, alt.slug, "alt");
    composer.endTransaction();
    return id;
  } catch (e) {
    composer.rollbackTransaction();
    throw e;
  }
}

/** Insert "List of {Collection}" at `at`; resolves with the list's id. */
export async function insertCmsList(composer: Composer, collection: CMSCollection, at: CmsInsertAt): Promise<string> {
  const plan = pageFieldPlan(collection);
  const picks = [
    plan.find((p) => p.element === "image"),
    plan.find((p) => p.element === "heading"),
    plan.find((p) => p.element === "text"),
  ].filter((p): p is PageFieldPlan => !!p);
  composer.history?.flushPending?.();
  composer.beginTransaction(`Insert list of ${collection.name}`);
  try {
    const els = composer.elements;
    const list = els.createElement("collection-list", { styles: { display: "grid", "grid-template-columns": "repeat(3, 1fr)", gap: "24px" } });
    list.setData(LAYER_NAME_KEY, `List of ${collection.name}`);
    const card = els.createElement("container", { styles: { display: "flex", "flex-direction": "column", gap: "8px" } });
    card.setData(LAYER_NAME_KEY, "Card");
    const images: string[] = [];
    for (const p of picks) {
      const child =
        p.element === "image"
          ? els.createElement("image", { attributes: { alt: p.field.name } })
          : els.createElement(p.element === "heading" ? "heading" : "paragraph", {
              content: `{{item.${p.field.slug}}}`,
              ...(p.element === "heading" ? { tagName: "h3" } : {}),
            });
      child.setData(LAYER_NAME_KEY, p.field.name);
      card.addChild(child);
      if (p.element === "image") images.push(child.getId(), p.field.slug);
    }
    list.addChild(card);
    els.addElement(list, at.parentId, at.index);
    const listId = list.getId();
    composer.cms.bindings.bindCollectionList(listId, collection.id);
    /* An image has no text placeholder: its src is a field binding, read per copy. */
    if (images.length) await composer.cms.bindings.bindToField(images[0], collection.id, undefined, images[1], "src");
    composer.endTransaction();
    return listId;
  } catch (e) {
    composer.rollbackTransaction();
    throw e;
  }
}
