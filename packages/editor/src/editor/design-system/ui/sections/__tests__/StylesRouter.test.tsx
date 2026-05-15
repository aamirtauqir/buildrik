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
  it("initial render selects Button category and its first variant (primary)", () => {
    const { container } = render(wrap(<StylesRouter />));

    const buttonRow = container.querySelector(
      '[data-category-row="button"]',
    ) as HTMLButtonElement;
    expect(buttonRow.getAttribute("data-active")).toBe("true");

    const detailPane = container.querySelector(
      "[data-preset-detail-pane]",
    ) as HTMLElement;
    expect(detailPane.getAttribute("data-category")).toBe("button");
    expect(detailPane.getAttribute("data-variant")).toBe("primary");
  });

  it("clicking Card category swaps detail pane to card + first card variant", () => {
    const { container } = render(wrap(<StylesRouter />));

    const cardRow = container.querySelector(
      '[data-category-row="card"]',
    ) as HTMLButtonElement;
    fireEvent.click(cardRow);

    expect(cardRow.getAttribute("data-active")).toBe("true");
    const detailPane = container.querySelector(
      "[data-preset-detail-pane]",
    ) as HTMLElement;
    expect(detailPane.getAttribute("data-category")).toBe("card");
    // DEFAULT_PRESETS: card variants are "elevated" then "flat".
    expect(detailPane.getAttribute("data-variant")).toBe("elevated");
  });

  it("clicking a variant tab inside the detail pane updates the variant", () => {
    const { container } = render(wrap(<StylesRouter />));

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
