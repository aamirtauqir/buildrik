import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { DesignToken } from "../../../../../features/design-system/types";
import { useSpacingTokens } from "../useSpacingTokens";

const MOCK_SPACING: DesignToken = {
  id: "space-4",
  name: "Space 4",
  value: "16px",
  category: "spacing",
  cssVar: "--aqb-space-4",
  type: "length",
};

describe("useSpacingTokens — redoToken", () => {
  it("redoes an undone spacing change", () => {
    const { result } = renderHook(() => useSpacingTokens([MOCK_SPACING]));
    act(() => result.current.updateToken("space-4", "24px"));
    act(() => result.current.undoToken("space-4"));
    expect(result.current.tokens[0].value).toBe("16px");
    act(() => result.current.redoToken("space-4"));
    expect(result.current.tokens[0].value).toBe("24px");
  });
});
