/**
 * useLayerTree — builds the LayerItem tree from the engine and owns
 * expand/collapse + visible-id + total-count derivations.
 *
 * A minimal event-emitting composer stub drives the initial build; the
 * expansion callbacks are then exercised directly.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import type { Composer } from "../../../../../engine";
import { EVENTS } from "@/shared/constants/events";
import { useLayerTree } from "../useLayerTree";

interface EngineEl {
  getId: () => string;
  getType: () => string;
  getTagName: () => string;
  isComponentInstance: () => boolean;
  getChildren: () => EngineEl[];
  getParent?: () => EngineEl | null;
}

function el(id: string, children: EngineEl[] = []): EngineEl {
  return {
    getId: () => id,
    getType: () => "container",
    getTagName: () => "div",
    isComponentInstance: () => false,
    getChildren: () => children,
    getParent: () => null,
  };
}

// root > [ a > a1, b ]
const a1 = el("a1");
const a = el("a", [a1]);
const b = el("b");
const root = el("root", [a, b]);
const elementMap = new Map<string, EngineEl>([
  ["root", root],
  ["a", a],
  ["a1", a1],
  ["b", b],
]);

/** A second page whose root holds only `b`, for the page-switch test. */
const root2 = el("root-2", [b]);
elementMap.set("root-2", root2);

function makeComposer(): Composer & { _emit(ev: string): void; _setPage(id: string): void } {
  const handlers = new Map<string, Set<() => void>>();
  let page = { id: "page-1", root: { id: "root" } };
  return {
    elements: {
      getActivePage: () => page,
      getElement: (id: string) => elementMap.get(id) ?? null,
    },
    on: (ev: string, fn: () => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    },
    off: (ev: string, fn: () => void) => handlers.get(ev)?.delete(fn),
    _emit: (ev: string) => handlers.get(ev)?.forEach((fn) => fn()),
    _setPage: (id: string) => {
      page = { id, root: { id: id === "page-2" ? "root-2" : "root" } };
    },
  } as unknown as Composer & { _emit(ev: string): void; _setPage(id: string): void };
}

beforeEach(() => {
  localStorage.clear();
});

/** Stable composer per mount — recreating it each render would loop forever. */
function mount() {
  const composer = makeComposer();
  return renderHook(() => useLayerTree(composer));
}

describe("useLayerTree — tree build", () => {
  // The page root is EXCLUDED (2026-09-08, BLOCKERS.md B6). Its children are
  // the top level; the root is a container the user never selects or names, and
  // counting it made an empty page read "1 layer".
  it("builds a nested LayerItem tree from the root's CHILDREN, not the root", () => {
    const { result } = mount();
    expect(result.current.layers.map((l) => l.id)).toEqual(["a", "b"]);
    expect(result.current.layers[0].children.map((c) => c.id)).toEqual(["a1"]);
    expect(result.current.layers.some((l) => l.id === "root")).toBe(false);
  });

  it("an empty page reads zero layers, so the empty state is reachable", () => {
    const composer = makeComposer();
    const emptyRoot = el("root");           // a page whose root has no children
    composer.elements.getElement = ((id: string) =>
      id === "root" ? emptyRoot : null) as never;
    const { result } = renderHook(() => useLayerTree(composer));
    expect(result.current.layers).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it("totalCount counts every node in the tree", () => {
    const { result } = mount();
    expect(result.current.totalCount).toBe(3); // a, a1, b — the root is not a layer
  });

  it("returns no layers when composer is null", () => {
    const { result } = renderHook(() => useLayerTree(null));
    expect(result.current.layers).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  // Nothing auto-expands now, and that IS the old behaviour: expanding the root
  // only ever made the top-level elements visible, and with the root excluded
  // they are visible already. Expanding layers[0] would open a level deeper
  // than the panel ever did.
  it("expands nothing on arrival — the top level is already visible", () => {
    const { result } = mount();
    expect(result.current.expandedIds.size).toBe(0);
    expect(result.current.getVisibleLayerIds().sort()).toEqual(["a", "b"]);
  });
});

describe("useLayerTree — expansion controls", () => {
  it("expandAll then getVisibleLayerIds returns every node", () => {
    const { result } = mount();
    act(() => result.current.expandAll());
    expect(result.current.getVisibleLayerIds().sort()).toEqual(["a", "a1", "b"]);
  });

  it("collapseAll collapses every layer, leaving only the top level visible", () => {
    const { result } = mount();
    act(() => result.current.expandAll());
    act(() => result.current.collapseAll());
    // Nothing expanded → only top-level layers visible; a1 (child of a) hidden.
    // This kept the root expanded before the root stopped being a row, because
    // collapsing it hid the whole page.
    expect(result.current.getVisibleLayerIds().sort()).toEqual(["a", "b"]);
    expect(result.current.expandedIds.has("a")).toBe(false);
  });

  it("toggleExpand flips a single node's expansion", () => {
    const { result } = mount();
    expect(result.current.expandedIds.has("a")).toBe(false);
    act(() => result.current.toggleExpand("a"));
    expect(result.current.expandedIds.has("a")).toBe(true);
    act(() => result.current.toggleExpand("a"));
    expect(result.current.expandedIds.has("a")).toBe(false);
  });

  it("expandIds adds ids without dropping existing ones (no-op on empty)", () => {
    const { result } = mount();
    act(() => result.current.expandIds(["a"]));
    act(() => result.current.expandIds([]));
    expect(result.current.expandedIds.has("a")).toBe(true); // untouched

    act(() => result.current.expandIds(["b"]));
    expect(result.current.expandedIds.has("a")).toBe(true);
    expect(result.current.expandedIds.has("b")).toBe(true);
  });

  it("getVisibleLayerIds hides children of collapsed nodes", () => {
    const { result } = mount();
    // Only root expanded initially → a1 is under a (collapsed) so hidden
    expect(result.current.getVisibleLayerIds()).not.toContain("a1");
  });
});

/* Switching the active page emits PROJECT_CHANGED { type: "page:activated" }.
   This hook listened for a bare "page:changed" the engine never sends, so the
   panel kept showing the previous page's tree until some unrelated element
   event happened to fire. */
describe("useLayerTree — page switch", () => {
  it("rebuilds the tree when the active page changes", () => {
    const composer = makeComposer();
    const { result } = renderHook(() => useLayerTree(composer));
    expect(result.current.layers.map((l) => l.id)).toEqual(["a", "b"]);

    act(() => {
      composer._setPage("page-2");
      composer._emit(EVENTS.PROJECT_CHANGED);
    });

    // page-2's root is excluded too — its children are what the panel lists.
    expect(result.current.layers.some((l) => l.id === "root-2")).toBe(false);
  });
});
