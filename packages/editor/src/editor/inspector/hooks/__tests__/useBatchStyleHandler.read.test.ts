import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBatchStyleHandler } from "../useBatchStyleHandler";

function makeElement(id: string, baseStyles: Record<string, string> = {}) {
  return {
    _styles: { ...baseStyles },
    getId: () => id,
    getStyles() { return { ...this._styles }; },
    setStyle(prop: string, val: string) { this._styles[prop] = val; },
    removeStyle(prop: string) { delete this._styles[prop]; },
  };
}

function makeComposer(els: ReturnType<typeof makeElement>[]) {
  const map = new Map(els.map((el) => [el.getId(), el]));
  const listeners = new Map<string, (p: unknown) => void>();
  const composer = {
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    elements: { getElement: (id: string) => map.get(id) },
    styles: {
      getBreakpointStyle: vi.fn(() => ({})),
      getRule: vi.fn(() => undefined),
      setBreakpointStyle: vi.fn(),
      removeBreakpointStyleProperty: vi.fn(),
      setRule: vi.fn(),
    },
    on: vi.fn((evt: string, cb: any) => { listeners.set(evt, cb); }),
    off: vi.fn((evt: string) => { listeners.delete(evt); }),
    _fire: (evt: string, payload?: unknown) => listeners.get(evt)?.(payload),
  } as any;
  return composer;
}

describe("useBatchStyleHandler reads effective styles + refreshes on events", () => {
  afterEach(() => vi.useRealTimers());

  it("reads mobile breakpoint overlay instead of base styles", () => {
    const e1 = makeElement("e1", { color: "#000" });
    const e2 = makeElement("e2", { color: "#000" });
    const composer = makeComposer([e1, e2]);
    // Both elements have mobile overlay color = red
    composer.styles.getBreakpointStyle = vi.fn((_id: string, bp: string) =>
      bp === "mobile" ? { color: "#f00" } : {}
    );

    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1", "e2"], "mobile", "normal")
    );

    expect(result.current.styles.color).toBe("#f00");
    expect(result.current.mixed.has("color")).toBe(false);
  });

  it("reads :hover pseudo overlay instead of base", () => {
    const e1 = makeElement("e1", { color: "#000" });
    const composer = makeComposer([e1]);
    composer.styles.getRule = vi.fn((sel: string) =>
      sel === '[data-buildrick-id="e1"]:hover' ? { properties: { color: "#0f0" } } : undefined
    );

    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1"], "desktop", "hover")
    );
    expect(result.current.styles.color).toBe("#0f0");
  });

  it("refreshes when composer emits element:updated for a selected id", () => {
    const e1 = makeElement("e1", { color: "#000" });
    const composer = makeComposer([e1]);
    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1"], "desktop", "normal")
    );
    expect(result.current.styles.color).toBe("#000");

    // External mutation (e.g., undo/redo, other panel)
    act(() => {
      e1.setStyle("color", "#abc");
      composer._fire("element:updated", e1);
    });
    expect(result.current.styles.color).toBe("#abc");
  });

  it("ignores element:updated for non-selected ids", () => {
    const e1 = makeElement("e1", { color: "#000" });
    const e2 = makeElement("e2", { color: "#fff" });
    const composer = makeComposer([e1, e2]);
    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1"], "desktop", "normal")
    );
    const before = result.current.styles.color;

    // Mutate e2 (not selected) and fire — should NOT refresh.
    act(() => {
      e2.setStyle("color", "#xyz");
      composer._fire("element:updated", e2);
    });
    expect(result.current.styles.color).toBe(before);
  });
});
