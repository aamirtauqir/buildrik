/**
 * pageFiles — which pages ship and under what file name. Shared by the
 * export/publish writer, the Publish panel's page count, the content issue
 * scanner, Pages' copy-link and the SEO tab. Split out of ExportEngine
 * (DQ-007): these are facts about a page list, not export steps.
 *
 * @module engine/export/pageFiles
 * @license BSD-3-Clause
 */

import type { PageData } from "@/shared/types";

/**
 * Whether a page is deployed at all.
 *
 * Page settings → Advanced offers Live / Hidden. Anything but unset or "live"
 * is left out of a deploy — including a "password" value stored before
 * Password pages were removed (C4 #26): static hosting cannot ask for a
 * password, and publishing a page the owner believes is protected is the
 * worse mistake.
 *
 * Exported because the Publish panel counts pages too, and a count that does
 * not match what ships is the same lie one layer up: it read "2 pages" for a
 * site with one live page and one hidden.
 */
export function isPageLive(page: PageData): boolean {
  const v = page.settings?.visibility;
  return v === undefined || v === "live";
}

/**
 * The page that becomes `index.html`.
 *
 * `isHome` is not guaranteed: pages arrive from AI generation, template apply,
 * duplication and seeds, and a site can reach publish with the flag on none of
 * them. Falling back to the first page keeps the deployed site answering at its
 * own root, which is the whole point of publishing it.
 */
export function resolveHomePageId(pages: ReadonlyArray<Pick<PageData, "id" | "isHome">>): string | undefined {
  return (pages.find((p) => p.isHome) ?? pages[0])?.id;
}

/**
 * Each page's published file name: the home page is index.html, every other
 * page `<slug>.html`, numbered when two slugs collide. The export writes
 * these files, and a CMS collection's template page is bound by the same
 * name (`pageTemplatePath`, matched against the publish payload's paths by
 * `appendDynamicPagesToPublish`), so both read it from here.
 */
export function pageFileNames(pages: ReadonlyArray<Pick<PageData, "id" | "slug" | "isHome">>): Map<string, string> {
  const homeId = resolveHomePageId(pages);
  const used = new Set<string>(["index.html"]);
  return new Map(
    pages.map((p, index) => {
      if (p.id === homeId) return [p.id, "index.html"];
      const slug = (p.slug ?? "").replace(/^\/+/, "") || `page-${index + 1}`;
      let name = `${slug}.html`;
      for (let n = 2; used.has(name); n++) name = `${slug}-${n}.html`;
      used.add(name);
      return [p.id, name];
    }),
  );
}
