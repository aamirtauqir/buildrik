/**
 * ComponentsSection — Brand › Component styles, board 7316:82755.
 *
 * Owner ruling 2026-09-24: the page lists the SITE SECTIONS — the Add ›
 * Blocks set (Hero, Features, Menu grid, …) — not UI controls. One card, a
 * row per section: its name over "Default appearance", ending in a ›. A row
 * hands off to its section (the workspace opens Add › Blocks). The AI action
 * is the workspace header's (BrandWorkspace.pages.test.tsx).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { ComponentsSection } from "../sections/ComponentsSection";
import { blockRows } from "@/editor/sidebar/tabs/build/catalog/groups";

describe("ComponentsSection — site sections", () => {
  it("lists the Add › Blocks sections, in their order, and nothing else", () => {
    const { getByTestId } = render(<ComponentsSection />);
    const rows = getByTestId("brand-components-list").querySelectorAll("[data-section-row]");
    expect(Array.from(rows).map((r) => r.getAttribute("data-section-row"))).toEqual(blockRows.map((b) => b.id));
    const names = blockRows.map((b) => b.label);
    for (const n of ["Hero", "Features", "Menu grid", "Footer", "Navbar"]) expect(names.some((x) => x.startsWith(n))).toBe(true);
    // No UI controls (the old catalogue) and no saved components.
    expect(getByTestId("brand-components-list").querySelector("[data-catalog-card],[data-saved-card]")).toBeNull();
  });

  it("each row reads name over 'Default appearance' and ends in a ›", () => {
    const { getByTestId } = render(<ComponentsSection />);
    const first = blockRows[0];
    const row = getByTestId(`brand-comp-row-${first.id}`);
    expect(getByTestId(`brand-comp-label-${first.id}`).textContent).toBe(first.label);
    expect(getByTestId(`brand-comp-meta-${first.id}`).textContent).toBe("Default appearance");
    expect(row.textContent?.trim().endsWith("›")).toBe(true);
  });

  it("a row opens its section (click and Enter)", () => {
    const onOpenSection = vi.fn();
    const { getByTestId } = render(<ComponentsSection onOpenSection={onOpenSection} />);
    const id = blockRows[1].id;
    fireEvent.click(getByTestId(`brand-comp-row-${id}`));
    fireEvent.keyDown(getByTestId(`brand-comp-row-${id}`), { key: "Enter" });
    expect(onOpenSection).toHaveBeenCalledTimes(2);
    expect(onOpenSection).toHaveBeenCalledWith(id);
  });
});
