/**
 * StyleCategoryRow — a Presets row, board 7316:83953 (C1 (ii)).
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { StyleCategoryRow } from "../StyleCategoryRow";

describe("StyleCategoryRow", () => {
  it("names the category the way the board does, over its variant count", () => {
    const { getByTestId } = render(<StyleCategoryRow category="button" variantCount={3} onClick={() => {}} />);
    expect(getByTestId("brand-preset-label-button").textContent).toBe("Buttons");
    expect(getByTestId("brand-preset-count-button").textContent).toBe("3 variants");
  });

  it("says 'variant', singular, for one", () => {
    const { getByTestId } = render(<StyleCategoryRow category="form" variantCount={1} onClick={() => {}} />);
    expect(getByTestId("brand-preset-label-form").textContent).toBe("Forms");
    expect(getByTestId("brand-preset-count-form").textContent).toBe("1 variant");
  });

  it("click and Enter invoke onClick", () => {
    const onClick = vi.fn();
    const { container } = render(<StyleCategoryRow category="badge" variantCount={2} onClick={onClick} />);
    const row = container.querySelector('[data-category-row="badge"]') as HTMLElement;
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("a category with no presets is disabled and does not drill in", () => {
    const onClick = vi.fn();
    const { container } = render(<StyleCategoryRow category="tooltip" variantCount={0} onClick={onClick} />);
    const row = container.querySelector('[data-category-row="tooltip"]') as HTMLElement;
    expect(row.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(row);
    expect(onClick).not.toHaveBeenCalled();
  });
});
