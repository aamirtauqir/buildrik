/**
 * The published page's head, assembled the way the worker assembles it.
 *
 * This pipeline lived inside the publish worker route, where no test could
 * execute it. That is how a five-page site came to ship five pages all
 * declaring the SAME canonical URL — the standard way to have every page but
 * one dropped from a search index — with a green suite the whole time.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  injectHeadTags,
  injectSeoTags,
  injectBadge,
  injectWorkspaceApps,
} from "../publish-html";
import { pageCanonicalUrl } from "@buildrik/shared/seo/urls";

const page = (title: string) =>
  `<!doctype html><html><head><title>${title}</title></head><body><h1>${title}</h1></body></html>`;

/** The worker's own composition, minus the analytics beacon (env-dependent). */
const publishPage = (
  path: string,
  html: string,
  opts: {
    canonicalDomain?: string | null;
    allowIndexing?: boolean;
    icons?: { favicon: string | null; touchIcon: string | null; ogImage: string | null };
    scripts?: string;
    badge?: boolean;
  } = {},
) =>
  injectBadge(
    injectSeoTags(
      injectHeadTags(
        injectWorkspaceApps(html, opts.scripts ?? ""),
        opts.icons ?? { favicon: null, touchIcon: null, ogImage: null },
      ),
      {
        canonical: pageCanonicalUrl(opts.canonicalDomain ?? null, path),
        allowIndexing: opts.allowIndexing ?? true,
      },
    ),
    opts.badge ?? false,
  );

const canonicalOf = (html: string) =>
  html.match(/<link rel="canonical" href="([^"]+)">/)?.[1] ?? null;

describe("canonical, across a multi-page site", () => {
  const site = [
    { path: "index.html", title: "Home" },
    { path: "about.html", title: "About" },
    { path: "pricing.html", title: "Pricing" },
  ];

  it("gives every page its own canonical, not the site's", () => {
    const out = site.map((p) =>
      canonicalOf(publishPage(p.path, page(p.title), { canonicalDomain: "https://example.com" })),
    );
    expect(out).toEqual([
      "https://example.com/",
      "https://example.com/about.html",
      "https://example.com/pricing.html",
    ]);
    expect(new Set(out).size).toBe(3);
  });

  it("emits no canonical at all when no domain is configured", () => {
    for (const p of site) {
      expect(canonicalOf(publishPage(p.path, page(p.title)))).toBeNull();
    }
  });

  it("never overwrites a canonical the page already declares", () => {
    const declared =
      '<!doctype html><html><head><link rel="canonical" href="https://mine.example/x"></head><body></body></html>';
    expect(canonicalOf(publishPage("about.html", declared, { canonicalDomain: "https://example.com" })))
      .toBe("https://mine.example/x");
  });

  it("gives the share card the page's own address too", () => {
    // The editor emits og:title/description/type/locale but cannot emit og:url
    // — it does not know the deploy domain.
    const html = publishPage("about.html", page("About"), { canonicalDomain: "https://example.com" });
    expect(html).toContain('<meta property="og:url" content="https://example.com/about.html">');
  });

  it("adds no og:url when there is no canonical to point at", () => {
    expect(publishPage("about.html", page("About"))).not.toContain("og:url");
  });

  it("leaves an og:url the page already declares", () => {
    const declared =
      '<!doctype html><html><head><meta property="og:url" content="https://mine.example/x"></head><body></body></html>';
    const out = publishPage("about.html", declared, { canonicalDomain: "https://example.com" });
    expect(out).toContain('content="https://mine.example/x"');
    expect(out).not.toContain('og:url" content="https://example.com');
  });

  it("escapes the href rather than closing the attribute", () => {
    const html = publishPage("a\"b.html", page("X"), { canonicalDomain: "https://example.com" });
    expect(html).not.toMatch(/href="[^"]*"[^>]*"/);
    expect(html).toContain("&quot;");
  });
});

