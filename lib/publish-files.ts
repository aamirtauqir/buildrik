/**
 * The exact set of files a publish uploads.
 *
 * Assembling it lived inside the publish worker route, where nothing could run
 * it — the same shape of blind spot that let every page ship the same canonical
 * URL under a green suite. A deploy is more than the editor's pages: each one
 * gains icons, canonical, og:url, robots meta, workspace scripts, the analytics
 * beacon and (on Free) the badge, and the set gains robots.txt, sitemap.xml and
 * — since Settings S3 — a vercel.json carrying the site's redirects and
 * response headers, which until then never left the database.
 *
 * Pure: page HTML and site columns in, file list out. No Prisma, no request.
 */
import {
  injectAnalyticsBeacon,
  injectWorkspaceApps,
  injectHeadTags,
  injectSeoTags,
  injectBadge,
} from "@lib/publish-html";
import {
  pageCanonicalUrl,
  buildSitemapXml,
  withSitemapDirective,
} from "@lib/publish-urls";

export interface DeployPage {
  path: string;
  html: string;
}

export interface DeployFile {
  file: string;
  data: string;
}

/** A `Redirect` row, as the Redirects screen wrote it. */
export interface DeployRedirect {
  fromPath: string;
  toUrl: string;
  /** "301" or "302". */
  type: string;
  matchQuery: boolean;
}

/** A `Domain` row: only `kind === "REDIRECT"` rows and the primary matter here. */
export interface DeployDomain {
  domain: string;
  kind: string;
  isPrimary: boolean;
}

/** The Site's Headers-screen columns; each null / blank / 0 means "not set". */
export interface DeployHeaders {
  cspPolicy: string | null;
  hstsMaxAge: number | null;
  xFrameOptions: string | null;
  referrerPolicy: string | null;
  permissionsPolicy: string | null;
}

export interface DeployInputs {
  siteId: string;
  pages: ReadonlyArray<DeployPage>;
  /** The site's own origin, already resolved (see resolveSiteOrigin). */
  origin: string | null;
  icons: { favicon: string | null; touchIcon: string | null; ogImage: string | null };
  canonicalUrl: string | null;
  allowIndexing: boolean;
  robotsTxt: string | null;
  /** Workspace-app head scripts, prebuilt once per deploy. */
  appScripts: string;
  /** Free plan ships the "Made with Buildrick" badge. */
  showBadge: boolean;
  redirects: ReadonlyArray<DeployRedirect>;
  domains: ReadonlyArray<DeployDomain>;
  headers: DeployHeaders;
  /** Injected so a test can pin lastmod; defaults to now. */
  now?: string;
}

interface VercelRedirect {
  source: string;
  destination: string;
  permanent: boolean;
  has?: Array<{ type: "host"; value: string }>;
}

interface VercelConfig {
  redirects?: VercelRedirect[];
  headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
}

/**
 * The deployment's vercel.json — Vercel's own file-based configuration, read
 * on every deployment (docs/project-configuration/vercel-json). Null when the
 * site has nothing to put in it, so a site without rules ships exactly what
 * it shipped before S3.
 *
 * Redirects (verified against the vercel.json reference and
 * @vercel/routing-utils `convertRedirects`, 2026-09-14):
 * - `permanent: true` is a 308, `false` a 307 — the modern, method-preserving
 *   forms of the 301 / 302 the row stores; both are cached / not cached the
 *   way the dialog's copy promises. `statusCode: 301|302` exists for the
 *   literal codes but "cannot be used with `permanent`".
 * - `source` matches the pathname only; the incoming query string is always
 *   forwarded to the destination ("all query strings found in the source path
 *   will be passed to the destination path"). There is no per-rule switch to
 *   drop it — `preserveQueryParams` exists only on the paid bulk-redirects
 *   file — so `matchQuery: false` cannot be honoured here and the row's flag
 *   is a recorded preference, not a deploy difference.
 * - A `REDIRECT`-kind domain becomes a host rule to the primary
 *   (`/(.*)` → `https://<primary>/$1`; `$1` is the capture group Vercel's
 *   proxy substitutes into `Location`). Only when a primary exists, and never
 *   for the primary itself — that would redirect it to itself.
 *
 * Headers apply to every path (`/(.*)`), one entry per column that is set;
 * HSTS is `max-age=<hstsMaxAge>` and only when the age is > 0.
 */
function buildVercelConfig(input: Pick<DeployInputs, "redirects" | "domains" | "headers">): VercelConfig | null {
  const redirects: VercelRedirect[] = input.redirects.map((r) => ({
    source: r.fromPath,
    destination: r.toUrl,
    permanent: r.type === "301",
  }));

  const primary = input.domains.find((d) => d.isPrimary)?.domain ?? null;
  if (primary) {
    for (const d of input.domains) {
      if (d.kind !== "REDIRECT" || d.domain === primary) continue;
      redirects.push({
        source: "/(.*)",
        has: [{ type: "host", value: d.domain }],
        destination: `https://${primary}/$1`,
        permanent: true,
      });
    }
  }

  const h = input.headers;
  const set = (key: string, value: string | null | undefined) =>
    value && value.trim() ? [{ key, value: value.trim() }] : [];
  const headers = [
    ...set("Content-Security-Policy", h.cspPolicy),
    ...((h.hstsMaxAge ?? 0) > 0 ? [{ key: "Strict-Transport-Security", value: `max-age=${h.hstsMaxAge}` }] : []),
    ...set("X-Frame-Options", h.xFrameOptions),
    ...set("Referrer-Policy", h.referrerPolicy),
    ...set("Permissions-Policy", h.permissionsPolicy),
  ];

  if (redirects.length === 0 && headers.length === 0) return null;
  return {
    ...(redirects.length > 0 ? { redirects } : {}),
    ...(headers.length > 0 ? { headers: [{ source: "/(.*)", headers }] } : {}),
  };
}

export function buildDeployFiles(input: DeployInputs): DeployFile[] {
  const files: DeployFile[] = input.pages.map((p) => ({
    file: p.path,
    data: injectBadge(
      injectSeoTags(
        injectHeadTags(
          injectWorkspaceApps(injectAnalyticsBeacon(p.html, input.siteId), input.appScripts),
          input.icons,
        ),
        {
          canonical: pageCanonicalUrl(input.canonicalUrl, p.path),
          allowIndexing: input.allowIndexing,
        },
      ),
      input.showBadge,
    ),
  }));

  // The site's custom rules if set, else a default driven by the indexing
  // toggle — plus the sitemap pointer, unless the author wrote their own.
  const robotsBody = input.robotsTxt?.trim()
    ? input.robotsTxt
    : `User-agent: *\n${input.allowIndexing ? "Allow: /" : "Disallow: /"}\n`;
  files.push({
    file: "robots.txt",
    data: input.allowIndexing ? withSitemapDirective(robotsBody, input.origin) : robotsBody,
  });

  /* No sitemap when indexing is off: a staging site asking to be crawled is the
     opposite of what that switch means. */
  if (input.allowIndexing && input.origin) {
    files.push({ file: "sitemap.xml", data: buildSitemapXml(input.origin, input.pages, input.now) });
  }

  const config = buildVercelConfig(input);
  if (config) files.push({ file: "vercel.json", data: JSON.stringify(config, null, 2) });

  return files;
}
