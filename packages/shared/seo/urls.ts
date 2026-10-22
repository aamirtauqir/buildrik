/**
 * The absolute URL of one published page — the ONE builder every output uses:
 * `<link rel="canonical">`, og:url and sitemap `<loc>` on the server
 * (lib/publish-files.ts, lib/publish-urls.ts), and the editor's Google preview.
 *
 * Paths come in as the files the export writes (`index.html`, `about.html`,
 * `blog/post/index.html`) and go out as the clean URL the deploy serves for
 * them: the generated vercel.json sets `cleanUrls` (REA #26, SEO plan Q3),
 * under which Vercel serves `about.html` at `/about` and 308-redirects the
 * `.html` form — a canonical, og:url or sitemap entry must never name a
 * redirect.
 */

/** Normalize a user-typed domain: add https:// if absent, drop a trailing slash. */
export function normalizeCanonicalOrigin(domain: string): string | null {
  const trimmed = domain.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    // Only the origin + any base path the user typed; query/hash are meaningless
    // for a canonical domain and would leak onto every page.
    const base = `${url.origin}${url.pathname}`;
    return base.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

/** One row of `siteDetail.domains.list` — the fields the host choice reads. */
export interface SiteDomainRow {
  domain: string;
  status: string;
  isPrimary: boolean;
}

/**
 * The origin the published site's absolute URLs sit on, in the publish
 * worker's order (`resolveSiteOrigin` over `verifiedPrimaryDomain`,
 * lib/publish-files.ts): the typed canonical, else the primary custom domain
 * once it is verified, else where the site was last published; null when
 * nothing is known yet. The editor's robots.txt/sitemap preview and the page
 * drawer's search preview both name their host through this.
 */
export function siteOrigin(
  domains: ReadonlyArray<SiteDomainRow>,
  publishedUrl: string | null | undefined,
  canonicalUrl?: string | null,
): string | null {
  const typed = normalizeCanonicalOrigin(canonicalUrl ?? "");
  if (typed) return typed;
  const primary = domains.find((d) => d.isPrimary && d.status === "VERIFIED");
  if (primary) return `https://${primary.domain}`;
  if (!publishedUrl) return null;
  try {
    return new URL(publishedUrl).origin;
  } catch {
    return null;
  }
}

/**
 * The root-relative URL the deploy serves an exported file at: `index.html` →
 * `/`, `about.html` → `/about`, `blog/post/index.html` → `/blog/post`. Also
 * what the publish export writes for internal links, so a click never takes
 * the `.html` redirect.
 */
export function publicPagePath(path: string): string {
  const file = path.replace(/^\/+/, "");
  return `/${file.replace(/(?:^|\/)index\.html$/, "").replace(/\.html$/, "")}`;
}

/**
 * The canonical URL for one exported page, or null when no domain is set.
 * `index.html` is the site root, so it canonicalizes to the bare origin.
 */
export function pageCanonicalUrl(domain: string | null, path: string): string | null {
  if (!domain) return null;
  const base = normalizeCanonicalOrigin(domain);
  if (!base) return null;
  return `${base}${publicPagePath(path)}`;
}

/**
 * The URL a user is handed for a page (Copy link, the page drawer's search
 * preview). Unlike the canonical, it must open on the deploy that is live
 * NOW: a site last published before cleanUrls shipped serves only the
 * `.html` files, so `/about` is a 404 there until it is republished
 * (BD-39 (4)). `servesCleanUrls` is the server's reading of the live
 * deploy's own vercel.json (`servesCleanUrls`, publish.service).
 */
export function pageLinkUrl(domain: string | null, path: string, servesCleanUrls: boolean): string | null {
  if (servesCleanUrls) return pageCanonicalUrl(domain, path);
  const base = normalizeCanonicalOrigin(domain ?? "");
  if (!base) return null;
  const file = path.replace(/^\/+/, "");
  return file === "index.html" ? `${base}/` : `${base}/${file}`;
}
