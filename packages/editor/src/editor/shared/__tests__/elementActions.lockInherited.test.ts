/**
 * Command-palette / menu element actions that change an element refuse one
 * under a locked layer (a lock covers everything inside it, 147:77668):
 * Replace with block… and Wrap in container.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { ELEMENT_ACTIONS } from "../elementActions";
import { wrapInContainer } from "@/editor/canvas/utils/wrapInContainer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function setup() {
  const c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const outer = c.elements.createElement("section");
  c.elements.addElement(outer, root);
  const inner = c.elements.createElement("section");
  c.elements.addElement(inner, outer.getId());
  c.elements.getElement(outer.getId())!.setLocked(true);
  return { c, inner: c.elements.getElement(inner.getId())! };
}

describe("element actions under a locked layer", () => {
  it("Replace with block… is refused, with the reason", () => {
    const { c, inner } = setup();
    expect(ELEMENT_ACTIONS["replace-with-block"].isEnabled?.({ composer: c, element: inner, isRoot: false })).toBe("Unlock it to replace it");
  });

  it("Wrap in container is refused, and says so", () => {
    const { c, inner } = setup();
    const toast = vi.fn();
    expect(wrapInContainer(c, inner, toast)).toBeNull();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: "This element is locked — unlock it to wrap it." }));
  });
});
