/**
 * X-A1 / Lrt2 — stored pages that share element ids must load as separate
 * trees. Every AI-generated, template, seeded AND empty page stores its root
 * as `"root"`; the element registry is keyed by id across pages, so the
 * last page loaded owned "root", the canvas drew it under another page's tab,
 * and every autosave copied the open page's content into every page.
 *
 * Covers fresh roots for blank pages
 * (no shared DEFAULT_ROOT object), import never mutates caller data, re-id is
 * deterministic with the first page keeping its ids, and id-keyed style
 * rules + CMS bindings follow a re-id'd element.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { installEngineBrowserStubs, removeEngineBrowserStubs, createTestComposer } from "./test-utils/realComposer";
import { projectDataFromRows } from "@/services/BuildrikSyncProvider";
import type { ElementData, ProjectData } from "@/shared/types";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

function row(id: string, name: string, position: number, blocks: unknown) {
  return { id, name, slug: name.toLowerCase(), position, isHomePage: position === 0, blocks, settings: null, meta: null, updatedAt: "", slugManuallySet: false, slugHistory: [] };
}

function storedRoot(text: string, extra: ElementData[] = []): ElementData {
  return {
    id: "root",
    type: "container",
    tagName: "div",
    classes: ["buildrick-page-root"],
    children: [{ id: "ai-hero-0", type: "text", tagName: "p", content: text, children: [] } as ElementData, ...extra],
  } as ElementData;
}

function load(pages: ReturnType<typeof row>[], extra: Partial<ProjectData> = {}) {
  const composer = createTestComposer();
  const data = { ...projectDataFromRows({ name: "S" }, pages, null), ...extra };
  composer.importProject(data);
  return composer;
}

const byPage = (data: ProjectData) => new Map(data.pages.map((p) => [p.id, JSON.stringify(p.root)]));

describe("duplicate element ids across stored pages", () => {
  it("two blank pages ([] blocks) stay separate — an edit on A never lands on B", () => {
    const composer = load([row("pa", "A", 0, []), row("pb", "B", 1, [])]);
    const a = composer.elements.getPage("pa")!;
    const child = composer.elements.createElement("text", { content: "only on A" });
    composer.elements.addElement(child, a.root.id);
    const out = byPage(composer.exportProject());
    expect(out.get("pa")).toContain("only on A");
    expect(out.get("pb")).not.toContain("only on A");
  });

  it("blank pages get distinct root objects, and a load leaves them untouched", () => {
    const first = projectDataFromRows({ name: "S" }, [row("pa", "A", 0, []), row("pb", "B", 1, [])], null);
    expect(first.pages[0].root).not.toBe(first.pages[1].root);
    const rootB = JSON.stringify(first.pages[1].root);
    createTestComposer().importProject(first);
    expect(JSON.stringify(first.pages[1].root)).toBe(rootB);
    const again = projectDataFromRows({ name: "S" }, [row("pc", "C", 0, [])], null);
    expect(again.pages[0].root.children).toEqual([]);
  });

  it("Lrt2 repro: 3 pages rooted at \"root\" + an element added on page 2 — the save payload keeps 1 and 3 distinct", () => {
    const composer = load([
      row("p1", "Home", 0, storedRoot("home copy")),
      row("p2", "About", 1, storedRoot("about copy")),
      row("p3", "Contact", 2, storedRoot("contact copy")),
    ]);
    composer.elements.setActivePage("p2");
    const p2 = composer.elements.getPage("p2")!;
    composer.elements.addElement(composer.elements.createElement("text", { content: "slider" }), p2.root.id);
    const out = byPage(composer.exportProject());
    expect(out.get("p1")).toContain("home copy");
    expect(out.get("p1")).not.toContain("slider");
    expect(out.get("p2")).toContain("about copy");
    expect(out.get("p2")).toContain("slider");
    expect(out.get("p3")).toContain("contact copy");
    expect(out.get("p3")).not.toContain("slider");
    expect(composer.elements.toHTML()).toContain("about copy");
  });

  it("re-id is deterministic and the first page (by position) keeps its ids", () => {
    const rows = () => [row("p2", "About", 1, storedRoot("about")), row("p1", "Home", 0, storedRoot("home"))];
    const a = load(rows()).exportProject();
    const b = load(rows()).exportProject();
    expect(a.pages.find((p) => p.id === "p1")!.root.id).toBe("root");
    expect(a.pages.find((p) => p.id === "p2")!.root.id).not.toBe("root");
    expect(JSON.stringify(a.pages.map((p) => p.root))).toBe(JSON.stringify(b.pages.map((p) => p.root)));
  });

  it("a responsive rule and a CMS binding on a colliding element follow it to its new id, and survive save", () => {
    const composer = load(
      [row("p1", "Home", 0, storedRoot("home")), row("p2", "About", 1, storedRoot("about"))],
      {
        styles: [
          { id: "s-hero-m", selector: '[data-buildrick-id="ai-hero-0"]', properties: { color: "red" }, mediaQuery: "(max-width: 767px)" },
        ],
        cmsBindings: {
          // The shape CMSBindingManager.bindToField stores (cmsBindingsSchema).
          field: {
            "ai-hero-0": [{
              binding: { sourceId: "cms:c1", path: "r1.title", type: "variable" },
              collectionId: "c1", itemId: "r1", fieldSlug: "title", property: "content",
            }],
          },
        },
      },
    );
    const p2Hero = composer.elements.getElement(composer.elements.getPage("p2")!.root.id)!.getChildren()[0];
    const newId = p2Hero.getId();
    expect(newId).not.toBe("ai-hero-0");
    const out = composer.exportProject();
    const rules = out.styles.filter((s) => s.selector === `[data-buildrick-id="${newId}"]`);
    expect(rules).toHaveLength(1);
    expect(rules[0].mediaQuery).toBe("(max-width: 767px)");
    expect(out.styles.some((s) => s.selector === '[data-buildrick-id="ai-hero-0"]')).toBe(true);
    expect(composer.cms.bindings.getBindings(newId)).toHaveLength(1);
    expect(composer.cms.bindings.getBindings("ai-hero-0")).toHaveLength(1);
    expect(out.cmsBindings?.field?.[newId]).toBeTruthy();
  });
});
