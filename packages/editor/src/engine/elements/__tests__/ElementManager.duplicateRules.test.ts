/**
 * BK-06: duplicate, paste and page-duplicate kept only an element's base
 * styles. Its Tablet/Mobile values and its :hover live in StyleEngine rules
 * keyed to its id, and the copy's fresh id matched none of them — a 24/40/32
 * heading with a red hover came out 24/24/24 with no hover, and a reload did
 * not repair it. The rules are copied onto the new ids, children included.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { elementSelector } from "@/shared/utils/elementSelector";
import { stylesAt } from "@/engine/commands/commandOperations";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let c: Composer;
let root: string;
const add = (type: string, parent = root): Element => {
  const el = c.elements.createElement(type as never, {} as never);
  c.elements.addElement(el, parent);
  return c.elements.getElement(el.getId())!;
};
const style = (el: Element) => {
  el.setStyle("font-size", "24px");
  c.styles.setBreakpointStyle(el.getId(), "tablet", { "font-size": "40px" });
  c.styles.setBreakpointStyle(el.getId(), "mobile", { "font-size": "32px" });
  c.styles.setRule(elementSelector(el.getId()), { color: "rgb(255, 0, 0)" }, { pseudo: ":hover" });
};
const expectStyled = (el: Element) => {
  expect(stylesAt(c, el, "desktop")["font-size"]).toBe("24px");
  expect(stylesAt(c, el, "tablet")["font-size"]).toBe("40px");
  expect(stylesAt(c, el, "mobile")["font-size"]).toBe("32px");
  expect(stylesAt(c, el, "desktop", "hover").color).toBe("rgb(255, 0, 0)");
};

beforeEach(() => {
  c = createTestComposer();
  root = c.elements.createPage("Home").root.id;
});

describe("copies keep their breakpoint and :state rules (BK-06)", () => {
  it("duplicate", () => {
    const src = add("heading");
    style(src);
    const copy = c.elements.duplicateElement(src.getId())!;
    expect(copy.getId()).not.toBe(src.getId());
    expectStyled(copy);
    expectStyled(src);
  });

  it("duplicate copies the rules of nested children too", () => {
    const box = add("container");
    const child = add("heading", box.getId());
    style(child);
    const copy = c.elements.duplicateElement(box.getId())!;
    const copiedChild = copy.getChildren()[0];
    expect(copiedChild.getId()).not.toBe(child.getId());
    expectStyled(copiedChild);
  });

  it("copy + paste, and cut + paste", () => {
    const src = add("heading");
    style(src);
    const pasted = c.elements.pasteElement(c.elements.serializeElement(src.getId())!, c.elements.getElement(root)!)!;
    expectStyled(pasted);

    const data = c.elements.serializeElement(src.getId())!;
    c.elements.removeElement(src.getId());
    const afterCut = c.elements.pasteElement(data, c.elements.getElement(root)!)!;
    expect(afterCut.getId()).not.toBe(src.getId());
    expectStyled(afterCut);
  });

  it("page duplicate", () => {
    const src = add("heading");
    style(src);
    const page = c.elements.duplicatePage(c.elements.getActivePage()!.id)!;
    const copiedHeading = c.elements.getElement(page.root.id)!.getChildren()[0];
    expect(copiedHeading.getId()).not.toBe(src.getId());
    expectStyled(copiedHeading);
  });

  it("the copied rules are saved with the project, so a reload keeps them", () => {
    const src = add("heading");
    style(src);
    const copy = c.elements.duplicateElement(src.getId())!;
    const saved = c.exportProject().styles ?? [];
    expect(saved.some((r) => r.selector === `${elementSelector(copy.getId())}:hover`)).toBe(true);
  });
});
