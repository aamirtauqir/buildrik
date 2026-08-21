/**
 * The exact set of files a publish uploads.
 *
 * Assembling it lived inside the publish worker route, where nothing could run
 * it — the same shape of blind spot that let every page ship the same canonical
 * URL under a green suite. A deploy is more than the editor's pages: each one
 * gains icons, canonical, og:url, robots meta, workspace scripts, the analytics
 * beacon and (on Free) the badge, and the set gains robots.txt and sitemap.xml.
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
  /** Injected so a test can pin lastmod; defaults to now. */
  now?: string;
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

  return files;
}
