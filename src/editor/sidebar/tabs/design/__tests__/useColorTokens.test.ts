import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { DesignToken } from "../../../../../features/design-system/types";
import { useColorTokens } from "../useColorTokens";

const MOCK_TOKEN: DesignToken = {
  id: "color-primary",
  name: "Primary",
  value: "#3B82F6",
  category: "colors",
  cssVar: "--aqb-color-primary",
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
      cssVar: "--aqb-color-cta",
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
      cssVar: "--aqb-color-new",
      type: "color",
      group: "brand",
    };
    act(() => result.current.addToken(newToken));
    expect(result.current.isDirty).toBe(true);
  });
});

describe("useColorTokens — deleteToken", () => {
  it("removes a token by id", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.deleteToken("color-primary"));
    expect(result.current.tokens).toHaveLength(0);
  });

  it("marks isDirty after deleteToken", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.deleteToken("color-primary"));
    expect(result.current.isDirty).toBe(true);
  });
});