describe("the rest of the head the worker adds", () => {
  it("adds noindex only when indexing is off", () => {
    expect(publishPage("index.html", page("H"), { allowIndexing: false })).toContain(
      '<meta name="robots" content="noindex,nofollow">',
    );
    expect(publishPage("index.html", page("H"), { allowIndexing: true })).not.toContain("noindex");
  });

  /* SEO-2: a page's own robots tag (e.g. "Follow links" off → nofollow) used
     to make the worker skip its noindex, so the page shipped indexable while
     the site's "Allow indexing" was off. */
  it("with indexing off, a page's own robots tag still gets noindex", () => {
    const withOwn = (content: string) =>
      `<!doctype html><html><head><title>A</title><meta name="robots" content="${content}"></head><body></body></html>`;
    const robotsOf = (html: string) => html.match(/<meta name="robots"[^>]*>/g) ?? [];

    const nofollowPage = publishPage("about.html", withOwn("nofollow"), { allowIndexing: false });
    expect(robotsOf(nofollowPage)).toEqual(['<meta name="robots" content="noindex,nofollow">']);

    // The page's other directives survive; an explicit "index" does not.
    const ownDirectives = publishPage("about.html", withOwn("index, follow, noarchive"), { allowIndexing: false });
    expect(robotsOf(ownDirectives)).toEqual(['<meta name="robots" content="noindex,nofollow,noarchive">']);

    // Indexing on: the page's own tag is left exactly as it was.
    expect(robotsOf(publishPage("about.html", withOwn("nofollow"), { allowIndexing: true }))).toEqual([
      '<meta name="robots" content="nofollow">',
    ]);
  });

  it("ships the icons stored on the site row", () => {
    const html = publishPage("index.html", page("H"), {
      icons: { favicon: "/f.ico", touchIcon: "/t.png", ogImage: "https://cdn/og.png" },
    });
    expect(html).toContain('<link rel="icon" href="/f.ico">');
    expect(html).toContain('<link rel="apple-touch-icon" href="/t.png">');
    expect(html).toContain('<meta property="og:image" content="https://cdn/og.png">');
  });

  it("puts everything it adds inside <head>, not after </html>", () => {
    const html = publishPage("about.html", page("A"), {
      canonicalDomain: "example.com",
      icons: { favicon: "/f.ico", touchIcon: null, ogImage: null },
      scripts: "<script>window.chat=1</script>",
    });
    const head = html.slice(html.indexOf("<head>"), html.indexOf("</head>"));
    expect(head).toContain("canonical");
    expect(head).toContain("/f.ico");
    expect(head).toContain("window.chat=1");
  });

  it("adds the free-plan badge to the body, and only on free", () => {
    expect(publishPage("index.html", page("H"), { badge: true })).toContain("Made with Buildrick");
    expect(publishPage("index.html", page("H"), { badge: false })).not.toContain("Made with Buildrick");
  });

  /**
   * escapeStyleText (packages/shared/schemas/element-markup.ts) only escapes
   * `</style` inside global CSS — a literal `</head>` in a CSS string value
   * or comment reaches this HTML untouched, sitting inside the <style> block
   * that is itself inside <head>, BEFORE the real closing tag. A naive
   * `.replace("</head>", …)` (String.replace matches the FIRST occurrence)
   * would land the injected block inside that <style> block instead of at
   * the actual head close.
   */
  it("inserts before the REAL </head>, not a literal one embedded in global CSS", () => {
    const htmlWithCssHeadLiteral =
      `<!doctype html><html><head>` +
      `<style>.x::before{content:"</head>"}</style>` +
      `</head><body><h1>H</h1></body></html>`;

    const out = publishPage("index.html", htmlWithCssHeadLiteral, {
      canonicalDomain: "example.com",
      scripts: "<script>window.chat=1</script>",
    });

    // The injected tags must land after the <style> block's fake "</head>",
    // i.e. right before the tag that actually opens <body>.
    const styleEnd = out.indexOf("</style>") + "</style>".length;
    const bodyStart = out.indexOf("<body>");
    const injected = out.slice(styleEnd, bodyStart);
    expect(injected).toContain("canonical");
    expect(injected).toContain("window.chat=1");
    // And nothing was injected earlier, inside the <style> block.
    const styleBlock = out.slice(out.indexOf("<style>"), styleEnd);
    expect(styleBlock).not.toContain("canonical");
    expect(styleBlock).not.toContain("window.chat=1");
  });
});
