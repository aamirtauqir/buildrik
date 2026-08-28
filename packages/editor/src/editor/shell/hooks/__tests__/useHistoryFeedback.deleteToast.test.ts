/**
 * Pressing Delete must say what it deleted and offer Undo — the same as the
 * canvas toolbar's Delete, which is the same intent by a different route.
 *
 * Walked live 2026-08-24: four seconds after a keyboard delete the only toasts
 * on screen were "Saved" and the empty-inspector hint, while
 * `handleToolbarDelete` had always shown "Heading deleted" for five seconds
 * with an Undo action. One action, two implementations, and the silent one is
 * the one most people use.
 *
 * The seam is the COMMAND, deliberately, and these tests pin that:
 *  - `element:deleted` fires once PER ELEMENT, so a multi-delete would stack
 *    one toast per element;
 *  - the toolbar calls `elements.removeElement` directly and never enters the
 *    command centre, so this cannot double up with its own toast.
 *
 * @license BSD-3-Clause
 */
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EVENTS } from "@/shared/constants";
import { useHistoryFeedback } from "../useHistoryFeedback";

type Handler = (...a: unknown[]) => void;

function makeComposer(selected: string[], elements: Record<string, { type: string; children: number }>) {
  const handlers: Record<string, Handler[]> = {};
  const live = new Set(Object.keys(elements));
  return {
    handlers,
    /** Simulate the command actually removing them. */
    remove: (...ids: string[]) => ids.forEach((i) => live.delete(i)),
    on: (e: string, h: Handler) => { (handlers[e] ??= []).push(h); },
    off: (e: string, h: Handler) => { handlers[e] = (handlers[e] ?? []).filter((x) => x !== h); },
    emit: (e: string, d?: unknown) => (handlers[e] ?? []).forEach((h) => h(d)),
    selection: { getSelectedIds: () => selected },
    elements: {
      getElement: (id: string) => {
        const e = elements[id];
        return e && live.has(id)
          ? { getType: () => e.type, getChildren: () => Array(e.children).fill(null) }
          : null;
      },
    },
    history: { undo: vi.fn(), redo: vi.fn() },
  };
}

let addToast: ReturnType<typeof vi.fn>;
beforeEach(() => { addToast = vi.fn(); });

/** BEFORE, then the command really removes `removed`, then RUN. */
const run = (composer: ReturnType<typeof makeComposer>, removed?: string[]) => {
  renderHook(() => useHistoryFeedback(composer as never, addToast as never));
  composer.emit(EVENTS.COMMAND_BEFORE, { id: "delete" });
  composer.remove(...(removed ?? composer.selection.getSelectedIds()));
  composer.emit(EVENTS.COMMAND_RUN, { id: "delete" });
  return addToast.mock.calls.map(([t]) => t as { description?: string; action?: { label?: string } });
};

describe("a keyboard delete announces itself", () => {
  it("names a single element and offers Undo", () => {
    const toasts = run(makeComposer(["a"], { a: { type: "heading", children: 0 } }));
    expect(toasts).toHaveLength(1);
    expect(toasts[0].description).toBe("Heading deleted");
    expect(toasts[0].action?.label).toBe("Undo");
  });

  it("counts the children it took with it — the toolbar's wording", () => {
    const toasts = run(makeComposer(["a"], { a: { type: "container", children: 3 } }));
    expect(toasts[0].description).toBe("Container (3 children) deleted");
  });

  it("says child, not children, for one", () => {
    const toasts = run(makeComposer(["a"], { a: { type: "container", children: 1 } }));
    expect(toasts[0].description).toBe("Container (1 child) deleted");
  });

  it("counts a multi-selection instead of naming one of them", () => {
    const toasts = run(makeComposer(["a", "b", "c"], { a: { type: "heading", children: 0 } }));
    expect(toasts[0].description).toBe("3 elements deleted");
  });

  /* One toast per user action. Reading the selection at COMMAND_BEFORE is what
     makes that possible — after the command there is nothing left to name. */
  it("stays silent for every other command", () => {
    const c = makeComposer(["a"], { a: { type: "heading", children: 0 } });
    renderHook(() => useHistoryFeedback(c as never, addToast as never));
    for (const id of ["duplicate", "copy", "paste", "save", "group"]) {
      c.emit(EVENTS.COMMAND_BEFORE, { id });
      c.emit(EVENTS.COMMAND_RUN, { id });
    }
    expect(addToast).not.toHaveBeenCalled();
  });

  /* codex, reviewing the first version: CommandCenter.run emits COMMAND_RUN
     whether or not the command changed anything. Toasting on the id alone made
     Delete-with-nothing-selected claim "Element deleted" and offer an Undo that
     would revert the PREVIOUS real edit — worse than the silence it replaced. */
  it("says nothing when the command deleted nothing", () => {
    const c = makeComposer(["a"], { a: { type: "heading", children: 0 } });
    const toasts = run(c, []);            // command ran, removed nothing
    expect(toasts).toHaveLength(0);
  });

  it("says nothing when there was no selection at all", () => {
    const toasts = run(makeComposer([], {}));
    expect(toasts).toHaveLength(0);
  });

  it("counts only what actually went — not what was selected", () => {
    const c = makeComposer(["a", "b", "c"], {
      a: { type: "heading", children: 0 },
      b: { type: "text", children: 0 },
      c: { type: "container", children: 0 },
    });
    const toasts = run(c, ["a", "b"]);    // one refused
    expect(toasts[0].description).toBe("2 elements deleted");
  });

  it("does not fire on a run it never saw the before for", () => {
    const c = makeComposer(["a"], { a: { type: "heading", children: 0 } });
    renderHook(() => useHistoryFeedback(c as never, addToast as never));
    c.emit(EVENTS.COMMAND_RUN, { id: "delete" });
    expect(addToast).not.toHaveBeenCalled();
  });
});

/* Board 814:7027 puts the reverse-action link on EVERY undo/redo toast; an
   earlier version gated it on the destructive labels, so a misfired ⌘Z over a
   nudge or a style change offered no way back. */
describe("undo/redo toasts always carry the reverse action", () => {
  it("non-destructive undo still offers Redo", () => {
    const c = makeComposer([], {});
    renderHook(() => useHistoryFeedback(c as never, addToast as never));
    c.emit(EVENTS.HISTORY_UNDO, { entry: { label: "nudge" } });
    const t = addToast.mock.calls[0][0] as { action?: { label?: string; onClick?: () => void } };
    expect(t.action?.label).toBe("Redo");
    t.action?.onClick?.();
    expect(c.history.redo).toHaveBeenCalledTimes(1);
  });

  it("non-destructive redo still offers Undo", () => {
    const c = makeComposer([], {});
    renderHook(() => useHistoryFeedback(c as never, addToast as never));
    c.emit(EVENTS.HISTORY_REDO, { entry: { label: "style-change" } });
    const t = addToast.mock.calls[0][0] as { action?: { label?: string; onClick?: () => void } };
    expect(t.action?.label).toBe("Undo");
    t.action?.onClick?.();
    expect(c.history.undo).toHaveBeenCalledTimes(1);
  });
});
