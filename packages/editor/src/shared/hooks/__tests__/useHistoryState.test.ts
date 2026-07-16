/**
 * useHistoryState tests — engine-event → React-state bridge with a mock
 * composer emitting HISTORY_* events.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHistoryState } from "../useHistoryState";
import { EVENTS } from "../../constants/events";
import type { Composer } from "../../../engine";

type Handler = (payload?: unknown) => void;

function createMockComposer() {
  const listeners = new Map<string, Set<Handler>>();
  const composer = {
    on: vi.fn((event: string, cb: Handler) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: Handler) => {
      listeners.get(event)?.delete(cb);
    }),
    emit: (event: string, payload?: unknown) => {
      listeners.get(event)?.forEach((cb) => cb(payload));
    },
    listenerCount: (event: string) => listeners.get(event)?.size ?? 0,
    history: {
      getHistoryStack: vi.fn(() => [] as { id: string; label: string }[]),
      canUndo: vi.fn(() => false),
      canRedo: vi.fn(() => false),
      undo: vi.fn(),
      redo: vi.fn(),
      clear: vi.fn(),
    },
  };
  return composer;
}

const asComposer = (m: ReturnType<typeof createMockComposer>) => m as unknown as Composer;

describe("useHistoryState", () => {
  it("null composer → empty stack, no undo/redo, not loading", () => {
    const { result } = renderHook(() => useHistoryState(null));
    expect(result.current.historyStack).toEqual([]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("loads initial state from the composer's history manager", () => {
    const composer = createMockComposer();
    const stack = [{ id: "e1", label: "Move element" }];
    composer.history.getHistoryStack.mockReturnValue(stack);
    composer.history.canUndo.mockReturnValue(true);

    const { result } = renderHook(() => useHistoryState(asComposer(composer)));

    expect(result.current.historyStack).toEqual(stack);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("refreshes on HISTORY_RECORDED / UNDO / REDO / CLEARED events", () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useHistoryState(asComposer(composer)));
    expect(result.current.historyStack).toEqual([]);

    const stack = [{ id: "e2", label: "Add section" }];
    composer.history.getHistoryStack.mockReturnValue(stack);
    composer.history.canUndo.mockReturnValue(true);
    act(() => composer.emit(EVENTS.HISTORY_RECORDED, { label: "Add section" }));
    expect(result.current.historyStack).toEqual(stack);
    expect(result.current.canUndo).toBe(true);

    composer.history.canUndo.mockReturnValue(false);
    composer.history.canRedo.mockReturnValue(true);
    act(() => composer.emit(EVENTS.HISTORY_UNDO));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    composer.history.getHistoryStack.mockReturnValue([]);
    composer.history.canRedo.mockReturnValue(false);
    act(() => composer.emit(EVENTS.HISTORY_CLEARED));
    expect(result.current.historyStack).toEqual([]);
    expect(result.current.canRedo).toBe(false);
  });

  it("undo/redo only call the engine when available", () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useHistoryState(asComposer(composer)));

    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(composer.history.undo).not.toHaveBeenCalled();
    expect(composer.history.redo).not.toHaveBeenCalled();

    composer.history.canUndo.mockReturnValue(true);
    composer.history.canRedo.mockReturnValue(true);
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(composer.history.undo).toHaveBeenCalledTimes(1);
    expect(composer.history.redo).toHaveBeenCalledTimes(1);
  });

  it("clear delegates to history.clear (no compensating checkpoint)", () => {
    const composer = createMockComposer();
    const { result } = renderHook(() => useHistoryState(asComposer(composer)));
    act(() => result.current.clear());
    expect(composer.history.clear).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes all four events on unmount", () => {
    const composer = createMockComposer();
    const { unmount } = renderHook(() => useHistoryState(asComposer(composer)));

    expect(composer.listenerCount(EVENTS.HISTORY_RECORDED)).toBe(1);
    unmount();
    for (const event of [
      EVENTS.HISTORY_RECORDED,
      EVENTS.HISTORY_UNDO,
      EVENTS.HISTORY_REDO,
      EVENTS.HISTORY_CLEARED,
    ]) {
      expect(composer.listenerCount(event)).toBe(0);
    }
  });
});
