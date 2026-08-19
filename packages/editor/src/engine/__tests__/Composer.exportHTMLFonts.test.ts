/**
 * `exportHTML().combined` is what Quick preview renders and what "copy HTML"
 * hands over. It builds its own document, and when the export learned to emit
 * the site's font slots and fetch the families that need fetching, this head
 * kept carrying neither — the divergence its own comment already records.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../Composer";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function composerWith(styles: Record<string, string>, tokens: Array<{ id: string; value: string }> = []) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{
      id: "p", name: "P", slug: "",
      root: { id: "root", type: "container" as const, tagName: "div",
        children: [{ id: "h", type: "heading" as const, tagName: "h1", content: "Hi", styles, children: [] }] },
    }],
  } as never);
  if (tokens.length) {
    composer.setProjectSettings({
      ...composer.getProjectSettings(),
      designTokens: tokens.map((t) => ({ ...t, name: t.id, cssVar: `--buildrick-design-${t.id}`, category: "typography" as const, type: "string" })),
    } as never);
  }
  return composer;
}

describe("the preview document carries the site's fonts", () => {
  it("fetches a family an element names inline", () => {
    // This document carries element styles INLINE, so the family appears in a
    // style attribute and nowhere in the stylesheet — detection has to read
    // the HTML too.
    const { combined } = composerWith({ "font-family": "Lora, serif" }).exportHTML();
    expect(combined).toContain("fonts.googleapis.com/css2?");
    expect(combined).toContain("family=Lora");
  });

  it("emits the site's own font rules", () => {
    const { combined } = composerWith({}, [
      { id: "font-body", value: "Verdana" },
      { id: "font-heading", value: "Playfair Display" },
    ]).exportHTML();
    expect(combined).toContain("body{font-family:Verdana,sans-serif}");
    expect(combined).toContain("h1,h2,h3,h4,h5,h6{font-family:Playfair Display,sans-serif}");
    expect(combined).toContain("family=Playfair+Display");
  });

  it("asks for nothing when no family needs fetching", () => {
    const { combined } = composerWith({ "font-family": "Helvetica Neue, sans-serif" }).exportHTML();
    expect(combined).not.toContain("Helvetica+Neue");
  });
});
