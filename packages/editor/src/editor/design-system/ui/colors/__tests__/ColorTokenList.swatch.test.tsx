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

  it("renders inline lint row IMMEDIATELY AFTER the affected swatch cell, not at group bottom", () => {
    // Spec gap fix — earlier the lint rows clustered as flat siblings AFTER
    // the SwatchGrid, so all amber rows ended up at the group bottom. Spec
    // calls for per-token inline placement: amber row directly below the
    // offending swatch, spanning all 6 grid columns.
    const tokens = [
      makeToken("color-primary", "Primary", "#2D6DFF", "brand"),
      makeToken("color-text", "Text", "#0F172A", "brand"),
      makeToken("color-muted", "Muted", "#64748B", "brand"),
    ];
    // Only the MIDDLE token has a lint issue — if placement is inline,
    // the lint row must appear between swatch-1 (Text) and swatch-2 (Muted)
    // in DOM order. If placement is cluster-bottom, it appears AFTER all
    // three swatches.
    const getLintIssues = (id: string) =>
      id === "color-text"
        ? [{ type: "contrast" as const, severity: "warn" as const, message: "low contrast", autoFixHint: "darken-22" }]
        : [];
    const { container } = render(
      <ColorTokenList
        tokens={tokens}
        {...baseProps}
        getLintIssues={getLintIssues}
        onLintAutoFix={() => {}}
        onLintIgnore={() => {}}
      />,
    );
    // Collect grid children in DOM order. Swatch cells contain a button
    // role="listitem"; the lint row has data-token-lint-row.
    const grid = container.querySelector('[role="list"]') as HTMLElement;
    expect(grid).toBeTruthy();
    const orderedKinds: string[] = [];
    for (const child of Array.from(grid.children)) {
      if (child.querySelector('[role="listitem"]')) orderedKinds.push("swatch");
      else if (child.getAttribute("data-token-lint-row")) orderedKinds.push("lint");
    }
    // Expected: [swatch (Primary), swatch (Text), lint (Text), swatch (Muted)].
    expect(orderedKinds).toEqual(["swatch", "swatch", "lint", "swatch"]);
  });

  it("inline lint row spans the full grid width via gridColumn: 1 / -1", () => {
    const tokens = [makeToken("color-text", "Text", "#0F172A", "brand")];
    const getLintIssues = () => [
      { type: "contrast" as const, severity: "warn" as const, message: "low contrast", autoFixHint: "darken-22" },
    ];
    const { container } = render(
      <ColorTokenList
        tokens={tokens}
        {...baseProps}
        getLintIssues={getLintIssues}
        onLintAutoFix={() => {}}
        onLintIgnore={() => {}}
      />,
    );
    const row = container.querySelector("[data-token-lint-row]") as HTMLElement;
    expect(row).toBeTruthy();
    expect(row.style.gridColumn).toBe("1 / -1");
  });
});
