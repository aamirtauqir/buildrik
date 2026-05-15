/**
 * ComponentsSection (Arc B2) — functional catalog tests.
 *
 * Replaces prior info-card tests. Verifies the catalog body: data-components-catalog
 * root, DSStatusChip "Bound to DS" text, 3 filter pills with All active initially,
 * filter gating of catalog vs user-saved sections, search typeability, and at least
 * one atom row rendered from the live CATALOG.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { ComponentsSection } from "../sections/ComponentsSection";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { StylePresetRegistryProvider } from "../../state/StylePresetRegistryContext";
import { ToastProvider } from "@/editor/shared/vibcoder";

const wrap = (ui: React.ReactNode) => (
  <ToastProvider>
    <TokenRegistryProvider projectId="cs-arc-b2-test">
      <StylePresetRegistryProvider projectId="cs-arc-b2-test">
        {ui}
      </StylePresetRegistryProvider>
    </TokenRegistryProvider>
  </ToastProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe("ComponentsSection (Arc B2) — functional catalog", () => {
  it("renders the data-components-catalog root", () => {
    const { container } = render(wrap(<ComponentsSection composer={null} />));
    expect(container.querySelector("[data-components-catalog]")).toBeTruthy();
  });

  it("renders the DSStatusChip with 'Bound to DS' text", () => {
    const { container } = render(wrap(<ComponentsSection composer={null} />));
    const chip = container.querySelector("[data-ds-status-chip]");
    expect(chip).toBeTruthy();
    expect(chip?.textContent).toMatch(/Bound to DS/);
  });

  it("renders 3 filter pills with All active initially", () => {
    const { getByText, container } = render(wrap(<ComponentsSection composer={null} />));
    expect(getByText("All")).toBeTruthy();
    expect(getByText("DS")).toBeTruthy();
    expect(getByText("Yours")).toBeTruthy();
    const allPill = container.querySelector('[data-filter-pill="all"]');
    expect(allPill?.getAttribute("aria-checked")).toBe("true");
  });

  it("clicking DS hides UserSavedSection (catalog only)", () => {
    const { getByText, container } = render(wrap(<ComponentsSection composer={null} />));
    fireEvent.click(getByText("DS"));
    expect(container.querySelector("[data-catalog-section]")).toBeTruthy();
    expect(container.querySelector("[data-user-saved-section]")).toBeNull();
  });

  it("clicking Yours hides CatalogSection (user-saved only)", () => {
    const { getByText, container } = render(wrap(<ComponentsSection composer={null} />));
    fireEvent.click(getByText("Yours"));
    expect(container.querySelector("[data-catalog-section]")).toBeNull();
    expect(container.querySelector("[data-user-saved-section]")).toBeTruthy();
  });

  it("search input is typeable and updates value", () => {
    const { getByLabelText } = render(wrap(<ComponentsSection composer={null} />));
    const input = getByLabelText("Search components") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "button" } });
    expect(input.value).toBe("button");
  });

  it("renders at least one catalog row in the All view", () => {
    const { container } = render(wrap(<ComponentsSection composer={null} />));
    const rows = container.querySelectorAll("[data-catalog-row]");
    expect(rows.length).toBeGreaterThan(0);
  });
});
