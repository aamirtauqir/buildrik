/**
 * rootMove — the row menu's Move up / Move down (design-2l9 boards 137:53911,
 * 137:59625) as the engine's "after <id>".
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { rootMove } from "../PagesTab";

// Site order: home, about, legal (in a folder), work, contact.
const site = ["home", "about", "legal", "work", "contact"];
const roots = ["home", "about", "work", "contact"];

describe("rootMove", () => {
  it("down: after the next top-level page", () => {
    expect(rootMove(site, roots, "about", 1)).toEqual({ afterId: "work", position: 3 });
  });
  it("up: after whatever precedes the previous top-level page in site order", () => {
    expect(rootMove(site, roots, "work", -1)).toEqual({ afterId: "home", position: 2 });
    expect(rootMove(site, roots, "about", -1)).toEqual({ afterId: null, position: 1 });
  });
  it("null at either end and for a folder member", () => {
    expect(rootMove(site, roots, "home", -1)).toBeNull();
    expect(rootMove(site, roots, "contact", 1)).toBeNull();
    expect(rootMove(site, roots, "legal", 1)).toBeNull();
  });
});
