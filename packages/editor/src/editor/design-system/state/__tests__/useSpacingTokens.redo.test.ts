import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { DesignToken } from "../../types";
import { useSpacingTokens } from "../useSpacingTokens";
import { v6Token, ownLight } from "@/engine/__tests__/test-utils/v6Token";

const MOCK_SPACING: DesignToken = v6Token({
  id: "space-4",
  name: "Space 4",
  value: "16px",
  category: "spacing",
  cssVar: "--buildrick-design-space-4",
  type: "length",
});

describe("useSpacingTokens — redoToken", () => {
  it("redoes an undone spacing change", () => {
    const { result } = renderHook(() => useSpacingTokens([MOCK_SPACING]));
    act(() => result.current.updateToken("space-4", "24px"));
    act(() => result.current.undoToken("space-4"));
    expect(ownLight(result.current.tokens[0])).toBe("16px");
    act(() => result.current.redoToken("space-4"));
    expect(ownLight(result.current.tokens[0])).toBe("24px");
  });
});
