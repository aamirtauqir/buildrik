/**
 * The single HTML file and the published site come out of the same modal and
 * the same engine, and they kept disagreeing. Four gaps were found one at a
 * time today — the page title, its SEO, its fonts, its per-breakpoint hides —
 * so this walks the remaining ones as a set rather than waiting for the fifth.
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

function site() {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{
      id: "p", name: "Home", slug: "", isHome: true,
      settings: { head: '<meta name="from-custom-head" content="1">' },
      root: { id: "root", type: "container" as const, tagName: "div",
        children: [{ id: "t", type: "paragraph" as const, tagName: "p", content: "copy", styles: { color: "red" }, children: [] }] },
    }],
  } as never);
  composer.styles.setBreakpointStyle("t", "mobile", { "font-size": "40px" });
  return composer;
}

describe("the single file carries what the published page carries", () => {
  it("has the breakpoint styles, not just the desktop ones", () => {
    const css = new ExportEngine(site()).generateCSS();
    expect(css).toMatch(/@media[^{]*\{[^}]*font-size/);
  });

  it("puts the breakpoint rules AFTER the base ones, so they win", () => {
    const css = new ExportEngine(site()).generateCSS();
    expect(css.indexOf("@media")).toBeGreaterThan(css.indexOf("color"));
  });

  it("has the page's custom head code", () => {
    const html = new ExportEngine(site()).generateHTML();
    expect(html).toContain("from-custom-head");
  });

  it("sanitises that head code rather than trusting it", () => {
    const composer = new Composer({} as never);
    composer.importProject({
      pages: [{ id: "p", name: "Home", slug: "", isHome: true,
        settings: { head: '<script>evil()</script><meta name="ok" content="1">' },
        root: { id: "root", type: "container" as const, tagName: "div", children: [] } }],
    } as never);
    const html = new ExportEngine(composer).generateHTML();
    expect(html).not.toContain("evil()");
  });

  it("agrees with the publish path on the breakpoint rule", async () => {
    const single = new ExportEngine(site()).generateCSS();
    const { files } = await new ExportEngine(site()).exportAllPages({ format: "html" });
    const published = files.find((f) => f.name === "styles.css")?.content ?? "";
    const query = (css: string) => (css.match(/@media[^{]+/g) ?? []).map((q) => q.trim()).sort();
    expect(query(single)).toEqual(query(published));
  });
});

describe("internal links point at the page they name", () => {
  function twoPages() {
    const composer = new Composer({} as never);
    composer.importProject({
      pages: [
        { id: "home", name: "Home", slug: "", isHome: true,
          root: { id: "r1", type: "container" as const, tagName: "div", children: [
            { id: "lnk", type: "link" as const, tagName: "a", content: "About us",
              attributes: { href: "#page:about" }, children: [] },
          ] } },
        { id: "about", name: "About", slug: "about",
          root: { id: "r2", type: "container" as const, tagName: "div", children: [] } },
      ],
    } as never);
    return composer;
  }

  it("does not send a link to another page back to this one", () => {
    // `#page:<id>` resolves against the filenames the export writes, and the
    // single-file path never built that map — so every internal link took the
    // "page was deleted" fallback and came out as index.html, which reads as
    // broken navigation rather than a missing file.
    const html = new ExportEngine(twoPages()).generateHTML();
    expect(html).toContain('href="about.html"');
    expect(html).not.toContain('href="index.html"');
  });

  it("resolves it the same way the publish path does", async () => {
    const single = new ExportEngine(twoPages()).generateHTML();
    const { files } = await new ExportEngine(twoPages()).exportAllPages({ format: "html" });
    const published = files.find((f) => f.name === "index.html")?.content ?? "";
    const hrefs = (html: string) =>
      (html.match(/href="[^"]*"/g) ?? []).filter((h) => !/googleapis|gstatic|styles\.css/.test(h));
    expect(hrefs(single)).toEqual(hrefs(published));
  });

  it("still falls back to home for a page that no longer exists", () => {
    const composer = new Composer({} as never);
    composer.importProject({
      pages: [{ id: "home", name: "Home", slug: "", isHome: true,
        root: { id: "r1", type: "container" as const, tagName: "div", children: [
          { id: "lnk", type: "link" as const, tagName: "a", content: "Gone",
            attributes: { href: "#page:deleted" }, children: [] },
        ] } }],
    } as never);
    const html = new ExportEngine(composer).generateHTML();
    expect(html).toContain('href="index.html"');
    expect(html).not.toContain("#page:");
  });
});
