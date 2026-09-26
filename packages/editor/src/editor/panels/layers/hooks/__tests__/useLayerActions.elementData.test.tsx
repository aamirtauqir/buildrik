/**
 * C5 G2-061 / G2-065 — a layer's custom name and its lock live in the
 * element's own data (saved with the project), not in this browser's
 * localStorage. Renaming writes `data.layerName` and marks the project dirty;
 * locking writes `locked`. Hydration reads both back from the elements, and
 * migrates any names / locks still in the old per-browser keys.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLayerActions } from "../useLayerActions";
import { getStorageKey } from "../layersPersistence";
import { EVENTS } from "@/shared/constants/events";

const PAGE = "page-1";

function fakeElement(id: string, init: { layerName?: string; locked?: boolean } = {}) {
  const data: { id: string; locked?: boolean; data?: Record<string, unknown> } = {
    id,
    locked: init.locked,
    data: init.layerName ? { layerName: init.layerName } : undefined,
  };
  return {
    getId: () => id,
    getData: () => data,
    getCustomData: (k: string) => data.data?.[k],
    setData: vi.fn((k: string, v: unknown) => {
      data.data = { ...(data.data ?? {}), [k]: v };
    }),
    setLocked: vi.fn((v: boolean) => {
      data.locked = v;
    }),
    isLocked: () => data.locked === true,
  };
}

function makeComposer(els: ReturnType<typeof fakeElement>[]) {
  // A tiny real pub/sub — needed to test the toggleLock/ELEMENT_UPDATED
  // resync loop, not just record calls.
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  return {
    emit: vi.fn((event: string, ...args: unknown[]) => {
      for (const fn of listeners.get(event) ?? []) fn(...args);
    }),
    on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    }),
    off: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(fn);
    }),
    markDirty: vi.fn(),
    elements: {
      getAllElements: () => els,
      getElement: (id: string) => els.find((e) => e.getId() === id),
    },
  };
}

beforeEach(() => localStorage.clear());

describe("useLayerActions — names and locks live in element data", () => {
  it("hydrates names and locks from the elements", () => {
    const composer = makeComposer([fakeElement("a", { layerName: "Hero" }), fakeElement("b", { locked: true })]);
    const { result } = renderHook(() => useLayerActions(composer as never, PAGE));
    act(() => result.current.hydrateFromStorage(PAGE));
    expect(result.current.customNames.get("a")).toBe("Hero");
    expect([...result.current.lockedIds]).toEqual(["b"]);
  });

  it("renaming writes data.layerName, marks dirty, and keeps nothing in localStorage", () => {
    const a = fakeElement("a");
    const composer = makeComposer([a]);
    const { result } = renderHook(() => useLayerActions(composer as never, PAGE));
    act(() => result.current.hydrateFromStorage(PAGE));
    act(() => result.current.startEditing("a", "Section", { stopPropagation() {} } as never));
    act(() => result.current.setEditingName("  Hero  "));
    act(() => result.current.saveEditedName());
    expect(a.setData).toHaveBeenCalledWith("layerName", "Hero");
    expect(composer.markDirty).toHaveBeenCalled();
    expect(localStorage.getItem(getStorageKey(PAGE, "names"))).toBeNull();
  });

  it("locking writes the element's lock and keeps nothing in localStorage", () => {
    const a = fakeElement("a");
    const composer = makeComposer([a]);
    const { result } = renderHook(() => useLayerActions(composer as never, PAGE));
    act(() => result.current.hydrateFromStorage(PAGE));
    act(() => result.current.toggleLock("a", { stopPropagation() {} } as never));
    expect(a.setLocked).toHaveBeenCalledWith(true);
    expect(localStorage.getItem(getStorageKey(PAGE, "locked"))).toBeNull();
  });

  // A-5: toggleLock used to derive isNowLocked from the panel's own
  // lockedIds set, which drifted from the element's real lock state after a
  // canvas-menu lock (or anything else bypassing this hook). A second Layers
  // click then re-locked an already-locked element instead of unlocking it.
  it("toggleLock reads the element's own lock, not stale panel state", () => {
    const a = fakeElement("a", { locked: true });
    const composer = makeComposer([a]);
    const { result } = renderHook(() => useLayerActions(composer as never, PAGE));
    act(() => result.current.hydrateFromStorage(PAGE));
    expect([...result.current.lockedIds]).toEqual(["a"]);

    act(() => result.current.toggleLock("a", { stopPropagation() {} } as never));

    expect(a.setLocked).toHaveBeenCalledWith(false);
  });

  it("resyncs lockedIds when an element is locked outside the panel", () => {
    const a = fakeElement("a");
    const composer = makeComposer([a]);
    const { result } = renderHook(() => useLayerActions(composer as never, PAGE));
    act(() => result.current.hydrateFromStorage(PAGE));
    expect(result.current.lockedIds.has("a")).toBe(false);

    act(() => {
      a.setLocked(true);
      composer.emit(EVENTS.ELEMENT_UPDATED, a);
    });

    expect(result.current.lockedIds.has("a")).toBe(true);
  });

  // Carry-over 14: undo/redo/import replay a whole snapshot without a
  // per-element ELEMENT_UPDATED for each one, so lockedIds went stale —
  // still showing a row as locked after an undo unlocked it, or unlocked
  // after a redo relocked it.
  it("rescans all elements' lock state on HISTORY_UNDO", () => {
    const a = fakeElement("a", { locked: true });
    const b = fakeElement("b");
    const composer = makeComposer([a, b]);
    const { result } = renderHook(() => useLayerActions(composer as never, PAGE));
    act(() => result.current.hydrateFromStorage(PAGE));
    expect([...result.current.lockedIds]).toEqual(["a"]);

    // The undo flips both without emitting ELEMENT_UPDATED for either —
    // the panel only learns about it from HISTORY_UNDO itself.
    act(() => {
      a.setLocked(false);
      b.setLocked(true);
      composer.emit(EVENTS.HISTORY_UNDO);
    });

    expect([...result.current.lockedIds]).toEqual(["b"]);
  });

  it("rescans all elements' lock state on HISTORY_REDO", () => {
    const a = fakeElement("a");
    const composer = makeComposer([a]);
    const { result } = renderHook(() => useLayerActions(composer as never, PAGE));
    act(() => result.current.hydrateFromStorage(PAGE));
    expect(result.current.lockedIds.has("a")).toBe(false);

    act(() => {
      a.setLocked(true);
      composer.emit(EVENTS.HISTORY_REDO);
    });

    expect(result.current.lockedIds.has("a")).toBe(true);
  });

  it("rescans all elements' lock state on PROJECT_LOADED — a fresh import replaces the document", () => {
    const a = fakeElement("a", { locked: true });
    const composer = makeComposer([a]);
    const { result } = renderHook(() => useLayerActions(composer as never, PAGE));
    act(() => result.current.hydrateFromStorage(PAGE));
    expect(result.current.lockedIds.has("a")).toBe(true);

    // The import swaps in an element with the same id but unlocked.
    const replacement = fakeElement("a", { locked: false });
    composer.elements.getAllElements = () => [replacement];
    act(() => composer.emit(EVENTS.PROJECT_LOADED));

    expect(result.current.lockedIds.has("a")).toBe(false);
  });

  // IMPORTANT 3: ELEMENT_UPDATED fires on every
  // element mutation, not just lock changes — a style edit on an unrelated,
  // still-unlocked element used to rebuild lockedIds from scratch (a new Set
  // every time), so every consumer re-rendered on every edit anywhere in the
  // document. The resync now bails (returns the SAME Set) when the updated
  // element's lock state didn't actually change.
  it("does not change the lockedIds Set identity when an unlocked element merely updates", () => {
    const a = fakeElement("a");
    const composer = makeComposer([a]);
    const { result } = renderHook(() => useLayerActions(composer as never, PAGE));
    act(() => result.current.hydrateFromStorage(PAGE));
    const before = result.current.lockedIds;

    act(() => composer.emit(EVENTS.ELEMENT_UPDATED, a));

    expect(result.current.lockedIds).toBe(before);
  });

  it("does not change the lockedIds Set identity when an already-locked element updates again", () => {
    const a = fakeElement("a", { locked: true });
    const composer = makeComposer([a]);
    const { result } = renderHook(() => useLayerActions(composer as never, PAGE));
    act(() => result.current.hydrateFromStorage(PAGE));
    const before = result.current.lockedIds;
    expect(before.has("a")).toBe(true);

    act(() => composer.emit(EVENTS.ELEMENT_UPDATED, a));

    expect(result.current.lockedIds).toBe(before);
  });

  it("migrates names and locks left in the old per-browser keys", () => {
    localStorage.setItem(getStorageKey(PAGE, "names"), JSON.stringify({ a: "Old name" }));
    localStorage.setItem(getStorageKey(PAGE, "locked"), JSON.stringify(["a"]));
    const a = fakeElement("a");
    const composer = makeComposer([a]);
    const { result } = renderHook(() => useLayerActions(composer as never, PAGE));
    act(() => result.current.hydrateFromStorage(PAGE));
    expect(a.setData).toHaveBeenCalledWith("layerName", "Old name");
    expect(a.setLocked).toHaveBeenCalledWith(true);
    expect(result.current.customNames.get("a")).toBe("Old name");
    expect(localStorage.getItem(getStorageKey(PAGE, "names"))).toBeNull();
    expect(localStorage.getItem(getStorageKey(PAGE, "locked"))).toBeNull();
  });
});
