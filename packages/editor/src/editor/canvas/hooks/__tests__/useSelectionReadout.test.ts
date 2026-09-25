// @vitest-environment jsdom
/**
 * useSelectionReadout — the canvas bar's "{Type} · {layer name}" (board
 * 5936:44788 "Section · Hero · 680 × 250"). The name is the one Layers shows:
 * a custom layer name, else a text layer's own copy, else nothing.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Composer } from "@/engine";
import { useSelectionReadout } from "../useSelectionReadout";

const composerWith = (el: { type: string; content?: string; layerName?: string }) =>
  ({
    on: () => {},
    off: () => {},
    isProjectLoading: () => false,
    selection: { getSelectedIds: () => ["e1"] },
    elements: {
      getActivePage: () => ({ id: "p1" }),
      getElement: () => ({
        getType: () => el.type,
        getContent: () => el.content ?? "",
        getCustomData: (k: string) => (k === "layerName" ? el.layerName : undefined),
      }),
    },
  }) as unknown as Composer;

const label = (el: { type: string; content?: string; layerName?: string }) =>
  renderHook(() => useSelectionReadout(composerWith(el), { id: "e1", type: el.type })).result.current.label;

describe("useSelectionReadout — layer name", () => {
  it("a named layer reads Type · name", () => {
    expect(label({ type: "section", layerName: "Hero" })).toBe("Section · Hero");
  });
  it("an unnamed text layer reads its copy, as Layers does", () => {
    expect(label({ type: "heading", content: "Wood-fired <b>pizza</b>" })).toBe("Heading · Wood-fired pizza");
  });
  it("an unnamed container reads its type alone", () => {
    expect(label({ type: "section" })).toBe("Section");
  });
});

/* Board 4418:166980: after "Hero created as a component" the bar reads
   "Component instance · Hero · 680 × 250" — the master's name, not the layer's. */
describe("useSelectionReadout — component instance", () => {
  it("an instance reads Component instance · master name", () => {
    const composer = composerWith({ type: "section", layerName: "Hero section" }) as unknown as Record<string, unknown>;
    composer.components = {
      getInstanceByElementId: (id: string) => (id === "e1" ? { componentId: "c1" } : undefined),
      getComponent: (id: string) => (id === "c1" ? { name: "Hero" } : undefined),
    };
    const { result } = renderHook(() => useSelectionReadout(composer as unknown as Composer, { id: "e1", type: "section" }));
    expect(result.current.label).toBe("Component instance · Hero");
  });
});

/* Board 4418:100890: while an Add row is dragged, the bar reads where it will
   land instead of the selection. */
describe("useSelectionReadout — Add drag", () => {
  it("reads 'Inserting {el} → {path} · after {sibling}' during the drag", async () => {
    const handlers = new Map<string, Set<(p: unknown) => void>>();
    const composer = {
      ...(composerWith({ type: "section", layerName: "Hero" }) as unknown as Record<string, unknown>),
      on: (e: string, h: (p: unknown) => void) => { if (!handlers.has(e)) handlers.set(e, new Set()); handlers.get(e)!.add(h); },
      off: (e: string, h: (p: unknown) => void) => handlers.get(e)?.delete(h),
    } as unknown as Composer;
    const fire = (e: string, p: unknown) => handlers.get(e)?.forEach((h) => h(p));
    const { result } = renderHook(() => useSelectionReadout(composer, { id: "e1", type: "section" }));
    const { act } = await import("@testing-library/react");
    act(() => fire("ui:insert-drag", { label: "Heading" }));
    act(() => fire("ui:insert-drag-target", { path: "Home › Hero › Content", into: "Content", after: "Subtitle" }));
    expect(result.current.label).toBe("Inserting Heading → Home › Hero › Content · after Subtitle");
    expect(result.current.dims).toBeNull();
    act(() => fire("ui:insert-drag", { label: null }));
    expect(result.current.label).toBe("Section · Hero");
  });
});
