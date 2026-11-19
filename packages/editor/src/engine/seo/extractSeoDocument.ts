/**
 * Composer page → `SeoDocument` (packages/shared/seo/document.ts), the input
 * of the shared SEO and readability checks. The drawer's live findings, the
 * Pages dots and the Settings overview all build their documents here, so
 * they agree.
 *
 * A `draft` overlays the drawer's staged edits (FG-012: nothing is saved
 * until Save), so findings follow what the person is typing.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "../Composer";
import type { PageData } from "@/shared/types";
import type { ContentElement } from "@buildrik/shared/content/contentIssues";
import { seoBlocksFromContent, type SeoDocument } from "@buildrik/shared/seo/document";
import { resolveEmittedTitle } from "@buildrik/shared/seo/titles";
import type { SeoContext } from "@buildrik/shared/seo/analysis";
import { resolvePageDescription } from "../export/SEOInjector";
import { isPageLive, pageFileNames } from "../export/pageFiles";

export interface SeoDraft {
  seoTitle?: string;
  seoDesc?: string;
  slug?: string;
  keyphrase?: string;
  noIndex?: boolean;
}

function siteVariableResolver(composer: Composer): (s: string) => string {
  const vars = composer.getProjectSettings?.()?.siteVariables ?? [];
  if (vars.length === 0) return (s) => s;
  const byKey = new Map(vars.map((v) => [v.key, v.value]));
  return (s) => s.replace(/\{\{\s*site\.([a-zA-Z][\w-]*)\s*\}\}/g, (m, key: string) => byKey.get(key) ?? m);
}

function emittedTitle(composer: Composer, page: PageData, draft: SeoDraft = {}): ReturnType<typeof resolveEmittedTitle> {
  const site = composer.getProjectSettings?.()?.seo;
  return resolveEmittedTitle({
    pageName: page.name,
    isHome: page.isHome === true,
    seoTitle: draft.seoTitle ?? page.settings?.seo?.metaTitle,
    settingsTitle: page.settings?.title,
    site: { metaTitle: site?.metaTitle, metaTitleTemplate: site?.metaTitleTemplate, siteName: site?.siteName },
  });
}

export function extractSeoDocument(composer: Composer, pageId: string, draft: SeoDraft = {}): SeoDocument | null {
  const pages = composer.elements.exportPages();
  const page = pages.find((p) => p.id === pageId);
  if (!page) return null;
  const site = composer.getProjectSettings?.()?.seo;
  const seo = page.settings?.seo;
  const title = emittedTitle(composer, page, draft);
  const boundIds = new Set(Object.keys(composer.cms?.bindings?.export?.() ?? {}));
  const files = pageFileNames(pages.map((p) => (p.id === pageId && draft.slug !== undefined ? { ...p, slug: draft.slug } : p)));
  return {
    title: title.title,
    titleSource: title.source,
    description: resolvePageDescription({ metaDescription: draft.seoDesc ?? seo?.metaDescription }, page.settings, site),
    slugFile: files.get(pageId) ?? "index.html",
    keyphrase: (draft.keyphrase ?? seo?.focusKeyphrase)?.trim() || undefined,
    locale: site?.language?.trim() || "en",
    noIndex: draft.noIndex ?? seo?.noIndex === true,
    blocks: seoBlocksFromContent(page.root as ContentElement | undefined, { boundIds, resolveText: siteVariableResolver(composer) }),
  };
}

/** The site's other live pages, for title and keyphrase uniqueness. */
export function seoContextFor(composer: Composer, pageId: string): SeoContext {
  return {
    otherPages: composer.elements
      .exportPages()
      .filter((p) => p.id !== pageId && isPageLive(p) && p.settings?.seo?.noIndex !== true)
      .map((p) => ({ id: p.id, name: p.name, title: emittedTitle(composer, p).title, keyphrase: p.settings?.seo?.focusKeyphrase })),
  };
}
