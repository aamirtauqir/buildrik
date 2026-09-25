/**
 * duplicateElement must hand out a copy that owns its data: the clone used to
 * share the original's `attributes` object, so editing the copy's href / src
 * rewrote the original too (found through New page's nav link, 2026-09-24).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { makeEngine } from "./harness";

describe("ElementManager.duplicateElement — the copy owns its data", () => {
  it("changing the duplicate's attribute leaves the original alone", () => {
    const { manager } = makeEngine();
    const home = manager.createPage("Home");
    const a = manager.createElement("link" as never, { content: "Menu", attributes: { href: "#page:m" } });
    manager.addElement(a, home.root.id);
    const copy = manager.duplicateElement(a.getId())!;
    copy.setAttribute("href", "#page:x");
    expect(a.getAttribute("href")).toBe("#page:m");
  });
});

/* Board 5940:147595: duplicating "Section · Hero" selects "Section · Hero 2".
   A named layer's copy takes the next free number among its siblings; an
   unnamed one stays unnamed. */
describe("ElementManager.duplicateElement — the copy's layer name", () => {
  it("Hero → Hero 2 → Hero 3; duplicating Hero 2 also gives Hero 3's successor", () => {
    const { manager } = makeEngine();
    const home = manager.createPage("Home");
    const hero = manager.createElement("section" as never);
    hero.setData("layerName", "Hero");
    manager.addElement(hero, home.root.id);
    const two = manager.duplicateElement(hero.getId())!;
    expect(two.getCustomData("layerName")).toBe("Hero 2");
    const three = manager.duplicateElement(hero.getId())!;
    expect(three.getCustomData("layerName")).toBe("Hero 3");
    expect(manager.duplicateElement(two.getId())!.getCustomData("layerName")).toBe("Hero 4");
    expect(hero.getCustomData("layerName")).toBe("Hero");
  });

  it("an unnamed layer's copy stays unnamed", () => {
    const { manager } = makeEngine();
    const home = manager.createPage("Home");
    const box = manager.createElement("container" as never);
    manager.addElement(box, home.root.id);
    expect(manager.duplicateElement(box.getId())!.getCustomData("layerName")).toBeUndefined();
  });
});
