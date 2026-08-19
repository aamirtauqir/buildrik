/**
 * StyleEngine RAF batching tests
 *
 * @module engine/styles/__tests__/StyleEngine
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { StyleEngine } from "../StyleEngine";
import { EVENTS } from "@shared/constants/events";
import { getBreakpointQuery } from "@shared/constants/breakpoints";
import type { BreakpointId } from "@shared/types/breakpoints";
import type { Element } from "@/engine/elements/Element";

function makeComposer(device: string = "desktop") {
  const listeners = new Map<string, Set<(p?: unknown) => void>>();
  return {
    emit: vi.fn((event: string, payload?: unknown) => {
      listeners.get(event)?.forEach((cb) => cb(payload));
    }),
    on: vi.fn((event: string, cb: (p?: unknown) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: (p?: unknown) => void) => {
      listeners.get(event)?.delete(cb);
    }),
    markDirty: vi.fn(),
    elements: {
      getElement: vi.fn(),
    },
    viewport: {
      getDevice: vi.fn(() => device),
      setDeviceForTest(d: string) {
        device = d;
      },
    },
  } as unknown as ConstructorParameters<typeof StyleEngine>[0] & {
    viewport: { getDevice: () => string; setDeviceForTest: (d: string) => void };
  };
}

describe("StyleEngine RAF batching", () => {
  let engine: StyleEngine;
  let composer: ReturnType<typeof makeComposer>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    composer = makeComposer();
    engine = new StyleEngine(composer);
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("batches 3 setProperty calls into a single toCSS() rebuild after RAF", () => {
    const toCSSSpy = vi.spyOn(engine, "toCSS");

    engine.setProperty('[data-buildrick-id="el-1"]', "color", "red");
    engine.setProperty('[data-buildrick-id="el-1"]', "font-size", "16px");
    engine.setProperty('[data-buildrick-id="el-1"]', "margin", "10px");

    // Before RAF, toCSS should not have been called
    expect(toCSSSpy).not.toHaveBeenCalled();

    // Trigger all pending RAF callbacks
    vi.runAllTimers();

    // After RAF, toCSS should have been called exactly once
    expect(toCSSSpy).toHaveBeenCalledTimes(1);
  });

  it("flush() synchronously applies pending update", () => {
    const toCSSSpy = vi.spyOn(engine, "toCSS");

    engine.setProperty('[data-buildrick-id="el-1"]', "color", "red");

    // Before flush, toCSS should not have been called
    expect(toCSSSpy).not.toHaveBeenCalled();

    // Flush synchronously
    engine.flush();

    // toCSS should have been called once
    expect(toCSSSpy).toHaveBeenCalledTimes(1);

    // The style element should contain the CSS
    const styleEl = (engine as unknown as Record<string, unknown>)[
      "styleElement"
    ] as HTMLStyleElement;
    expect(styleEl.textContent).toContain("color: red");
  });

  it("does not call toCSS() for reads via getStyles()", () => {
    const toCSSSpy = vi.spyOn(engine, "toCSS");

    engine.setProperty('[data-buildrick-id="el-1"]', "color", "red");
    const styles = engine.getStyles("el-1");

    expect(styles).toBeDefined();
    expect(toCSSSpy).not.toHaveBeenCalled();
  });
});

describe("StyleEngine rule index", () => {
  let engine: StyleEngine;
  let composer: ReturnType<typeof makeComposer>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    composer = makeComposer();
    engine = new StyleEngine(composer);
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("finds a rule by selector after setRule", () => {
    engine.setRule(".a", { color: "red" });
    const found = engine.getRule(".a");
    expect(found).toBeDefined();
    expect(found?.selector).toBe(".a");
    expect(found?.properties.color).toBe("red");
  });

  it("finds a rule with media query", () => {
    engine.setRule(".b", { color: "blue" }, { mediaQuery: "(max-width: 768px)" });
    const found = engine.getRule(".b", "(max-width: 768px)");
    expect(found).toBeDefined();
    expect(found?.selector).toBe(".b");
    expect(found?.mediaQuery).toBe("(max-width: 768px)");
  });

  it("removes rule from index on removeRule", () => {
    engine.setRule(".a", { color: "red" });
    expect(engine.getRule(".a")).toBeDefined();

    engine.removeRule(".a");
    expect(engine.getRule(".a")).toBeUndefined();
  });
});

// L2 defense (2026-05-23): importStyles must drop malformed entries
// instead of letting them poison engine state. Bad rules previously
// reached useTokenUsageMap, crashed DesignSystemTab via undefined
// selector, and rendered "Something went wrong" across 4 sidebar tabs.
describe("StyleEngine.importStyles — validation", () => {
  let engine: StyleEngine;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    engine = new StyleEngine(makeComposer());
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    engine.destroy();
    warnSpy.mockRestore();
    vi.useRealTimers();
  });

  it("imports valid rules", () => {
    engine.importStyles([
      { id: "s1", selector: ".a", properties: { color: "red" } },
      { id: "s2", selector: ".b", properties: { color: "blue" } },
    ]);
    expect(engine.getRule(".a")?.properties.color).toBe("red");
    expect(engine.getRule(".b")?.properties.color).toBe("blue");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("drops rule with undefined selector + warns", () => {
    engine.importStyles([
      { id: "s1", selector: ".a", properties: { color: "red" } },
      { id: "s2", selector: undefined as unknown as string, properties: {} },
    ]);
    expect(engine.getRule(".a")).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("dropped 1"));
  });

  it("drops rule with empty-string selector", () => {
    engine.importStyles([
      { id: "s1", selector: "", properties: {} },
    ]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("dropped 1"));
  });

  it("drops rule with missing id", () => {
    engine.importStyles([
      { id: undefined as unknown as string, selector: ".a", properties: {} },
    ]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("dropped 1"));
  });

  it("drops rule with missing properties", () => {
    engine.importStyles([
      { id: "s1", selector: ".a", properties: undefined as unknown as Record<string, string> },
    ]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("dropped 1"));
  });

  it("drops null entry without throwing", () => {
    engine.importStyles([
      null as unknown as { id: string; selector: string; properties: Record<string, string> },
      { id: "s1", selector: ".ok", properties: {} },
    ]);
    expect(engine.getRule(".ok")).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("dropped 1"));
  });

  it("counts multiple drops in a single warn", () => {
    engine.importStyles([
      { id: "s1", selector: undefined as unknown as string, properties: {} },
      { id: "", selector: ".x", properties: {} },
      { id: "s3", selector: ".ok", properties: { color: "green" } },
    ]);
    expect(engine.getRule(".ok")).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("dropped 2"));
  });
});

// ============================================================
// Extended coverage: style element lifecycle, rule CRUD with
// pseudo/media selectors, device + breakpoint rules, CSS
// serialization, computed styles, inheritance, events.
// ============================================================

/**
 * Composer mock with typed handles on the spies (avoids reaching
 * through the cast to get at emit/markDirty/getElement).
 */
