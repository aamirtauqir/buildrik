/**
 * One page, everything a user can set on it, and the published HTML that
 * carries it.
 *
 * Eight things were found missing from an export or a publish in a single day
 * — the page's title, its SEO, its fonts and their stylesheet link, its
 * per-breakpoint hides, its breakpoint styles, its internal links, the site's
 * custom code and analytics, and the keyframes behind its animations. Each was
 * fixed where it broke and tested there. This is the one place that asks for
 * all of them at once, so the ninth is a failing test rather than a walk.
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

function fullSite() {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      {
        id: "home", name: "Home", slug: "", isHome: true,
        settings: {
          head: '<meta name="from-page-head" content="1">',
          seo: { metaTitle: "Their Title", metaDescription: "Their description.", noIndex: true },
        },
        root: {
          id: "root", type: "container" as const, tagName: "div",
          children: [
            { id: "h", type: "heading" as const, tagName: "h1", content: "Hi",
              styles: { "font-family": "'Poppins', sans-serif", "--hide-mobile": "true" }, children: [] },
            { id: "a", type: "paragraph" as const, tagName: "p", content: "fade",
              styles: { animation: "bd-anim-fadeIn 600ms ease both" }, children: [] },
            { id: "lnk", type: "link" as const, tagName: "a", content: "About",
              attributes: { href: "#page:about" }, children: [] },
          ],
        },
      },
      { id: "about", name: "About", slug: "about",
        root: { id: "r2", type: "container" as const, tagName: "div", children: [] } },
      { id: "secret", name: "Secret", slug: "secret", settings: { visibility: "hidden" },
        root: { id: "r3", type: "container" as const, tagName: "div", children: [] } },
    ],
  } as never);
  composer.setProjectSettings({
    ...composer.getProjectSettings(),
    designTokens: [
      { id: "font-body", name: "font-body", value: "Verdana", cssVar: "--buildrick-design-font-body", category: "typography", type: "string" },
      { id: "color-text", name: "color-text", value: "#334155", cssVar: "--buildrick-design-color-text", category: "colors", type: "color" },
    ],
    customCode: { headScripts: '<script src="https://plausible.io/js/script.js"></script>' },
    analytics: { googleAnalytics: { enabled: true, measurementId: "G-FULLSITE" } },
  } as never);
  composer.styles.setBreakpointStyle("h", "mobile", { "font-size": "22px" });
  return composer;
}

describe("the published page carries everything the user set", () => {
  let files: Array<{ name: string; content: string }>;
  let home = "";
  let css = "";

  beforeAll(async () => {
    files = (await new ExportEngine(fullSite()).exportAllPages({ format: "html" })).files;
    home = files.find((f) => f.name === "index.html")?.content ?? "";
    css = files.find((f) => f.name === "styles.css")?.content ?? "";
  });

  it("the page's own title, not the exporter's brand name", () => {
    expect(home).toContain("<title>Their Title</title>");
    expect(home).not.toContain("Buildrick Export");
  });

  it("its description and social tags", () => {
    expect(home).toContain('content="Their description."');
    expect(home).toContain('property="og:title"');
  });

  it("its indexing choice", () => {
    expect(home).toContain('name="robots" content="noindex"');
  });

  it("its own head code", () => {
    expect(home).toContain("from-page-head");
  });

  it("the site's custom head script and analytics", () => {
    expect(home).toContain("plausible.io/js/script.js");
    expect(home).toContain("G-FULLSITE");
  });

  it("the fonts it names, and the request that fetches them", () => {
    // The body rule carries the site's text colour alongside its font, so
    // assert the parts rather than one exact string.
    expect(css).toMatch(/body\{[^}]*font-family:Verdana,sans-serif/);
    expect(home).toContain("fonts.googleapis.com/css2?");
    expect(home).toContain("family=Poppins");
  });

  it("its per-breakpoint hide and its breakpoint styles", () => {
    expect(css).toContain("@media (max-width:767px)");
    expect(css).toContain("display:none!important");
    expect(css).toMatch(/@media[^{]*\{[^}]*font-size/);
  });

  it("the keyframes its animation references", () => {
    expect(css).toContain("@keyframes bd-anim-fadeIn");
  });

  it("a link to another page, pointing at that page", () => {
    expect(home).toContain('href="about.html"');
  });

  it("every page the user meant to publish, and none they hid", () => {
    const names = files.map((f) => f.name);
    expect(names).toContain("index.html");
    expect(names).toContain("about.html");
    expect(names).not.toContain("secret.html");
  });
});


/**
 * The same page, downloaded instead of published. Six of the nine gaps found
 * today were in this direction — the single file lagging what publish had —
 * and one was the reverse. Asking both for the same list is what keeps them
 * from drifting apart again.
 */
describe("the downloaded file carries the same things", () => {
  let html = "";
  let css = "";

  beforeAll(() => {
    const engine = new ExportEngine(fullSite());
    html = engine.generateHTML();
    css = engine.generateCSS();
  });

  it("the page's own title and SEO", () => {
    expect(html).toContain("<title>Their Title</title>");
    expect(html).toContain('content="Their description."');
    expect(html).toContain('name="robots" content="noindex"');
  });

  it("both kinds of custom code, and the analytics", () => {
    expect(html).toContain("from-page-head");
    expect(html).toContain("plausible.io/js/script.js");
    expect(html).toContain("G-FULLSITE");
  });

  it("the fonts and the request that fetches them", () => {
    expect(css).toMatch(/body\{[^}]*font-family:Verdana,sans-serif/);
    expect(html).toContain("family=Poppins");
  });

  it("the hide, the breakpoint styles and the keyframes", () => {
    expect(css).toContain("display:none!important");
    expect(css).toMatch(/@media[^{]*\{[^}]*font-size/);
    expect(css).toContain("@keyframes bd-anim-fadeIn");
  });

  it("an internal link that names the other page", () => {
    expect(html).toContain('href="about.html"');
  });
});
