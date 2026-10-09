/**
 * L1-020 (editor audit 2026-10-08): ⌘G on one element was a silent no-op, and
 * a real group said nothing either, while Delete and Duplicate each toast with
 * Undo. Same seam as the delete toast: COMMAND_BEFORE reads the selection,
 * COMMAND_RUN checks what actually happened.
 * @license BSD-3-Clause
 */
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EVENTS } from "@/shared/constants";
import { useHistoryFeedback } from "../useHistoryFeedback";

type Handler = (...a: unknown[]) => void;

function setup(selected: string[]) {
  const handlers: Record<string, Handler[]> = {};
  const sel = { ids: selected };
  const composer = {
    on: (e: string, h: Handler) => { (handlers[e] ??= []).push(h); },
    off: (e: string, h: Handler) => { handlers[e] = (handlers[e] ?? []).filter((x) => x !== h); },
    emit: (e: string, d?: unknown) => (handlers[e] ?? []).forEach((h) => h(d)),
    selection: { getSelectedIds: () => sel.ids },
    elements: { getElement: () => null },
    history: { undo: vi.fn(), redo: vi.fn(), captureUndo: vi.fn(() => vi.fn()) },
  };
  const addToast = vi.fn();
  renderHook(() => useHistoryFeedback(composer as never, addToast as never));
  return { composer, sel, addToast };
}

describe("Group feedback", () => {
  it("⌘G on one element says how to group instead of doing nothing silently", () => {
    const { composer, addToast } = setup(["a"]);
    composer.emit(EVENTS.COMMAND_BEFORE, { id: "group" });
    composer.emit(EVENTS.COMMAND_RUN, { id: "group" });
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ description: "Select two or more elements to group" }));
  });

  it("a real group says so and offers Undo", () => {
    const { composer, sel, addToast } = setup(["a", "b"]);
    composer.emit(EVENTS.COMMAND_BEFORE, { id: "group" });
    sel.ids = ["g1"];
    composer.emit(EVENTS.COMMAND_RUN, { id: "group" });
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: "2 elements grouped", action: expect.objectContaining({ label: "Undo" }) }),
    );
  });

  it("a group that did not happen (selection unchanged) says nothing", () => {
    const { composer, addToast } = setup(["a", "b"]);
    composer.emit(EVENTS.COMMAND_BEFORE, { id: "group" });
    composer.emit(EVENTS.COMMAND_RUN, { id: "group" });
    expect(addToast).not.toHaveBeenCalled();
  });

  it("⌘⇧G on something that is not a group says so", () => {
    const { composer, addToast } = setup(["a"]);
    composer.emit(EVENTS.COMMAND_BEFORE, { id: "ungroup" });
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ description: "Select a group to ungroup" }));
  });
});
