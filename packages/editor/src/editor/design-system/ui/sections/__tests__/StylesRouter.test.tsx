import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import * as React from "react";
import { StylesRouter } from "../StylesRouter";
import { StylePresetRegistryProvider } from "../../../state/StylePresetRegistryContext";

const PROJECT_ID = "styles-router-test";

const wrap = (ui: React.ReactNode) => (
  <StylePresetRegistryProvider projectId={PROJECT_ID}>
    {ui}
  </StylePresetRegistryProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe("StylesRouter", () => {
  it("initial render shows list view (no detail pane)", () => {
    const { container } = render(wrap(<StylesRouter />));

    expect(container.querySelector("[data-list-view]")).toBeTruthy();
    expect(container.querySelector("[data-detail-view]")).toBeNull();
    expect(container.querySelector("[data-preset-detail-pane]")).toBeNull();
    // 11 category rows visible.
    expect(container.querySelectorAll("[data-category-row]").length).toBe(11);
  });

  it("clicking a category row pushes detail view with first variant", () => {
    const { container } = render(wrap(<StylesRouter />));

    const cardRow = container.querySelector(
      '[data-category-row="card"]',
    ) as HTMLButtonElement;
    fireEvent.click(cardRow);

    expect(container.querySelector("[data-list-view]")).toBeNull();
    expect(container.querySelector("[data-detail-view]")).toBeTruthy();
    const detailPane = container.querySelector(
      "[data-preset-detail-pane]",
    ) as HTMLElement;
    expect(detailPane.getAttribute("data-category")).toBe("card");
    expect(detailPane.getAttribute("data-variant")).toBe("elevated");
  });

  it("back arrow returns to list view", () => {
    const { container, getByText } = render(wrap(<StylesRouter />));
    const buttonRow = container.querySelector(
      '[data-category-row="button"]',
    ) as HTMLButtonElement;
    fireEvent.click(buttonRow);

    expect(container.querySelector("[data-detail-view]")).toBeTruthy();
    fireEvent.click(getByText(/Back to styles/));
    expect(container.querySelector("[data-list-view]")).toBeTruthy();
    expect(container.querySelector("[data-detail-view]")).toBeNull();
  });

  it("clicking a variant tab inside the detail pane updates the variant", () => {
    const { container } = render(wrap(<StylesRouter />));

    // Drill in first.
    const buttonRow = container.querySelector(
      '[data-category-row="button"]',
    ) as HTMLButtonElement;
    fireEvent.click(buttonRow);

    const ghostTab = container.querySelector(
      '[data-variant-tab="ghost"]',
    ) as HTMLButtonElement;
    fireEvent.click(ghostTab);

    const detailPane = container.querySelector(
      "[data-preset-detail-pane]",
    ) as HTMLElement;
    expect(detailPane.getAttribute("data-variant")).toBe("ghost");
  });

  it("category rows with zero presets are disabled", () => {
    // DEFAULT_PRESETS in constants.ts may not seed every category.
    // Just assert the disabled property tracks variantCount=0 truthfully.
    const { container } = render(wrap(<StylesRouter />));
    const rows = container.querySelectorAll("[data-category-row]");
    rows.forEach((row) => {
      const btn = row as HTMLButtonElement;
      const label = btn.textContent ?? "";
      const isZero = / · 0 variants$/.test(label);
      if (isZero) {
        expect(btn.disabled).toBe(true);
      } else {
        expect(btn.disabled).toBe(false);
      }
    });
  });
});
