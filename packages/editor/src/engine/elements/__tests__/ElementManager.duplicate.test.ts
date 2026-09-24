/**
 * duplicateElement must hand out a copy that owns its data: the clone used to
 * share the original's `attributes` object, so editing the copy's href / src
 * rewrote the original too (found through New page's nav link, 2026-09-24).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { makeEngine } from "./harness";

describe("ElementManager.duplicateElement — the copy owns its data", () => {
  it("changing the duplicate's attribute leaves the original alone", () => {
    const { manager } = makeEngine();
    const home = manager.createPage("Home");
    const a = manager.createElement("link" as never, { content: "Menu", attributes: { href: "#page:m" } });
    manager.addElement(a, home.root.id);
    const copy = manager.duplicateElement(a.getId())!;
    copy.setAttribute("href", "#page:x");
    expect(a.getAttribute("href")).toBe("#page:m");
  });
});
