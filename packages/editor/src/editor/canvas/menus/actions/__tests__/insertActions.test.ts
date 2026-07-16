/**
 * insertActions — Insert Before/After/Inside, Wrap, Unwrap.
 * Asserts the composer command calls each handler issues.
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { insertSubmenu } from "../insertActions";
import type { ActionContext } from "../../contextMenuRegistry";
import {
  makeComposer,
  makeElementStub,
  linkChildren,
  asComposer,
  type ComposerStub,
  type ElementStub,
} from "../../../__tests__/testHarness";
import type { Element } from "../../../../../engine";

function action(id: string) {
  const found = insertSubmenu.find((a) => a.id === id);
  if (!found) throw new Error(`insertSubmenu has no action "${id}"`);
  return found;
}

describe("insertActions", () => {
  let composer: ComposerStub;
  let parent: ElementStub;
  let element: ElementStub;
  let sibling: ElementStub;
  let newEl: ElementStub;
  let ctx: ActionContext;

  beforeEach(() => {
    parent = makeElementStub({ id: "parent-1", type: "container" });
    sibling = makeElementStub({ id: "sib-1", type: "container" });
    element = makeElementStub({ id: "el-1", type: "container" });
    linkChildren(parent, [sibling, element]);

    newEl = makeElementStub({ id: "new-1", type: "container" });
    composer = makeComposer();
    composer.elements.createElement = vi.fn(() => newEl);
    ctx = {
      composer: asComposer(composer),
      element: element as unknown as Element,
      isRoot: false,
    };
  });

  it("insert-before adds a placeholder at the element's index and selects it", () => {
    action("insert-before").handler!(ctx);

    expect(composer.beginTransaction).toHaveBeenCalledWith("context-insert-before");
    expect(composer.elements.addElement).toHaveBeenCalledWith(newEl, "parent-1", 1);
    expect(composer.selection.select).toHaveBeenCalledWith(newEl);
    expect(composer.endTransaction).toHaveBeenCalled();
  });

  it("insert-after adds a placeholder at index + 1", () => {
    action("insert-after").handler!(ctx);
    expect(composer.elements.addElement).toHaveBeenCalledWith(newEl, "parent-1", 2);
    expect(composer.selection.select).toHaveBeenCalledWith(newEl);
  });

  it("insert-inside-first inserts at index 0 of the element itself", () => {
    linkChildren(element, [makeElementStub({ id: "child-1" })]);
    action("insert-inside-first").handler!(ctx);
    expect(composer.elements.addElement).toHaveBeenCalledWith(newEl, "el-1", 0);
  });

  it("insert-inside-last inserts at the current child count", () => {
    linkChildren(element, [makeElementStub({ id: "c1" }), makeElementStub({ id: "c2" })]);
    action("insert-inside-last").handler!(ctx);
    expect(composer.elements.addElement).toHaveBeenCalledWith(newEl, "el-1", 2);
  });

  it("insert-before is a no-op when the element has no parent", () => {
    element._parent = null;
    action("insert-before").handler!(ctx);
    expect(composer.elements.addElement).not.toHaveBeenCalled();
    expect(composer.beginTransaction).not.toHaveBeenCalled();
  });

  it("wrap-section calls element.wrap('section')", () => {
    action("wrap-section").handler!(ctx);
    expect(element.wrap).toHaveBeenCalledWith("section");
  });

  it("unwrap calls element.unwrap()", () => {
    action("unwrap").handler!(ctx);
    expect(element.unwrap).toHaveBeenCalled();
  });

  describe("visibility / enablement predicates", () => {
    it("insert-before/after require a parent", () => {
      expect(action("insert-before").isVisible!(ctx)).toBe(true);
      element._parent = null;
      expect(action("insert-before").isVisible!(ctx)).toBe(false);
      expect(action("insert-after").isVisible!(ctx)).toBe(false);
    });

    it("insert-inside requires canHaveChildren and unlocked", () => {
      expect(action("insert-inside-first").isVisible!(ctx)).toBe(true);
      element.canHaveChildren.mockReturnValue(false);
      expect(action("insert-inside-first").isVisible!(ctx)).toBe(false);
      element.canHaveChildren.mockReturnValue(true);
      element.isLocked.mockReturnValue(true);
      expect(action("insert-inside-last").isVisible!(ctx)).toBe(false);
    });

    it("unwrap is enabled only when the element has children", () => {
      linkChildren(element, []);
      expect(action("unwrap").isEnabled!(ctx)).toBe(false);
      linkChildren(element, [makeElementStub({ id: "c1" })]);
      expect(action("unwrap").isEnabled!(ctx)).toBe(true);
    });
  });
});
