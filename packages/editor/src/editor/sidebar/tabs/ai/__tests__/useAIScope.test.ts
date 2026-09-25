/**
 * useAIScope — the AI panel's "Scope: <what>" follows the selection as it
 * SETTLES (the selection manager announces a new element before it retires
 * the old one, and a multi-select before its first element), named the way
 * the boards name it: "Hero section", "Menu preview image", "Flex container".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAIScope, scopeLabel } from "../hooks/useAIScope";
import { EVENTS } from "@/shared/constants/events";

interface FakeElement {
  getId: () => string;
  getType: () => string;
  getCustomData: (k: string) => unknown;
  getAttribute: (n: string) => string | undefined;
}

const el = (id: string, type: string, layerName?: string): FakeElement => ({
  getId: () => id,
  getType: () => type,
  getCustomData: (k: string) => (k === "layerName" ? layerName : undefined),
  getAttribute: () => undefined,
});

function makeComposer(initial: FakeElement[] = []) {
  const handlers = new Map<string, Set<(...a: unknown[]) => void>>();
  let selected = initial;
  const composer = {
    selection: { getAllSelected: () => selected },
    on(evt: string, fn: (...a: unknown[]) => void) {
      if (!handlers.has(evt)) handlers.set(evt, new Set());
      handlers.get(evt)!.add(fn);
    },
    off(evt: string, fn: (...a: unknown[]) => void) {
      handlers.get(evt)?.delete(fn);
    },
    emit(evt: string, ...args: unknown[]) {
      for (const fn of handlers.get(evt) ?? []) fn(...args);
    },
    /** What SelectionManager.select does: selected(new), then deselected(old). */
    select(next: FakeElement) {
      const old = selected[0];
      selected = [next];
      composer.emit(EVENTS.ELEMENT_SELECTED, next);
      if (old) composer.emit(EVENTS.ELEMENT_DESELECTED, old);
    },
    /** What selectMultiple does: multiple, then selected(first). */
    selectMultiple(els: FakeElement[]) {
      selected = els;
      composer.emit(EVENTS.SELECTION_MULTIPLE, els);
      composer.emit(EVENTS.ELEMENT_SELECTED, els[0]);
    },
    clear() {
      const old = selected[0];
      selected = [];
      if (old) composer.emit(EVENTS.ELEMENT_DESELECTED, old);
    },
  };
  return composer;
}

const settle = () => act(async () => { await Promise.resolve(); });

describe("scopeLabel", () => {
  it.each([
    [el("h", "section", "Hero"), "Hero section"],
    [el("i", "image", "Menu preview"), "Menu preview image"],
    [el("t", "heading"), "Heading text"],
    [el("f", "flex"), "Flex container"],
    [el("g", "grid"), "Grid container"],
    [el("b", "button", "Menu"), "Menu button"],
    [el("x", "image"), "Image"],
  ])("%#: names the element as the boards do", (e, label) => {
    expect(scopeLabel(e as never)).toBe(label);
  });
});

describe("useAIScope", () => {
  let composer: ReturnType<typeof makeComposer>;
  beforeEach(() => { composer = makeComposer(); });

  it("starts on the whole page when nothing is selected", () => {
    const { result } = renderHook(() => useAIScope(composer as never));
    expect(result.current.scope).toEqual({ kind: "page" });
    expect(result.current.status).toBe("idle");
  });

  it("seeds from the current selection on mount", () => {
    composer = makeComposer([el("h", "section", "Hero")]);
    const { result } = renderHook(() => useAIScope(composer as never));
    expect(result.current.scope).toEqual({ kind: "element", id: "h", label: "Hero section", name: "Hero" });
  });

  it("selecting another element with the panel open scopes to it (not 'Whole page')", async () => {
    const { result } = renderHook(() => useAIScope(composer as never));
    act(() => composer.select(el("h", "section", "Hero")));
    await settle();
    act(() => composer.select(el("i", "image", "Menu preview")));
    await settle();
    expect(result.current.scope).toEqual({ kind: "element", id: "i", label: "Menu preview image", name: "Menu preview" });
  });

  it("a multi-select stays '3 selected'", async () => {
    const { result } = renderHook(() => useAIScope(composer as never));
    act(() => composer.selectMultiple([el("a", "text"), el("b", "text"), el("c", "text")]));
    await settle();
    expect(result.current.scope).toEqual({ kind: "multi", ids: ["a", "b", "c"] });
  });

  it("clearing the selection returns to the whole page", async () => {
    const { result } = renderHook(() => useAIScope(composer as never));
    act(() => composer.select(el("h", "section", "Hero")));
    act(() => composer.clear());
    await settle();
    expect(result.current.scope).toEqual({ kind: "page" });
  });

  it("lock() freezes the scope; unlock() resumes tracking", async () => {
    const { result } = renderHook(() => useAIScope(composer as never));
    act(() => composer.select(el("h", "section", "Hero")));
    await settle();
    act(() => result.current.lock());
    act(() => composer.select(el("f", "section", "Footer")));
    await settle();
    expect(result.current.scope).toMatchObject({ id: "h" });
    act(() => result.current.unlock());
    act(() => composer.select(el("g", "grid")));
    await settle();
    expect(result.current.scope).toEqual({ kind: "element", id: "g", label: "Grid container", name: "the selected grid" });
  });
});
