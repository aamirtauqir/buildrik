/**
 * A toast's Undo undoes the action it announced — or nothing.
 *
 * Every "X deleted · Undo" toast called bare `history.undo()`, which pops the
 * NEWEST entry whenever it is clicked. Walked live (A-4, verify pass 3): delete
 * an image, type a newer edit, click the delete toast's Undo — the newer edit
 * was reverted and the image stayed deleted. `captureUndo()` binds the undo to
 * the entry that is newest when the toast is raised; once history has moved
 * past it, clicking refuses and says so instead of undoing something else.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { EVENTS } from "../../shared/constants/events";
import { installEngineBrowserStubs, removeEngineBrowserStubs, createTestComposer } from "./test-utils/realComposer";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

function setup() {
  const c = createTestComposer();
  const page = c.elements.getActivePage() ?? c.elements.createPage("Home");
  const img = c.elements.createElement("image", {});
  const text = c.elements.createElement("text", { content: "Second seeded site" });
  c.elements.addElement(img, page.root.id);
  c.elements.addElement(text, page.root.id);
  c.history.flushPending();
  const deleteImage = () => {
    c.beginTransaction("delete");
    c.elements.removeElement(img.getId());
    c.endTransaction();
  };
  return { c, imgId: img.getId(), textId: text.getId(), deleteImage };
}

describe("history.captureUndo — a toast's Undo is bound to its own action", () => {
  it("undoes the captured action while it is still the newest", () => {
    const { c, imgId, deleteImage } = setup();
    deleteImage();
    const undoDelete = c.history.captureUndo();

    expect(undoDelete()).toBe(true);
    expect(c.elements.getElement(imgId)).toBeTruthy();
  });

  it("refuses — and reverts nothing — once a newer edit exists", () => {
    const { c, imgId, textId, deleteImage } = setup();
    deleteImage();
    const undoDelete = c.history.captureUndo();
    const noop = vi.fn();
    c.on(EVENTS.HISTORY_NOOP, noop);

    // Still inside the 500ms coalesce window — the edit is not even recorded yet.
    c.elements.getElement(textId)!.setContent("A4 newer edit");

    expect(undoDelete()).toBe(false);
    expect(c.elements.getElement(textId)!.getContent()).toBe("A4 newer edit");
    expect(c.elements.getElement(imgId)).toBeFalsy();
    expect(noop).toHaveBeenCalledWith(expect.objectContaining({ direction: "undo", superseded: "delete" }));
  });

  it("refuses after the captured action was already undone by ⌘Z", () => {
    const { c, deleteImage } = setup();
    deleteImage();
    const undoDelete = c.history.captureUndo();
    expect(c.history.undo()).toBe(true);
    const before = c.history.getUndoCount();

    expect(undoDelete()).toBe(false);
    expect(c.history.getUndoCount()).toBe(before);
  });
});
