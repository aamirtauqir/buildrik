/**
 * TypographySection — board 153:57 (Brand · Typography).
 *
 * The weight count is the part worth pinning. Nothing in the token model
 * records which weights of a family a site uses, so the number is measured off
 * the element tree — and a measured number is only worth showing while it stays
 * measured. These hold that it counts DISTINCT weights, only for the family
 * asked about, and that a family nobody uses says so rather than claiming one.
 *
 * @license BSD-3-Clause
 */
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TypographySection } from "../TypographySection";
import type { DesignToken } from "../../../types";

const TOKENS = [
  { id: "font-heading", value: "General Sans" },
  { id: "font-body", value: '"Inter", sans-serif' },
  { id: "font-mono", value: "Geist Mono" },
] as unknown as DesignToken[];

function makeComposer(elements: Array<Record<string, string>>) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    elements: {
      getAllElements: () => elements.map((styles) => ({ getStyles: () => styles })),
    },
  } as never;
}

afterEach(cleanup);

describe("Brand · Typography", () => {
  it("names each font in its own role, in the board's order", () => {
    render(<TypographySection composer={makeComposer([])} tokens={TOKENS} />);
    const roles = screen.getAllByText(/^(Display|Body|Mono)$/).map((n) => n.textContent);
    expect(roles).toEqual(["Display", "Body", "Mono"]);
  });

  it("strips the fallback stack — a family is a name, not a CSS value", () => {
    render(<TypographySection composer={makeComposer([])} tokens={TOKENS} />);
    expect(screen.getByText("Inter")).toBeInTheDocument();
    expect(screen.queryByText(/sans-serif/)).toBeNull();
  });

  it("counts DISTINCT weights, not elements", () => {
    const composer = makeComposer([
      { "font-family": "Inter", "font-weight": "400" },
      { "font-family": "Inter", "font-weight": "400" },
      { "font-family": "Inter", "font-weight": "700" },
    ]);
    render(<TypographySection composer={composer} tokens={TOKENS} />);
    expect(screen.getByText("2 weights in use")).toBeInTheDocument();
  });

  it("counts only the family it is asked about", () => {
    const composer = makeComposer([
      { "font-family": "Inter", "font-weight": "400" },
      { "font-family": "Geist Mono", "font-weight": "500" },
      { "font-family": "Geist Mono", "font-weight": "700" },
    ]);
    render(<TypographySection composer={composer} tokens={TOKENS} />);
    expect(screen.getByText("1 weight in use")).toBeInTheDocument();
    expect(screen.getByText("2 weights in use")).toBeInTheDocument();
  });

  it("an element that names no weight still renders one", () => {
    const composer = makeComposer([{ "font-family": "Inter" }]);
    render(<TypographySection composer={composer} tokens={TOKENS} />);
    expect(screen.getByText("1 weight in use")).toBeInTheDocument();
  });

  it("says so when a font is set but nothing on the site uses it", () => {
    render(<TypographySection composer={makeComposer([])} tokens={TOKENS} />);
    expect(screen.getAllByText("not used yet")).toHaveLength(3);
  });

  it("matches the family case-insensitively — CSS does", () => {
    const composer = makeComposer([{ "font-family": "inter", "font-weight": "600" }]);
    render(<TypographySection composer={composer} tokens={TOKENS} />);
    expect(screen.getByText("1 weight in use")).toBeInTheDocument();
  });

  it("shows nothing rather than empty rows when no font token is set", () => {
    render(<TypographySection composer={makeComposer([])} tokens={[]} />);
    expect(screen.getByText(/No fonts set/)).toBeInTheDocument();
    expect(screen.queryByTestId("brand-typography")).toBeNull();
  });
});
