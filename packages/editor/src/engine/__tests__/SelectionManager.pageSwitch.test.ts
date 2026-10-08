/**
 * L3-002 (Critical) — a selection survived a page switch, so the Add panel's
 * smart placement walked up from an element on the PREVIOUS page and inserted
 * there; the visible page stayed empty and the toast named the hidden target.
 * A switch to another page drops a selection that is not on it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "./test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function setup() {
  const c = createTestComposer();
  const home = c.elements.createPage("Home");
  const team = c.elements.createPage("Team");
  const el = c.elements.createElement("heading", { content: "On Home" });
  c.elements.addElement(el, home.root.id);
  return { c, home, team, el };
}

describe("a page switch drops a selection from another page", () => {
  it("switching away clears the selection", () => {
    const { c, home, team, el } = setup();
    c.elements.setActivePage(home.id);
    c.selection.select(el);
    c.elements.setActivePage(team.id);
    expect(c.selection.getSelectedIds()).toEqual([]);
  });

  it("re-activating the page the selection is on keeps it", () => {
    const { c, home, el } = setup();
    c.elements.setActivePage(home.id);
    c.selection.select(el);
    c.elements.setActivePage(home.id);
    expect(c.selection.getSelectedIds()).toEqual([el.getId()]);
  });
});
