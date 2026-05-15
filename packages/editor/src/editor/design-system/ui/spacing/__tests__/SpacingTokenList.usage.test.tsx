/**
 * T7 coverage — SpacingTokenList renders TokenUsageChip per chip pill.
 */
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { SpacingTokenList } from "../SpacingTokenList";
import type { DesignToken } from "../../../types";

function makeSpacing(id: string, value: string): DesignToken {
  return {
    id,
    name: id,
    value,
    category: "spacing",
    cssVar: `--bd-${id}`,
    type: "length",
    kind: "spacing",
  };
}

const baseProps = {
  activePreset: "normal" as const,
  savedPreset: "normal" as const,
  isDirty: false,
  onTokenChange: vi.fn(),
  onPresetApply: vi.fn(),
  onResetToDefaults: vi.fn(),
  onUndo: vi.fn(),
  canUndo: () => false,
  onRedo: vi.fn(),
  canRedo: () => false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SpacingTokenList — usage chip (T7 coverage)", () => {
  it("renders 'used Nx' for tokens with usage", () => {
    const tokens = [makeSpacing("space-md", "16px")];
    const usageMap = new Map([["space-md", 31]]);
    const { getByText } = render(
      <SpacingTokenList tokens={tokens} {...baseProps} usageByTokenId={usageMap} />,
    );
    expect(getByText("used 31×")).toBeTruthy();
  });

  it("renders 'unused' for tokens without usage", () => {
    const tokens = [makeSpacing("space-md", "16px")];
    const { getByText } = render(<SpacingTokenList tokens={tokens} {...baseProps} />);
    expect(getByText("unused")).toBeTruthy();
  });

  it("renders one chip per spacing pill across the grid", () => {
    const tokens = [
      makeSpacing("space-sm", "8px"),
      makeSpacing("space-md", "16px"),
      makeSpacing("space-lg", "24px"),
    ];
    const usageMap = new Map([
      ["space-sm", 4],
      ["space-md", 31],
      ["space-lg", 2],
    ]);
    const { getByText } = render(
      <SpacingTokenList tokens={tokens} {...baseProps} usageByTokenId={usageMap} />,
    );
    expect(getByText("used 4×")).toBeTruthy();
    expect(getByText("used 31×")).toBeTruthy();
    expect(getByText("used 2×")).toBeTruthy();
  });
});
