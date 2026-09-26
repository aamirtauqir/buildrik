/**
 * A locked element survives ⌘A + Delete (and ⌘A + Cut).
 *
 * Walked live (A-5, verify pass 3): lock an image, ⌘A, Delete — the canvas
 * went 11 → 3 elements and the locked image was gone. delete/cut already drop
 * a LOCKED element from the selection, but ⌘A selects every element, and
 * topMost() prunes the selection to its top-level ancestors — so the image
 * was never looked at: the unlocked section around it was removed, subtree
 * and all.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { EVENTS } from "../../../shared/constants/events";
import {
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
  createTestComposer,
} from "../../__tests__/test-utils/realComposer";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

function setup() {
  const c = createTestComposer();
  const page = c.elements.getActivePage() ?? c.elements.createPage("Home");
  const section = c.elements.createElement("section", {});
  c.elements.addElement(section, page.root.id);
  const img = c.elements.createElement("image", {});
  const text = c.elements.createElement("text", { content: "Caption" });
  c.elements.addElement(img, section.getId());
  c.elements.addElement(text, section.getId());
  const heading = c.elements.createElement("heading", { content: "Title" });
  c.elements.addElement(heading, page.root.id);
  c.elements.getElement(img.getId())!.setLocked(true);
  const skipped = vi.fn();
  c.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, skipped);
  c.selection.selectAll();
  return { c, ids: { section: section.getId(), img: img.getId(), text: text.getId(), heading: heading.getId() }, skipped };
}

describe("A-5 — select-all destructive ops keep locked descendants", () => {
  it("⌘A + Delete removes everything unlocked and keeps the locked image with its ancestors", () => {
    const { c, ids, skipped } = setup();
    c.commands.run("delete", { confirmed: true });

    expect(c.elements.getElement(ids.img)).toBeTruthy();
    expect(c.elements.getElement(ids.section)).toBeTruthy();
    expect(c.elements.getElement(ids.text)).toBeFalsy();
    expect(c.elements.getElement(ids.heading)).toBeFalsy();
    expect(skipped).toHaveBeenCalled();
  });

  it("⌘A + Cut does the same, and the clipboard holds only what was removed", () => {
    const { c, ids, skipped } = setup();
    c.commands.run("cut");

    expect(c.elements.getElement(ids.img)).toBeTruthy();
    expect(c.elements.getElement(ids.section)).toBeTruthy();
    expect(c.elements.getElement(ids.text)).toBeFalsy();
    expect(c.elements.getElement(ids.heading)).toBeFalsy();
    expect((c.clipboard ?? []).map((d) => d.content).sort()).toEqual(["Caption", "Title"]);
    expect(skipped).toHaveBeenCalled();
  });

  it("the multi-delete confirm counts what will actually go", () => {
    const { c } = setup();
    const request = vi.fn();
    c.on(EVENTS.UI_REQUEST_DELETE_SELECTION, request);
    c.commands.run("delete");
    expect(request).toHaveBeenCalledWith({ count: 2 });
  });
});
