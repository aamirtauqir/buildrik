import { normalizeCanonicalOrigin, pageCanonicalUrl } from "@buildrik/shared/seo/urls";

/**
 * Absolute URLs for a published site. Per-page URLs come from
 * `pageCanonicalUrl` (packages/shared/seo/urls.ts) — the one builder the
 * canonical, og:url, sitemap and the editor's search preview all share.
 *
 * The Site row carries ONE `canonicalUrl`, and the field that fills it is
 * labelled "Canonical domain" — "The preferred URL search engines should index
 * (e.g. https://www.example.com)". The publish worker was stamping that single
 * value into every page as `<link rel="canonical">`, so a five-page site told
 * search engines that About, Pricing and Contact were all duplicates of the
 * home page — the standard way to have every page but one dropped from the
 * index.
 *
 * A canonical has to name the page it sits on. Paths come from the editor's
 * multi-page export (`index.html`, `about.html`, `blog/post.html`) and the
 * exported navigation links to those exact names, so the canonical uses them
 * too: the URL a visitor actually lands on.
 */

/**
 * The site's own origin for absolute URLs, in order of what the owner meant:
 * the canonical domain they typed, else a verified custom domain, else the
 * Vercel project the deploy lands on (deterministic from the site slug).
 */
export function resolveSiteOrigin(opts: {
  canonicalUrl: string | null;
  verifiedDomain?: string | null;
  vercelProjectName?: string | null;
}): string | null {
  return (
    normalizeCanonicalOrigin(opts.canonicalUrl ?? "") ??
    normalizeCanonicalOrigin(opts.verifiedDomain ?? "") ??
    (opts.vercelProjectName ? `https://${opts.vercelProjectName}.vercel.app` : null)
  );
}

/**
 * Every origin a published site might actually be reached from — not just
 * the single "preferred" one `resolveSiteOrigin` picks. A site can have a
 * verified custom domain AND still be reachable at its own *.vercel.app
 * project URL, and a custom domain is commonly configured for both the apex
 * and `www` at once. Used to widen an exact-origin check (the form
 * after-submit `_return`/Referer validation in `form-submission.service.ts`)
 * beyond the one origin a canonical or sitemap would use — never itself
 * written into either of those.
 */
export function resolveSiteOrigins(opts: {
  canonicalUrl: string | null;
  verifiedDomain?: string | null;
  vercelProjectName?: string | null;
}): string[] {
  const origins = new Set<string>();
  const addWithWwwCounterpart = (raw: string | null | undefined) => {
    const normalized = normalizeCanonicalOrigin(raw ?? "");
    if (!normalized) return;
    origins.add(normalized);
    const url = new URL(normalized);
    const host = url.hostname;
    const counterpart = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
    origins.add(`${url.protocol}//${counterpart}`);
  };
  addWithWwwCounterpart(opts.canonicalUrl);
  addWithWwwCounterpart(opts.verifiedDomain);
  if (opts.vercelProjectName) origins.add(`https://${opts.vercelProjectName}.vercel.app`);
  return Array.from(origins);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * sitemap.xml for a deployed site.
 *
 * Published sites shipped none, though a SitemapGenerator has existed and been
 * tested in the editor for months — it only ran on the ZIP export, and the
 * publish payload carries pages, so nothing else ever reached the deploy.
 *
 * Entries use the uploaded filenames (about.html), because that is what the
 * deploy serves: the vercel.json we ship (publish-files.ts, Settings S3)
 * carries redirects and headers, not `cleanUrls`, and a sitemap of /about
 * would be a list of 404s. A page carrying its own noindex is left
 * out — a sitemap is a list of pages you want indexed.
 */
export function buildSitemapXml(
  origin: string,
  pages: ReadonlyArray<{ path: string; html?: string }>,
  lastmod?: string,
): string {
  const day = (lastmod ?? new Date().toISOString()).slice(0, 10);
  const entries = pages
    .filter((p) => !/<meta[^>]+name=["']?robots["']?[^>]*content=["'][^"']*noindex/i.test(p.html ?? ""))
    .map((p) => ({ p, loc: pageCanonicalUrl(origin, p.path) }))
    .filter((e): e is { p: { path: string; html?: string }; loc: string } => e.loc !== null)
    .map(
      ({ p, loc }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${day}</lastmod>
    <priority>${p.path.replace(/^\/+/, "") === "index.html" ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

/** Add the sitemap pointer to robots.txt, unless the author already wrote one. */
export function withSitemapDirective(robotsTxt: string, origin: string | null): string {
  if (!origin || /^\s*sitemap:/im.test(robotsTxt)) return robotsTxt;
  const body = robotsTxt.endsWith("\n") ? robotsTxt : `${robotsTxt}\n`;
  return `${body}\nSitemap: ${origin}/sitemap.xml\n`;
}
