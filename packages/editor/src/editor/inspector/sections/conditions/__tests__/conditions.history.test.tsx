// @vitest-environment jsdom
/**
 * B-11 against a real Composer: a condition write is one undo step, and
 * activating an old condition (old binding out, rule in) is ONE step too.
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { useConditions } from "../useConditions";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function setup() {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  const h = c.elements.createElement("heading" as never, { content: "Hi" } as never);
  c.elements.addElement(h, page.root.id);
  return { c, id: h.getId() };
}

describe("conditions history (real composer)", () => {
  it("set is one undo step; the project carries it", () => {
    const { c, id } = setup();
    c.cms.bindings.setCondition(id, { match: "all", rules: [{ field: "sunday", op: "set" }] }, "Add visibility condition");
    expect(c.exportProject().cmsBindings?.conditions?.[id]).toBeTruthy();
    c.history.undo();
    expect(c.cms.bindings.getCondition(id)).toBeNull();
    c.history.redo();
    expect(c.cms.bindings.getCondition(id)).toBeTruthy();
  });

  it("activating an old condition is one step; Undo brings the old one back", () => {
    const { c, id } = setup();
    c.elements.getElement(id)!.setDataBinding("condition", { type: "condition", sourceId: "", path: "", condition: { operator: "exists", left: "opening_hours.sunday" } } as never);
    c.history.flushPending?.();
    const { result } = renderHook(() => useConditions(c, id));
    act(() => {
      expect(result.current.activateLegacy()).toBe(true);
    });
    expect(c.cms.bindings.getCondition(id)).toEqual({ match: "all", rules: [{ field: "opening_hours.sunday", op: "set" }] });
    expect(c.elements.getElement(id)!.getDataBinding("condition")).toBeUndefined();
    act(() => {
      c.history.undo();
    });
    expect(c.cms.bindings.getCondition(id)).toBeNull();
    expect(c.elements.getElement(id)!.getDataBinding("condition")).toBeTruthy();
  });
});
