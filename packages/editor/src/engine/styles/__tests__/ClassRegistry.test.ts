/**
 * composer.classes — the derived class registry (CLASS-FIRST-SPEC §2.2), on a
 * real Composer.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { loadStyleModelSite } from "@/engine/export/__tests__/fixtures/styleModelSite";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

describe("ClassRegistry", () => {
  it("lists classes in first-seen order with element, page and rule counts", () => {
    const composer = createTestComposer();
    loadStyleModelSite(composer);
    composer.styles.setRule(".unused-thing", { color: "red" });
    expect(composer.classes.list()).toEqual([
      { name: "hero-title", spellings: ["hero-title"], elements: 1, pages: { home: 1 }, rules: 3 },
      { name: "card", spellings: ["Card", "card"], elements: 2, pages: { home: 2 }, rules: 3 },
      { name: "note", spellings: ["note"], elements: 2, pages: { home: 2 }, rules: 1 },
      { name: "unused-thing", spellings: ["unused-thing"], elements: 0, pages: {}, rules: 1 },
    ]);
    composer.destroy();
  });

  it("follows live edits — nothing is stored", () => {
    const composer = createTestComposer();
    loadStyleModelSite(composer);
    composer.elements.getElement("aboutText")!.addClass("hero-title");
    const hero = composer.classes.list().find((c) => c.name === "hero-title")!;
    expect(hero.elements).toBe(2);
    expect(hero.pages).toEqual({ home: 1, about: 1 });
    expect(composer.exportProject().settings).not.toHaveProperty("classes");
    composer.destroy();
  });

  it("elementsUsing counts only elements carrying the whole chain", () => {
    const composer = createTestComposer();
    loadStyleModelSite(composer);
    const ids = (chain: string[]) => composer.classes.elementsUsing(chain).map((el) => el.getId()).sort();
    expect(ids(["card"])).toEqual(["cardBox", "noteText"]);
    expect(ids(["card", "note"])).toEqual(["cardBox", "noteText"]);
    expect(ids(["hero-title", "note"])).toEqual([]);
    expect(ids([])).toEqual([]);
    composer.destroy();
  });
});
