/**
 * The published page's <head> and <body> injections.
 *
 * A deployed page is not the editor's export verbatim: icons, canonical, robots
 * meta, workspace-app scripts, the analytics beacon and the free-plan badge are
 * all added at publish time from columns the editor never sees. That assembly
 * used to live inside the publish worker route, where nothing could execute it
 * — which is how every page came to carry the SAME canonical URL without a
 * single test noticing.
 *
 * Pure string in, string out. No Prisma, no request context.
 */
import { MARKETING_URL } from "@lib/constants/contact";

/**
 * Inject the first-party analytics beacon into a page's HTML before deploy.
 * The deployed site is cross-origin, so the beacon posts to the dashboard's
 * absolute /api/public/track/<siteId> on load. sendBeacon keeps it
 * fire-and-forget; a per-browser sessionId enables unique-visitor counts.
 * Without this the analytics write path is never triggered and stats stay 0.
 */
export function injectAnalyticsBeacon(html: string, siteId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) return html; // no dashboard URL configured → skip silently
  const url = `${base}/api/public/track/${siteId}`;
  const snippet = `<script>(function(){try{var s=localStorage.getItem("_bk_sid");if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);try{localStorage.setItem("_bk_sid",s)}catch(e){}}var d={path:location.pathname,referrer:document.referrer,sessionId:s,viewportWidth:window.innerWidth};var b=new Blob([JSON.stringify(d)],{type:"application/json"});if(navigator.sendBeacon){navigator.sendBeacon(${JSON.stringify(url)},b)}else{fetch(${JSON.stringify(url)},{method:"POST",body:b,keepalive:true})}}catch(e){}})();</script>`;
  if (html.includes("</body>")) return html.replace("</body>", `${snippet}</body>`);
  return html + snippet;
}

export function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Insert `block` immediately before the document's real </head>.
 *
 * The engine's `escapeStyleText` only escapes `</style` inside global CSS
 * (Composer.ts / ExportEngine.ts) — a literal `</head>` inside a CSS string
 * value or comment (e.g. `content: "</head>"`) reaches this HTML untouched,
 * sitting inside the <style> block that is itself inside <head>, BEFORE the
 * real closing tag. A plain `.replace("</head>", …)` (String.replace matches
 * the FIRST occurrence) would land the injected block inside that <style>
 * block instead of the actual head close. Using the LAST occurrence is safe
 * here because everything after the true </head> is <body>, and body content
 * is serialized through element/attribute encoding that turns "<" into an
 * entity — a raw "</head>" substring cannot occur there.
 */
export function insertBeforeHeadClose(html: string, block: string): string {
  const i = html.lastIndexOf("</head>");
  if (i === -1) return block + html;
  return html.slice(0, i) + block + html.slice(i);
}

/**
 * Inject installed workspace-app head scripts (Live Chat, …) before </head>.
 * `scripts` is prebuilt once per deploy from WorkspaceApp config; empty means
 * nothing installed/configured, so the page is returned untouched.
 */
export function injectWorkspaceApps(html: string, scripts: string): string {
  if (!scripts) return html;
  return insertBeforeHeadClose(html, scripts);
}

/**
 * Inject favicon / apple-touch-icon / og:image into <head>. These were
 * uploaded + stored on the Site row but never reached the deployed HTML
 * (the editor's head builder only emits og:image, and only when the editor
 * config carries it). Injecting server-side from the canonical columns
 * guarantees the icons ship, and skips any tag the page already declares.
 */
