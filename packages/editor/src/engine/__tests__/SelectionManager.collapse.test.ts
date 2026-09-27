/**
 * P-12 — clicking the primary element of a multi-selection collapses it.
 *
 * select() returned early whenever the element was already the primary, so a
 * plain click on the first of three selected elements left all three
 * selected — the only way back to one was to click something else first.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { EVENTS } from "../../shared/constants/events";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "./test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function setup() {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  const els = ["A", "B", "C"].map((t) => {
    const el = c.elements.createElement("heading", { content: t });
    c.elements.addElement(el, page.root.id);
    return el;
  });
  c.selection.selectMultiple(els);
  return { c, els };
}

describe("P-12 — select(primary) collapses a multi-selection", () => {
  it("selecting the primary leaves only the primary selected", () => {
    const { c } = setup();
    const primary = c.selection.getSelected()!;
    expect(c.selection.getAllSelected()).toHaveLength(3);
    c.selection.select(primary);
    expect(c.selection.getAllSelected()).toEqual([primary]);
    expect(c.selection.getSelected()).toBe(primary);
  });

  it("announces the new selection and does not report the primary as deselected", () => {
    const { c } = setup();
    const primary = c.selection.getSelected()!;
    const selected = vi.fn();
    const deselected = vi.fn();
    c.on(EVENTS.ELEMENT_SELECTED, selected);
    c.on(EVENTS.ELEMENT_DESELECTED, deselected);
    c.selection.select(primary);
    expect(selected).toHaveBeenCalledWith(primary);
    expect(deselected).not.toHaveBeenCalledWith(primary);
  });

  it("re-selecting a lone selection is still a no-op", () => {
    const { c, els } = setup();
    c.selection.select(els[1]);
    const selected = vi.fn();
    c.on(EVENTS.ELEMENT_SELECTED, selected);
    c.selection.select(els[1]);
    expect(selected).not.toHaveBeenCalled();
  });
});
