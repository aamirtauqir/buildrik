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
    cssVar: `--aqb-${id}`,
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
