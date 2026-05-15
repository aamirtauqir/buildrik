/**
 * T7 coverage — TypeTokenList renders TokenUsageChip per row.
 */
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { TypeTokenList } from "../TypeTokenList";
import type { DesignToken } from "../../../types";

// document.fonts polyfill lives in test-setup.ts (jsdom-wide).

function makeFont(id: string, value: string): DesignToken {
  return {
    id,
    name: id,
    value,
    category: "typography",
    cssVar: `--bd-${id}`,
    type: "font-family",
    kind: "type",
  };
}

function makeSize(id: string, value: string): DesignToken {
  return {
    id,
    name: id,
    value,
    category: "typography",
    cssVar: `--bd-${id}`,
    type: "font-size",
    kind: "type",
  };
}

const baseProps = {
  responsiveMode: "desktop" as const,
  onTokenChange: vi.fn(),
  onResponsiveModeChange: vi.fn(),
  onUndo: vi.fn(),
  canUndo: () => false,
  onRedo: vi.fn(),
  canRedo: () => false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TypeTokenList — usage chip (T7 coverage)", () => {
  it("renders 'used Nx' for size tokens with usage", () => {
    const tokens = [makeSize("font-size-4xl", "48px")];
    const usageMap = new Map([["font-size-4xl", 47]]);
    const { getByText } = render(
      <TypeTokenList tokens={tokens} {...baseProps} usageByTokenId={usageMap} />,
    );
    expect(getByText("used 47×")).toBeTruthy();
  });

  it("renders 'unused' for size tokens without usage", () => {
    const tokens = [makeSize("font-size-base", "16px")];
    const { getByText } = render(<TypeTokenList tokens={tokens} {...baseProps} />);
    expect(getByText("unused")).toBeTruthy();
  });

  it("renders chip on font-family rows too", () => {
    const tokens = [makeFont("font-body", "Inter")];
    const usageMap = new Map([["font-body", 9]]);
    const { getByText } = render(
      <TypeTokenList tokens={tokens} {...baseProps} usageByTokenId={usageMap} />,
    );
    expect(getByText("used 9×")).toBeTruthy();
  });
});
