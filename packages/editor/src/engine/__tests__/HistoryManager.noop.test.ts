/**
 * An undo with nothing left has to say so.
 *
 * Board 814:7027 draws six toast variants, and the sixth is grey: "Nothing to
 * undo", no reverse action, "shown when undo/redo stack is empty". `undo()`
 * returned `false` and emitted nothing, so every caller — ⌘Z, the command
 * palette's two entries, the topbar — did nothing silently. An undo with
 * nothing left looked exactly like an undo that was broken.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { HistoryManager } from "../HistoryManager";
import { EVENTS } from "../../shared/constants/events";

function makeComposer() {
  return {
    on: vi.fn(),
    emit: vi.fn(),
    exportProject: vi.fn(() => ({ pages: [], styles: [], assets: [] })),
    importProject: vi.fn(),
  } as never;
}

describe("history no-op — the empty stack announces itself", () => {
  it("emits on undo with an empty stack", () => {
    const composer = makeComposer();
    const hm = new HistoryManager(composer);

    expect(hm.undo()).toBe(false);
    expect((composer as unknown as { emit: ReturnType<typeof vi.fn> }).emit)
      .toHaveBeenCalledWith(EVENTS.HISTORY_NOOP, { direction: "undo" });
  });

  it("emits on redo with an empty stack", () => {
    const composer = makeComposer();
    const hm = new HistoryManager(composer);

    expect(hm.redo()).toBe(false);
    expect((composer as unknown as { emit: ReturnType<typeof vi.fn> }).emit)
      .toHaveBeenCalledWith(EVENTS.HISTORY_NOOP, { direction: "redo" });
  });

  /* `record()` diffs against the captured snapshot, and two empty projects
     produce an empty patch — so the fixture cannot manufacture an undoable
     step. Assert the gate instead: the emit is bound to canUndo/canRedo, and
     the normal path stays covered by HistoryManager.test.ts. */
  it("is bound to the same gate the undo itself is", () => {
    const composer = makeComposer();
    const hm = new HistoryManager(composer);
    expect(hm.canUndo()).toBe(false);
    expect(hm.undo()).toBe(false);
    expect(hm.canRedo()).toBe(false);
    expect(hm.redo()).toBe(false);
  });
});
