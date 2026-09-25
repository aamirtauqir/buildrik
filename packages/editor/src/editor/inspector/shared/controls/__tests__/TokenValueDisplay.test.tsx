/**
 * L2-V3 (board 6894:74644): a value bound to a site token shows the number it
 * resolves to, never the raw `var(--buildrick-design-…)`, in the unit field,
 * the spacing box and the corner-radius box.
 *
 * @license BSD-3-Clause
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { InputWithUnit, CornerRadiusInput } from "..";

beforeAll(() => {
  document.documentElement.style.setProperty("--buildrick-design-input-height", "40px");
  document.documentElement.style.setProperty("--buildrick-design-input-radius", "8px");
});
afterAll(() => {
  document.documentElement.style.removeProperty("--buildrick-design-input-height");
  document.documentElement.style.removeProperty("--buildrick-design-input-radius");
});

describe("token-bound values display resolved", () => {
  it("InputWithUnit shows 40, not var(…)", () => {
    render(<InputWithUnit label="Height" value="var(--buildrick-design-input-height)" onChange={vi.fn()} />);
    const input = screen.getAllByRole("textbox")[0] as HTMLInputElement;
    expect(input.value).toBe("40");
  });

  it("CornerRadiusInput shows 8 in each corner", () => {
    const r = "var(--buildrick-design-input-radius)";
    render(<CornerRadiusInput values={{ tl: r, tr: r, bl: r, br: r }} onChange={vi.fn()} linked onLinkToggle={vi.fn()} />);
    const values = (screen.getAllByRole("textbox") as HTMLInputElement[]).map((i) => i.value);
    expect(values.every((v) => v === "8")).toBe(true);
    expect(values.length).toBeGreaterThan(0);
  });
});
