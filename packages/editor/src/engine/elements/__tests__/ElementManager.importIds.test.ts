/**
 * X-A1 (live): on a fresh load of S1 the "Home" tab was selected but the
 * canvas drew Contact. Every S1 page stores its root as `id: "root"` — so
 * does every page the AI-generate worker writes (sectionsToBlocks), and its
 * section ids (`ai-hero-0`) repeat across pages too. The element registry is
 * keyed by id, so the LAST page imported owned "root": the canvas
 * (`toHTML` → `elements.get(page.root.id)`) drew Contact under a Home tab,
 * and a save (`exportPages`) wrote Contact's tree into all three pages —
 * which is what the verify DB now holds.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { ElementData, PageData } from "@/shared/types";
import { makeEngine } from "./harness";

function storedPage(id: string, name: string, text: string): PageData {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    root: {
      id: "root",
      type: "container",
      tagName: "div",
      classes: ["buildrick-page-root"],
      children: [
        { id: "ai-hero-0", type: "container", tagName: "section", content: text, children: [] } as ElementData,
      ],
    } as ElementData,
  } as PageData;
}

function loadThreePages() {
  const { manager } = makeEngine();
  manager.importPage(storedPage("home", "Home", "Welcome home"));
  manager.importPage(storedPage("about", "About", "About us"));
  manager.importPage(storedPage("contact", "Contact", "Reach out to us"));
  return manager;
}

describe("importPage · element ids shared across stored pages", () => {
  it("the canvas draws the active (first) page, not the last one imported", () => {
    const manager = loadThreePages();
    expect(manager.getActivePage()?.id).toBe("home");
    const html = manager.toHTML();
    expect(html).toContain("Welcome home");
    expect(html).not.toContain("Reach out to us");
  });

  it("switching pages draws each page's own content", () => {
    const manager = loadThreePages();
    manager.setActivePage("about");
    expect(manager.toHTML()).toContain("About us");
    manager.setActivePage("home");
    expect(manager.toHTML()).toContain("Welcome home");
  });

  it("a save exports every page's own tree (no page overwritten by another)", () => {
    const manager = loadThreePages();
    const byId = new Map(manager.exportPages().map((p) => [p.id, JSON.stringify(p.root)]));
    expect(byId.get("home")).toContain("Welcome home");
    expect(byId.get("about")).toContain("About us");
    expect(byId.get("contact")).toContain("Reach out to us");
    const rootIds = manager.exportPages().map((p) => p.root.id);
    expect(new Set(rootIds).size).toBe(3);
  });

  it("the first page keeps its stored ids; only colliding later ones are renamed", () => {
    const manager = loadThreePages();
    expect(manager.getPage("home")?.root.id).toBe("root");
    expect(manager.getElement("ai-hero-0")?.getContent()).toBe("Welcome home");
  });
});
