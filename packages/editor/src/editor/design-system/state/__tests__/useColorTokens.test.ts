import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { DesignToken } from "../../types";
import { useColorTokens } from "../useColorTokens";

const MOCK_TOKEN: DesignToken = {
  id: "color-primary",
  name: "Primary",
  value: "#3B82F6",
  category: "colors",
  cssVar: "--buildrick-design-color-primary",
  type: "color",
  group: "brand",
};

const INITIAL = [MOCK_TOKEN];

describe("useColorTokens — addToken", () => {
  it("appends the new token to the tokens array", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    const newToken: DesignToken = {
      id: "color-cta",
      name: "CTA",
      value: "#FF6B00",
      category: "colors",
      cssVar: "--buildrick-design-color-cta",
      type: "color",
      group: "brand",
    };
    act(() => result.current.addToken(newToken));
    expect(result.current.tokens).toHaveLength(2);
    expect(result.current.tokens[1].id).toBe("color-cta");
  });

  it("marks isDirty after addToken", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    const newToken: DesignToken = {
      id: "color-new",
      name: "New",
      value: "#AABBCC",
      category: "colors",
      cssVar: "--buildrick-design-color-new",
      type: "color",
      group: "brand",
    };
    act(() => result.current.addToken(newToken));
    expect(result.current.isDirty).toBe(true);
  });
});

describe("useColorTokens — deleteToken", () => {
  it("removes a token by id (hard delete — back-compat)", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.deleteToken("color-primary"));
    expect(result.current.tokens).toHaveLength(0);
  });

  it("marks isDirty after deleteToken", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.deleteToken("color-primary"));
    expect(result.current.isDirty).toBe(true);
  });

  // B4 lock (2026-05-16): soft-delete via replaceWith uses B1 replacedBy bridge.
  // Token stays in registry but resolver redirects to replacement.

  it("soft-deletes with { replaceWith } — keeps token + sets replacedBy", () => {
    const REPL: DesignToken = { ...MOCK_TOKEN, id: "color-replacement", name: "Replacement" };
    const { result } = renderHook(() => useColorTokens([MOCK_TOKEN, REPL]));
    act(() => result.current.deleteToken("color-primary", { replaceWith: "color-replacement" }));
    // Token NOT removed from array (soft-delete)
    expect(result.current.tokens).toHaveLength(2);
    const soft = result.current.tokens.find((t) => t.id === "color-primary");
    expect(soft).toBeDefined();
    expect(soft?.replacedBy).toBe("color-replacement");
  });

  it("soft-delete marks isDirty (registry changed)", () => {
    const REPL: DesignToken = { ...MOCK_TOKEN, id: "color-replacement" };
    const { result } = renderHook(() => useColorTokens([MOCK_TOKEN, REPL]));
    act(() => result.current.deleteToken("color-primary", { replaceWith: "color-replacement" }));
    expect(result.current.isDirty).toBe(true);
  });
});
