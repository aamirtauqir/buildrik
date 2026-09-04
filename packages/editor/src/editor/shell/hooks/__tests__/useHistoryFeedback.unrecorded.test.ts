/**
 * When Undo refuses because the last action is not in history, the toast says
 * which action — "Nothing to undo" would be false with entries on the stack.
 * @license BSD-3-Clause
 */
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EVENTS } from "@/shared/constants";
import { useHistoryFeedback } from "../useHistoryFeedback";

type Handler = (...a: unknown[]) => void;
function makeComposer() {
  const handlers: Record<string, Handler[]> = {};
  return {
    on: (e: string, h: Handler) => { (handlers[e] ??= []).push(h); },
    off: (e: string, h: Handler) => { handlers[e] = (handlers[e] ?? []).filter((x) => x !== h); },
    emit: (e: string, d?: unknown) => (handlers[e] ?? []).forEach((h) => h(d)),
    selection: { getSelectedIds: () => [] as string[] },
    elements: { getElement: () => null },
    history: { undo: vi.fn(), redo: vi.fn() },
  };
}

describe("undo refusal names the action that cannot be undone", () => {
  it("says which action, and that earlier edits are intact", () => {
    const composer = makeComposer();
    const addToast = vi.fn();
    renderHook(() => useHistoryFeedback(composer as never, addToast as never));
    composer.emit(EVENTS.HISTORY_NOOP, { direction: "undo", reason: "binding a field to content" });
    const t = addToast.mock.calls[0][0] as { description: string };
    expect(t.description).toMatch(/Can't undo binding a field to content/);
    expect(t.description).toMatch(/earlier edits are still there/);
  });

  it("still says 'Nothing to undo' when there is no reason", () => {
    const composer = makeComposer();
    const addToast = vi.fn();
    renderHook(() => useHistoryFeedback(composer as never, addToast as never));
    composer.emit(EVENTS.HISTORY_NOOP, { direction: "undo" });
    expect((addToast.mock.calls[0][0] as { description: string }).description).toBe("Nothing to undo");
  });
});
