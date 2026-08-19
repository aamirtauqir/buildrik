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
