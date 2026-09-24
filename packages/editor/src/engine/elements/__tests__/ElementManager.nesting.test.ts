/**
 * The engine's own structural writes obey the canvas drop's nesting rule
 * (shared/utils/nesting/placement.ts). A heading saved inside a heading is
 * hoisted out by the browser when the canvas renders, so the model and the
 * DOM stop agreeing (walk, /edit/:id, 2026-09-24). An illegal placement now
 * lands as a sibling right after the parent that refused it.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { makeEngine } from "./harness";

const setup = () => {
  const { manager } = makeEngine();
  const page = manager.createPage("Home");
  const section = manager.createElement("section");
  const h = manager.createElement("heading");
  const after = manager.createElement("paragraph");
  manager.addElement(section, page.root.id);
  manager.addElement(h, section.getId());
  manager.addElement(after, section.getId());
  const ids = () => section.getChildren().map((c) => c.getId());
  return { manager, page, section, h, after, ids };
};

describe("engine writes refuse illegal nesting by placing after the parent", () => {
  it("addElement: a heading into a heading lands after it", () => {
    const { manager, h, after, ids } = setup();
    const inner = manager.createElement("heading");
    expect(manager.addElement(inner, h.getId())).toBe(true);
    expect(h.getChildren()).toHaveLength(0);
    expect(ids()).toEqual([h.getId(), inner.getId(), after.getId()]);
  });

  it("moveElement: a paragraph moved into a heading lands after it", () => {
    const { manager, h, after, ids } = setup();
    expect(manager.moveElement(after.getId(), h.getId(), 0)).toBe(true);
    expect(h.getChildren()).toHaveLength(0);
    expect(ids()).toEqual([h.getId(), after.getId()]);
  });

  it("pasteElement: pasted heading data into a heading lands after it", () => {
    const { manager, h, after, ids } = setup();
    const data = manager.serializeElement(after.getId())!;
    const pasted = manager.pasteElement({ ...data, type: "heading", tagName: "h3" }, h)!;
    expect(h.getChildren()).toHaveLength(0);
    expect(ids()).toEqual([h.getId(), pasted.getId(), after.getId()]);
  });

  it("insertHTMLToElement: markup inserted into a heading lands after it, in order", () => {
    const { manager, h, after, ids } = setup();
    const made = manager.insertHTMLToElement(h.getId(), "<h3>One</h3><h4>Two</h4>");
    expect(h.getChildren()).toHaveLength(0);
    expect(ids()).toEqual([h.getId(), made[0].getId(), made[1].getId(), after.getId()]);
  });

  it("legal placements are untouched", () => {
    const { manager, section } = setup();
    const box = manager.createElement("container");
    manager.addElement(box, section.getId(), 0);
    const inner = manager.createElement("heading");
    manager.addElement(inner, box.getId());
    expect(box.getChildren().map((c) => c.getId())).toEqual([inner.getId()]);
    expect(section.getChildren()[0].getId()).toBe(box.getId());
  });
});
