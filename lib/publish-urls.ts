/**
 * Absolute URLs for a published site.
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
