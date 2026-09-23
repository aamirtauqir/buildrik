/**
 * TypographySection — Brand › Fonts & type styles, board 7316:81551 (was 153:57).
 *
 * The weight count is the part worth pinning. Nothing in the token model
 * records which weights of a family a site uses, so the number is measured off
 * the element tree — and a measured number is only worth showing while it stays
 * measured. These hold that it counts DISTINCT weights, only for the family
 * asked about, and that a family nobody uses says so rather than claiming one.
 *
 * @license BSD-3-Clause
 */
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TypographySection, fontsCaption } from "../TypographySection";
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

/** Elements that declare no family — the normal case — carry a TYPE instead. */
function makeTypedComposer(elements: Array<{ type: string; styles?: Record<string, string> }>) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    elements: {
      getAllElements: () =>
        elements.map((e) => ({ getStyles: () => e.styles ?? {}, getType: () => e.type })),
    },
  } as never;
}

afterEach(cleanup);

describe("Brand · Typography", () => {
  it("names each font in its own role, in the board's order", () => {
    render(<TypographySection composer={makeComposer([])} tokens={TOKENS} />);
    const roles = ["font-heading", "font-body", "font-mono"].map(
      (id) => screen.getByTestId(`brand-font-role-${id}`).textContent,
    );
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
    expect(screen.getByText("2 weights")).toBeInTheDocument();
  });

  it("counts only the family it is asked about", () => {
    const composer = makeComposer([
      { "font-family": "Inter", "font-weight": "400" },
      { "font-family": "Geist Mono", "font-weight": "500" },
      { "font-family": "Geist Mono", "font-weight": "700" },
    ]);
    render(<TypographySection composer={composer} tokens={TOKENS} />);
    expect(screen.getByText("1 weight")).toBeInTheDocument();
    expect(screen.getByText("2 weights")).toBeInTheDocument();
  });

  it("an element that names no weight still renders one", () => {
    const composer = makeComposer([{ "font-family": "Inter" }]);
    render(<TypographySection composer={composer} tokens={TOKENS} />);
    expect(screen.getByText("1 weight")).toBeInTheDocument();
  });

  it("says so when a font is set but nothing on the site uses it", () => {
    render(<TypographySection composer={makeComposer([])} tokens={TOKENS} />);
    expect(screen.getAllByText("not used yet")).toHaveLength(3);
  });

  it("matches the family case-insensitively — CSS does", () => {
    const composer = makeComposer([{ "font-family": "inter", "font-weight": "600" }]);
    render(<TypographySection composer={composer} tokens={TOKENS} />);
    expect(screen.getByText("1 weight")).toBeInTheDocument();
  });

  it("shows nothing rather than empty rows when no type token is set", () => {
    render(<TypographySection composer={makeComposer([])} tokens={[]} />);
    expect(screen.getByText(/No fonts set/)).toBeInTheDocument();
    expect(screen.queryByTestId("brand-typography")).toBeNull();
  });
});

describe("Brand · Typography — a page that declares no font still uses one", () => {
  /*
    `ElementManager` writes `font-family` only when a user applies a font to a
    selection; everything else inherits from the site's CSS, which binds these
    three tokens by their cssVar. Counting only DECLARED families meant a
    normally-built page reported "not used yet" on every row, forever — the row
    exists to answer "in how many weights" and could not answer it at all.
  */
  it("counts a heading against the display face", () => {
    const composer = makeTypedComposer([{ type: "heading" }]);
    render(<TypographySection composer={composer} tokens={TOKENS} />);
    const rows = [...document.querySelectorAll("[data-font-weights]")];
    expect(rows[0].textContent).toMatch(/1 weight/); // Display
    expect(rows[2].textContent).toMatch(/not used yet/);    // Mono
  });

  it("counts everything that is not a heading or code against body", () => {
    const composer = makeTypedComposer([{ type: "text" }, { type: "button" }]);
    render(<TypographySection composer={composer} tokens={TOKENS} />);
    const rows = [...document.querySelectorAll("[data-font-weights]")];
    expect(rows[0].textContent).toMatch(/not used yet/);    // Display
    expect(rows[1].textContent).toMatch(/1 weight/); // Body
  });

  it("counts code against the mono face", () => {
    const composer = makeTypedComposer([{ type: "code" }]);
    render(<TypographySection composer={composer} tokens={TOKENS} />);
    const rows = [...document.querySelectorAll("[data-font-weights]")];
    expect(rows[2].textContent).toMatch(/1 weight/); // Mono
  });

  it("counts distinct declared weights, not elements", () => {
    const composer = makeTypedComposer([
      { type: "text", styles: { "font-weight": "400" } },
      { type: "text", styles: { "font-weight": "400" } },
      { type: "text", styles: { "font-weight": "700" } },
    ]);
    render(<TypographySection composer={composer} tokens={TOKENS} />);
    const rows = [...document.querySelectorAll("[data-font-weights]")];
    expect(rows[1].textContent).toMatch(/2 weights/);
  });

  it("an explicit family still wins over the element's role", () => {
    // A body-role element told to render in the mono family counts as mono.
    const composer = makeTypedComposer([
      { type: "text", styles: { "font-family": "Geist Mono" } },
    ]);
    render(<TypographySection composer={composer} tokens={TOKENS} />);
    const rows = [...document.querySelectorAll("[data-font-weights]")];
    expect(rows[2].textContent).toMatch(/1 weight/); // Mono
    expect(rows[1].textContent).toMatch(/not used yet/);    // Body
  });
});

describe("Brand · Fonts & type styles — the board's card (7316:81551)", () => {
  const WITH_SIZES = [
    ...TOKENS,
    { id: "font-size-base", name: "Base", value: "16px", type: "font-size" },
    { id: "font-size-4xl", name: "4XL", value: "36px", type: "font-size" },
  ] as unknown as DesignToken[];

  it("one card: the three roles, then the type styles largest first", () => {
    render(<TypographySection composer={makeComposer([])} tokens={WITH_SIZES} />);
    const rows = [...screen.getByTestId("brand-typography").querySelectorAll("[data-type-row]")];
    expect(rows.map((r) => r.getAttribute("data-testid"))).toEqual([
      "brand-type-row-font-heading",
      "brand-type-row-font-body",
      "brand-type-row-font-mono",
      "brand-type-row-font-size-4xl",
      "brand-type-row-font-size-base",
    ]);
  });

  it("a type style names its role's family and its size", () => {
    render(<TypographySection composer={makeComposer([])} tokens={WITH_SIZES} />);
    expect(screen.getByTestId("brand-type-row-font-size-4xl").textContent).toMatch(/Heading 1General Sans · 36px/);
    expect(screen.getByTestId("brand-type-row-font-size-base").textContent).toMatch(/Body textInter · 16px/);
  });

  it("a row click selects the token — the card opens in the right column", () => {
    const onSelectToken = vi.fn();
    render(<TypographySection composer={makeComposer([])} tokens={WITH_SIZES} onSelectToken={onSelectToken} />);
    fireEvent.click(screen.getByTestId("brand-type-row-font-body"));
    expect(onSelectToken).toHaveBeenCalledWith("font-body");
  });

  it("captions the page: roles and distinct active fonts", () => {
    expect(fontsCaption(TOKENS)).toBe("3 roles · 3 active fonts");
    expect(fontsCaption([...TOKENS.slice(0, 2), { id: "font-mono", value: "Inter" } as DesignToken])).toBe(
      "3 roles · 2 active fonts",
    );
  });
});
