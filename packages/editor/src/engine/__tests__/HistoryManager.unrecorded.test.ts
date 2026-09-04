/**
 * A feature that changes the project outside history must stop Undo offering.
 *
 * Three walks on 2026-09-03 found three features mutating outside history —
 * CMS binding, brand tokens, a page created mid-load — while the footer Undo
 * stayed ENABLED and pointed at an unrelated earlier edit. Nothing on screen
 * distinguished "enabled because of what I just did" from "enabled because of
 * something ten minutes ago". Pressing it undid the earlier edit: an action the
 * user did not ask for, which is worse than refusing.
 *
 * Bindings cannot simply join history — they live in a manager map and
 * ProjectData has no field for them, so a transaction would flip canUndo true
 * over an entry that restores nothing. Instead the feature says so, Undo
 * disables until the next recorded action, and a refusal names the reason.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { HistoryManager } from "../HistoryManager";
import { EVENTS } from "../../shared/constants/events";

/* `record()` diffs the captured snapshot against the cached one, so a fixture
   that returns the same project twice can never manufacture an undoable step.
   Each export is a different page list, so every record lands. */
function makeComposer() {
  let n = 0;
  const emit = vi.fn();
  return {
    composer: {
      on: vi.fn(),
      emit,
      exportProject: vi.fn(() => ({ pages: [{ id: `p${n++}` }], styles: [], assets: [] })),
      importProject: vi.fn(),
    } as never,
    emit,
  };
}

describe("history — an unrecorded action disables Undo until the next recorded one", () => {
  it("stops offering after a feature reports it changed the project outside history", () => {
    const { composer, emit } = makeComposer();
    const hm = new HistoryManager(composer);
    hm.record("resize");
    expect(hm.canUndo()).toBe(true);

    hm.noteUnrecordedAction("binding a field to content");
    expect(hm.canUndo()).toBe(false);
    expect(emit).toHaveBeenCalledWith(EVENTS.HISTORY_UNRECORDED, { label: "binding a field to content" });
  });

  it("refuses with the reason, not with 'nothing to undo'", () => {
    const { composer, emit } = makeComposer();
    const hm = new HistoryManager(composer);
    hm.record("resize");
    hm.noteUnrecordedAction("binding a field to content");

    expect(hm.undo()).toBe(false);
    expect(emit).toHaveBeenCalledWith(EVENTS.HISTORY_NOOP, {
      direction: "undo",
      reason: "binding a field to content",
    });
    // The earlier edit is still on the stack — refused, not discarded.
    expect(hm.getUndoCount()).toBe(2);
  });

  it("offers again once the next action is recorded", () => {
    const { composer } = makeComposer();
    const hm = new HistoryManager(composer);
    hm.record("resize");
    hm.noteUnrecordedAction("binding a field to content");
    expect(hm.canUndo()).toBe(false);

    hm.record("move");
    expect(hm.canUndo()).toBe(true);
  });

  it("keeps 'nothing to undo' honest on a genuinely empty stack", () => {
    const { composer, emit } = makeComposer();
    const hm = new HistoryManager(composer);
    hm.noteUnrecordedAction("binding a field to content");

    expect(hm.undo()).toBe(false);
    /* One baseline entry, nothing above it: there IS nothing to undo, and the
       reason must not be borrowed to say otherwise. */
    expect(emit).toHaveBeenCalledWith(EVENTS.HISTORY_NOOP, { direction: "undo", reason: undefined });
  });
});