function makeComposerHarness() {
  const emit = vi.fn();
  const markDirty = vi.fn();
  const getElement = vi.fn();
  return {
    composer: {
      emit,
      on: vi.fn(),
      off: vi.fn(),
      markDirty,
      elements: { getElement },
      viewport: { getDevice: vi.fn(() => "desktop") },
    } as unknown as ConstructorParameters<typeof StyleEngine>[0],
    emit,
    markDirty,
    getElement,
  };
}

interface MockElementData {
  id: string;
  breakpointStyles?: Record<string, Record<string, string>>;
  data?: Record<string, unknown>;
}

/**
 * Element mock faithful to the real Element semantics that
 * StyleEngine depends on:
 * - getData() returns a SHALLOW copy ({ ...data }) — nested objects
 *   are shared by reference with the element.
 * - setData(key, value) writes into the CUSTOM DATA bag (data.data),
 *   NOT top-level ElementData fields (see Element.ts setData).
 */
function makeElementMock(id: string, seed?: Omit<MockElementData, "id">) {
  const data: MockElementData = { id, ...seed };
  return {
    data,
    getId: () => id,
    getClasses: (): string[] => [],
    getData: () => ({ ...data }),
    setData: (key: string, value: unknown) => {
      if (!data.data) data.data = {};
      data.data[key] = value;
    },
    // Mirrors the real Element.setBreakpointStyles: writes the TOP-LEVEL
    // ElementData.breakpointStyles field, NOT the custom-data bag (data.data).
    setBreakpointStyles: (styles: Record<string, Record<string, string>>) => {
      data.breakpointStyles = styles;
    },
  };
}

/** Minimal element for computeStyles/inheritStyles (id + classes only). */
function makeStyledElement(id: string, classes: string[] = []): Element {
  return {
    getId: () => id,
    getClasses: () => classes,
  } as unknown as Element;
}

function emitsOf(emit: ReturnType<typeof vi.fn>, event: string) {
  return emit.mock.calls.filter((call) => call[0] === event);
}