export function injectHeadTags(
  html: string,
  icons: { favicon: string | null; touchIcon: string | null; ogImage: string | null },
): string {
  const tags: string[] = [];
  if (icons.favicon && !/<link[^>]+rel=["']?icon/i.test(html)) {
    tags.push(`<link rel="icon" href="${escapeAttr(icons.favicon)}">`);
  }
  if (icons.touchIcon && !/<link[^>]+rel=["']?apple-touch-icon/i.test(html)) {
    tags.push(`<link rel="apple-touch-icon" href="${escapeAttr(icons.touchIcon)}">`);
  }
  if (icons.ogImage && !/<meta[^>]+property=["']?og:image/i.test(html)) {
    tags.push(`<meta property="og:image" content="${escapeAttr(icons.ogImage)}">`);
  }
  if (tags.length === 0) return html;
  return insertBeforeHeadClose(html, tags.join(""));
}

/**
 * Technical SEO (d5) — inject canonical link + robots meta into <head> from the
 * Site's canonical columns. allowIndexing=false emits noindex,nofollow (the
 * staging opt-out). Skips any tag the page already declares.
 *
 * `canonical` is per PAGE. The Site row holds one value, filled by a field
 * labelled "Canonical domain", and stamping it unchanged onto every page told
 * search engines that About, Pricing and Contact were duplicates of the home
 * page — which is how a site loses every page but one from the index.
 */
export function injectSeoTags(
  html: string,
  seo: { canonical: string | null; allowIndexing: boolean },
): string {
  const tags: string[] = [];
  if (seo.canonical && !/<link[^>]+rel=["']?canonical/i.test(html)) {
    tags.push(`<link rel="canonical" href="${escapeAttr(seo.canonical)}">`);
    /* og:url is the same fact for the share card. The editor emits og:title,
       og:description, og:type and og:locale but cannot emit this one — it does
       not know the domain the site will be deployed to. Without it a shared
       link's preview has no address of its own to point at. */
    if (!/<meta[^>]+property=["']?og:url/i.test(html)) {
      tags.push(`<meta property="og:url" content="${escapeAttr(seo.canonical)}">`);
    }
  }
  let out = html;
  if (!seo.allowIndexing) {
    /* The site says "do not index". A page's own robots tag ("Follow links"
       off → nofollow) must not switch that off: it is merged, not obeyed. */
    if (html.match(ROBOTS_META)) out = html.replace(ROBOTS_META, (tag) => robotsTag(siteOffDirectives(tag)));
    else tags.push(robotsTag(["noindex", "nofollow"]));
  }
  if (tags.length === 0) return out;
  return insertBeforeHeadClose(out, tags.join(""));
}

const ROBOTS_META = /<meta\b[^>]*\bname=["']?robots\b[^>]*>/gi;
/** Directives the site's "no indexing" overrides. */
const INDEXING_DIRECTIVES = new Set(["index", "follow", "all", "none", "noindex", "nofollow"]);

const robotsTag = (directives: string[]) => `<meta name="robots" content="${escapeAttr(directives.join(","))}">`;

/** noindex,nofollow plus whatever else the page's own tag asked for (noarchive, …). */
function siteOffDirectives(tag: string): string[] {
  const content = tag.match(/\bcontent=(["'])(.*?)\1/i)?.[2] ?? "";
  const own = content
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d && !INDEXING_DIRECTIVES.has(d));
  return ["noindex", "nofollow", ...new Set(own)];
}

/**
 * Free-plan badge (90-published): a small fixed "Made with Buildrick" pill linking
 * back to the marketing site. Injected only on FREE; paid plans ship clean.
 * Self-contained inline styles so it never depends on the page's CSS.
 */
export function injectBadge(html: string, show: boolean): string {
  if (!show) return html;
  const badge =
    `<a href="${MARKETING_URL}?ref=badge" target="_blank" rel="noopener" ` +
    `style="position:fixed;bottom:12px;right:12px;z-index:2147483647;` +
    `display:inline-flex;align-items:center;gap:6px;padding:6px 10px;` +
    `background:#111;color:#fff;font:500 12px/1 sans-serif;` +
    `border-radius:999px;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.2)">` +
    `Made with Buildrick</a>`;
  if (html.includes("</body>")) return html.replace("</body>", `${badge}</body>`);
  return html + badge;
}
