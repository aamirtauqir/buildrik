/**
 * Site Settings → Social Links reaches the page — all six networks.
 *
 * The three URLs were written into project settings by the Site Settings
 * screen and read by nothing at all — not this injector, not the canvas, not
 * the publish path. A site owner filled in Twitter/Facebook/LinkedIn and the
 * values never left the editor. They now ride an Organization `sameAs`, which
 * is what a site-wide social profile means to a search engine.
 *
 * @license BSD-3-Clause
 */
import { beforeAll, describe, expect, it } from "vitest";
import { SEOInjector } from "../SEOInjector";
import { Composer } from "@/engine/Composer";
import { ExportEngine } from "../ExportEngine";
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

  it("emits all six networks the Settings screen offers, in its order (Q-B9)", () => {
    const seo: SiteSEO = {
      socialLinks: {
        github: "https://github.com/bella",
        youtube: "https://youtube.com/@bella",
        instagram: "https://instagram.com/bella",
        linkedin: "https://linkedin.com/company/bella",
        facebook: "https://facebook.com/bella",
        twitter: "https://x.com/bella",
      },
    };
    const org = ld(new SEOInjector().inject(page, seo)).find((x) => x["@type"] === "Organization");
    expect(org.sameAs).toEqual([
      "https://x.com/bella",
      "https://facebook.com/bella",
      "https://linkedin.com/company/bella",
      "https://instagram.com/bella",
      "https://youtube.com/@bella",
      "https://github.com/bella",
    ]);
  });

  it("an Instagram-only site still gets its Organization", () => {
    const org = ld(new SEOInjector().inject(page, { socialLinks: { instagram: "https://instagram.com/bella" } })).find(
      (x) => x["@type"] === "Organization",
    );
    expect(org.sameAs).toEqual(["https://instagram.com/bella"]);
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

describe("the exported page carries every social profile (ExportEngine)", () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.getContext = (() => ({
      drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
      putImageData: () => {}, clearRect: () => {},
    })) as unknown as HTMLCanvasElement["getContext"];
    (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
  });

  it("an Instagram, YouTube and GitHub profile set in Settings reach the exported head", () => {
    const composer = new Composer({} as never);
    composer.importProject({
      pages: [{ id: "p", name: "Home", slug: "", isHome: true, root: { id: "root", type: "container" as const, tagName: "div", children: [] } }],
    } as never);
    composer.setProjectSettings({
      ...composer.getProjectSettings(),
      seo: {
        siteName: "Bella Cucina",
        socialLinks: {
          twitter: "https://x.com/bella",
          instagram: "https://instagram.com/bella",
          youtube: "https://youtube.com/@bella",
          github: "https://github.com/bella",
        },
      },
    });
    const org = ld(new ExportEngine(composer).generateHTML()).find((x) => x["@type"] === "Organization");
    expect(org.sameAs).toEqual([
      "https://x.com/bella",
      "https://instagram.com/bella",
      "https://youtube.com/@bella",
      "https://github.com/bella",
    ]);
  });
});
