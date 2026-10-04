import { pageCanonicalUrl } from "./urls";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * sitemap.xml for a site — the ONE builder: the publish worker
 * (lib/publish-files.ts) and the editor's ZIP export (ExportEngine) both call
 * it with the files they wrote. The editor kept its own SitemapGenerator until
 * 2026-10-04, which built `/<slug>` locs and filtered on page settings.
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
