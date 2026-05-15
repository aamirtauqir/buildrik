/**
 * T7 coverage — ColorTokenList renders TokenUsageChip per swatch.
 */
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { ColorTokenList } from "../ColorTokenList";
import type { DesignToken, TokenDiff } from "../../../types";

function makeToken(id: string, name: string, value: string, group = "brand"): DesignToken {
  return {
    id,
    name,
    value,
    category: "colors",
    cssVar: `--bd-${id}`,
    type: "color",
    kind: "color",
    group,
  };
}

const baseProps = {
  pendingDiff: {} as Record<string, TokenDiff>,
  onColorChange: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  canUndo: () => false,
  canRedo: () => false,
  onAddToken: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ColorTokenList — usage chip (T7 coverage)", () => {
  it("renders 'used Nx' for tokens with usage", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF")];
    const usageMap = new Map([["color-primary", 7]]);
    const { getByText } = render(
      <ColorTokenList tokens={tokens} {...baseProps} usageByTokenId={usageMap} />,
    );
    expect(getByText("used 7×")).toBeTruthy();
  });

  it("renders 'unused' for tokens without usage", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF")];
    const { getByText } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    expect(getByText("unused")).toBeTruthy();
  });

  it("renders one chip per token across multiple groups", () => {
    const tokens = [
      makeToken("color-primary", "Primary", "#2D6DFF", "brand"),
      makeToken("color-surface", "Surface", "#F8FAFC", "surface"),
    ];
    const usageMap = new Map([
      ["color-primary", 23],
      ["color-surface", 12],
    ]);
    const { getByText } = render(
      <ColorTokenList tokens={tokens} {...baseProps} usageByTokenId={usageMap} />,
    );
    expect(getByText("used 23×")).toBeTruthy();
    expect(getByText("used 12×")).toBeTruthy();
  });
});
