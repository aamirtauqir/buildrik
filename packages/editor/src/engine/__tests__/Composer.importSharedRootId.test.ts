/**
 * X-4 (live verify 2026-09-26). Every page the seed, the AI-generate worker
 * (`sectionsToBlocks`) or an empty `pages.blocks` (BuildrikSyncProvider's
 * DEFAULT_ROOT) produces has the root id "root". The element registry is one
 * map for all pages, so the pages' roots collided: every page showed the same
 * tree, and `exportPages` resolved each page through `elements.get("root")`,
 * so EVERY autosave wrote the active page's tree into every page. Measured on
 * the verify DB: Home/About/Contact all 683 bytes, identical, stamped within
 * 4 ms; after one slider add all three were 1546 bytes, identical. The
 * verifier read that as cross-agent contamination.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../Composer";
import type { ProjectData } from "@/shared/types";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

const page = (id: string, text: string, childId = `h-${id}`) => ({
  id,
  name: id,
  slug: id,
  root: {
    id: "root", type: "container", tagName: "div",
    children: [{ id: childId, type: "heading", tagName: "h2", content: text, children: [] }],
  },
});

const texts = (data: ProjectData) =>
  data.pages.map((p) => (p.root.children ?? []).map((c) => (c as { content?: string }).content));

describe("pages that share a root id (X-4)", () => {
  it("each page exports its own tree", () => {
    const composer = new Composer({} as never);
    composer.importProject({
      pages: [page("home", "Home"), page("about", "About"), page("contact", "Contact")],
    } as never);
    expect(texts(composer.exportProject())).toEqual([["Home"], ["About"], ["Contact"]]);
  });

  it("an element added to one page is saved into that page only", () => {
    const composer = new Composer({} as never);
    composer.importProject({ pages: [page("home", "Home"), page("about", "About")] } as never);
    composer.elements.setActivePage("home");
    const homeRoot = composer.elements.getActivePage()!.root.id;
    const slider = composer.elements.createElement("slider" as never);
    composer.elements.getElement(homeRoot)!.addChild(slider);

    const out = composer.exportProject();
    expect(out.pages[0].root.children).toHaveLength(2);
    expect(out.pages[1].root.children).toHaveLength(1);
    expect(texts(out)[1]).toEqual(["About"]);
  });

  it("pages already clobbered to the SAME tree (same child ids) come apart", () => {
    const composer = new Composer({} as never);
    composer.importProject({
      pages: [page("home", "Same", "dup"), page("about", "Same", "dup")],
    } as never);
    const [a, b] = composer.exportProject().pages;
    expect(a.root.id).not.toBe(b.root.id);
    expect(a.root.children![0].id).not.toBe(b.root.children![0].id);
  });

  it("leaves a project whose ids are already unique untouched", () => {
    const composer = new Composer({} as never);
    const home = page("home", "Home");
    const about = { ...page("about", "About"), root: { ...page("about", "About").root, id: "root-about" } };
    composer.importProject({ pages: [home, about] } as never);
    const [a, b] = composer.exportProject().pages;
    expect([a.root.id, b.root.id]).toEqual(["root", "root-about"]);
    expect(a.root.children![0].id).toBe("h-home");
  });
});
