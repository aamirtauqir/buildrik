/**
 * ColorTokenList — the Colours page's table, board 7315:80955.
 *
 * TOKEN · LIGHT · DARK · USED, one row per token, swatch on the gutter. A row
 * click SELECTS the token (the workspace draws its card in the right column);
 * it is not a drill-in. The drawer-era furniture — search field, group
 * headings, per-row lint state, the dark-missing chip — is not on the board:
 * findings live on Brand checks, missing dark values on Colour mode.
 *
 * Rewritten for C1 (ii); it replaced the T4 row-stack and row-shape suites
 * (and DarkMissingChip, whose list now lives on the Colour mode page).
 */
import { render, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { ColorTokenList } from "../ColorTokenList";
import type { DesignToken, TokenDiff } from "../../../types";

function makeToken(id: string, name: string, value: string, extra: Partial<DesignToken> = {}): DesignToken {
  return { id, name, value, category: "colors", cssVar: `--${id}`, type: "color", kind: "color", ...extra };
}

const baseProps = {
  pendingDiff: {} as Record<string, TokenDiff>,
  onAddToken: vi.fn(),
};

describe("ColorTokenList — the Colours table (7315:80955)", () => {
  it("draws the board's four column headers", () => {
    const { getAllByRole } = render(
      <ColorTokenList tokens={[makeToken("color-primary", "Primary", "#1a56db")]} {...baseProps} />,
    );
    expect(getAllByRole("columnheader").map((h) => h.textContent).filter(Boolean)).toEqual([
      "Token", "Light", "Dark", "Used",
    ]);
  });

  it("renders one row per token, keyed by id", () => {
    const tokens = [
      makeToken("color-primary", "Primary", "#1A56DB"),
      makeToken("color-text", "Text", "#111827"),
      makeToken("color-muted", "Muted", "#6B7280"),
    ];
    const { container } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    expect(container.querySelectorAll("[data-token-row]").length).toBe(3);
    expect(container.querySelector('[data-token-row="color-primary"]')).toBeTruthy();
  });

  it("prints light and dark values upper-case, and an em dash when there is no dark value", () => {
    const { getByTestId } = render(
      <ColorTokenList
        tokens={[
          makeToken("color-primary", "Primary", "#1a56db", { darkValue: "#76a9fa" }),
          makeToken("color-pale", "Pale", "#F9FAFB"),
        ]}
        {...baseProps}
      />,
    );
    const row = getByTestId("brand-token-row-color-primary");
    expect(within(row).getByText("#1A56DB")).toBeTruthy();
    expect(getByTestId("brand-token-dark-color-primary").textContent).toBe("#76A9FA");
    expect(getByTestId("brand-token-dark-color-pale").textContent).toBe("—");
  });

  it("clicking a row selects it — onSelectToken with the id, not a drill-in", () => {
    const onSelectToken = vi.fn();
    const { getByTestId } = render(
      <ColorTokenList tokens={[makeToken("color-primary", "Primary", "#1A56DB")]} {...baseProps} onSelectToken={onSelectToken} />,
    );
    fireEvent.click(getByTestId("brand-token-row-color-primary"));
    expect(onSelectToken).toHaveBeenCalledWith("color-primary");
  });

  it("Enter on a focused row selects it too", () => {
    const onSelectToken = vi.fn();
    const { getByTestId } = render(
      <ColorTokenList tokens={[makeToken("color-primary", "Primary", "#1A56DB")]} {...baseProps} onSelectToken={onSelectToken} />,
    );
    fireEvent.keyDown(getByTestId("brand-token-row-color-primary"), { key: "Enter" });
    expect(onSelectToken).toHaveBeenCalledWith("color-primary");
  });

  it("marks the selected row", () => {
    const tokens = [makeToken("color-primary", "Primary", "#1A56DB"), makeToken("color-text", "Text", "#111827")];
    const { getByTestId } = render(<ColorTokenList tokens={tokens} {...baseProps} selectedTokenId="color-text" />);
    expect(getByTestId("brand-token-row-color-text").getAttribute("aria-selected")).toBe("true");
    expect(getByTestId("brand-token-row-color-primary").getAttribute("aria-selected")).toBe("false");
  });

  it("orders the semantic and brand tokens before surface and the primitive scale", () => {
    const tokens = [
      makeToken("gray-50", "Gray 50", "#F9FAFB", { group: "primitive" }),
      makeToken("color-surface", "Surface", "#F9FAFB", { group: "surface" }),
      makeToken("color-primary", "Primary", "#1A56DB", { group: "brand" }),
    ];
    const { container } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    const ids = [...container.querySelectorAll("[data-token-row]")].map((r) => r.getAttribute("data-token-row"));
    expect(ids).toEqual(["color-primary", "color-surface", "gray-50"]);
  });

  it("draws no drawer furniture: no search field, no group headings, no lint tag", () => {
    const tokens = [
      makeToken("color-primary", "Primary", "#1A56DB", { group: "brand" }),
      makeToken("color-bg", "Background", "#FFFFFF", { group: "surface" }),
    ];
    const { container, queryByRole, queryByText } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    expect(queryByRole("textbox")).toBeNull();
    expect(queryByText("Brand color")).toBeNull();
    expect(container.querySelector("[data-lint-warn]")).toBeNull();
    expect(container.querySelector("[data-group]")).toBeNull();
  });

  it("shows a dirty marker on the swatch when the token has a pending diff", () => {
    const pendingDiff: Record<string, TokenDiff> = {
      "color-primary": { tokenId: "color-primary", previousValue: "#1A56DB", currentValue: "#FF0000" },
    };
    const { container, getByTestId } = render(
      <ColorTokenList tokens={[makeToken("color-primary", "Primary", "#1A56DB")]} {...baseProps} pendingDiff={pendingDiff} />,
    );
    expect(container.querySelector('[aria-label="unsaved changes"]')).toBeTruthy();
    // The row prints the staged value, not the saved one.
    expect(within(getByTestId("brand-token-row-color-primary")).getByText("#FF0000")).toBeTruthy();
  });

  it("the empty library offers its own Add door", () => {
    const onAddToken = vi.fn();
    const { getByText } = render(<ColorTokenList tokens={[]} {...baseProps} onAddToken={onAddToken} />);
    fireEvent.click(getByText("+ Add a color"));
    expect(onAddToken).toHaveBeenCalledTimes(1);
  });
});
