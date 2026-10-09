/**
 * A-5: findValidDropTarget must refuse a component instance's subtree as a
 * drop target — syncInstance discards structural edits inside an instance,
 * so a block dropped there silently vanished on the next sync. Matches the
 * lock/instance refusal defaultCommands.ts already applies to delete/cut.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/shared/utils/nesting", () => ({
  canHaveChildren: () => true,
  canNestElement: () => true,
}));

import { findValidDropTarget } from "../dropTarget";
import type { Element } from "@/engine/elements/Element";

function makeElement(
  id: string,
  opts: { parent?: Element | null; instance?: boolean } = {},
): Element {
  const el = {
    getId: () => id,
    getType: () => "container",
    getParent: () => opts.parent ?? null,
    getChildIndex: () => 0,
    isComponentInstance: () => opts.instance === true,
  };
  return el as unknown as Element;
}

describe("findValidDropTarget — component instance refusal", () => {
  it("refuses the instance root itself as a drop target", () => {
    const instanceRoot = makeElement("inst-1", { instance: true });

    const result = findValidDropTarget(instanceRoot, "heading");

    expect(result.success).toBe(false);
  });

  it("refuses an element nested inside an instance and climbs past it", () => {
    const instanceRoot = makeElement("inst-1", { instance: true });
    const child = makeElement("child-1", { parent: instanceRoot, instance: true });

    const result = findValidDropTarget(child, "heading");

    expect(result.success).toBe(false);
  });

  it("still finds a normal (non-instance) ancestor as a valid target", () => {
    const page = makeElement("page-1");
    const section = makeElement("section-1", { parent: page });

    const result = findValidDropTarget(section, "heading");

    expect(result.success).toBe(true);
    expect(result.result?.parent.getId()).toBe("section-1");
  });
});
