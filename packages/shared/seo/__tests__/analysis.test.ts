import { describe, it, expect } from "vitest";
import { analyzeSeo, isPlaceholderSlug, SEO_CHECKS } from "../analysis";
import type { SeoDocument } from "../document";
import { seoBlocksFromContent } from "../document";

const para = (id: string, text: string) => ({ elementId: id, kind: "paragraph" as const, text });
const doc = (over: Partial<SeoDocument> = {}): SeoDocument => ({
  title: "Wood-fired pizza in town · Bella Cucina",
  titleSource: "page-seo",
  description: "x".repeat(130),
  slugFile: "pizza.html",
  locale: "en",
  noIndex: false,
  blocks: [],
  ...over,
});
const byId = (findings: ReturnType<typeof analyzeSeo>, id: string) => findings.find((f) => f.id === id);
const ctx = { otherPages: [] };

describe("analyzeSeo", () => {
  it("without a keyphrase runs no keyphrase checks, only an optional prompt", () => {
    const f = analyzeSeo(doc(), ctx);
    expect(f.filter((x) => x.id.startsWith("keyphrase-"))).toEqual([
      expect.objectContaining({ id: "keyphrase-missing", rating: "improvement", text: "Add a focus keyphrase to see keyphrase checks (optional)." }),
    ]);
  });

  it("with a keyphrase runs the keyphrase checks", () => {
    const f = analyzeSeo(doc({ keyphrase: "pizza", blocks: [para("p1", "Our pizza is wood fired.")] }), ctx);
    expect(byId(f, "keyphrase-in-title")?.rating).not.toBe("problem");
    expect(byId(f, "keyphrase-in-slug")?.rating).toBe("good");
    expect(byId(f, "keyphrase-in-intro")?.rating).toBe("good");
    expect(byId(f, "keyphrase-missing")).toBeUndefined();
  });

  it("single-h1 with two H1s points at the second, fixed in typography", () => {
    const f = analyzeSeo(doc({ blocks: [
      { elementId: "h-a", kind: "heading", level: 1, text: "A" },
      { elementId: "h-b", kind: "heading", level: 1, text: "B" },
    ] }), ctx);
    expect(byId(f, "single-h1")).toMatchObject({ rating: "problem", elementId: "h-b", fix: { kind: "element", elementId: "h-b", section: "typography" } });
  });

  it("image-alt points at the first image without alt; decorative images are not flagged", () => {
    const f = analyzeSeo(doc({ blocks: [
      { elementId: "i1", kind: "image", alt: "", decorative: true },
      { elementId: "i2", kind: "image", alt: "A dining room" },
      { elementId: "i3", kind: "image" },
    ] }), ctx);
    expect(byId(f, "image-alt")).toMatchObject({ elementId: "i3", fix: { kind: "element", section: "media", property: "alt" } });
  });

  it("title-length reads the emitted title", () => {
    expect(byId(analyzeSeo(doc({ title: "x".repeat(75) }), ctx), "title-length")?.rating).toBe("problem");
    expect(byId(analyzeSeo(doc({ title: "x".repeat(65) }), ctx), "title-length")?.rating).toBe("improvement");
    expect(byId(analyzeSeo(doc({ title: "x".repeat(40) }), ctx), "title-length")?.rating).toBe("good");
  });

  it("title-unique names the other page", () => {
    const f = analyzeSeo(doc({ title: "Home" }), { otherPages: [{ id: "o", name: "Menu", title: "home" }] });
    expect(byId(f, "title-unique")).toMatchObject({ rating: "problem" });
    expect(byId(f, "title-unique")?.text).toContain('"Menu"');
  });

  it("flags custom HTML it could not check, once", () => {
    const f = analyzeSeo(doc({ blocks: [{ elementId: "x", kind: "paragraph", uncheckedHtml: true }, { elementId: "y", kind: "paragraph", uncheckedHtml: true }] }), ctx);
    expect(f.filter((x) => x.id === "unchecked-html")).toEqual([expect.objectContaining({ rating: "improvement", text: "Some custom HTML wasn't checked." })]);
  });

  it("every check in the table returns a finding or null for an empty page", () => {
    for (const check of Object.values(SEO_CHECKS)) expect(() => check(doc({ blocks: [] }), ctx)).not.toThrow();
  });

  it("isPlaceholderSlug catches every generated page-N slug", () => {
    expect(isPlaceholderSlug("page-1")).toBe(true);
    expect(isPlaceholderSlug("page-7.html")).toBe(true);
    expect(isPlaceholderSlug("pages")).toBe(false);
  });
});

describe("seoBlocksFromContent", () => {
  it("yields blocks in document order and reads links and images inside rich text", () => {
    const root = {
      id: "root", type: "container", children: [
        { id: "h", type: "heading", tagName: "h1", content: "Hello" },
        { id: "img", type: "image", attributes: { src: "a.png" } },
        { id: "t", type: "text", content: 'See <a href="#page:p2">menu</a> and <img src="b.png" alt="">', contentFormat: "html" },
        { id: "raw", type: "container", content: "<h2>Inside</h2>", contentFormat: "html" },
      ],
    };
    const blocks = seoBlocksFromContent(root as never, { boundIds: new Set(["h"]) });
    expect(blocks.map((b) => [b.elementId, b.kind])).toEqual([
      ["h", "heading"], ["img", "image"], ["t", "paragraph"], ["t", "link"], ["t", "image"], ["raw", "paragraph"], ["raw", "paragraph"],
    ]);
    expect(blocks[0]).toMatchObject({ level: 1, cmsBound: true });
    expect(blocks[3]).toMatchObject({ internal: true });
    expect(blocks[4]).toMatchObject({ decorative: true });
    expect(blocks[6]).toMatchObject({ uncheckedHtml: true });
  });
});
