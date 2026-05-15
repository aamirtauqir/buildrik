/**
 * T4 regression — lock ColorTokenList to TokenRow-based row stack shape.
 *
 * Guards against re-introducing the 6-col swatch grid (SwatchGrid). If this
 * test fails, someone is reverting the T4 layout — re-read the spec at
 * docs/superpowers/specs/2026-05-15-ds-prototype-full-rewrite-arc-design.md
 * before "fixing" it.
 */
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { ColorTokenList } from "../ColorTokenList";
import type { DesignToken, TokenDiff } from "../../../types";

function makeToken(id: string, name: string, value: string, group = "brand"): DesignToken {
  return {
    id, name, value,
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

describe("ColorTokenList — row-shape regression (T4)", () => {
  it("renders the canonical [data-color-token-list] root marker", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF")];
    const { container } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    expect(container.querySelector("[data-color-token-list]")).toBeTruthy();
  });

  it("does NOT render a 6-col grid (no role='list' grid container)", () => {
    const tokens = [
      makeToken("color-primary", "Primary", "#2D6DFF"),
      makeToken("color-text", "Text", "#0F172A"),
    ];
    const { container } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    // Old SwatchGrid used role="list" with grid-template-columns: repeat(6, 1fr).
    // If this comes back, T4 has been reverted.
    expect(container.querySelector('[role="list"]')).toBeNull();
  });

  it("does NOT render button[role='listitem'] swatch tiles (old grid shape)", () => {
    const tokens = [makeToken("color-primary", "Primary", "#2D6DFF")];
    const { container } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    expect(container.querySelector('button[role="listitem"]')).toBeNull();
  });

  it("renders rows as [data-token-row] markers (TokenRow SSOT primitive)", () => {
    const tokens = [
      makeToken("color-primary", "Primary", "#2D6DFF"),
      makeToken("color-text", "Text", "#0F172A"),
    ];
    const { container } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    expect(container.querySelectorAll("[data-token-row]").length).toBe(2);
  });

  it("groups wrap in [data-group=<key>] containers", () => {
    const tokens = [
      makeToken("color-primary", "Primary", "#2D6DFF", "brand"),
      makeToken("color-bg", "Background", "#F8FAFC", "surface"),
    ];
    const { container } = render(<ColorTokenList tokens={tokens} {...baseProps} />);
    expect(container.querySelector('[data-group="brand"]')).toBeTruthy();
    expect(container.querySelector('[data-group="surface"]')).toBeTruthy();
  });
});
