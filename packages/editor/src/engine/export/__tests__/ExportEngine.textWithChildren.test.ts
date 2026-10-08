/**
 * The canvas renders an element's own text AND its children
 * (`ElementSerialization.toHTML`: `${content}${childrenHTML}`). The exporter
 * wrote children OR text, so `<h2>Heading<hr></h2>` exported as `<h2><hr></h2>`
 * and the published heading lost its words (audit L1-002, Critical).
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
      root: { id: "root", type: "container" as const, tagName: "div",
        children: [{
          id: "h", type: "heading" as const, tagName: "h2", content: "Heading",
          children: [{ id: "d", type: "divider" as const, tagName: "hr", children: [] }],
        }] },
    }],
  } as never);
  return composer;
}

describe("an element with text and children exports both, text first", () => {
  it("in the single-file HTML", () => {
    const html = new ExportEngine(site()).generateHTML();
    expect(html).toMatch(/<h2[^>]*>Heading\s*<hr/);
  });

  it("in every published page", async () => {
    const result = await new ExportEngine(site()).exportAllPages({ format: "html", minify: false });
    const index = result.files.find((f) => f.name === "index.html");
    expect(String(index?.content)).toMatch(/<h2[^>]*>Heading\s*<hr/);
  });
});
