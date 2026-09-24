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
  };
}

function makeComposer(els: ReturnType<typeof fakeElement>[]) {
  return {
    emit: vi.fn(),
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
