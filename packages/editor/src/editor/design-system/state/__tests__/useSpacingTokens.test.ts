/**
 * useSpacingTokens — preset value tests
 * Verifies all 3 presets produce explicit, predictable pixel values.
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpacingTokens } from "../useSpacingTokens";
import type { DesignToken } from "../../types";

const SPACING_IDS = [
  "space-1", "space-2", "space-3", "space-4", "space-5",
  "space-6", "space-8", "space-10", "space-12",
] as const;

function makeTokens(): DesignToken[] {
  return SPACING_IDS.map((id) => ({
    id,
    name: id,
    value: "0px",
    category: "spacing" as const,
    cssVar: `--buildrick-design-${id}`,
    type: "length" as const,
  }));
}

function getValues(tokens: DesignToken[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const t of tokens) result[t.id] = parseFloat(t.value);
  return result;
}

describe("useSpacingTokens presets", () => {
  it("compact preset produces expected values", () => {
    const { result } = renderHook(() => useSpacingTokens(makeTokens()));
    act(() => result.current.applyPreset("compact"));
    expect(getValues(result.current.tokens)).toEqual({
      "space-1": 2, "space-2": 6, "space-3": 8, "space-4": 12,
      "space-5": 16, "space-6": 20, "space-8": 24, "space-10": 32, "space-12": 40,
    });
  });

  it("normal preset produces expected values", () => {
    const { result } = renderHook(() => useSpacingTokens(makeTokens()));
    act(() => result.current.applyPreset("normal"));
    expect(getValues(result.current.tokens)).toEqual({
      "space-1": 4, "space-2": 8, "space-3": 12, "space-4": 16,
      "space-5": 20, "space-6": 24, "space-8": 32, "space-10": 40, "space-12": 48,
    });
  });

  it("spacious preset produces expected values (all even numbers)", () => {
    const { result } = renderHook(() => useSpacingTokens(makeTokens()));
    act(() => result.current.applyPreset("spacious"));
    const values = getValues(result.current.tokens);
    expect(values).toEqual({
      "space-1": 6, "space-2": 12, "space-3": 16, "space-4": 20,
      "space-5": 24, "space-6": 32, "space-8": 40, "space-10": 48, "space-12": 64,
    });
    // All values should be even (on 2px grid at minimum)
    Object.values(values).forEach((v) => expect(v % 2).toBe(0));
  });
});

describe("useSpacingTokens — activePreset lifecycle", () => {
  it("starts with activePreset and savedPreset both 'normal'", () => {
    const { result } = renderHook(() => useSpacingTokens(makeTokens()));
    expect(result.current.activePreset).toBe("normal");
    expect(result.current.savedPreset).toBe("normal");
  });

  it("applyPreset switches activePreset and clears per-token undo stacks", () => {
    const { result } = renderHook(() => useSpacingTokens(makeTokens()));
    act(() => result.current.updateToken("space-4", "99px"));
    expect(result.current.canUndo("space-4")).toBe(true);
    act(() => result.current.applyPreset("compact"));
    expect(result.current.activePreset).toBe("compact");
    expect(result.current.canUndo("space-4")).toBe(false);
  });

  it("manual token edit drops activePreset to null (custom scale)", () => {
    const { result } = renderHook(() => useSpacingTokens(makeTokens()));
    act(() => result.current.applyPreset("spacious"));
    expect(result.current.activePreset).toBe("spacious");
    act(() => result.current.updateToken("space-4", "21px"));
    expect(result.current.activePreset).toBeNull();
  });

  it("markSaved persists the active preset as savedPreset", () => {
    const { result } = renderHook(() => useSpacingTokens(makeTokens()));
    act(() => result.current.applyPreset("compact"));
    act(() => result.current.markSaved());
    expect(result.current.savedPreset).toBe("compact");
    expect(result.current.isDirty).toBe(false);
  });

  it("discardAll restores savedPreset alongside token values", () => {
    const { result } = renderHook(() => useSpacingTokens(makeTokens()));
    act(() => result.current.applyPreset("compact"));
    act(() => result.current.markSaved());
    // Manual edit → activePreset null + dirty values.
    act(() => result.current.updateToken("space-4", "77px"));
    expect(result.current.activePreset).toBeNull();
    act(() => result.current.discardAll());
    expect(result.current.activePreset).toBe("compact");
    expect(result.current.tokens.find((t) => t.id === "space-4")?.value).toBe("12px");
  });

  it("markSaved after a manual edit persists savedPreset=null (custom scale saved)", () => {
    const { result } = renderHook(() => useSpacingTokens(makeTokens()));
    act(() => result.current.updateToken("space-4", "77px"));
    act(() => result.current.markSaved());
    expect(result.current.savedPreset).toBeNull();
  });
});

describe("useSpacingTokens — stageDefaults (C3 factory reset)", () => {
  it("stages spacing defaults without touching savedTokens (Review/Apply flow)", () => {
    const { result } = renderHook(() => useSpacingTokens(makeTokens()));
    const defaults = makeTokens().map((t) => ({ ...t, value: "5px" }));
    act(() => result.current.stageDefaults(defaults));
    expect(result.current.tokens.every((t) => t.value === "5px")).toBe(true);
    // savedTokens untouched — the reset is staged, so the panel goes dirty.
    expect(result.current.savedTokens.every((t) => t.value === "0px")).toBe(true);
    expect(result.current.isDirty).toBe(true);
  });

  it("resets activePreset to 'normal' and filters non-spacing categories out", () => {
    const { result } = renderHook(() => useSpacingTokens(makeTokens()));
    act(() => result.current.updateToken("space-4", "77px")); // preset → null
    const defaults: ReturnType<typeof makeTokens> = [
      ...makeTokens(),
      {
        id: "color-primary", name: "Primary", value: "#FFF",
        category: "colors", cssVar: "--buildrick-design-color-primary", type: "color",
      },
    ];
    act(() => result.current.stageDefaults(defaults));
    expect(result.current.activePreset).toBe("normal");
    expect(result.current.tokens.some((t) => t.id === "color-primary")).toBe(false);
    expect(result.current.tokens).toHaveLength(9);
  });
});
