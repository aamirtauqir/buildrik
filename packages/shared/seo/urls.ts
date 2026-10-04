/**
 * The absolute URL of one published page — the ONE builder every output uses:
 * `<link rel="canonical">`, og:url and sitemap `<loc>` on the server
 * (lib/publish-files.ts, lib/publish-urls.ts), and the editor's Google preview.
 *
 * Paths are the files the export writes (`index.html`, `about.html`,
 * `blog/post.html`), because that is what the deploy serves today: the
 * generated vercel.json carries no `cleanUrls`. When the cleanUrls ticket
 * lands, this function changes and every output moves with it.
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

/**
 * The canonical URL for one exported page, or null when no domain is set.
 * `index.html` is the site root, so it canonicalizes to the bare origin.
 */
export function pageCanonicalUrl(domain: string | null, path: string): string | null {
  if (!domain) return null;
  const base = normalizeCanonicalOrigin(domain);
  if (!base) return null;
  const clean = path.replace(/^\/+/, "");
  if (clean === "index.html" || clean === "") return `${base}/`;
  return `${base}/${clean}`;
}
