/**
 * Site Settings → Social Links reaches the page.
 *
 * The three URLs were written into project settings by the Site Settings
 * screen and read by nothing at all — not this injector, not the canvas, not
 * the publish path. A site owner filled in Twitter/Facebook/LinkedIn and the
 * values never left the editor. They now ride an Organization `sameAs`, which
 * is what a site-wide social profile means to a search engine.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { SEOInjector } from "../SEOInjector";
import type { PageData, SiteSEO } from "@/shared/types";

const page = { id: "p1", name: "Home", isHome: true, root: { id: "r", type: "container" } } as unknown as PageData;

const ld = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1]),
  );

describe("Organization sameAs", () => {
  it("emits the site's social links", () => {
    const seo: SiteSEO = {
      siteName: "Bella Cucina",
      socialLinks: {
        twitter: "https://twitter.com/bella",
        facebook: "https://facebook.com/bella",
        linkedin: "https://linkedin.com/company/bella",
      },
    };
    const org = ld(new SEOInjector().inject(page, seo)).find((x) => x["@type"] === "Organization");
    expect(org).toBeTruthy();
    expect(org.sameAs).toEqual([
      "https://twitter.com/bella",
      "https://facebook.com/bella",
      "https://linkedin.com/company/bella",
    ]);
    expect(org.name).toBe("Bella Cucina");
  });

  it("emits nothing when no link is set", () => {
    expect(ld(new SEOInjector().inject(page, { siteName: "Bella Cucina" }))).toHaveLength(0);
  });

  it("drops a link that isn't http(s) — this lands inside a script tag", () => {
    const seo = {
      socialLinks: { twitter: "javascript:alert(1)", facebook: "https://facebook.com/ok", linkedin: "" },
    } as unknown as SiteSEO;
    const org = ld(new SEOInjector().inject(page, seo)).find((x) => x["@type"] === "Organization");
    expect(org.sameAs).toEqual(["https://facebook.com/ok"]);
  });

  it("leaves a page's own structured data alone", () => {
    const withData = {
      ...page,
      settings: { seo: { structuredData: { "@type": "Recipe", name: "Ragu" } } },
    } as unknown as PageData;
    const blocks = ld(
      new SEOInjector().inject(withData, { socialLinks: { twitter: "https://twitter.com/bella" } }),
    );
    expect(blocks.map((b) => b["@type"]).sort()).toEqual(["Organization", "Recipe"]);
  });
});
