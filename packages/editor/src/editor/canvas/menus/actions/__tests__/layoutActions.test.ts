/**
 * layoutActions — flex/grid/center/space-between style writes + layer ordering
 * composer command calls.
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { layoutSubmenu } from "../layoutActions";
import type { ActionContext } from "../../contextMenuRegistry";
import {
  makeComposer,
  makeElementStub,
  asComposer,
  type ComposerStub,
  type ElementStub,
} from "../../../__tests__/testHarness";
import type { Element } from "../../../../../engine";

function action(id: string) {
  const found = layoutSubmenu.find((a) => a.id === id);
  if (!found) throw new Error(`layoutSubmenu has no action "${id}"`);
  return found;
}

describe("layoutActions", () => {
  let composer: ComposerStub;
  let element: ElementStub;
  let ctx: ActionContext;

  beforeEach(() => {
    composer = makeComposer();
    element = makeElementStub({ id: "el-1", type: "container" });
    ctx = {
      composer: asComposer(composer),
      element: element as unknown as Element,
      isRoot: false,
    };
  });

  it.each([
    ["layout-flex-row", [["display", "flex"], ["flexDirection", "row"]]],
    ["layout-flex-column", [["display", "flex"], ["flexDirection", "column"]]],
    ["layout-center", [["display", "flex"], ["alignItems", "center"], ["justifyContent", "center"]]],
    ["layout-space-between", [["display", "flex"], ["justifyContent", "space-between"]]],
  ] as const)("%s sets the expected styles inside a transaction", (id, styles) => {
    action(id).handler!(ctx);
    for (const [key, value] of styles) {
      expect(element.setStyle).toHaveBeenCalledWith(key, value);
    }
    expect(composer.beginTransaction).toHaveBeenCalledWith(id);
    expect(composer.endTransaction).toHaveBeenCalled();
  });

  it("layout-grid sets 2-column grid and defaults gap to 16px when unset", () => {
    action("layout-grid").handler!(ctx);
    expect(element.setStyle).toHaveBeenCalledWith("display", "grid");
    expect(element.setStyle).toHaveBeenCalledWith(
      "gridTemplateColumns",
      "repeat(2, minmax(0, 1fr))",
    );
    expect(element.setStyle).toHaveBeenCalledWith("gap", "16px");
  });

  it("layout-grid preserves an existing gap", () => {
    element.getStyle.mockImplementation((key: string) => (key === "gap" ? "24px" : undefined));
    action("layout-grid").handler!(ctx);
    expect(element.setStyle).toHaveBeenCalledWith("gap", "24px");
  });

  it.each([
    ["bring-to-front"],
    ["bring-forward"],
    ["send-backward"],
    ["send-to-back"],
  ])("%s runs the composer command of the same name", (id) => {
    action(id).handler!(ctx);
    expect(composer.commands.run).toHaveBeenCalledWith(id);
  });

  describe("visibility predicates", () => {
    it("flex/grid/center/space-between are container-only", () => {
      for (const id of [
        "layout-flex-row",
        "layout-flex-column",
        "layout-grid",
        "layout-center",
        "layout-space-between",
      ]) {
        expect(action(id).isVisible!(ctx)).toBe(true);
      }
      element.isContainer.mockReturnValue(false);
      for (const id of ["layout-flex-row", "layout-grid", "layout-center"]) {
        expect(action(id).isVisible!(ctx)).toBe(false);
      }
    });

    it("layer ordering is hidden on the root element", () => {
      const rootCtx = { ...ctx, isRoot: true };
      for (const id of ["bring-to-front", "bring-forward", "send-backward", "send-to-back"]) {
        expect(action(id).isVisible!(ctx)).toBe(true);
        expect(action(id).isVisible!(rootCtx)).toBe(false);
      }
    });
  });
});
