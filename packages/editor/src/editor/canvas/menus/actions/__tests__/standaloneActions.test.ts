/**
 * standaloneActions — save-as-component emit, reveal-in-layers, select-parent,
 * group/ungroup, lock/unlock.
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { standaloneActions } from "../standaloneActions";
import { EVENTS } from "../../../../../shared/constants/events";
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
  const found = standaloneActions.find((a) => a.id === id);
  if (!found) throw new Error(`standaloneActions has no action "${id}"`);
  return found;
}

describe("standaloneActions", () => {
  let composer: ComposerStub;
  let element: ElementStub;
  let parent: ElementStub;
  let ctx: ActionContext;

  beforeEach(() => {
    composer = makeComposer();
    parent = makeElementStub({ id: "parent-1", type: "container" });
    element = makeElementStub({ id: "el-1", type: "container", parent });
    ctx = {
      composer: asComposer(composer),
      element: element as unknown as Element,
      isRoot: false,
    };
  });

  describe("save-as-component", () => {
    it("emits COMPONENT_SAVE_AS_REQUESTED with the multi-selection when present", () => {
      composer.selection.getSelectedIds.mockReturnValue(["a", "b"]);
      const bindings = [{ token: "color.accent" }];
      composer.designSystem.tokenBindingResolver.resolveForElements.mockReturnValue(bindings);

      action("save-as-component").handler!(ctx);

      expect(
        composer.designSystem.tokenBindingResolver.resolveForElements,
      ).toHaveBeenCalledWith(["a", "b"], (composer.elements.getAllElements as () => unknown)());
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.COMPONENT_SAVE_AS_REQUESTED, {
        selectionIds: ["a", "b"],
        extractedBindings: bindings,
      });
    });

    it("falls back to the right-clicked element when nothing is selected", () => {
      composer.selection.getSelectedIds.mockReturnValue([]);
      action("save-as-component").handler!(ctx);
      expect(composer.emit).toHaveBeenCalledWith(
        EVENTS.COMPONENT_SAVE_AS_REQUESTED,
        expect.objectContaining({ selectionIds: ["el-1"] }),
      );
    });

    it("is hidden on root", () => {
      expect(action("save-as-component").isVisible!({ ...ctx, isRoot: true })).toBe(false);
    });
  });

  it("reveal-in-layers selects the element and emits layers:reveal", () => {
    action("reveal-in-layers").handler!(ctx);
    expect(composer.selection.select).toHaveBeenCalledWith(element);
    expect(composer.emit).toHaveBeenCalledWith("layers:reveal", element);
  });

  describe("select-parent", () => {
    it("selects the parent element", () => {
      action("select-parent").handler!(ctx);
      expect(composer.selection.select).toHaveBeenCalledWith(parent);
    });

    it("is hidden without a parent", () => {
      element._parent = null;
      expect(action("select-parent").isVisible!(ctx)).toBe(false);
    });
  });

  describe("group / ungroup", () => {
    it("group-elements groups the selection and selects the new group", () => {
      const group = makeElementStub({ id: "group-1", type: "container" });
      composer.selection.getSelectedIds.mockReturnValue(["a", "b"]);
      composer.elements.groupElements.mockReturnValue(group);

      action("group-elements").handler!(ctx);

      expect(composer.beginTransaction).toHaveBeenCalledWith("group-elements");
      expect(composer.elements.groupElements).toHaveBeenCalledWith(["a", "b"]);
      expect(composer.selection.select).toHaveBeenCalledWith(group);
      expect(composer.endTransaction).toHaveBeenCalled();
    });

    it("group-elements bails silently below 2 selected ids", () => {
      composer.selection.getSelectedIds.mockReturnValue(["a"]);
      action("group-elements").handler!(ctx);
      expect(composer.elements.groupElements).not.toHaveBeenCalled();
    });

    it("ungroup-elements ungroups and clears the selection", () => {
      action("ungroup-elements").handler!(ctx);
      expect(composer.elements.ungroupElement).toHaveBeenCalledWith("el-1");
      expect(composer.selection.clear).toHaveBeenCalled();
    });

    it("ungroup is visible only for containers with children", () => {
      linkChildren(element, []);
      expect(action("ungroup-elements").isVisible!(ctx)).toBe(false);
      linkChildren(element, [makeElementStub({ id: "c1" })]);
      expect(action("ungroup-elements").isVisible!(ctx)).toBe(true);
      element.getType.mockReturnValue("text");
      expect(action("ungroup-elements").isVisible!(ctx)).toBe(false);
    });
  });

  describe("lock / unlock", () => {
    it("lock-element sets locked=true in a transaction", () => {
      action("lock-element").handler!(ctx);
      expect(composer.beginTransaction).toHaveBeenCalledWith("lock-element");
      expect(element.setLocked).toHaveBeenCalledWith(true);
    });

    it("unlock-element sets locked=false", () => {
      action("unlock-element").handler!(ctx);
      expect(element.setLocked).toHaveBeenCalledWith(false);
    });

    it("visibility flips on lock state and hides on root", () => {
      expect(action("lock-element").isVisible!(ctx)).toBe(true);
      expect(action("unlock-element").isVisible!(ctx)).toBe(false);
      element.isLocked.mockReturnValue(true);
      expect(action("lock-element").isVisible!(ctx)).toBe(false);
      expect(action("unlock-element").isVisible!(ctx)).toBe(true);
      expect(action("lock-element").isVisible!({ ...ctx, isRoot: true })).toBe(false);
    });
  });
});
