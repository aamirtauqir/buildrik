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

function makeComposer(): Composer {
  return {
    elements: {
      getActivePage: () => ({ id: "page-1", root: { id: "root" } }),
      getElement: (id: string) => elementMap.get(id) ?? null,
    },
    on: () => {},
    off: () => {},
  } as unknown as Composer;
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
  it("builds a nested LayerItem tree rooted at the active page root", () => {
    const { result } = mount();
    expect(result.current.layers).toHaveLength(1);
    expect(result.current.layers[0].id).toBe("root");
    expect(result.current.layers[0].children.map((c) => c.id)).toEqual(["a", "b"]);
    expect(result.current.layers[0].children[0].children.map((c) => c.id)).toEqual(["a1"]);
  });

  it("totalCount counts every node in the tree", () => {
    const { result } = mount();
    expect(result.current.totalCount).toBe(4); // root, a, a1, b
  });

  it("returns no layers when composer is null", () => {
    const { result } = renderHook(() => useLayerTree(null));
    expect(result.current.layers).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it("auto-expands the root so its direct children are initially visible", () => {
    const { result } = mount();
    expect(result.current.expandedIds.has("root")).toBe(true);
  });
});

describe("useLayerTree — expansion controls", () => {
  it("expandAll then getVisibleLayerIds returns every node", () => {
    const { result } = mount();
    act(() => result.current.expandAll());
    expect(result.current.getVisibleLayerIds().sort()).toEqual(["a", "a1", "b", "root"]);
  });

  it("collapseAll leaves only the root expanded (grandchildren hidden)", () => {
    const { result } = mount();
    act(() => result.current.expandAll());
    act(() => result.current.collapseAll());
    // root expanded → root + its direct children visible; a1 (grandchild) hidden
    expect(result.current.getVisibleLayerIds().sort()).toEqual(["a", "b", "root"]);
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
    act(() => result.current.expandIds([]));
    expect(result.current.expandedIds.has("root")).toBe(true); // untouched

    act(() => result.current.expandIds(["a", "b"]));
    expect(result.current.expandedIds.has("a")).toBe(true);
    expect(result.current.expandedIds.has("b")).toBe(true);
    expect(result.current.expandedIds.has("root")).toBe(true);
  });

  it("getVisibleLayerIds hides children of collapsed nodes", () => {
    const { result } = mount();
    // Only root expanded initially → a1 is under a (collapsed) so hidden
    expect(result.current.getVisibleLayerIds()).not.toContain("a1");
  });
});
