/**
 * html/seo — meta-tag + JSON-LD generation.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  generateMetaTags,
  generateJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
} from "../seo";

describe("generateMetaTags", () => {
  it("returns an empty string for an empty config", () => {
    expect(generateMetaTags({})).toBe("");
  });

  it("emits charset/viewport/title/description", () => {
    const out = generateMetaTags({
      charset: "utf-8",
      viewport: "width=device-width",
      title: "Home",
      description: "desc",
    });
    expect(out).toContain('<meta charset="utf-8">');
    expect(out).toContain('name="viewport"');
    expect(out).toContain("<title>Home</title>");
    expect(out).toContain('name="description" content="desc"');
  });

  it("joins keywords with a comma", () => {
    const out = generateMetaTags({ keywords: ["a", "b", "c"] });
    expect(out).toContain('content="a, b, c"');
  });

  it("skips keywords when the array is empty", () => {
    expect(generateMetaTags({ keywords: [] })).toBe("");
  });

  it("escapes attribute values (XSS-safe meta)", () => {
    const out = generateMetaTags({ description: '"><script>alert(1)</script>' });
    expect(out).not.toContain("<script>");
    expect(out).toContain("&quot;");
  });

  it("escapes the title as HTML content", () => {
    const out = generateMetaTags({ title: "A & B < C" });
    expect(out).toContain("<title>A &amp; B &lt; C</title>");
  });

  it("emits the full Open Graph + Twitter set", () => {
    const out = generateMetaTags({
      author: "Me",
      robots: "index",
      canonical: "https://x.test",
      themeColor: "#2D6DFF",
      ogTitle: "ogt",
      ogDescription: "ogd",
      ogImage: "ogi",
      ogUrl: "ogu",
      ogType: "website",
      ogSiteName: "site",
      twitterCard: "summary",
      twitterTitle: "tt",
      twitterDescription: "td",
      twitterImage: "ti",
      twitterSite: "@s",
      twitterCreator: "@c",
    });
    expect(out).toContain('name="author" content="Me"');
    // escapeAttr escapes "/" → &#47;, so slashes in URLs come out encoded.
    expect(out).toContain('rel="canonical" href="https:&#47;&#47;x.test"');
    expect(out).toContain('property="og:title" content="ogt"');
    expect(out).toContain('property="og:site_name" content="site"');
    expect(out).toContain('name="twitter:card" content="summary"');
    expect(out).toContain('name="twitter:creator" content="@c"');
  });
});

describe("generateJsonLd", () => {
  it("wraps data in a schema.org LD+JSON script", () => {
    const out = generateJsonLd("Product", { name: "Widget" });
    expect(out).toContain('<script type="application/ld+json">');
    const json = JSON.parse(out.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, ""));
    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("Product");
    expect(json.name).toBe("Widget");
  });
});

describe("generateBreadcrumbJsonLd", () => {
  it("builds a positioned ItemList", () => {
    const out = generateBreadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: "Blog", url: "/blog" },
    ]);
    const json = JSON.parse(out.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, ""));
    expect(json["@type"]).toBe("BreadcrumbList");
    expect(json.itemListElement).toHaveLength(2);
    expect(json.itemListElement[0]).toMatchObject({ position: 1, name: "Home", item: "/" });
    expect(json.itemListElement[1].position).toBe(2);
  });
});

describe("generateFaqJsonLd", () => {
  it("maps each Q/A into Question/Answer nodes", () => {
    const out = generateFaqJsonLd([{ question: "Q1?", answer: "A1" }]);
    const json = JSON.parse(out.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, ""));
    expect(json["@type"]).toBe("FAQPage");
    expect(json.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "Q1?",
      acceptedAnswer: { "@type": "Answer", text: "A1" },
    });
  });
});
