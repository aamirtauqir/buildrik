// @vitest-environment jsdom
/**
 * An element's stored `attributes.class` reaches the output of all three HTML
 * writers — canvas (`toHTML` → buildAttributeString), single-file export
 * (`generateHTML`) and the published page (`exportAllPages` →
 * renderPageElement) — merged with its `classes` list, once each, as class
 * tokens only.
 *
 * The export writers skipped the raw `class` attribute on the assumption that
 * it mirrors `classes`; the Accordion, Modal, Stack, Switch, Table, Tabs and
 * ProductGrid blocks store their classes ONLY there, so published sites lost
 * them. The canvas writer emitted both and produced two `class` attributes.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { insertBlock, getBlockById } from "@/blocks/blockRegistry";
import { ExportEngine } from "../ExportEngine";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

async function publishedBody(composer: ReturnType<typeof createTestComposer>): Promise<string> {
  const res = await new ExportEngine(composer).exportAllPages({ format: "html", minify: false });
  const html = res.files.find((f) => f.name === "index.html")!.content;
  return html.slice(html.indexOf("<body"), html.indexOf("</body>"));
}

/** The element's class attribute as a browser reads it, plus how many class attributes its tag had. */
function classOf(html: string, elementId: string): { tokens: string[]; attrCount: number } {
  const tag = html.match(new RegExp(`<[a-z0-9]+[^>]*data-buildrick-id="${elementId}"[^>]*>`))?.[0] ?? "";
  const el = new DOMParser().parseFromString(`<div>${tag}</div>`, "text/html").querySelector(`[data-buildrick-id="${elementId}"]`);
  return {
    tokens: (el?.getAttribute("class") ?? "").split(/\s+/).filter(Boolean),
    attrCount: (tag.match(/\sclass=/g) ?? []).length,
  };
}

function withClasses() {
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const el = composer.elements.createElement("container" as never, {} as never);
  composer.elements.addElement(el, page.root.id);
  el.setAttribute("class", "faq  faq--open");
  el.addClass("hero-title");
  el.addClass("faq");
  return { composer, id: el.getId() };
}

describe("attributes.class in the HTML writers", () => {
  it("canvas: one class attribute, classes + attributes.class merged without duplicates", () => {
    const { composer, id } = withClasses();
    const out = classOf(composer.elements.toHTML(), id);
    expect(out.attrCount).toBe(1);
    expect(out.tokens).toEqual(["hero-title", "faq", "faq--open"]);
  });

  it("single-file export keeps the stored class tokens beside the generated one", () => {
    const { composer, id } = withClasses();
    const html = new ExportEngine(composer).generateHTML({ minify: false });
    const tag = html.match(new RegExp(`<[a-z0-9]+[^>]*class="[^"]*${id}[^"]*"[^>]*>`))?.[0] ?? "";
    const tokens = (tag.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/);
    expect(tokens.slice(1)).toEqual(["hero-title", "faq", "faq--open"]);
    expect(tokens[0].endsWith(id)).toBe(true);
  });

  it("published page keeps them too", async () => {
    const { composer, id } = withClasses();
    const out = classOf(await publishedBody(composer), id);
    expect(out.attrCount).toBe(1);
    expect(out.tokens.slice(1)).toEqual(["hero-title", "faq", "faq--open"]);
  });

  it("the Accordion block's own classes reach the published page", async () => {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    const id = insertBlock(composer, getBlockById("accordion")!, page.root.id)!;
    const body = await publishedBody(composer);
    expect(classOf(body, id).tokens).toContain("accordion");
    expect(body).toMatch(/class="[^"]*\baccordion-item\b[^"]*\bopen\b/);
    expect(body).toMatch(/class="[^"]*\baccordion-header\b/);
  });

  it("only class tokens survive: anything carrying quotes or angle brackets is dropped", async () => {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    const el = composer.elements.createElement("container" as never, {} as never);
    composer.elements.addElement(el, page.root.id);
    el.setAttribute("class", `ok a"b <c> d'e f\`g`);
    const id = el.getId();
    expect(classOf(composer.elements.toHTML(), id).tokens).toEqual(["ok"]);
    expect(classOf(await publishedBody(composer), id).tokens.slice(1)).toEqual(["ok"]);
    const single = new ExportEngine(composer).generateHTML({ minify: false });
    const tag = single.match(new RegExp(`<[a-z0-9]+[^>]*class="[^"]*${id}[^"]*"[^>]*>`))?.[0] ?? "";
    expect((tag.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/).slice(1)).toEqual(["ok"]);
    expect(tag).not.toMatch(/<c>|onerror|a"b/);
  });

  it("single-file export: the Accordion keeps its block classes, a duplicate appears once", () => {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    const id = insertBlock(composer, getBlockById("accordion")!, page.root.id)!;
    composer.elements.getElement(id)!.addClass("accordion");
    const html = new ExportEngine(composer).generateHTML({ minify: false });
    const tag = html.match(new RegExp(`<[a-z0-9]+[^>]*class="[^"]*${id}[^"]*"[^>]*>`))?.[0] ?? "";
    const tokens = (tag.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/);
    expect(tokens.filter((t) => t === "accordion")).toHaveLength(1);
    expect((tag.match(/\sclass=/g) ?? []).length).toBe(1);
    expect(html).toMatch(/class="[^"]*\baccordion-header\b/);
  });
});
