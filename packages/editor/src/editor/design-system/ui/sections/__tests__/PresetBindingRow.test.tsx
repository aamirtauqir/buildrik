/**
 * PresetBindingRow (Arc B1 T4) — binding row label humanization + token chip.
 *
 * Pins the v1 contract: the row is PRESENTATIONAL ONLY. Clicking it does
 * nothing — token picker integration is deferred (spec D3). If someone wires
 * a click handler without shipping the picker, the no-op pin below fails.
 */

import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { PresetBindingRow } from "../PresetBindingRow";

describe("PresetBindingRow — rendering", () => {
  it("renders the humanized property label and the token chip", () => {
    const { container, getByText } = render(
      <PresetBindingRow propertyName="background-color" tokenId="color-primary" />
    );
    expect(getByText("Background")).toBeTruthy();
    const chip = container.querySelector("[data-token-chip]");
    expect(chip?.textContent).toBe("color-primary");
  });

  it("exposes data-binding-row keyed by the raw property name", () => {
    const { container } = render(
      <PresetBindingRow propertyName="hoverBg" tokenId="color-primary-hover" />
    );
    expect(container.querySelector('[data-binding-row="hoverBg"]')).toBeTruthy();
  });

  it.each([
    ["background", "Background"],
    ["backgroundColor", "Background"],
    ["color", "Text color"],
    ["border-radius", "Radius"],
    ["paddingX", "Padding X"],
    ["padding-block", "Padding Y"],
    ["font-size", "Font size"],
    ["boxShadow", "Shadow"],
    ["hoverBg", "Hover bg"],
  ])("maps known property %s → %s", (prop, label) => {
    const { getByText } = render(
      <PresetBindingRow propertyName={prop} tokenId="tok" />
    );
    expect(getByText(label)).toBeTruthy();
  });

  it("falls back to generic humanization for unknown dash-case properties", () => {
    const { getByText } = render(
      <PresetBindingRow propertyName="letter-spacing" tokenId="tok" />
    );
    expect(getByText("Letter spacing")).toBeTruthy();
  });

  it("falls back to generic humanization for unknown camelCase properties", () => {
    const { getByText } = render(
      <PresetBindingRow propertyName="rowGap" tokenId="tok" />
    );
    expect(getByText("Row Gap")).toBeTruthy();
  });
});

describe("PresetBindingRow — v1 no-op pin (spec D3: token picker deferred)", () => {
  it("renders no interactive element — no button, link, or input inside the row", () => {
    const { container } = render(
      <PresetBindingRow propertyName="background" tokenId="color-primary" />
    );
    expect(container.querySelector("button, a, input, select, [role='button']")).toBeNull();
  });

  it("clicking the row and the chip changes nothing and throws nothing", () => {
    const { container } = render(
      <PresetBindingRow propertyName="background" tokenId="color-primary" />
    );
    const row = container.querySelector("[data-binding-row]") as HTMLElement;
    const before = row.outerHTML;
    fireEvent.click(row);
    fireEvent.click(row.querySelector("[data-token-chip]") as HTMLElement);
    expect(row.outerHTML).toBe(before);
  });
});
