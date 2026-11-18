/**
 * history.recordCustom — a step whose state lives outside the project
 * snapshot (page folders) on the same stack as the snapshot steps.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { EVENTS } from "@/shared/constants/events";
import { installEngineBrowserStubs, removeEngineBrowserStubs, createTestComposer } from "./test-utils/realComposer";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

function setup() {
  const c = createTestComposer();
  const page = c.elements.getActivePage() ?? c.elements.createPage("Home");
  const text = c.elements.createElement("text", { content: "one" });
  c.elements.addElement(text, page.root.id);
  c.history.flushPending();
  const id = text.getId();
  const setText = (v: string) => {
    c.elements.getElement(id)!.setContent(v);
    c.history.flushPending();
  };
  const content = () => c.elements.getElement(id)!.getContent();
  /* The outside state a custom step owns — a folder name, here. */
  const outside = { folder: "none" };
  const move = (to: string) => {
    const from = outside.folder;
    outside.folder = to;
    c.history.recordCustom({ label: `Moved to ${to}`, undo: () => { outside.folder = from; }, redo: () => { outside.folder = to; } });
  };
  return { c, id, setText, content, outside, move };
}

describe("history.recordCustom", () => {
  it("undoes and redoes a custom step with its own functions", () => {
    const { c, outside, move } = setup();
    move("Studio");
    expect(c.history.canUndo()).toBe(true);
    expect(c.history.undo()).toBe(true);
    expect(outside.folder).toBe("none");
    expect(c.history.redo()).toBe(true);
    expect(outside.folder).toBe("Studio");
  });

  it("interleaves with snapshot steps in order, both ways", () => {
    const { c, setText, content, outside, move } = setup();
    setText("two");
    move("Studio");
    setText("three");

    c.history.undo();
    expect([content(), outside.folder]).toEqual(["two", "Studio"]);
    c.history.undo();
    expect([content(), outside.folder]).toEqual(["two", "none"]);
    c.history.undo();
    expect([content(), outside.folder]).toEqual(["one", "none"]);

    c.history.redo();
    expect([content(), outside.folder]).toEqual(["two", "none"]);
    c.history.redo();
    expect([content(), outside.folder]).toEqual(["two", "Studio"]);
    c.history.redo();
    expect([content(), outside.folder]).toEqual(["three", "Studio"]);
  });

  it("commits an edit still in the coalesce window below the custom step", () => {
    const { c, id, content, outside, move } = setup();
    c.elements.getElement(id)!.setContent("pending");
    move("Studio");
    c.history.undo();
    expect([content(), outside.folder]).toEqual(["pending", "none"]);
    c.history.undo();
    expect(content()).toBe("one");
  });

  it("a new edit clears a custom step from redo — snapshot or custom", () => {
    const { c, setText, outside, move } = setup();
    move("Studio");
    c.history.undo();
    setText("two");
    expect(c.history.canRedo()).toBe(false);

    move("Studio");
    c.history.undo();
    move("Client");
    expect(c.history.canRedo()).toBe(false);
    expect(outside.folder).toBe("Client");
  });

  it("a captured toast Undo targets the custom step and refuses once superseded", () => {
    const { c, setText, outside, move } = setup();
    move("Studio");
    const undoMove = c.history.captureUndo();
    expect(undoMove()).toBe(true);
    expect(outside.folder).toBe("none");

    move("Studio");
    const stale = c.history.captureUndo();
    setText("two");
    expect(stale()).toBe(false);
    expect(outside.folder).toBe("Studio");
  });

  it("emits recorded / undo / redo with the step's label", () => {
    const { c, move } = setup();
    const seen: string[] = [];
    c.on(EVENTS.HISTORY_RECORDED, (d: { label?: string }) => seen.push(`rec:${d.label}`));
    c.on(EVENTS.HISTORY_UNDO, (d: { entry: { label?: string } }) => seen.push(`undo:${d.entry.label}`));
    c.on(EVENTS.HISTORY_REDO, (d: { entry: { label?: string } }) => seen.push(`redo:${d.entry.label}`));
    move("Studio");
    c.history.undo();
    c.history.redo();
    expect(seen).toEqual(["rec:Moved to Studio", "undo:Moved to Studio", "redo:Moved to Studio"]);
  });

  it("a throwing undo leaves the step where it was", () => {
    const { c } = setup();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    c.history.recordCustom({ label: "Bad", undo: () => { throw new Error("no"); }, redo: () => {} });
    const before = c.history.getUndoCount();
    expect(c.history.undo()).toBe(false);
    expect(c.history.getUndoCount()).toBe(before);
    expect(c.history.canRedo()).toBe(false);
    warn.mockRestore();
  });

  it("changes nothing in the snapshot stats and shows in the History list", () => {
    const { c, setText, move } = setup();
    setText("two");
    const stats = c.history.getStats();
    move("Studio");
    const after = c.history.getStats();
    expect([after.patchCount, after.checkpointCount]).toEqual([stats.patchCount, stats.checkpointCount]);
    expect(c.history.getHistoryStack()[0]).toMatchObject({ label: "Moved to Studio", type: "custom" });
  });

  it("restoring an earlier History row undoes the custom steps after it", () => {
    const { c, setText, content, outside, move } = setup();
    setText("two");
    const rowBefore = c.history.getHistoryStack()[0].id; // "two"
    move("Studio");
    setText("three");
    expect(c.history.restoreEntry(rowBefore)).toBe(true);
    expect([content(), outside.folder]).toEqual(["two", "none"]);
  });

  it("trimming past old steps keeps every remaining step undoable", () => {
    const { c, setText, content, outside, move } = setup();
    setText("a");
    move("Studio");
    setText("b");
    setText("c");
    // [.., a, move, b, c] → cap 4 keeps a as the new baseline checkpoint.
    c.history.setMaxHistory(4);
    c.history.undo();
    expect(content()).toBe("b");
    c.history.undo();
    expect([content(), outside.folder]).toEqual(["a", "Studio"]);
    c.history.undo();
    expect([content(), outside.folder]).toEqual(["a", "none"]);
    expect(c.history.canUndo()).toBe(false);
  });

  it("trimming a snapshot-only stack rebuilds the new baseline from the old one", () => {
    const { c, setText, content } = setup();
    setText("a");
    setText("b");
    setText("c");
    c.history.setMaxHistory(3);
    c.history.undo();
    expect(content()).toBe("b");
    c.history.undo();
    expect(content()).toBe("a");
    expect(c.history.canUndo()).toBe(false);
  });

  it("is not recorded while history is paused", () => {
    const { c, outside } = setup();
    c.history.pause();
    const before = c.history.getUndoCount();
    c.history.recordCustom({ label: "x", undo: () => { outside.folder = "u"; }, redo: () => {} });
    expect(c.history.getUndoCount()).toBe(before);
    c.history.resume();
  });
});
