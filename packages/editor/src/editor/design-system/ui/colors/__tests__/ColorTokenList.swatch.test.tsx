/**
 * T4 — ColorTokenList row-stack view tests. Migrated from 6-col swatch grid
 * shape (now via TokenRow primitive). Original swatch+picker drawer tests
 * dropped (drill-in moves to T8). Surviving tests assert on row-shape
 * (data-token-row), search, group headers, dirty indicator, and Add token.
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

describe("ColorTokenList — row stack (T4)", () => {
  it("renders one TokenRow per token", () => {
    const tokens = [
      makeToken("color-primary", "Primary", "#2D6DFF", "brand"),
      makeToken("color-text", "Text", "#0F172A", "brand"),
      makeToken("color-muted", "Muted", "#64748B", "brand"),
    ];
    const { container } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    const rows = container.querySelectorAll("[data-token-row]");
    expect(rows.length).toBe(3);
  });

  it("each row carries the token id via data-token-row marker", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF", "brand")];
    const { container } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    expect(container.querySelector('[data-token-row="color-primary"]')).toBeTruthy();
  });

  it("clicking a row dispatches onRowClick with the token id", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF", "brand")];
    const onRowClick = vi.fn();
    const { container } = render(
      <ColorTokenList tokens={tokens} {...baseProps} onRowClick={onRowClick} />,
    );
    const row = container.querySelector('[data-token-row="color-primary"]') as HTMLElement;
    fireEvent.click(row);
    expect(onRowClick).toHaveBeenCalledWith("color-primary");
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

  it("shows a dirty marker on the swatch when token has a pending diff", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF", "brand")];
    const pendingDiff: Record<string, TokenDiff> = {
      "color-primary": { tokenId: "color-primary", previousValue: "#2D6DFF", currentValue: "#FF0000" },
    };
    const { container } = render(
      <ColorTokenList tokens={tokens} {...baseProps} pendingDiff={pendingDiff} />,
    );
    expect(container.querySelector('[aria-label="unsaved changes"]')).toBeTruthy();
  });

  it("brand group surfaces the first token's value as mono mini-metadata in the header", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF", "brand")];
    const { container } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    expect(container.textContent).toContain("#2D6DFF");
  });

  it("preserves the search filter — typing narrows visible rows", () => {
    const tokens = [
      makeToken("color-primary", "Primary", "#2D6DFF", "brand"),
      makeToken("color-text", "Text", "#0F172A", "brand"),
      makeToken("color-muted", "Muted", "#64748B", "brand"),
    ];
    const { container, getByPlaceholderText } = render(
      <ColorTokenList tokens={tokens} {...baseProps} />,
    );
    expect(container.querySelectorAll("[data-token-row]").length).toBe(3);
    fireEvent.change(getByPlaceholderText("Search colors…"), { target: { value: "primary" } });
    expect(container.querySelectorAll("[data-token-row]").length).toBe(1);
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

  it("rows with lint issues get warn state via TokenRow (data-lint-warn)", () => {
    const tokens = [
      makeToken("color-primary", "Primary", "#2D6DFF", "brand"),
      makeToken("color-text", "Text", "#0F172A", "brand"),
    ];
    const getLintIssues = (id: string) =>
      id === "color-text"
        ? [{ type: "banned-hue" as const, severity: "warning" as const, message: "low contrast", autoFixHint: "darken-22" }]
        : [];
    const { container } = render(
      <ColorTokenList tokens={tokens} {...baseProps} getLintIssues={getLintIssues} />,
    );
    const warnRow = container.querySelector('[data-token-row="color-text"]') as HTMLElement;
    expect(warnRow.getAttribute("data-lint-warn")).toBe("true");
    const cleanRow = container.querySelector('[data-token-row="color-primary"]') as HTMLElement;
    expect(cleanRow.getAttribute("data-lint-warn")).toBeNull();
  });
});
