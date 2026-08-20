/**
 * The publish payload's `path` is the same name the ZIP uses — both come from
 * `ExportEngine`'s page-href map. Every existing test around publishing mocks
 * this function, so nothing checked the shape it actually produces, and a slug
 * saved as "/about" reached Vercel as `path: "/about.html"`.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../../../engine";
import { exportPublishPages } from "../exportPublishPages";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function composerWithSlug(slug: string) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      { id: "home", name: "Home", slug: "", isHome: true,
        root: { id: "r1", type: "container" as const, tagName: "div", children: [] } },
      { id: "about", name: "About", slug,
        root: { id: "r2", type: "container" as const, tagName: "div", children: [] } },
    ],
  } as never);
  return composer;
}

describe("exportPublishPages", () => {
  it("gives every page a deploy-relative path", async () => {
    const pages = await exportPublishPages(composerWithSlug("about"));
    expect(pages.map((p) => p.path).sort()).toEqual(["about.html", "index.html"]);
  });

  it("never sends a path with a leading slash", async () => {
    const pages = await exportPublishPages(composerWithSlug("/about"));
    expect(pages.map((p) => p.path).sort()).toEqual(["about.html", "index.html"]);
  });

  it("ships html for each page, not empty documents", async () => {
    const pages = await exportPublishPages(composerWithSlug("about"));
    for (const p of pages) expect(p.html).toContain("<html");
  });
});

/* The publish payload is `pages: [{ path, html }]` — nothing else crosses to
   the server, and the worker uploads exactly those files plus robots.txt. The
   multi-page export writes ONE styles.css and links it from every page, so
   that link pointed at a file the deployment never received: published pages
   rendered with browser defaults, because the exported markup carries classes
   (`class="buildrick-el-…"`) rather than style attributes. */
describe("exportPublishPages — the stylesheet has to travel", () => {
  const page = (body: string) =>
    `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n${body}\n</body>\n</html>`;

  it("folds the stylesheet into every page and drops the dead link", async () => {
    const { inlinePublishStylesheet } = await import("../exportPublishPages");
    const out = inlinePublishStylesheet([
      { name: "index.html", content: page("<h1>Home</h1>") },
      { name: "about.html", content: page("<h1>About</h1>") },
      { name: "styles.css", content: ".buildrick-el-1{color:red}" },
    ]);
    expect(out.map((p) => p.path)).toEqual(["index.html", "about.html"]);
    for (const p of out) {
      expect(p.html).not.toContain('href="styles.css"');
      expect(p.html).toContain("<style>.buildrick-el-1{color:red}</style>");
    }
  });

  it("returns page files only — the payload schema takes pages, nothing else", async () => {
    const { inlinePublishStylesheet } = await import("../exportPublishPages");
    const out = inlinePublishStylesheet([
      { name: "index.html", content: page("<h1>Home</h1>") },
      { name: "styles.css", content: ".a{}" },
      { name: "sitemap.xml", content: "<urlset/>" },
    ]);
    expect(out.every((p) => p.path.endsWith(".html"))).toBe(true);
  });

  it("leaves a page alone when the export produced no stylesheet", async () => {
    const { inlinePublishStylesheet } = await import("../exportPublishPages");
    const html = "<!DOCTYPE html><html><head></head><body></body></html>";
    const out = inlinePublishStylesheet([{ name: "index.html", content: html }]);
    expect(out).toEqual([{ path: "index.html", html }]);
  });
});
