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
}

/**
 * Make the page: a section holding one element per chosen field, each bound
 * to that field for "this page's record". Opens nothing and links nothing.
 */
export function buildCollectionPage(
  composer: Composer,
  collection: CMSCollection,
  plan: PageFieldPlan[],
  layout: CollectionPageLayout,
): CreatedCollectionPage {
  const name = collectionPageName(collection, layout);
  composer.beginTransaction(`Create ${name}`);
  let page;
  try {
    page = composer.elements.createPage(name);
    const section = composer.elements.createElement("section");
    composer.elements.addElement(section, page.root.id);
    const binds: Array<[string, PageFieldPlan]> = [];
    for (const p of orderedPlan(plan, layout)) {
      const el =
        p.element === "image"
          ? composer.elements.createElement("image", { attributes: { alt: p.field.name } })
          : composer.elements.createElement(p.element, {
              content: `{${p.field.name}}`,
              ...(p.element === "heading" ? { tagName: "h1" } : {}),
            });
      composer.elements.addElement(el, section.getId());
      binds.push([el.getId(), p]);
    }
    composer.endTransaction();
    /* After the page step, one labelled step per binding — what ⌘Z walks back. */
    for (const [id, p] of binds) {
      composer.cms.bindings.bindToField(id, collection.id, undefined, p.field.slug, p.element === "image" ? "src" : "content", undefined, `Bind ${p.field.name}`);
    }
  } catch (e) {
    composer.rollbackTransaction();
    throw e;
  }
  const file = pageFileNames(composer.elements.getAllPages()).get(page.id) ?? `${page.id}.html`;
  return { pageId: page.id, name, file };
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