describe("StyleEngine style element lifecycle", () => {
  let engine: StyleEngine;
  let harness: ReturnType<typeof makeComposerHarness>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    harness = makeComposerHarness();
    engine = new StyleEngine(harness.composer);
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  function styleEl(): HTMLStyleElement {
    return (engine as unknown as Record<string, unknown>)["styleElement"] as HTMLStyleElement;
  }

  it('creates a <style id="aquibra-styles"> element in document.head on construction', () => {
    const el = styleEl();
    expect(el).toBeInstanceOf(HTMLStyleElement);
    expect(el.id).toBe("aquibra-styles");
    expect(document.head.contains(el)).toBe(true);
  });

  it("flushes rules into the style element on the RAF tick", () => {
    engine.setRule(".a", { color: "red" });

    // Not flushed yet — RAF has not fired
    expect(styleEl().textContent).toBe("");

    vi.runAllTimers();

    expect(styleEl().textContent).toContain(".a {");
    expect(styleEl().textContent).toContain("color: red;");
  });

  it("clear() removes all rules and flushes an empty stylesheet", () => {
    engine.setRule(".a", { color: "red" });
    engine.setRule(".b", { color: "blue" }, { mediaQuery: "(max-width: 1023px)" });
    vi.runAllTimers();
    expect(styleEl().textContent).not.toBe("");

    engine.clear();
    vi.runAllTimers();

    expect(engine.getRule(".a")).toBeUndefined();
    expect(engine.getRule(".b", "(max-width: 1023px)")).toBeUndefined();
    expect(engine.exportStyles()).toEqual([]);
    expect(styleEl().textContent).toBe("");
  });

  it("flushes synchronously when requestAnimationFrame is unavailable", () => {
    vi.stubGlobal("requestAnimationFrame", undefined);
    try {
      engine.setRule(".sync", { color: "red" });
      // No RAF tick needed — the non-RAF environment fallback flushes inline
      expect(styleEl().textContent).toContain(".sync {");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("destroy() removes the style element from the document", () => {
    const el = styleEl();
    expect(document.head.contains(el)).toBe(true);

    engine.setRule(".a", { color: "red" }); // leaves a pending RAF
    engine.destroy();

    expect(document.head.contains(el)).toBe(false);
    // Idempotent: destroying again must not throw
    expect(() => engine.destroy()).not.toThrow();
  });
});

describe("StyleEngine.setRule — selectors, pseudo, media", () => {
  let engine: StyleEngine;
  let harness: ReturnType<typeof makeComposerHarness>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    harness = makeComposerHarness();
    engine = new StyleEngine(harness.composer);
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("merges properties into an existing rule instead of duplicating it", () => {
    const first = engine.setRule(".a", { color: "red" });
    const second = engine.setRule(".a", { fontSize: "16px" });

    expect(second.id).toBe(first.id);
    expect(second.properties).toEqual({ color: "red", fontSize: "16px" });
    expect(engine.exportStyles()).toHaveLength(1);
  });

  it("appends pseudo option to the selector", () => {
    const style = engine.setRule(".btn", { color: "red" }, { pseudo: ":hover" });

    expect(style.selector).toBe(".btn:hover");
    expect(style.pseudo).toBe(":hover");
    // Lookup requires the full selector including the pseudo
    expect(engine.getRule(".btn:hover")).toBe(style);
    expect(engine.getRule(".btn")).toBeUndefined();
  });

  it("combines pseudo and mediaQuery on one rule", () => {
    const style = engine.setRule(
      ".btn",
      { color: "red" },
      { pseudo: ":hover", mediaQuery: "(max-width: 767px)" }
    );

    expect(style.selector).toBe(".btn:hover");
    expect(style.mediaQuery).toBe("(max-width: 767px)");
    expect(engine.getRule(".btn:hover", "(max-width: 767px)")).toBe(style);
    // Same selector without the media query is a different key
    expect(engine.getRule(".btn:hover")).toBeUndefined();
  });

  it("keeps the same selector under different media queries as independent rules", () => {
    engine.setRule(".a", { color: "red" });
    engine.setRule(".a", { color: "green" }, { mediaQuery: "(max-width: 1023px)" });
    engine.setRule(".a", { color: "blue" }, { mediaQuery: "(max-width: 767px)" });

    expect(engine.getRule(".a")?.properties.color).toBe("red");
    expect(engine.getRule(".a", "(max-width: 1023px)")?.properties.color).toBe("green");
    expect(engine.getRule(".a", "(max-width: 767px)")?.properties.color).toBe("blue");
    expect(engine.exportStyles()).toHaveLength(3);
  });

  it("emits STYLE_CHANGED with the rule and marks the project dirty", () => {
    const style = engine.setRule(".a", { color: "red" });

    expect(emitsOf(harness.emit, EVENTS.STYLE_CHANGED)).toHaveLength(1);
    expect(emitsOf(harness.emit, EVENTS.STYLE_CHANGED)[0][1]).toBe(style);
    expect(harness.markDirty).toHaveBeenCalledTimes(1);
  });

  it("removeRule emits STYLE_REMOVED and returns false for unknown selectors", () => {
    const style = engine.setRule(".a", { color: "red" });

    expect(engine.removeRule(".a")).toBe(true);
    const removed = emitsOf(harness.emit, EVENTS.STYLE_REMOVED);
    expect(removed).toHaveLength(1);
    expect(removed[0][1]).toBe(style);

    expect(engine.removeRule(".missing")).toBe(false);
    expect(emitsOf(harness.emit, EVENTS.STYLE_REMOVED)).toHaveLength(1);
  });
});

describe("StyleEngine.setProperty / removeProperty", () => {
  let engine: StyleEngine;
  let harness: ReturnType<typeof makeComposerHarness>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    harness = makeComposerHarness();
    engine = new StyleEngine(harness.composer);
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("creates the rule when the selector has none yet", () => {
    engine.setProperty(".fresh", "color", "red");

    expect(engine.getRule(".fresh")?.properties).toEqual({ color: "red" });
  });

  it("updates an existing property in place", () => {
    engine.setRule(".a", { color: "red" });
    engine.setProperty(".a", "color", "blue");

    expect(engine.getRule(".a")?.properties.color).toBe("blue");
    expect(engine.exportStyles()).toHaveLength(1);
  });

  it("removeProperty deletes the property and emits STYLE_CHANGED", () => {
    engine.setRule(".a", { color: "red", padding: "8px" });
    harness.emit.mockClear();

    engine.removeProperty(".a", "color");

    expect(engine.getRule(".a")?.properties).toEqual({ padding: "8px" });
    expect(emitsOf(harness.emit, EVENTS.STYLE_CHANGED)).toHaveLength(1);
  });

  it("removeProperty is a no-op (no emit) when the property is absent", () => {
    engine.setRule(".a", { color: "red" });
    harness.emit.mockClear();
    harness.markDirty.mockClear();

    engine.removeProperty(".a", "padding");
    engine.removeProperty(".missing", "color");

    expect(harness.emit).not.toHaveBeenCalled();
    expect(harness.markDirty).not.toHaveBeenCalled();
  });
});

describe("StyleEngine.getRulesForSelector", () => {
  let engine: StyleEngine;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    engine = new StyleEngine(makeComposerHarness().composer);
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("returns the base rule and its pseudo variants", () => {
    engine.setRule(".btn", { color: "red" });
    engine.setRule(".btn", { color: "blue" }, { pseudo: ":hover" });

    const rules = engine.getRulesForSelector(".btn");
    expect(rules.map((r) => r.selector).sort()).toEqual([".btn", ".btn:hover"]);
  });

  // `.btn` matches only the exact class — a longer identifier like
  // `.btn-primary` is a different class and must not leak in (prefix collision
  // fixed: matching stops at selector boundaries, not identifier continuation).
  it("does not match .btn-primary for a .btn lookup (no prefix collision)", () => {
    engine.setRule(".btn", { color: "red" });
    engine.setRule(".btn-primary", { color: "blue" });

    const rules = engine.getRulesForSelector(".btn");
    expect(rules.map((r) => r.selector).sort()).toEqual([".btn"]);
  });

  // Boundary variants (pseudo `:hover`, compound `.active`) still match; only a
  // plain identifier continuation (`-primary`) is excluded.
  it("still matches boundary variants (.btn:hover, .btn.active) but not .btn-primary", () => {
    engine.setRule(".btn", { color: "red" });
    engine.setRule(".btn", { color: "blue" }, { pseudo: ":hover" });
    engine.setRule(".btn.active", { color: "green" });
    engine.setRule(".btn-primary", { color: "purple" });

    const rules = engine.getRulesForSelector(".btn");
    expect(rules.map((r) => r.selector).sort()).toEqual([".btn", ".btn.active", ".btn:hover"]);
  });
});

describe("StyleEngine.setDeviceRule — DIVERGENT media queries (audit B9 drift)", () => {
  // setDeviceRule hardcodes tablet=(max-width: 991px) / mobile=(max-width: 575px)
  // while the breakpoint SSOT (shared/constants/breakpoints.ts) defines
  // tablet=(max-width: 1023px) / mobile=(max-width: 767px). These tests assert
  // the CURRENT divergent behavior as-is per audit B9 — do not "fix" the
  // numbers here without reconciling the drift in source first.
  let engine: StyleEngine;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    engine = new StyleEngine(makeComposerHarness().composer);
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("tablet device rule uses (max-width: 991px)", () => {
    const style = engine.setDeviceRule(".a", { color: "red" }, "tablet");
    expect(style.mediaQuery).toBe("(max-width: 991px)");
    expect(engine.getRule(".a", "(max-width: 991px)")).toBe(style);
  });

  it("mobile device rule uses (max-width: 575px)", () => {
    const style = engine.setDeviceRule(".a", { color: "red" }, "mobile");
    expect(style.mediaQuery).toBe("(max-width: 575px)");
    expect(engine.getRule(".a", "(max-width: 575px)")).toBe(style);
  });

  it("device rules are invisible to breakpoint-SSOT lookups (the B9 drift)", () => {
    engine.setDeviceRule(".a", { color: "red" }, "tablet");
    engine.setDeviceRule(".a", { color: "blue" }, "mobile");

    // SSOT queries (1023/767) find nothing where setDeviceRule wrote (991/575)
    expect(engine.getRule(".a", getBreakpointQuery("tablet") ?? undefined)).toBeUndefined();
    expect(engine.getRule(".a", getBreakpointQuery("mobile") ?? undefined)).toBeUndefined();
  });
});

describe("StyleEngine breakpoint styles", () => {
  let engine: StyleEngine;
  let harness: ReturnType<typeof makeComposerHarness>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    harness = makeComposerHarness();
    engine = new StyleEngine(harness.composer);
    // devWarn logs in DEV mode (vitest); silence to keep output clean
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    engine.destroy();
    warnSpy.mockRestore();
    vi.useRealTimers();
  });

  it("desktop writes a base rule without a media query", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);

    engine.setBreakpointStyle("el-1", "desktop", { color: "red" });

    const rule = engine.getRule('[data-buildrick-id="el-1"]');
    expect(rule?.properties).toEqual({ color: "red" });
    expect(rule?.mediaQuery).toBeUndefined();
  });

  it("tablet writes a rule under (max-width: 1023px)", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);

    engine.setBreakpointStyle("el-1", "tablet", { color: "green" });

    const rule = engine.getRule('[data-buildrick-id="el-1"]', "(max-width: 1023px)");
    expect(rule?.properties).toEqual({ color: "green" });
  });

  it("mobile writes a rule under (max-width: 767px)", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);

    engine.setBreakpointStyle("el-1", "mobile", { color: "blue" });

    const rule = engine.getRule('[data-buildrick-id="el-1"]', "(max-width: 767px)");
    expect(rule?.properties).toEqual({ color: "blue" });
  });

  it("rejects an invalid breakpoint without creating a rule", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);

    engine.setBreakpointStyle("el-1", "watch" as unknown as BreakpointId, { color: "red" });

    expect(engine.exportStyles()).toEqual([]);
  });

  it("does nothing when the element is unknown", () => {
    harness.getElement.mockReturnValue(undefined);

    engine.setBreakpointStyle("missing", "tablet", { color: "red" });

    expect(engine.exportStyles()).toEqual([]);
  });

  it("emits STYLE_CHANGED with { elementId, breakpoint, styles }", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);

    engine.setBreakpointStyle("el-1", "tablet", { color: "red" });

    const changed = emitsOf(harness.emit, EVENTS.STYLE_CHANGED);
    // setRule emits once with the rule; setBreakpointStyle emits again with payload
    expect(changed[changed.length - 1][1]).toEqual({
      elementId: "el-1",
      breakpoint: "tablet",
      styles: { color: "red" },
    });
  });

  // The mirror write now lands on the TOP-LEVEL ElementData.breakpointStyles
  // field — the one ReactExporter and serialization read — not the custom-data
  // bag (data.data).
  it("mirrors styles into top-level ElementData.breakpointStyles, not the custom-data bag", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);

    engine.setBreakpointStyle("el-1", "tablet", { color: "red" });

    expect(el.data.breakpointStyles).toEqual({ tablet: { color: "red" } });
    expect(el.data.data?.breakpointStyles).toBeUndefined();
  });

  // The merge base is read from top-level getData().breakpointStyles, which is
  // now actually written, so a second breakpoint merges in instead of
  // clobbering the first.
  it("preserves the mirror across breakpoints (no clobber)", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);

    engine.setBreakpointStyle("el-1", "tablet", { color: "red" });
    engine.setBreakpointStyle("el-1", "mobile", { color: "blue" });

    // Both breakpoints survive on the top-level field.
    expect(el.data.breakpointStyles).toEqual({
      tablet: { color: "red" },
      mobile: { color: "blue" },
    });
  });

  // The mirror is visible through the same getData() path serialization/toJSON
  // read, so downstream consumers (ReactExporter) actually see the responsive
  // styles.
  it("exposes the mirror via getData().breakpointStyles for serialization", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);

    engine.setBreakpointStyle("el-1", "tablet", { color: "green", fontSize: "14px" });
    engine.setBreakpointStyle("el-1", "tablet", { color: "red" });

    // Second write merges into the first breakpoint's mirror rather than
    // replacing it wholesale.
    expect(el.getData().breakpointStyles).toEqual({
      tablet: { color: "red", fontSize: "14px" },
    });
  });

  it("getBreakpointStyles returns a per-breakpoint map from the rule store", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);

    engine.setBreakpointStyle("el-1", "desktop", { color: "red" });
    engine.setBreakpointStyle("el-1", "tablet", { color: "green" });
    engine.setBreakpointStyle("el-1", "mobile", { color: "blue" });

    expect(engine.getBreakpointStyles("el-1")).toEqual({
      desktop: { color: "red" },
      tablet: { color: "green" },
      mobile: { color: "blue" },
    });
  });

  it("getBreakpointStyle returns a single breakpoint's properties, {} otherwise", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);

    engine.setBreakpointStyle("el-1", "tablet", { color: "green" });

    expect(engine.getBreakpointStyle("el-1", "tablet")).toEqual({ color: "green" });
    expect(engine.getBreakpointStyle("el-1", "mobile")).toEqual({});
    expect(engine.getBreakpointStyle("el-1", "watch" as unknown as BreakpointId)).toEqual({});
  });

  it("removeBreakpointStyleProperty removes one property and keeps the rest", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);

    engine.setBreakpointStyle("el-1", "tablet", { color: "green", fontSize: "14px" });
    engine.removeBreakpointStyleProperty("el-1", "tablet", "color");

    expect(engine.getBreakpointStyle("el-1", "tablet")).toEqual({ fontSize: "14px" });

    // Invalid breakpoint is a no-op
    engine.removeBreakpointStyleProperty("el-1", "watch" as unknown as BreakpointId, "fontSize");
    expect(engine.getBreakpointStyle("el-1", "tablet")).toEqual({ fontSize: "14px" });
  });

  it("clearBreakpointStyles is a no-op for an invalid breakpoint", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);
    engine.setBreakpointStyle("el-1", "tablet", { color: "red" });

    engine.clearBreakpointStyles("el-1", "watch" as unknown as BreakpointId);

    expect(engine.getBreakpointStyle("el-1", "tablet")).toEqual({ color: "red" });
  });

  it("clearBreakpointStyles removes the rule and deletes seeded top-level element data", () => {
    // Seed top-level breakpointStyles the way a loaded project would carry it.
    const el = makeElementMock("el-2", {
      breakpointStyles: { tablet: { color: "red" } },
    });
    harness.getElement.mockReturnValue(el);
    engine.setRule('[data-buildrick-id="el-2"]', { color: "red" }, { mediaQuery: "(max-width: 1023px)" });

    engine.clearBreakpointStyles("el-2", "tablet");

    expect(engine.getRule('[data-buildrick-id="el-2"]', "(max-width: 1023px)")).toBeUndefined();
    // getData() is a shallow copy, so the nested delete reaches the element
    expect(el.data.breakpointStyles?.tablet).toBeUndefined();
  });
});

