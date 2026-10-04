import { normalizeCanonicalOrigin } from "@buildrik/shared/seo/urls";

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

/** Add the sitemap pointer to robots.txt, unless the author already wrote one. */
export function withSitemapDirective(robotsTxt: string, origin: string | null): string {
  if (!origin || /^\s*sitemap:/im.test(robotsTxt)) return robotsTxt;
  const body = robotsTxt.endsWith("\n") ? robotsTxt : `${robotsTxt}\n`;
  return `${body}\nSitemap: ${origin}/sitemap.xml\n`;
}
