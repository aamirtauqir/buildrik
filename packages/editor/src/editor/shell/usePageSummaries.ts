/**
 * usePageSummaries — the shell's one page list (bottom-bar page switcher and
 * the ⌘K "Go to <page>" rows).
 *
 * Read from the same composer list the Pages panel reads (`usePages`), plus
 * two facts the panel does not need in a single row: which pages are CMS
 * collection templates (a collection's `pageTemplatePath` names the page's
 * published file, the binding `DynamicPagesPane` edits) and which pages carry
 * unsaved edits (`useDirtyPages`).
 *
 * Re-synced on page mutations, on a whole-project load (undo, redo and version
 * restore arrive as PROJECT_LOADED only) and on the CMS store's own collection
 * events — a separate emitter from the composer.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { pageFileNames } from "@/engine/export";
import { EVENTS } from "@/shared/constants/events";
import type { CMSCollection, PageData, PageSummary } from "@/shared/types";
import { slugify } from "@shared/utils/helpers/string";
import { useDirtyPages } from "@/editor/shared/useDirtyPages";

/** A page's slug as the Pages panel shows it: stored slug, else derived from
 *  the name, else the id. */
export function pageSlug(page: Pick<PageData, "id" | "name" | "slug">): string {
  return page.slug ?? (page.name ? slugify(page.name) : undefined) ?? page.id;
}

const asPath = (slug: string) => `/${slug.replace(/^\/+/, "")}`;

export function toPageSummaries(
  pages: readonly PageData[],
  collections: readonly CMSCollection[],
  dirty: ReadonlySet<string>,
): PageSummary[] {
  const files = pageFileNames(pages);
  const templateOf = new Map<string, CMSCollection>();
  for (const c of collections) {
    if (c.pageSlugPattern && c.pageTemplatePath) templateOf.set(c.pageTemplatePath, c);
  }
  return pages.map((p) => {
    const collection = templateOf.get(files.get(p.id) ?? "");
    const slug = collection?.pageSlugPattern
      ? asPath(collection.pageSlugPattern)
      : p.isHome
        ? "/"
        : asPath(pageSlug(p));
    return {
      id: p.id,
      name: p.name,
      slug,
      kind: collection ? "template" : "static",
      ...(collection ? { collectionId: collection.id, collectionName: collection.name } : {}),
      isHome: Boolean(p.isHome),
      dirty: dirty.has(p.id),
      depth: collection ? 0 : Math.max(0, slug.split("/").filter(Boolean).length - 1),
    };
  });
}

const CMS_STORE_EVENTS = [
  EVENTS.CMS_STORE_REFRESHED,
  EVENTS.CMS_COLLECTION_CREATED,
  EVENTS.CMS_COLLECTION_UPDATED,
  EVENTS.CMS_COLLECTION_DELETED,
] as const;

export function usePageSummaries(composer: Composer | null): PageSummary[] {
  const [source, setSource] = React.useState<{ pages: PageData[]; collections: CMSCollection[] }>({
    pages: [],
    collections: [],
  });
  const dirty = useDirtyPages(composer);

  React.useEffect(() => {
    if (!composer) {
      setSource({ pages: [], collections: [] });
      return;
    }
    const sync = () =>
      setSource({
        pages: composer.elements.getAllPages(),
        /* Optional: test doubles are commonly a partial composer without a
           CMS manager (a real Composer always has one). */
        collections: composer.cms?.collections.getAllCollections() ?? [],
      });
    const onChange = (payload?: { type?: string }) => {
      if (!payload?.type || payload.type.startsWith("page:")) sync();
    };
    sync();
    composer.on(EVENTS.PROJECT_CHANGED, onChange);
    composer.on(EVENTS.PROJECT_LOADED, sync);
    const store = composer.cms?.collections;
    CMS_STORE_EVENTS.forEach((ev) => store?.on(ev, sync));
    return () => {
      composer.off(EVENTS.PROJECT_CHANGED, onChange);
      composer.off(EVENTS.PROJECT_LOADED, sync);
      CMS_STORE_EVENTS.forEach((ev) => store?.off(ev, sync));
    };
  }, [composer]);

  return React.useMemo(
    () => toPageSummaries(source.pages, source.collections, dirty),
    [source, dirty],
  );
}
