/**
 * The <title> a page ships with — the ONE resolver. The editor's export
 * (SEOInjector), the drawer's previews and placeholder, and the server's
 * pre-publish check (publish.service) all call it, so the string a person
 * previews is the string the check inspects and the string that ships.
 *
 * Owner order (L3-036, 2026-10-10): the page's own SEO title, verbatim → the
 * site title template applied to the page title → the page title. The site
 * default title (Settings › SEO › Defaults) is the HOME page's fallback only,
 * after its own SEO title and before the template (plan Q3).
 */

export type TitleSource = "page-seo" | "home-default" | "template" | "page-name";

export interface TitleSiteInput {
  metaTitle?: string | null;
  metaTitleTemplate?: string | null;
  siteName?: string | null;
}

export interface TitleInput {
  /** Stored pages can lack a name; the fallback is "Untitled". */
  pageName?: string | null;
  isHome: boolean;
  /** The page's own SEO title (`settings.seo.metaTitle`). */
  seoTitle?: string | null;
  /** The legacy `settings.title`, treated as the page's own title. */
  settingsTitle?: string | null;
  site: TitleSiteInput;
}

/**
 * Fill a title template. A template without `{page_title}` would give every
 * page the same title, which is never what the field is for, so it is ignored.
 */
export function applyTitleTemplate(title: string, template?: string | null, siteName?: string | null): string {
  const t = template?.trim();
  if (!t || !t.includes("{page_title}")) return title;
  return t.replace(/\{page_title\}/g, title).replace(/\{site_name\}/g, siteName ?? "").trim();
}

export function resolveEmittedTitle(input: TitleInput): { title: string; source: TitleSource } {
  const own = input.seoTitle?.trim() || input.settingsTitle?.trim();
  if (own) return { title: own, source: "page-seo" };
  const homeDefault = input.isHome ? input.site.metaTitle?.trim() : "";
  if (homeDefault) return { title: homeDefault, source: "home-default" };
  const name = input.pageName?.trim() || "Untitled";
  const templated = applyTitleTemplate(name, input.site.metaTitleTemplate, input.site.siteName);
  return templated !== name ? { title: templated, source: "template" } : { title: name, source: "page-name" };
}

/** Search results show roughly this many characters of a title; past it a title may be cut off. */
export const TITLE_MAX_CHARS = 60;

export type TitleFindingKind = "empty" | "untitled" | "too-long" | "duplicate";

export interface TitleFinding {
  pageId: string;
  kind: TitleFindingKind;
  message: string;
}

/**
 * What is wrong with the titles a publish will emit (L3-036) — one finding
 * per page and problem, over pages search engines may index. The titles are
 * the emitted ones (`resolveEmittedTitle`); `noIndex` pages are skipped.
 */
export function titleFindings(
  pages: ReadonlyArray<{ id: string; name: string; title: string; noIndex: boolean }>,
): TitleFinding[] {
  const indexable = pages.filter((p) => !p.noIndex);
  const findings: TitleFinding[] = [];
  const byKey = new Map<string, typeof indexable>();
  for (const p of indexable) {
    const title = p.title.trim();
    if (!title) {
      findings.push({ pageId: p.id, kind: "empty", message: `"${p.name}" has no title.` });
      continue;
    }
    if (title === "Untitled") {
      findings.push({ pageId: p.id, kind: "untitled", message: `"${p.name}" ships as "Untitled".` });
    } else if (title.length > TITLE_MAX_CHARS) {
      findings.push({
        pageId: p.id,
        kind: "too-long",
        message: `"${p.name}"'s title is ${title.length} characters and may be cut off in search results.`,
      });
    }
    const key = title.toLowerCase().replace(/\s+/g, " ");
    byKey.set(key, [...(byKey.get(key) ?? []), p]);
  }
  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    const message = `${group.length} pages share the title "${group[0].title.trim()}": ${group.map((p) => p.name).join(", ")}.`;
    for (const p of group) findings.push({ pageId: p.id, kind: "duplicate", message });
  }
  return findings;
}
