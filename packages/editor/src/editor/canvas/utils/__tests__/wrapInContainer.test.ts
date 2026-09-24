/**
 * G2-052: one wrap — a container <div>, one transaction, refusals say why.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { wrapInContainer } from "../wrapInContainer";

const make = (over: Partial<Record<"isRoot" | "isLocked" | "isComponentInstance", boolean>> = {}) => {
  const wrapper = { id: "w" };
  const element = {
    isRoot: () => !!over.isRoot,
    isLocked: () => !!over.isLocked,
    isComponentInstance: () => !!over.isComponentInstance,
    wrap: vi.fn(() => wrapper),
  };
  const composer = { beginTransaction: vi.fn(), endTransaction: vi.fn(), selection: { select: vi.fn() } };
  return { element, composer, wrapper };
};

describe("wrapInContainer", () => {
  it("wraps in a div in one transaction and selects the wrapper", () => {
    const { element, composer, wrapper } = make();
    expect(wrapInContainer(composer as never, element as never)).toBe(wrapper);
    expect(element.wrap).toHaveBeenCalledWith("div");
    expect(composer.beginTransaction).toHaveBeenCalledWith("wrap-container");
    expect(composer.selection.select).toHaveBeenCalledWith(wrapper);
  });

  it.each([
    [{ isLocked: true }, /locked/],
    [{ isComponentInstance: true }, /Detach/],
    [{ isRoot: true }, /page itself/],
  ] as const)("refuses %o with a toast that says why", (over, text) => {
    const { element, composer } = make(over);
    const addToast = vi.fn();
    expect(wrapInContainer(composer as never, element as never, addToast)).toBeNull();
    expect(element.wrap).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringMatching(text) }));
  });
});
