import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { StyleCategoryRow } from "../StyleCategoryRow";

describe("StyleCategoryRow", () => {
  it("renders category label + variant count (plural)", () => {
    const { getByText } = render(
      <StyleCategoryRow
        category="button"
        variantCount={3}
        isActive={false}
        onClick={() => {}}
      />,
    );
    /* Board 152:112 puts the name at the left and the count at the right,
       so they are two nodes now rather than one run of text. */
    expect(getByText("Button")).toBeTruthy();
    expect(getByText("3 variants")).toBeTruthy();
  });

  it("renders singular 'variant' when variantCount === 1", () => {
    const { getByText } = render(
      <StyleCategoryRow
        category="form"
        variantCount={1}
        isActive={false}
        onClick={() => {}}
      />,
    );
    expect(getByText("Form input")).toBeTruthy();
    expect(getByText("1 variant")).toBeTruthy();
  });

  it("active state exposes data-active='true' and accent fg", () => {
    const { container } = render(
      <StyleCategoryRow
        category="card"
        variantCount={2}
        isActive
        onClick={() => {}}
      />,
    );
    const btn = container.querySelector('[data-category-row="card"]') as
      | HTMLButtonElement
      | null;
    expect(btn).toBeTruthy();
    expect(btn?.getAttribute("data-active")).toBe("true");
    expect(btn?.style.borderLeftColor || btn?.style.borderLeft).toBeTruthy();
  });

  it("click invokes onClick exactly once", () => {
    const onClick = vi.fn();
    const { container } = render(
      <StyleCategoryRow
        category="badge"
        variantCount={2}
        isActive={false}
        onClick={onClick}
      />,
    );
    const btn = container.querySelector(
      '[data-category-row="badge"]',
    ) as HTMLButtonElement;
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("variantCount=0 → disabled + opacity 0.4", () => {
    const { container } = render(
      <StyleCategoryRow
        category="tooltip"
        variantCount={0}
        isActive={false}
        onClick={() => {}}
      />,
    );
    const btn = container.querySelector(
      '[data-category-row="tooltip"]',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.style.opacity).toBe("0.4");
  });
});
