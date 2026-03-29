import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { DesignToken } from "../../../../../features/design-system/types";
import { useTypeTokens } from "../useTypeTokens";

const MOCK_TYPE_TOKEN: DesignToken = {
  id: "font-size-4xl",
  name: "Font Size 4XL",
  value: "48px",
  category: "typography",
  cssVar: "--aqb-font-size-4xl",
  type: "font-size",
};

describe("useTypeTokens — redoToken", () => {
  it("redoes an undone change", () => {
    const { result } = renderHook(() => useTypeTokens([MOCK_TYPE_TOKEN]));
    act(() => result.current.updateToken("font-size-4xl", "72px"));
    act(() => result.current.undoToken("font-size-4xl"));
    expect(result.current.tokens[0].value).toBe("48px");
    expect(result.current.canRedo("font-size-4xl")).toBe(true);
    act(() => result.current.redoToken("font-size-4xl"));
    expect(result.current.tokens[0].value).toBe("72px");
  });

  it("canRedo returns false before any undo", () => {
    const { result } = renderHook(() => useTypeTokens([MOCK_TYPE_TOKEN]));
    act(() => result.current.updateToken("font-size-4xl", "60px"));
    expect(result.current.canRedo("font-size-4xl")).toBe(false);
  });
});
