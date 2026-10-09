// @vitest-environment jsdom
/**
 * SEOInjector — meta/OG/Twitter tag generation + custom-head injection.
 * Custom head code flows through sanitizeHeadCode (DOMPurify) which needs a
 * DOM global, hence jsdom.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { SEOInjector } from "../SEOInjector";
import type { PageData } from "@/shared/types";

function makePage(overrides: Partial<PageData>): PageData {
  return {
    id: "p1",
    name: "Home",
    root: { id: "root", type: "container" },
    ...overrides,
  };
}

describe("SEOInjector.inject — title resolution", () => {
  it("prefers pageSEO.metaTitle over settings.title and page name", () => {
    const html = new SEOInjector().inject(
      makePage({ settings: { title: "Settings Title", seo: { metaTitle: "SEO Title" } } })
    );
    expect(html).toContain("<title>SEO Title</title>");
  });

  it("falls back to settings.title, then page.name, then 'Untitled'", () => {
    expect(
      new SEOInjector().inject(makePage({ settings: { title: "Settings Title" } }))
    ).toContain("<title>Settings Title</title>");

    expect(new SEOInjector().inject(makePage({ name: "About" }))).toContain(
      "<title>About</title>"
    );

    expect(new SEOInjector().inject(makePage({ name: "" }))).toContain(
      "<title>Untitled</title>"
    );
  });

  it("HTML-escapes the title", () => {
    const html = new SEOInjector().inject(
      makePage({ settings: { seo: { metaTitle: `A & B <"quoted"> 'x'` } } })
    );
    expect(html).toContain(
      "<title>A &amp; B &lt;&quot;quoted&quot;&gt; &#039;x&#039;</title>"
    );
  });
});

describe("SEOInjector.inject — description", () => {
  it("prefers metaDescription over settings.description and escapes it", () => {
    const html = new SEOInjector().inject(
      makePage({
        settings: { description: "fallback", seo: { metaDescription: 'Best "site" ever' } },
      })
    );
    expect(html).toContain('<meta name="description" content="Best &quot;site&quot; ever">');
    expect(html).toContain('<meta property="og:description" content="Best &quot;site&quot; ever">');
    expect(html).toContain('<meta name="twitter:description" content="Best &quot;site&quot; ever">');
  });

  it("omits description/og:description/twitter:description when absent", () => {
    const html = new SEOInjector().inject(makePage({}));
    expect(html).not.toContain('name="description"');
    expect(html).not.toContain("og:description");
    expect(html).not.toContain("twitter:description");
  });
});

describe("SEOInjector.inject — Open Graph + Twitter", () => {
  it("always emits og:type website and og:locale (default en)", () => {
    const html = new SEOInjector().inject(makePage({}));
    expect(html).toContain('<meta property="og:type" content="website">');
    expect(html).toContain('<meta property="og:locale" content="en">');
  });

  it("uses siteSEO.language for og:locale", () => {
    const html = new SEOInjector().inject(makePage({}), { language: "de" });
    expect(html).toContain('<meta property="og:locale" content="de">');
  });

  it("og:title / twitter:title default to the resolved title, ogTitle overrides", () => {
    const html = new SEOInjector().inject(
      makePage({ settings: { seo: { metaTitle: "Meta", ogTitle: "Social Title" } } })
    );
    expect(html).toContain('<meta property="og:title" content="Social Title">');
    expect(html).toContain('<meta name="twitter:title" content="Social Title">');
    expect(html).toContain("<title>Meta</title>");
  });

  it("og:image falls back page ogImage -> siteSEO.defaultOgImage -> omitted", () => {
    const withPage = new SEOInjector().inject(
      makePage({ settings: { seo: { ogImage: "https://cdn.x/page.png" } } }),
      { defaultOgImage: "https://cdn.x/site.png" }
    );
    expect(withPage).toContain('<meta property="og:image" content="https://cdn.x/page.png">');
    expect(withPage).toContain('<meta name="twitter:image" content="https://cdn.x/page.png">');

    const withSite = new SEOInjector().inject(makePage({}), {
      defaultOgImage: "https://cdn.x/site.png",
    });
    expect(withSite).toContain('<meta property="og:image" content="https://cdn.x/site.png">');

    const without = new SEOInjector().inject(makePage({}));
    expect(without).not.toContain("og:image");
    expect(without).not.toContain("twitter:image");
  });

  it("emits og:site_name and twitter:site from siteSEO", () => {
    const html = new SEOInjector().inject(makePage({}), {
      siteName: "Acme & Co",
      twitterHandle: "@acme",
    });
    expect(html).toContain('<meta property="og:site_name" content="Acme &amp; Co">');
    expect(html).toContain('<meta name="twitter:site" content="@acme">');
  });

  it("twitter:card defaults to summary_large_image and honors the override", () => {
    expect(new SEOInjector().inject(makePage({}))).toContain(
      '<meta name="twitter:card" content="summary_large_image">'
    );
    expect(
      new SEOInjector().inject(makePage({ settings: { seo: { twitterCard: "summary" } } }))
    ).toContain('<meta name="twitter:card" content="summary">');
  });

  it("emits favicon link from siteSEO", () => {
    const html = new SEOInjector().inject(makePage({}), { favicon: "/favicon.ico" });
    expect(html).toContain('<link rel="icon" href="/favicon.ico">');
  });
});

describe("SEOInjector.inject — canonical URL", () => {
  it("uses pageSEO.canonicalUrl verbatim when set", () => {
    const html = new SEOInjector().inject(
      makePage({ slug: "about", settings: { seo: { canonicalUrl: "https://canonical.example/x" } } })
    );
    expect(html).toContain('<link rel="canonical" href="https://canonical.example/x">');
    expect(html).toContain('<meta property="og:url" content="https://canonical.example/x">');
  });

  /* The default canonical is the server's (pageCanonicalUrl, from the served
     file path). The editor never invents one from a slug: that produced
     `/about` while the deploy serves `/about.html`. */
  it("omits canonical and og:url when the page has no canonicalUrl of its own", () => {
    const html = new SEOInjector().inject(makePage({ slug: "about" }));
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain("og:url");
  });
});

