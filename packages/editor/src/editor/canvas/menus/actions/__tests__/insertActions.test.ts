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






  /* G2-052: one wrap — "Wrap in container" (board 7052:78347), a div. */
  it("wrap-container wraps in a div", () => {
    Object.assign(element, { isRoot: () => false, isLocked: () => false, isComponentInstance: () => false });
    action("wrap-container").handler!(ctx);
    expect(element.wrap).toHaveBeenCalledWith("div");
  });

  it("unwrap calls element.unwrap()", () => {
    action("unwrap").handler!(ctx);
    expect(element.unwrap).toHaveBeenCalled();
  });

  describe("visibility / enablement predicates", () => {


    /* This guard used to ride on `isLocked()`, which returned true for every
       component instance. `isLocked` stopped conflating the two on 2026-08-25,
       so the guard is named here now — structural edits inside an instance
       subtree are discarded by the next `syncInstance`, so they stay blocked. */

    it("unwrap is enabled only when the element has children", () => {
      linkChildren(element, []);
      expect(action("unwrap").isEnabled!(ctx)).toBe(false);
      linkChildren(element, [makeElementStub({ id: "c1" })]);
      expect(action("unwrap").isEnabled!(ctx)).toBe(true);
    });
  });
});
