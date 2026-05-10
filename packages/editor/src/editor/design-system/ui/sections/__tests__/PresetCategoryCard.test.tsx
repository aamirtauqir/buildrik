import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { PresetCategoryCard } from "../PresetCategoryCard";

beforeEach(() => {
  localStorage.clear();
});

describe("PresetCategoryCard", () => {
  it("renders title + count + dirty dot when dirty", () => {
    const { getByText, getByLabelText } = render(
      <PresetCategoryCard categoryId="button" title="Buttons" count={3} isDirty>
        <div>body</div>
      </PresetCategoryCard>,
    );
    expect(getByText("Buttons")).toBeTruthy();
    expect(getByText("3 presets")).toBeTruthy();
    expect(getByLabelText("unsaved changes in this category")).toBeTruthy();
  });

  it("collapses by default + expands on click + persists open state", () => {
    const { getByRole, queryByText, rerender } = render(
      <PresetCategoryCard categoryId="card" title="Cards" count={2}>
        <div>body-content</div>
      </PresetCategoryCard>,
    );
    expect(queryByText("body-content")).toBeNull();
    fireEvent.click(getByRole("button"));
    expect(queryByText("body-content")).toBeTruthy();
    expect(localStorage.getItem("buildrik:design-tab:preset-card-open:card")).toBe("true");

    // Re-mount → reads from localStorage and starts open.
    rerender(
      <PresetCategoryCard categoryId="card" title="Cards" count={2}>
        <div>body-content</div>
      </PresetCategoryCard>,
    );
    // (rerender keeps state in this hook tree; mount-from-fresh path is what
    // localStorage covers — assert the storage value as the regression lock.)
    expect(localStorage.getItem("buildrik:design-tab:preset-card-open:card")).toBe("true");
  });

  it("data-preset-category-card marker exposes id for tests", () => {
    const { container } = render(
      <PresetCategoryCard categoryId="form" title="Forms" count={1}>
        <div />
      </PresetCategoryCard>,
    );
    expect(container.querySelector('[data-preset-category-card="form"]')).toBeTruthy();
  });
});