describe("StyleEngine CSS serialization", () => {
  let engine: StyleEngine;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    engine = new StyleEngine(makeComposerHarness().composer);
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("toCSS converts camelCase property names to kebab-case", () => {
    engine.setRule(".a", { backgroundColor: "red", fontSize: "16px" });

    const css = engine.toCSS();
    expect(css).toBe(".a {\n  background-color: red;\n  font-size: 16px;\n}");
  });

  it("toCSS groups media-query rules under @media blocks", () => {
    engine.setRule(".a", { color: "red" });
    engine.setRule(".b", { color: "green" }, { mediaQuery: "(max-width: 1023px)" });
    engine.setRule(".c", { color: "blue" }, { mediaQuery: "(max-width: 1023px)" });

    const css = engine.toCSS();
    expect(css).toContain(".a {\n  color: red;\n}");
    expect(css).toContain(
      "@media (max-width: 1023px) {\n.b {\n  color: green;\n}\n.c {\n  color: blue;\n}\n}"
    );
  });

  it("generateScopedCSS prefixes every selector with the scope", () => {
    engine.setRule(".a", { color: "red" });
    engine.setRule(".b", { color: "blue" }, { mediaQuery: "(max-width: 767px)" });

    const css = engine.generateScopedCSS("#site");
    expect(css).toContain("#site .a {");
    expect(css).toContain("#site .b {");
  });

  it("minifies output when minify: true", () => {
    engine.setRule(".a", { color: "red", fontSize: "16px" });

    expect(engine.toCSS({ minify: true })).toBe(".a{color:red;font-size:16px}");
  });

  it("generateResponsiveCSS orders base → tablet → mobile → other queries", () => {
    engine.setRule(".m", { color: "blue" }, { mediaQuery: "(max-width: 767px)" });
    engine.setRule(".c", { color: "black" }, { mediaQuery: "(min-width: 1400px)" });
    engine.setRule(".t", { color: "green" }, { mediaQuery: "(max-width: 1023px)" });
    engine.setRule(".base", { color: "red" });

    const css = engine.generateResponsiveCSS();
    const iBase = css.indexOf(".base {");
    const iTablet = css.indexOf("@media (max-width: 1023px)");
    const iMobile = css.indexOf("@media (max-width: 767px)");
    const iCustom = css.indexOf("@media (min-width: 1400px)");

    expect(iBase).toBeGreaterThanOrEqual(0);
    expect(iTablet).toBeGreaterThan(iBase);
    expect(iMobile).toBeGreaterThan(iTablet);
    expect(iCustom).toBeGreaterThan(iMobile);
  });

  it("generateResponsiveCSS honors minify", () => {
    engine.setRule(".base", { color: "red" });
    engine.setRule(".t", { color: "green" }, { mediaQuery: "(max-width: 1023px)" });

    const css = engine.generateResponsiveCSS({ minify: true });
    expect(css).toContain(".base{color:red}");
    // minifyCSS's `\s*:\s*` pass also strips the space inside media queries
    expect(css).toContain("@media (max-width:1023px){.t{color:green}}");
  });

  it("generateCSS({ optimize: true }) routes output through optimizeCSS", () => {
    engine.setRule(".a", { color: "red" });

    // Single rule: the line-dedupe is safe here and blank lines are dropped
    expect(engine.generateCSS({ optimize: true })).toBe(".a {\n  color: red;\n}");
  });

  it("optimizeCSS dedupes identical repeated rules", () => {
    const out = engine.optimizeCSS(".a {\n  color: red;\n}\n.a {\n  color: red;\n}");
    expect(out).toBe(".a {\n  color: red;\n}");
  });

  // optimizeCSS now dedupes on whole rules, so two DIFFERENT rules that share a
  // declaration both survive intact — no eaten declarations or closing braces.
  it("keeps shared declarations and closing braces across different rules", () => {
    const out = engine.optimizeCSS(".a {\n  color: red;\n}\n\n.b {\n  color: red;\n}");
    expect(out).toBe(".a {\n  color: red;\n}\n.b {\n  color: red;\n}");
  });

  // Rule-aware dedupe drops an identical repeated rule while keeping @media
  // blocks intact as a single unit — no structural corruption on multi-rule CSS.
  it("dedupes whole rules and keeps @media blocks intact", () => {
    const css =
      ".a {\n  display: flex;\n}\n@media (max-width: 767px) {\n.a {\n  display: flex;\n}\n}\n.a {\n  display: flex;\n}";
    const out = engine.optimizeCSS(css);
    expect(out).toBe(
      ".a {\n  display: flex;\n}\n@media (max-width: 767px) {\n.a {\n  display: flex;\n}\n}"
    );
  });
});

