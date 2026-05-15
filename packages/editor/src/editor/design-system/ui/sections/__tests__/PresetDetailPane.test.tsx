import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { PresetDetailPane } from "../PresetDetailPane";
import type { StylePreset } from "../../../types";

const buttonPresets: StylePreset[] = [
  {
    id: "button-primary",
    friendlyName: "Primary button",
    category: "button",
    variant: "primary",
    bindings: {
      "background-color": { tokenId: "color-primary" },
      color: { tokenId: "color-background" },
      "border-radius": { tokenId: "btn-radius" },
    },
  },
  {
    id: "button-ghost",
    friendlyName: "Ghost button",
    category: "button",
    variant: "ghost",
    bindings: {
      color: { tokenId: "color-primary" },
      "border-radius": { tokenId: "btn-radius" },
    },
  },
];

describe("PresetDetailPane", () => {
  it("renders header with category + variant + mono preset id", () => {
    const { getByText, container } = render(
      <PresetDetailPane
        category="button"
        variant="primary"
        presets={buttonPresets}
        onVariantChange={() => {}}
      />,
    );
    expect(getByText("Button · primary")).toBeTruthy();
    const presetIdEl = container.querySelector("[data-preset-id]");
    expect(presetIdEl?.textContent).toBe("preset.button.primary");
  });

  it("renders a variant tab per preset, marking the active one aria-selected", () => {
    const { container } = render(
      <PresetDetailPane
        category="button"
        variant="ghost"
        presets={buttonPresets}
        onVariantChange={() => {}}
      />,
    );
    const tabs = container.querySelectorAll("[data-variant-tab]");
    expect(tabs.length).toBe(2);
    const ghostTab = container.querySelector(
      '[data-variant-tab="ghost"]',
    ) as HTMLButtonElement;
    const primaryTab = container.querySelector(
      '[data-variant-tab="primary"]',
    ) as HTMLButtonElement;
    expect(ghostTab.getAttribute("aria-selected")).toBe("true");
    expect(primaryTab.getAttribute("aria-selected")).toBe("false");
  });

  it("renders a binding row per binding entry on the active variant", () => {
    const { container } = render(
      <PresetDetailPane
        category="button"
        variant="primary"
        presets={buttonPresets}
        onVariantChange={() => {}}
      />,
    );
    const rows = container.querySelectorAll("[data-binding-row]");
    // primary has 3 bindings: background-color, color, border-radius
    expect(rows.length).toBe(3);
    expect(
      container.querySelector('[data-binding-row="background-color"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-binding-row="color"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-binding-row="border-radius"]'),
    ).toBeTruthy();
  });

  it("clicking a variant tab fires onVariantChange with the new variant", () => {
    const onVariantChange = vi.fn();
    const { container } = render(
      <PresetDetailPane
        category="button"
        variant="primary"
        presets={buttonPresets}
        onVariantChange={onVariantChange}
      />,
    );
    const ghostTab = container.querySelector(
      '[data-variant-tab="ghost"]',
    ) as HTMLButtonElement;
    fireEvent.click(ghostTab);
    expect(onVariantChange).toHaveBeenCalledTimes(1);
    expect(onVariantChange).toHaveBeenCalledWith("ghost");
  });

  it("empty presets list renders the empty-state message", () => {
    const { container, getByText } = render(
      <PresetDetailPane
        category="tooltip"
        variant=""
        presets={[]}
        onVariantChange={() => {}}
      />,
    );
    expect(
      container.querySelector('[data-preset-detail-pane][data-empty="true"]'),
    ).toBeTruthy();
    expect(getByText(/No presets in this category yet/i)).toBeTruthy();
  });
});
