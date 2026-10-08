/**
 * L1-007 — undo jumped the editor to the first page. Undo restores a snapshot
 * through importProject, which resets the active page to pages[0]; an edit
 * undone on "About" left the user on "Home", with the undone change out of view.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { installEngineBrowserStubs, removeEngineBrowserStubs, createTestComposer } from "./test-utils/realComposer";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

describe("undo and redo keep the page the user is on", () => {
  it("undoing an edit on a second page stays on that page", () => {
    const c = createTestComposer();
    c.elements.getActivePage() ?? c.elements.createPage("Home");
    const about = c.elements.createPage("About");
    c.history.flushPending();
    c.elements.setActivePage(about.id);

    c.beginTransaction("Added Heading");
    c.elements.addElement(c.elements.createElement("heading", { content: "Hi" }), about.root.id);
    c.endTransaction();

    c.history.undo();
    expect(c.elements.getActivePage()?.id).toBe(about.id);
    c.history.redo();
    expect(c.elements.getActivePage()?.id).toBe(about.id);
  });
});
