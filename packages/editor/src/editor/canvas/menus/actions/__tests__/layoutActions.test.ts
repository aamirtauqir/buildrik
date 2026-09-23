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
    ["bring-to-front"],
    ["bring-forward"],
    ["send-backward"],
    ["send-to-back"],
  ])("%s runs the composer command of the same name", (id) => {
    action(id).handler!(ctx);
    expect(composer.commands.run).toHaveBeenCalledWith(id);
  });

  describe("visibility predicates", () => {

    it("layer ordering is hidden on the root element", () => {
      const rootCtx = { ...ctx, isRoot: true };
      for (const id of ["bring-to-front", "bring-forward", "send-backward", "send-to-back"]) {
        expect(action(id).isVisible!(ctx)).toBe(true);
        expect(action(id).isVisible!(rootCtx)).toBe(false);
      }
    });
  });
});
