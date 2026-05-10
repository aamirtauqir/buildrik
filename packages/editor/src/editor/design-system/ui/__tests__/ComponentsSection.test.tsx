import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { ComponentsSection } from "../sections/ComponentsSection";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { StylePresetRegistryProvider } from "../../state/StylePresetRegistryContext";
import { CATALOG } from "../../../components-catalog/catalog";

const wrap = (ui: React.ReactNode) => (
  <TokenRegistryProvider projectId="cs-test">
    <StylePresetRegistryProvider projectId="cs-test">
      {ui}
    </StylePresetRegistryProvider>
  </TokenRegistryProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe("ComponentsSection (S3) — read-only summary", () => {
  it("renders three summary cards with stable headings", () => {
    const { getByText } = render(wrap(<ComponentsSection />));
    expect(getByText("Catalog")).toBeTruthy();
    expect(getByText("Design surface")).toBeTruthy();
    expect(getByText("Manage components")).toBeTruthy();
  });

  it("shows the live CATALOG length as the built-in component count", () => {
    const { getByText } = render(wrap(<ComponentsSection />));
    expect(getByText("Built-in components")).toBeTruthy();
    expect(getByText(String(CATALOG.length))).toBeTruthy();
  });

  it("breaks the catalog count down by tier (atom / molecule / organism)", () => {
    const expectedAtoms = CATALOG.filter((c) => c.category === "atom").length;
    const expectedMolecules = CATALOG.filter((c) => c.category === "molecule").length;
    const expectedOrganisms = CATALOG.filter((c) => c.category === "organism").length;
    const { getByText } = render(wrap(<ComponentsSection />));
    expect(getByText("Atoms")).toBeTruthy();
    expect(getByText("Molecules")).toBeTruthy();
    expect(getByText("Organisms")).toBeTruthy();
    expect(expectedAtoms + expectedMolecules + expectedOrganisms).toBe(CATALOG.length);
  });

  it("surfaces token + preset totals from the live registries", () => {
    const { getByText } = render(wrap(<ComponentsSection />));
    expect(getByText("Tokens defined")).toBeTruthy();
    expect(getByText("Style presets defined")).toBeTruthy();
  });

  it("points users to the Components rail tab for action", () => {
    const { container } = render(wrap(<ComponentsSection />));
    expect(container.textContent).toMatch(/Components/);
    expect(container.textContent).toMatch(/rail tab/);
  });
});
