/**
 * Public hosting domains. Single source of truth — this string was previously
 * hardcoded in ~15 places across the dashboard and editor, which is how it drifted
 * out of sync with the brand.
 *
 * NOTE: this is the domain PUBLISHED SITES are served on. It is deliberately not
 * the dashboard's own origin (`app.buildrick.io`, set via NEXT_PUBLIC_APP_URL).
 */
export const SITE_DOMAIN = "buildrick.app";

/** `my-site.buildrick.app` — the bare host, for display and clipboard copy. */
export const siteHost = (slug: string) => `${slug}.${SITE_DOMAIN}`;

/** `https://my-site.buildrick.app` — the full URL, for links and publishedUrl. */
export const siteUrl = (slug: string) => `https://${siteHost(slug)}`;

/** Host that draft share-links are served from. */
export const PREVIEW_HOST = `preview.${SITE_DOMAIN}`;

/** Host that uploaded assets are served from. */
export const CDN_HOST = `cdn.${SITE_DOMAIN}`;
