/**
 * FG-011: X metadata follows the shared social values unless the page
 * turned on "Customize for X"; custom values kept while it is off are ignored.
 */
import { describe, it, expect } from "vitest";
import { SEOInjector } from "../SEOInjector";
import type { PageData } from "@/shared/types";

const page = (seo: Record<string, unknown>): PageData =>
  ({ id: "p", name: "About", root: { id: "r", type: "container" }, settings: { seo: { ogTitle: "Shared title", ogDescription: "Shared desc", ogImage: "https://x/og.jpg", ...seo } } }) as PageData;

describe("SEOInjector — X metadata", () => {
  it("not customised: twitter:* = the shared values, even with kept X values", () => {
    const html = new SEOInjector().inject(page({ xCustomized: false, twitterTitle: "X only", twitterImage: "https://x/sq.jpg" }));
    expect(html).toContain('<meta name="twitter:title" content="Shared title">');
    expect(html).toContain('<meta name="twitter:image" content="https://x/og.jpg">');
  });

  it("customised: twitter:* = the X values, falling back per field", () => {
    const html = new SEOInjector().inject(page({ xCustomized: true, twitterTitle: "X only" }));
    expect(html).toContain('<meta name="twitter:title" content="X only">');
    expect(html).toContain('<meta name="twitter:description" content="Shared desc">');
    expect(html).toContain('<meta property="og:title" content="Shared title">');
  });
});
