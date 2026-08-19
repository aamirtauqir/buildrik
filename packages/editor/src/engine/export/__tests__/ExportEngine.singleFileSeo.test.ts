/**
 * One modal, two formats, different fidelity.
 *
 * The ZIP runs the multi-page pipeline and injects a page's SEO. The single
 * HTML file wrote a title and — only when the Options tab had one typed into
 * it — a description, and nothing else. Walked it: Page settings → SEO,
 * typed a description, exported HTML, and the head came down without it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function composerWithSeo(seo: Record<string, unknown>, settings: Record<string, unknown> = {}) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{
      id: "p", name: "Home", slug: "", isHome: true,
      settings: { ...settings, seo },
      root: { id: "root", type: "container" as const, tagName: "div", children: [] },
    }],
  } as never);
  return composer;
}

describe("the single HTML file carries the page's SEO", () => {
  it("writes the description a user set under Page settings", () => {
    const html = new ExportEngine(composerWithSeo({ metaDescription: "Real description." })).generateHTML();
    expect(html).toContain('<meta name="description" content="Real description.">');
  });

  it("writes the Open Graph and Twitter tags too", () => {
    const html = new ExportEngine(
      composerWithSeo({ metaTitle: "Card Title", metaDescription: "Card copy.", ogImage: "https://x.test/i.png" })
    ).generateHTML();
    expect(html).toContain('<meta property="og:title" content="Card Title">');
    expect(html).toContain('<meta property="og:image" content="https://x.test/i.png">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
  });

  it("lets a description typed in the export Options win, and writes it once", () => {
    const html = new ExportEngine(composerWithSeo({ metaDescription: "From the page." }), {
      metaDescription: "From the modal.",
    }).generateHTML();
    expect(html).toContain('content="From the modal."');
    expect(html).not.toContain('name="description" content="From the page."');
    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
  });

  it("escapes what it writes", () => {
    const html = new ExportEngine(composerWithSeo({ metaDescription: '"><script>x()</script>' })).generateHTML();
    expect(html).not.toContain("<script>x()");
  });

  it("says nothing when the page carries no SEO of its own", () => {
    const html = new ExportEngine(composerWithSeo({})).generateHTML();
    expect(html).not.toContain('name="description"');
  });
});
