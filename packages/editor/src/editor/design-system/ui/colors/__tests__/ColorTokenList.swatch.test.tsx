/**
 * Visual-sync arc V1 — ColorTokenList swatch grid view tests.
 * Reference: docs/reference/left-panel/tab-design.html (Brand colour section).
 */
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { ColorTokenList } from "../ColorTokenList";
import type { DesignToken, TokenDiff } from "../../../types";

function makeToken(id: string, name: string, value: string, group?: string): DesignToken {
  return {
    id, name, value,
    category: "colors",
    cssVar: `--bd-${id}`,
    type: "color",
    kind: "color",
    ...(group ? { group } : {}),
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

describe("ColorTokenList — swatch grid (Visual-sync V1)", () => {
  it("renders one swatch per token as a button", () => {
    const tokens = [
      makeToken("color-primary", "Primary", "#2D6DFF", "brand"),
      makeToken("color-text", "Text", "#0F172A", "brand"),
      makeToken("color-muted", "Muted", "#64748B", "brand"),
    ];
    const { getAllByRole } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    const swatches = getAllByRole("listitem");
    expect(swatches.length).toBe(3);
  });

  it("each swatch has accessible name with token name + value", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF", "brand")];
    const { getByLabelText } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    expect(getByLabelText(/Edit color Primary \(#2D6DFF\)/)).toBeTruthy();
  });

  it("clicking a swatch toggles aria-pressed and reveals the picker drawer", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF", "brand")];
    const { getByLabelText, queryByText, container } = render(
      <ColorTokenList tokens={tokens} {...baseProps} />,
    );
    const swatch = getByLabelText(/Edit color Primary/);
    expect(swatch.getAttribute("aria-pressed")).toBe("false");
    expect(queryByText("Primary")).toBeNull(); // drawer not rendered yet

    fireEvent.click(swatch);
    expect(swatch.getAttribute("aria-pressed")).toBe("true");
    // Drawer renders the token name + value in mono header.
    expect(container.textContent).toContain("Primary");
    expect(container.textContent).toContain("#2D6DFF");
  });

  it("clicking the active swatch a second time collapses the picker drawer", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF", "brand")];
    const { getByLabelText } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    const swatch = getByLabelText(/Edit color Primary/);
    fireEvent.click(swatch);
    fireEvent.click(swatch);
    expect(swatch.getAttribute("aria-pressed")).toBe("false");
  });

  it("groups tokens by their `group` field — brand renders as 'Brand colour' header", () => {
    const tokens = [
      makeToken("color-primary", "Primary", "#2D6DFF", "brand"),
      makeToken("color-bg", "Background", "#F8FAFC", "surface"),
    ];
    const { getByText } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    expect(getByText("Brand colour")).toBeTruthy();
    expect(getByText("Surface")).toBeTruthy();
  });

  it("shows a dirty marker on swatches whose token has a pending diff", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF", "brand")];
    const pendingDiff = {
      "color-primary": { previousValue: "#2D6DFF", newValue: "#FF0000" } as TokenDiff,
    };
    const { container } = render(
      <ColorTokenList tokens={tokens} {...baseProps} pendingDiff={pendingDiff} />,
    );
    expect(container.querySelector('[aria-label="unsaved changes"]')).toBeTruthy();
  });

  it("brand group surfaces the first token's value as mono mini-metadata in the header", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF", "brand")];
    const { container } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    // The header pattern is: <h3>Brand colour</h3> ... <span>#2D6DFF</span>
    expect(container.textContent).toContain("#2D6DFF");
  });

  it("preserves the search filter — typing narrows visible swatches", () => {
    const tokens = [
      makeToken("color-primary", "Primary", "#2D6DFF", "brand"),
      makeToken("color-text", "Text", "#0F172A", "brand"),
      makeToken("color-muted", "Muted", "#64748B", "brand"),
    ];
    const { getAllByRole, getByPlaceholderText } = render(
      <ColorTokenList tokens={tokens} {...baseProps} />,
    );
    expect(getAllByRole("listitem").length).toBe(3);
    fireEvent.change(getByPlaceholderText("Search colors…"), { target: { value: "primary" } });
    expect(getAllByRole("listitem").length).toBe(1);
  });

  it("preserves the Add token affordance", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF", "brand")];
    const onAddToken = vi.fn();
    const { getByText } = render(
      <ColorTokenList tokens={tokens} {...baseProps} onAddToken={onAddToken} />,
    );
    fireEvent.click(getByText("+ Add token"));
    expect(onAddToken).toHaveBeenCalledTimes(1);
  });
});
