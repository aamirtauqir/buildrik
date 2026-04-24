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

  it("refreshes after handleBatchStyleChange writes to mobile overlay", () => {
    const e1 = makeElement("e1", { color: "#000" });
    const composer = makeComposer([e1]);
    // StyleEngine stub: setBreakpointStyle mutates the overlay and emits.
    const overlays = new Map<string, Record<string, string>>();
    composer.styles.getBreakpointStyle = vi.fn((id: string, bp: string) =>
      overlays.get(`${id}::${bp}`) ?? {}
    );
    composer.styles.setBreakpointStyle = vi.fn((id: string, bp: string, changes: Record<string, string>) => {
      const key = `${id}::${bp}`;
      overlays.set(key, { ...(overlays.get(key) ?? {}), ...changes });
      composer._fire("style:changed", { elementId: id, breakpoint: bp, styles: changes });
    });

    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1"], "mobile", "normal")
    );
    expect(result.current.styles.color).toBe("#000");

    act(() => {
      result.current.handleBatchStyleChange({ color: "#f00" });
    });

    // Panel must reflect the new mobile overlay value, not the base.
    expect(result.current.styles.color).toBe("#f00");
  });

  it("refreshes when an external style:changed fires for a selected id", () => {
    const e1 = makeElement("e1", { color: "#000" });
    const composer = makeComposer([e1]);
    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1"], "desktop", "normal")
    );
    expect(result.current.styles.color).toBe("#000");

    act(() => {
      e1.setStyle("color", "#0f0");
      composer._fire("style:changed", {
        selector: '[data-buildrick-id="e1"]',
        properties: { color: "#0f0" },
      });
    });
    expect(result.current.styles.color).toBe("#0f0");
  });

  it("ignores element:updated for non-selected ids", () => {
    const e1 = makeElement("e1", { color: "#000" });
    const e2 = makeElement("e2", { color: "#fff" });
    const composer = makeComposer([e1, e2]);
    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1"], "desktop", "normal")
    );
    const before = result.current.styles.color;

    // Mutate e2 (not selected) and fire — should NOT change our view's color.
    act(() => {
      e2.setStyle("color", "#xyz");
      composer._fire("element:updated", e2);
    });
    expect(result.current.styles.color).toBe(before);
  });

  it("ignores style:changed for non-selected ids (breakpoint payload)", () => {
    const e1 = makeElement("e1", { color: "#000" });
    const e2 = makeElement("e2", { color: "#000" });
    const composer = makeComposer([e1, e2]);
    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1"], "mobile", "normal")
    );
    const before = result.current.styles.color;

    // style:changed for e2 under mobile — payload shape from setBreakpointStyle.
    // Our view (selected=e1) must stay unchanged.
    act(() => {
      composer._fire("style:changed", { elementId: "e2", breakpoint: "mobile", styles: { color: "#f00" } });
    });
    expect(result.current.styles.color).toBe(before);
  });

  it("ignores style:changed for non-selected ids (selector payload)", () => {
    const e1 = makeElement("e1", { color: "#000" });
    const composer = makeComposer([e1]);
    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1"], "desktop", "normal")
    );
    const before = result.current.styles.color;

    // style:changed from setRule for some other element's :hover rule.
    act(() => {
      composer._fire("style:changed", {
        selector: '[data-buildrick-id="e99"]:hover',
        properties: { color: "#f00" },
      });
    });
    expect(result.current.styles.color).toBe(before);
  });
});
