/**
 * createCollectionPage — "Create collection page" (design-2l9 187:20616 …
 * 187:21418): one ordinary page whose elements are bound to the collection's
 * fields, then the collection's link to it (URL pattern + template page) saved
 * and confirmed by the server. Two steps, two outcomes: the page always stays
 * once made; a link the server did not confirm is retried on its own and
 * never makes a second page (187:21035 / 187:21245).
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import { pageFileNames } from "@/engine/export";
import type { CMSCollection, CMSField } from "@/shared/types/cms";
import { consumeDirectSync, markDirectSync, syncCollectionUpsert } from "@/services/cmsSync";
import { cmsSlugField } from "@buildrik/shared/schemas/cms";
import { LAYER_NAME_KEY } from "@/shared/constants/elementTypeLabels";

export type CollectionPageLayout = "Article" | "Profile" | "Simple";
export const COLLECTION_PAGE_LAYOUTS: readonly CollectionPageLayout[] = ["Article", "Profile", "Simple"];

/** What a field becomes on the page ("Portrait · Image", "Name · Heading H1"). */
export interface PageFieldPlan {
  field: CMSField;
  element: "image" | "heading" | "text";
  label: string;
}

const TEXT_TYPES = new Set(["text", "textarea", "number", "date", "datetime", "select", "multiselect", "email", "url", "slug"]);

/** The fields a page element can show, in the collection's order — the
 *  display field as the H1. Booleans, files, references and colours have no
 *  element that shows them, so they are not offered. */
export function pageFieldPlan(collection: CMSCollection): PageFieldPlan[] {
  const display = collection.displayField ?? collection.fields.find((f) => f.type === "text")?.slug;
  return [...collection.fields]
    .sort((a, b) => a.order - b.order)
    .flatMap((field): PageFieldPlan[] => {
      if (field.type === "image") return [{ field, element: "image", label: "Image" }];
      if (field.slug === display) return [{ field, element: "heading", label: "Heading H1" }];
      if (field.type === "richtext") return [{ field, element: "text", label: "Rich text" }];
      if (field.type === "slug") return [];
      return TEXT_TYPES.has(field.type) ? [{ field, element: "text", label: "Text" }] : [];
    });
}

/** "/team/{slug}" — the collection's path under its slug field. */
export function defaultPagePattern(collection: CMSCollection): string {
  const slug = cmsSlugField(collection.fields)?.slug ?? collection.displayField ?? "slug";
  return `/${collection.slug}/{${slug}}`;
}

export function collectionPageName(collection: CMSCollection, layout: CollectionPageLayout): string {
  return `${collection.name} ${layout === "Simple" ? "page" : layout.toLowerCase()}`;
}

/** Article leads with the title, Profile with the image; Simple has none. */
export function orderedPlan(plan: PageFieldPlan[], layout: CollectionPageLayout): PageFieldPlan[] {
  const rank = (p: PageFieldPlan) =>
    layout === "Profile" ? (p.element === "image" ? 0 : p.element === "heading" ? 1 : 2) : p.element === "heading" ? 0 : p.element === "image" ? 1 : 2;
  return plan.filter((p) => layout !== "Simple" || p.element !== "image").sort((a, b) => rank(a) - rank(b));
}

export interface CreatedCollectionPage {
  pageId: string;
  name: string;
  /** The page's published file name — what `pageTemplatePath` stores. */
  file: string;
  /** Reverts the creation step; false once history has moved past it. */
  undo: () => boolean;
}

/**
 * Make the page: a section holding one element per chosen field, each bound
 * to that field for "this page's record" — ONE composer transaction, the
 * bindings applied inside it, so the whole creation is one history step.
 * `undo` reverts exactly that step (and refuses once history has moved on).
 * Opens nothing and links nothing.
 */
export async function buildCollectionPage(
  composer: Composer,
  collection: CMSCollection,
  plan: PageFieldPlan[],
  layout: CollectionPageLayout,
): Promise<CreatedCollectionPage> {
  const name = collectionPageName(collection, layout);
  composer.beginTransaction(`Create ${name}`);
  let page;
  try {
    page = composer.elements.createPage(name);
    /* 187:21418: a section named for the layout; a Profile sets the image
       beside a column of the text, the others stack. Each element carries
       its field's name in Layers. */
    const named = (el: ReturnType<typeof composer.elements.createElement>, label: string) => {
      el.setData(LAYER_NAME_KEY, label);
      return el;
    };
    const section = named(composer.elements.createElement("section"), layout);
    composer.elements.addElement(section, page.root.id);
    const ordered = orderedPlan(plan, layout);
    const sideBySide = layout === "Profile" && ordered.some((p) => p.element === "image");
    let textParent = section.getId();
    if (sideBySide) {
      section.setStyles({ display: "flex", gap: "40px", alignItems: "flex-start" });
    }
    const binds: Promise<void>[] = [];
    for (const p of ordered) {
      const el = named(
        p.element === "image"
          ? composer.elements.createElement("image", { attributes: { alt: p.field.name } })
          : composer.elements.createElement(p.element, {
              content: `{${p.field.name}}`,
              ...(p.element === "heading" ? { tagName: "h1" } : {}),
            }),
        p.field.name,
      );
      if (sideBySide && p.element !== "image" && textParent === section.getId()) {
        const column = named(composer.elements.createElement("container", { styles: { display: "flex", flexDirection: "column", gap: "16px" } }), "Text");
        composer.elements.addElement(column, section.getId());
        textParent = column.getId();
      }
      composer.elements.addElement(el, p.element === "image" ? section.getId() : textParent);
      binds.push(composer.cms.bindings.bindToField(el.getId(), collection.id, undefined, p.field.slug, p.element === "image" ? "src" : "content"));
    }
    /* Applied before the step closes, so the step holds the shown values. */
    await Promise.all(binds);
    composer.endTransaction();
  } catch (e) {
    composer.rollbackTransaction();
    throw e;
  }
  composer.history.flushPending();
  const undo = composer.history.captureUndo();
  const file = pageFileNames(composer.elements.getAllPages()).get(page.id) ?? `${page.id}.html`;
  return { pageId: page.id, name, file, undo };
}

/**
 * Save the collection's link to the page and say whether the SERVER has it
 * (true) or it is only on this device (false). The direct-sync mark keeps the
 * event-driven mirror from POSTing the same write twice.
 */
export async function saveCollectionLink(
  composer: Composer,
  collection: CMSCollection,
  link: { file: string; pattern: string },
): Promise<boolean> {
  markDirectSync("collection", collection.id);
  try {
    const updated = await composer.cms.collections.updateCollection(collection.id, {
      pageTemplatePath: link.file,
      pageSlugPattern: link.pattern,
    });
    return updated ? await syncCollectionUpsert(updated) : false;
  } finally {
    consumeDirectSync("collection", collection.id);
  }
}

/** Retry only the link (187:21245): the collection as it stands, re-sent. */
export async function retryCollectionLink(composer: Composer, collectionId: string): Promise<boolean> {
  const current = composer.cms.collections.getCollection(collectionId);
  return current ? syncCollectionUpsert(current) : false;
}