describe("SEOInjector.inject — robots directives", () => {
  it("emits no robots tag by default", () => {
    expect(new SEOInjector().inject(makePage({}))).not.toContain('name="robots"');
  });

  it("emits noindex / nofollow individually and combined", () => {
    expect(
      new SEOInjector().inject(makePage({ settings: { seo: { noIndex: true } } }))
    ).toContain('<meta name="robots" content="noindex">');

    expect(
      new SEOInjector().inject(makePage({ settings: { seo: { noFollow: true } } }))
    ).toContain('<meta name="robots" content="nofollow">');

    expect(
      new SEOInjector().inject(makePage({ settings: { seo: { noIndex: true, noFollow: true } } }))
    ).toContain('<meta name="robots" content="noindex, nofollow">');
  });
});

describe("SEOInjector.inject — structured data (JSON-LD)", () => {
  it("emits a JSON-LD script for structuredData", () => {
    const html = new SEOInjector().inject(
      makePage({
        settings: { seo: { structuredData: { "@type": "Organization", name: "Acme" } } },
      })
    );
    expect(html).toContain(
      '<script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script>'
    );
  });

  it("escapes </script> inside the JSON-LD payload (no tag breakout)", () => {
    const html = new SEOInjector().inject(
      makePage({
        settings: { seo: { structuredData: { evil: "</script><script>alert(1)</script>" } } },
      })
    );
    expect(html).toContain("<\\/script>");
    // The only literal </script> closers belong to the wrapper, never the payload.
    expect(html).not.toContain("</script><script>alert(1)");
  });
});

describe("SEOInjector.inject — custom head code (sanitizeHeadCode path)", () => {
  it("appends sanitized head code LAST so user tags override defaults", () => {
    const html = new SEOInjector().inject(
      makePage({ settings: { head: '<meta name="theme-color" content="#2D6DFF">' } })
    );
    expect(html).toContain('name="theme-color"');
    const lastTag = html.split("\n  ").pop();
    expect(lastTag).toContain("theme-color");
  });

  it("strips inline <script> bodies from custom head code before injection", () => {
    const html = new SEOInjector().inject(
      makePage({ settings: { head: '<script>alert("xss")</script><meta name="ok" content="1">' } })
    );
    expect(html).not.toContain('alert("xss")');
    expect(html).toContain('name="ok"');
  });

  it("fail-closed: appends nothing when the head code sanitizes to empty", () => {
    const withMalicious = new SEOInjector().inject(
      makePage({ settings: { head: "<script>alert(1)</script>" } })
    );
    const without = new SEOInjector().inject(makePage({}));
    expect(withMalicious).toBe(without);
  });

  it("joins all tags with newline + two-space indent", () => {
    const html = new SEOInjector().inject(makePage({}));
    expect(html.split("\n  ").length).toBeGreaterThan(3);
    expect(html).not.toContain("\n\n");
  });
});


/* Owner decision Q4 (2026-10-04): a page with no title or description of its
   own inherits the site defaults from Settings › SEO › Defaults. Both export
   paths (ZIP + publish) run through `inject`, so this is the one place. */
describe("SEOInjector.inject — site default title/description fallback", () => {
  const SITE = { metaTitle: "Acme Bakery — fresh bread daily", metaDescription: "Sourdough baked every morning in Leeds." };

  it("a page with no description ships the site default description (meta, og, twitter)", () => {
    const html = new SEOInjector().inject(makePage({ name: "About" }), SITE);
    expect(html).toContain('<meta name="description" content="Sourdough baked every morning in Leeds.">');
    expect(html).toContain('<meta property="og:description" content="Sourdough baked every morning in Leeds.">');
    expect(html).toContain('<meta name="twitter:description" content="Sourdough baked every morning in Leeds.">');
  });

  it("a page with no title ships the site default title, ahead of the page name", () => {
    const html = new SEOInjector().inject(makePage({ name: "About" }), SITE);
    expect(html).toContain("<title>Acme Bakery — fresh bread daily</title>");
    expect(html).toContain('<meta property="og:title" content="Acme Bakery — fresh bread daily">');
  });

  it("the page's own title and description still win over the defaults", () => {
    const html = new SEOInjector().inject(
      makePage({ settings: { seo: { metaTitle: "Our story", metaDescription: "Three generations of bakers." } } }),
      SITE
    );
    expect(html).toContain("<title>Our story</title>");
    expect(html).toContain('<meta name="description" content="Three generations of bakers.">');
  });

  it("the site default title is not wrapped in the title template a second time", () => {
    const html = new SEOInjector().inject(makePage({ name: "About" }), {
      ...SITE,
      metaTitleTemplate: "{page_title} | Acme",
    });
    expect(html).toContain("<title>Acme Bakery — fresh bread daily</title>");
  });

  it("without site defaults the page name (through the template) stands, as before", () => {
    const html = new SEOInjector().inject(makePage({ name: "About" }), { metaTitleTemplate: "{page_title} | Acme" });
    expect(html).toContain("<title>About | Acme</title>");
    expect(html).not.toContain('name="description"');
  });
});
