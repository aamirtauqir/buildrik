// @vitest-environment jsdom
/**
 * resetInstanceOverride — take the master's value back for ONE property of an
 * instance (board 26's override dot "Reset to master"), leaving the
 * instance's other edits alone. The whole-instance reset (resetInstance) is
 * the ⋯ "Reset to master" row; this is the per-field one.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Composer } from "@/engine/Composer";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

async function instance(): Promise<{ c: Composer; id: string; childId: string }> {
  const c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const banner = c.elements.createElement("container" as never, {} as never);
  c.elements.addElement(banner, root);
  banner.setStyle("padding-top", "16px");
  const text = c.elements.createElement("text" as never, { content: "Book" } as never);
  c.elements.addElement(text, banner.getId());
  text.setStyle("color", "black");
  const comp = (await c.components.createComponent("Reservation banner", banner.getId()))!;
  const id = (await c.components.instantiateComponent(comp.id, root))!;
  const childId = c.elements.getElement(id)!.getChildren()[0].getId();
  return { c, id, childId };
}

describe("ComponentManager.resetInstanceOverride", () => {
  it("puts the master's value back for one style and keeps the other edits", async () => {
    const { c, id } = await instance();
    const el = c.elements.getElement(id)!;
    el.setStyle("padding-top", "32px");
    el.setStyle("padding-bottom", "40px");
    expect(Object.keys(c.components.getOverridesForElement(id)).sort()).toEqual(["padding-bottom", "padding-top"]);

    expect(c.components.resetInstanceOverride(id, "style", "padding-top")).toBe(true);

    expect(c.elements.getElement(id)!.getStyles()["padding-top"]).toBe("16px");
    expect(c.elements.getElement(id)!.getStyles()["padding-bottom"]).toBe("40px");
    expect(Object.keys(c.components.getOverridesForElement(id))).toEqual(["padding-bottom"]);
  });

  it("a property the master never set is removed, not pinned", async () => {
    const { c, id } = await instance();
    c.elements.getElement(id)!.setStyle("margin-top", "8px");
    c.components.resetInstanceOverride(id, "style", "margin-top");
    expect(c.elements.getElement(id)!.getStyles()["margin-top"]).toBeUndefined();
    expect(c.components.getOverridesForElement(id)).toEqual({});
  });

  it("works on an element inside the instance, by its position in the master", async () => {
    const { c, childId } = await instance();
    c.elements.getElement(childId)!.setStyle("color", "red");
    expect(c.components.getOverridesForElement(childId)).toEqual({ color: "red" });
    c.components.resetInstanceOverride(childId, "style", "color");
    expect(c.elements.getElement(childId)!.getStyles().color).toBe("black");
    expect(c.components.getOverridesForElement(childId)).toEqual({});
  });

  it("an attribute override is reset too", async () => {
    const { c, id } = await instance();
    c.elements.getElement(id)!.setAttribute("title", "Mine");
    c.components.resetInstanceOverride(id, "attribute", "title");
    expect(c.elements.getElement(id)!.getAttribute("title")).toBeUndefined();
    const stored = c.components.getInstance(id)!.overrides.map((o) => o.path);
    expect(stored.some((p) => p.endsWith("/attribute/title"))).toBe(false);
  });

  it("says false for an element that is not in an instance, or a property with no override", async () => {
    const { c, id } = await instance();
    const root = c.elements.getElement(id)!.getParent()!.getId();
    const loose = c.elements.createElement("text" as never, {} as never);
    c.elements.addElement(loose, root);
    expect(c.components.resetInstanceOverride(loose.getId(), "style", "color")).toBe(false);
    expect(c.components.resetInstanceOverride(id, "style", "padding-top")).toBe(false);
  });
});
