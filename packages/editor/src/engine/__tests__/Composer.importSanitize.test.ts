/**
 * S-1a (A19-1): what the canvas renders is `composer.elements.toHTML()`, put
 * into the app document with dangerouslySetInnerHTML. A stored tree whose
 * tagName smuggles attributes, or which carries an iframe `srcdoc`, must not
 * reach that string — and the allowlist must not change the stock templates.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../Composer";
import { SITE_TEMPLATES } from "@/editor/sidebar/tabs/templates/templatesData";
import { sanitizeElementTreeContent } from "@/shared/utils/html/sanitization";
import type { ProjectData } from "@/shared/types";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function project(root: unknown): ProjectData {
  return { pages: [{ id: "p", name: "P", slug: "", root }] } as never;
}

describe("importProject → canvas HTML (S-1a)", () => {
  it("renders neither the srcdoc nor the smuggled handler", () => {
    const composer = new Composer({} as never);
    composer.importProject(project({
      id: "root", type: "container", tagName: "div",
      children: [
        { id: "f", type: "container", tagName: "iframe", attributes: { srcdoc: "<script>alert(1)</script>" }, children: [] },
        { id: "i", type: "image", tagName: "img src=x onerror=alert(1) x", children: [] },
      ],
    }));
    const html = composer.elements.toHTML();
    expect(html).not.toMatch(/srcdoc/i);
    expect(html).not.toMatch(/onerror/i);
    expect(html).not.toMatch(/<iframe/i);
  });

  it("an element whose tag is refused renders its type's own tag", () => {
    const composer = new Composer({} as never);
    composer.importProject(project({
      id: "root", type: "container", tagName: "div",
      children: [{ id: "h", type: "heading", tagName: "h1 onclick=x", content: "Hi", children: [] }],
    }));
    expect(composer.elements.getElement("h")?.getTagName()).toBe("h2");
  });
});

describe("every stock template survives the allowlist unchanged", () => {
  it.each(SITE_TEMPLATES.map((t) => [t.id, t.html] as const))("%s", (_id, html) => {
    const composer = new Composer({} as never);
    composer.importProject(project({ id: "root", type: "container", tagName: "div", children: [] }));
    composer.elements.importHTMLToActivePage(html);
    const before = composer.exportProject();
    const root = structuredClone(before.pages[0].root);
    sanitizeElementTreeContent(root);
    expect(JSON.stringify(root).split("\"id\"").length).toBeGreaterThan(20);
    expect(root).toEqual(before.pages[0].root);

    const reloaded = new Composer({} as never);
    reloaded.importProject(structuredClone(before));
    expect(reloaded.elements.toHTML()).toBe(composer.elements.toHTML());
  });
});
