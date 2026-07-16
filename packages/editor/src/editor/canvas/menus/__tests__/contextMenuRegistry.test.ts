/**
 * contextMenuRegistry — 4 main groups + standalone actions, isVisible filtering,
 * empty-submenu collapse.
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { getContextMenuActions, type ActionContext } from "../contextMenuRegistry";
import {
  makeComposer,
  makeElementStub,
  asComposer,
  type ElementStub,
} from "../../__tests__/testHarness";
import type { Element } from "../../../../engine";

function makeCtx(overrides: Partial<{ element: ElementStub; isRoot: boolean; selectedIds: string[] }> = {}): ActionContext {
  const parent = makeElementStub({ id: "parent-1", type: "container" });
  const element =
    overrides.element ??
    makeElementStub({ id: "el-1", type: "container", parent, children: [] });
  const composer = makeComposer({
    selection: {
      getSelectedIds: () => overrides.selectedIds ?? ["el-1"],
    } as never,
  });
  return {
    composer: asComposer(composer),
    element: element as unknown as Element,
    isRoot: overrides.isRoot ?? false,
  };
}

describe("getContextMenuActions — structure", () => {
  it("returns the 4 main groups for a normal container element", () => {
    const actions = getContextMenuActions(makeCtx());
    const mainIds = actions.filter((a) => a.group === "main").map((a) => a.id);
    expect(mainIds).toEqual(["edit-group", "insert-group", "layout-group", "style-group"]);
  });

  it("every main group carries a non-empty submenu", () => {
    const actions = getContextMenuActions(makeCtx());
    for (const action of actions.filter((a) => a.group === "main")) {
      expect(action.submenu, `${action.id} submenu`).toBeDefined();
      expect(action.submenu!.length).toBeGreaterThan(0);
    }
  });

  it("appends standalone actions after the main groups", () => {
    const actions = getContextMenuActions(makeCtx());
    const standalone = actions.filter((a) => a.group === "standalone");
    expect(standalone.length).toBeGreaterThan(0);
    const firstStandaloneIndex = actions.findIndex((a) => a.group === "standalone");
    const lastMainIndex = actions.map((a) => a.group).lastIndexOf("main");
    expect(firstStandaloneIndex).toBeGreaterThan(lastMainIndex);
  });
});

describe("getContextMenuActions — isVisible filtering", () => {
  it("hides the layout group entirely for a non-container element (empty submenu collapses parent)", () => {
    // Layout submenu items are all isContainer-gated except the layer-ordering
    // quartet which is isRoot-gated — so use a non-container ROOT element.
    const textEl = makeElementStub({ id: "t-1", type: "text" });
    textEl.isContainer.mockReturnValue(false);
    const actions = getContextMenuActions(makeCtx({ element: textEl, isRoot: true }));
    expect(actions.find((a) => a.id === "layout-group")).toBeUndefined();
  });

  it("keeps the layout group when only the layer-ordering items are visible", () => {
    const textEl = makeElementStub({ id: "t-1", type: "text" });
    textEl.isContainer.mockReturnValue(false);
    const actions = getContextMenuActions(makeCtx({ element: textEl, isRoot: false }));
    const layout = actions.find((a) => a.id === "layout-group");
    expect(layout).toBeDefined();
    expect(layout!.submenu!.map((a) => a.id)).toEqual([
      "bring-to-front",
      "bring-forward",
      "send-backward",
      "send-to-back",
    ]);
  });

  it("filters standalone lock/unlock by current lock state", () => {
    const lockedEl = makeElementStub({ id: "l-1", type: "container", locked: true });
    const actions = getContextMenuActions(makeCtx({ element: lockedEl }));
    const ids = actions.map((a) => a.id);
    expect(ids).toContain("unlock-element");
    expect(ids).not.toContain("lock-element");

    const unlockedActions = getContextMenuActions(makeCtx());
    const unlockedIds = unlockedActions.map((a) => a.id);
    expect(unlockedIds).toContain("lock-element");
    expect(unlockedIds).not.toContain("unlock-element");
  });

  it("hides group-elements unless 2+ elements are selected", () => {
    const single = getContextMenuActions(makeCtx({ selectedIds: ["el-1"] }));
    expect(single.map((a) => a.id)).not.toContain("group-elements");

    const multi = getContextMenuActions(makeCtx({ selectedIds: ["el-1", "el-2"] }));
    expect(multi.map((a) => a.id)).toContain("group-elements");
  });

  it("hides select-parent when the element has no parent", () => {
    const orphan = makeElementStub({ id: "o-1", type: "container", parent: null });
    const actions = getContextMenuActions(makeCtx({ element: orphan }));
    expect(actions.map((a) => a.id)).not.toContain("select-parent");
  });
});