describe("StyleEngine export/import round-trip", () => {
  let engine: StyleEngine;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    engine = new StyleEngine(makeComposerHarness().composer);
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("importStyles(exportStyles()) reproduces all lookups in a fresh engine", () => {
    engine.setRule(".a", { color: "red" });
    engine.setRule(".a", { color: "green" }, { mediaQuery: "(max-width: 1023px)" });
    engine.setRule(".btn", { color: "blue" }, { pseudo: ":hover" });

    const exported = engine.exportStyles();
    expect(exported).toHaveLength(3);

    const fresh = new StyleEngine(makeComposerHarness().composer);
    try {
      fresh.importStyles(exported);

      expect(fresh.getRule(".a")?.properties.color).toBe("red");
      expect(fresh.getRule(".a", "(max-width: 1023px)")?.properties.color).toBe("green");
      expect(fresh.getRule(".btn:hover")?.properties.color).toBe("blue");
      expect(fresh.toCSS()).toBe(engine.toCSS());
    } finally {
      fresh.destroy();
    }
  });
});

describe("StyleEngine computed styles", () => {
  let engine: StyleEngine;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    engine = new StyleEngine(makeComposerHarness().composer);
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("computeStyles returns element-rule properties", () => {
    engine.setRule('[data-buildrick-id="el-9"]', { color: "red", margin: "4px" });

    const computed = engine.computeStyles(makeStyledElement("el-9"));
    expect(computed).toEqual({ color: "red", margin: "4px" });
  });

  it("merges class rules over element rules (class wins conflicts)", () => {
    engine.setRule('[data-buildrick-id="el-9"]', { color: "red", margin: "4px" });
    engine.setRule(".card", { color: "blue", padding: "8px" });

    const computed = engine.computeStyles(makeStyledElement("el-9", ["card"]));
    expect(computed).toEqual({ color: "blue", margin: "4px", padding: "8px" });
  });

  it("later classes win conflicts against earlier classes", () => {
    engine.setRule(".first", { color: "red", padding: "8px" });
    engine.setRule(".second", { color: "blue" });

    const computed = engine.computeStyles(makeStyledElement("el-9", ["first", "second"]));
    expect(computed).toEqual({ color: "blue", padding: "8px" });
  });

  // Current behavior: class lookup goes through getRulesForSelector
  // (startsWith), so a class's pseudo-variant rules are merged into the
  // computed base styles too.
  it("merges a class's pseudo-variant rules into computed styles (current behavior)", () => {
    engine.setRule(".card", { color: "red" });
    engine.setRule(".card", { color: "blue" }, { pseudo: ":hover" });

    const computed = engine.computeStyles(makeStyledElement("el-9", ["card"]));
    expect(computed.color).toBe("blue");
  });

  it("getEffectiveStyles delegates to computeStyles", () => {
    engine.setRule('[data-buildrick-id="el-9"]', { color: "red" });

    const el = makeStyledElement("el-9");
    expect(engine.getEffectiveStyles(el)).toEqual(engine.computeStyles(el));
  });

  it("getClassStyles merges rules for multiple classes without an element", () => {
    engine.setRule(".a", { color: "red", margin: "4px" });
    engine.setRule(".b", { color: "blue" });

    expect(engine.getClassStyles(["a", "b"])).toEqual({ color: "blue", margin: "4px" });
    expect(engine.getClassStyles([])).toEqual({});
  });
});

