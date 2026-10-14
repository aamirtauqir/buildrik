/**
 * standaloneActions — save-as-component emit, reveal-in-layers, select-parent,
 * group/ungroup, lock/unlock.
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { standaloneActions } from "../standaloneActions";
import { EVENTS } from "@/shared/constants/events";
import type { ActionContext } from "@/editor/canvas/menus/contextMenuRegistry";
import {
  makeComposer,
  makeElementStub,
  linkChildren,
  asComposer,
  type ComposerStub,
  type ElementStub,
} from "@/editor/canvas/__tests__/testHarness";
import type { Element } from "@/engine";
import { BINDABLE_TYPES, capabilitiesFor } from "@/shared/constants/elementCapabilities";

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

  /* Gap walk 93 #4: the row opened the CMS workspace on its collection list,
     over the canvas and the element being bound — no field picker. The
     picker is the inspector's Content section (Source · Collection · Field),
     so the row selects the element and reveals that section, the same way
     "Add interaction" reveals Interactions. */
  describe("bind-to-cms", () => {
    it("reveals the element's CMS binding section instead of opening the CMS workspace", () => {
      const heading = makeElementStub({ id: "h-1", type: "heading", parent });
      action("bind-to-cms").handler!({ ...ctx, element: heading as unknown as Element });
      expect(composer.selection.select).toHaveBeenCalledWith(heading);
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "cms-binding" });
      expect(composer.emit).not.toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "content" });
    });

    it("is offered only on types whose capabilities carry the CMS binding section", () => {
      for (const type of BINDABLE_TYPES) {
        const el = makeElementStub({ id: `x-${type}`, type, parent });
        expect(action("bind-to-cms").isVisible!({ ...ctx, element: el as unknown as Element })).toBe(true);
        expect(capabilitiesFor(type).cmsBindable).toBe(true);
      }
    });
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
    /* The shared lock commands (one transaction each, the same the Inspector
       and Layers run) — on the right-clicked element. */
    it("lock-element runs the lock command on this element", () => {
      (composer as unknown as { commands: { run: ReturnType<typeof vi.fn> } }).commands = { run: vi.fn() };
      action("lock-element").handler!(ctx);
      expect((composer as unknown as { commands: { run: ReturnType<typeof vi.fn> } }).commands.run).toHaveBeenCalledWith("lock-element", { elementId: element.getId() });
    });

    it("unlock-element runs the unlock command on this element", () => {
      (composer as unknown as { commands: { run: ReturnType<typeof vi.fn> } }).commands = { run: vi.fn() };
      action("unlock-element").handler!(ctx);
      expect((composer as unknown as { commands: { run: ReturnType<typeof vi.fn> } }).commands.run).toHaveBeenCalledWith("unlock-element", { elementId: element.getId() });
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
