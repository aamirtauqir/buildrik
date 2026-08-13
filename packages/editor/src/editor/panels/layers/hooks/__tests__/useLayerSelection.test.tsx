/**
 * useLayerSelection — click / meta-click / shift-range selection that routes
 * through the Composer selection facade (composer is SSOT).
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { Composer } from "../../../../../engine";
import { useLayerSelection } from "../useLayerSelection";
import type { LayerItem } from "../../types";

const flatItem = (id: string): LayerItem => ({
  id,
  type: "container",
  tagName: "div",
  depth: 0,
  children: [],
});

// Flat sibling list → flattenTree order is [a, b, c, d].
const layers: LayerItem[] = [flatItem("a"), flatItem("b"), flatItem("c"), flatItem("d")];

function makeComposer(initialSelected: string[] = []) {
  const select = vi.fn();
  const toggle = vi.fn();
  const addToSelection = vi.fn();
  const clear = vi.fn();
  const composer = {
    selection: {
      getSelectedIds: () => initialSelected,
      select,
      toggle,
      addToSelection,
      clear,
    },
    elements: {
      getElement: (id: string) => ({ id }),
    },
    on: () => {},
    off: () => {},
  } as unknown as Composer;
  return { composer, select, toggle, addToSelection, clear };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("useLayerSelection — engine event sync (multi-select regression)", () => {
  it("reflects SELECTION_ADDED/REMOVED — what meta-click toggle actually emits", () => {
    // Real event registry + mutable selection: the engine's addToSelection
    // emits selection:added, NOT selection:changed. The hook must hear it.
    const handlers = new Map<string, Set<(p?: unknown) => void>>();
    let ids: string[] = ["a"];
    const composer = {
      selection: {
        getSelectedIds: () => ids,
        select: vi.fn(),
        toggle: vi.fn(),
        addToSelection: vi.fn(),
        clear: vi.fn(),
      },
      elements: { getElement: (id: string) => ({ id }) },
      on: (ev: string, fn: (p?: unknown) => void) => {
        if (!handlers.has(ev)) handlers.set(ev, new Set());
        handlers.get(ev)!.add(fn);
      },
      off: (ev: string, fn: (p?: unknown) => void) => handlers.get(ev)?.delete(fn),
      emit: (ev: string) => handlers.get(ev)?.forEach((fn) => fn()),
    } as unknown as Composer & { emit: (ev: string) => void };

    const { result } = renderHook(() => useLayerSelection(composer, layers, new Set()));
    expect(result.current.selectedIds).toEqual(new Set(["a"]));

    ids = ["a", "b"];
    act(() => composer.emit("selection:added"));
    expect(result.current.selectedIds).toEqual(new Set(["a", "b"]));

    ids = ["a"];
    act(() => composer.emit("selection:removed"));
    expect(result.current.selectedIds).toEqual(new Set(["a"]));

    /* Marquee / Select All go through selectMultiple → SELECTION_MULTIPLE, and
       a plain click replaces the selection via ELEMENT_SELECTED. Neither was
       subscribed; the dead "selection:changed" was. */
    ids = ["a", "b", "c"];
    act(() => composer.emit("element:selected"));
    expect(result.current.selectedIds).toEqual(new Set(["a", "b", "c"]));

    ids = ["c"];
    act(() => composer.emit("selection:multiple"));
    expect(result.current.selectedIds).toEqual(new Set(["c"]));
  });
});

describe("useLayerSelection — plain + meta clicks", () => {
  it("selectSingle selects the resolved element", () => {
    const { composer, select } = makeComposer();
    const { result } = renderHook(() => useLayerSelection(composer, layers, new Set()));
    act(() => result.current.selectSingle("b"));
    expect(select).toHaveBeenCalledWith({ id: "b" });
  });

  it("selectLayer with no modifiers selects a single element", () => {
    const { composer, select, toggle } = makeComposer();
    const { result } = renderHook(() => useLayerSelection(composer, layers, new Set()));
    act(() => result.current.selectLayer("c", {}));
    expect(select).toHaveBeenCalledWith({ id: "c" });
    expect(toggle).not.toHaveBeenCalled();
  });

  it("selectLayer with meta toggles the element into the selection", () => {
    const { composer, toggle, select } = makeComposer();
    const { result } = renderHook(() => useLayerSelection(composer, layers, new Set()));
    act(() => result.current.selectLayer("c", { meta: true }));
    expect(toggle).toHaveBeenCalledWith({ id: "c" });
    expect(select).not.toHaveBeenCalled();
  });
});

describe("useLayerSelection — shift range", () => {
  it("adds every node between the last selected and the clicked node", () => {
    const { composer, addToSelection } = makeComposer(["a"]);
    const { result } = renderHook(() => useLayerSelection(composer, layers, new Set()));
    act(() => result.current.selectLayer("c", { shift: true }));
    // range a..c inclusive → a, b, c added
    expect(addToSelection).toHaveBeenCalledTimes(3);
    expect(addToSelection).toHaveBeenCalledWith({ id: "a" });
    expect(addToSelection).toHaveBeenCalledWith({ id: "b" });
    expect(addToSelection).toHaveBeenCalledWith({ id: "c" });
  });

  it("falls back to a single-node range when there is no prior selection", () => {
    const { composer, addToSelection } = makeComposer([]);
    const { result } = renderHook(() => useLayerSelection(composer, layers, new Set()));
    act(() => result.current.selectLayer("c", { shift: true }));
    expect(addToSelection).toHaveBeenCalledTimes(1);
    expect(addToSelection).toHaveBeenCalledWith({ id: "c" });
  });
});

describe("useLayerSelection — clear + hover", () => {
  it("clearSelection clears the composer selection", () => {
    const { composer, clear } = makeComposer(["a"]);
    const { result } = renderHook(() => useLayerSelection(composer, layers, new Set()));
    act(() => result.current.clearSelection());
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("mouse enter sets hovered id and toggles the canvas highlight class", () => {
    const canvasEl = document.createElement("div");
    canvasEl.setAttribute("data-buildrick-id", "b");
    document.body.appendChild(canvasEl);

    const { composer } = makeComposer();
    const { result } = renderHook(() => useLayerSelection(composer, layers, new Set()));

    act(() => result.current.handleLayerMouseEnter("b"));
    expect(result.current.hoveredLayerId).toBe("b");
    expect(canvasEl.classList.contains("bd-layer-hover-highlight")).toBe(true);

    act(() => result.current.handleLayerMouseLeave());
    expect(result.current.hoveredLayerId).toBeNull();
    expect(canvasEl.classList.contains("bd-layer-hover-highlight")).toBe(false);
  });
});