describe("StyleEngine.inheritStyles", () => {
  let engine: StyleEngine;
  let harness: ReturnType<typeof makeComposerHarness>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    harness = makeComposerHarness();
    engine = new StyleEngine(harness.composer);
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it("copies all source properties onto the target's rule", () => {
    engine.setRule('[data-buildrick-id="from-el"]', { color: "red", padding: "8px" });
    engine.setRule('[data-buildrick-id="to-el"]', { margin: "4px" });

    engine.inheritStyles(makeStyledElement("from-el"), makeStyledElement("to-el"));

    expect(engine.getStyles("to-el")?.properties).toEqual({
      margin: "4px",
      color: "red",
      padding: "8px",
    });
  });

  it("respects an explicit properties subset", () => {
    engine.setRule('[data-buildrick-id="from-el"]', { color: "red", padding: "8px" });
    engine.setRule('[data-buildrick-id="to-el"]', {});

    engine.inheritStyles(makeStyledElement("from-el"), makeStyledElement("to-el"), ["color"]);

    expect(engine.getStyles("to-el")?.properties).toEqual({ color: "red" });
  });

  it("emits STYLE_INHERITED with from/to/properties", () => {
    engine.setRule('[data-buildrick-id="from-el"]', { color: "red" });
    engine.setRule('[data-buildrick-id="to-el"]', {});
    const from = makeStyledElement("from-el");
    const to = makeStyledElement("to-el");

    engine.inheritStyles(from, to);

    const inherited = emitsOf(harness.emit, EVENTS.STYLE_INHERITED);
    expect(inherited).toHaveLength(1);
    expect(inherited[0][1]).toEqual({ from, to, properties: ["color"] });
  });

  it("is a no-op when the target element has no rule", () => {
    engine.setRule('[data-buildrick-id="from-el"]', { color: "red" });

    engine.inheritStyles(makeStyledElement("from-el"), makeStyledElement("to-el"));

    expect(engine.getStyles("to-el")).toBeUndefined();
    expect(emitsOf(harness.emit, EVENTS.STYLE_INHERITED)).toHaveLength(0);
  });
});

