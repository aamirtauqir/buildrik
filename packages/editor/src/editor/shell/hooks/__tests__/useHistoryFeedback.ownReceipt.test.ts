/**
 * design-2l9 187:22586: a receipt whose Undo says its own result runs the
 * undo through `undoWithOwnReceipt`, and the shell's generic "Undo: …" bar
 * stays down for that one undo — and only that one. ⌘Z still gets its bar.
 *
 * @license BSD-3-Clause
 */
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EVENTS } from "@/shared/constants";
import { undoWithOwnReceipt, useHistoryFeedback } from "../useHistoryFeedback";

function mount() {
  const addToast = vi.fn();
  const handlers: Record<string, ((d?: unknown) => void)[]> = {};
  const emit = (e: string, d?: unknown) => handlers[e]?.forEach((h) => h(d));
  /* Like HistoryManager: undo() emits HISTORY_UNDO synchronously. */
  const undo = vi.fn(() => {
    emit(EVENTS.HISTORY_UNDO, { entry: { label: "Create Team profile" } });
    return true;
  });
  const composer = {
    on: (e: string, h: (d?: unknown) => void) => { (handlers[e] ??= []).push(h); },
    off: () => {},
    history: { undo, redo: vi.fn(), captureUndo: vi.fn(() => vi.fn()) },
  };
  renderHook(() => useHistoryFeedback(composer as never, addToast));
  return { addToast, undo };
}

describe("useHistoryFeedback — an undo whose receipt speaks for itself", () => {
  it("raises no generic 'Undo: …' bar for an undo run through undoWithOwnReceipt", () => {
    const { addToast, undo } = mount();
    expect(undoWithOwnReceipt(undo)).toBe(true);
    expect(undo).toHaveBeenCalledTimes(1);
    expect(addToast).not.toHaveBeenCalled();
  });

  it("still raises it for any other undo (⌘Z, the topbar), including the next one", () => {
    const { addToast, undo } = mount();
    undoWithOwnReceipt(undo);
    undo();
    expect(addToast).toHaveBeenCalledTimes(1);
    expect(addToast.mock.calls[0][0].description).toBe("Undo: Create Team profile");
  });

  it("lowers the flag even when the receipt's undo throws", () => {
    const { addToast, undo } = mount();
    expect(() => undoWithOwnReceipt(() => { throw new Error("boom"); })).toThrow("boom");
    undo();
    expect(addToast).toHaveBeenCalledTimes(1);
  });
});