/* The editor's device preview is a narrowed canvas in a full-width page —
   `@media (max-width: …)` never matches in the editor, so a tablet override
   was stored, exported, and invisible on the canvas claiming to show Tablet
   (found live 2026-08-14: engine held tablet font-size 28px, canvas rendered
   the default). flush() re-emits the active breakpoint's rules without their
   media queries, after the base rules; exports must never see that block. */
describe("StyleEngine editor device preview", () => {
  let engine: StyleEngine;
  let composer: ReturnType<typeof makeComposer>;

  beforeEach(() => {
    composer = makeComposer("desktop");
    engine = new StyleEngine(composer);
    const el = { getData: () => ({}), setBreakpointStyles: vi.fn() } as unknown as Element;
    (composer.elements.getElement as ReturnType<typeof vi.fn>).mockReturnValue(el);
  });

  afterEach(() => {
    engine.destroy();
  });

  const sheet = () => document.getElementById("aquibra-styles")!.textContent!;

  it("desktop: breakpoint rules stay behind their media queries only", () => {
    engine.setBreakpointStyle("el-1", "tablet", { "font-size": "28px" });
    engine.flush();

    const bare = sheet().split("@media")[0];
    expect(bare).not.toContain("font-size: 28px");
    expect(sheet()).toContain("@media (max-width: 1023px)");
  });

  it("tablet: the override is re-emitted un-media'd so the canvas shows it", () => {
    engine.setBreakpointStyle("el-1", "tablet", { "font-size": "28px" });
    (composer as unknown as { viewport: { setDeviceForTest: (d: string) => void } }).viewport.setDeviceForTest("tablet");
    composer.emit(EVENTS.BREAKPOINT_CHANGED, "tablet");
    engine.flush();

    expect(sheet()).toContain("editor device preview (tablet)");
    const preview = sheet().split("editor device preview")[1];
    expect(preview).toContain("font-size: 28px");
  });

  /* …and the re-emitted rules have to BEAT the base ones. The canvas renders
     an element's base styles inline, and inline beats any stylesheet, so the
     block above was in the sheet and the canvas still drew the desktop value —
     measured live 2026-08-19: heading set to 22px on Mobile, the rule present,
     the canvas at 48px. The publish path avoids the collision by emitting base
     styles as class rules; the canvas does not, so these carry !important. */
  it("tablet: the re-emitted rule outranks the inline base style", () => {
    engine.setBreakpointStyle("el-1", "tablet", { "font-size": "28px" });
    (composer as unknown as { viewport: { setDeviceForTest: (d: string) => void } }).viewport.setDeviceForTest("tablet");
    composer.emit(EVENTS.BREAKPOINT_CHANGED, "tablet");
    engine.flush();

    const preview = sheet().split("editor device preview")[1];
    expect(preview).toContain("font-size: 28px !important");
  });

  it("the exported CSS keeps its media queries and stays !important-free", () => {
    engine.setBreakpointStyle("el-1", "tablet", { "font-size": "28px" });
    (composer as unknown as { viewport: { setDeviceForTest: (d: string) => void } }).viewport.setDeviceForTest("tablet");
    composer.emit(EVENTS.BREAKPOINT_CHANGED, "tablet");

    const exported = engine.generateResponsiveCSS();
    expect(exported).toContain("@media (max-width: 1023px)");
    expect(exported).not.toContain("!important");
    expect(exported).not.toContain("editor device preview");
  });

  it("mobile: desktop-first cascade — tablet rules first, then mobile", () => {
    engine.setBreakpointStyle("el-1", "tablet", { "font-size": "28px" });
    engine.setBreakpointStyle("el-1", "mobile", { "font-size": "20px" });
    (composer as unknown as { viewport: { setDeviceForTest: (d: string) => void } }).viewport.setDeviceForTest("mobile");
    composer.emit(EVENTS.BREAKPOINT_CHANGED, "mobile");
    engine.flush();

    const preview = sheet().split("editor device preview")[1];
    expect(preview.indexOf("28px")).toBeGreaterThan(-1);
    expect(preview.indexOf("20px")).toBeGreaterThan(preview.indexOf("28px"));
  });

  it("switching back to desktop removes the preview block", () => {
    engine.setBreakpointStyle("el-1", "tablet", { "font-size": "28px" });
    const v = (composer as unknown as { viewport: { setDeviceForTest: (d: string) => void } }).viewport;
    v.setDeviceForTest("tablet");
    composer.emit(EVENTS.BREAKPOINT_CHANGED, "tablet");
    engine.flush();
    expect(sheet()).toContain("editor device preview");

    v.setDeviceForTest("desktop");
    composer.emit(EVENTS.BREAKPOINT_CHANGED, "desktop");
    engine.flush();
    expect(sheet()).not.toContain("editor device preview");
  });

  it("exported CSS never contains the preview block", () => {
    engine.setBreakpointStyle("el-1", "tablet", { "font-size": "28px" });
    (composer as unknown as { viewport: { setDeviceForTest: (d: string) => void } }).viewport.setDeviceForTest("tablet");
    composer.emit(EVENTS.BREAKPOINT_CHANGED, "tablet");

    expect(engine.toCSS()).not.toContain("editor device preview");
    expect(engine.generateCSS()).not.toContain("editor device preview");
  });
});
