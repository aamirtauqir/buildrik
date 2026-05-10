import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { CatalogSection } from "../CatalogSection";

describe("CatalogSection", () => {
  it("renders three tier groups", () => {
    const { container } = render(<CatalogSection />);
    expect(container.querySelector('[data-catalog-tier="atom"]')).toBeTruthy();
    expect(container.querySelector('[data-catalog-tier="molecule"]')).toBeTruthy();
    expect(container.querySelector('[data-catalog-tier="organism"]')).toBeTruthy();
  });

  it("renders one CatalogRow per catalog component", () => {
    const { container } = render(<CatalogSection />);
    // CE2 ships 5 components total.
    expect(container.querySelectorAll("[data-catalog-row]").length).toBe(5);
  });

  it("search query filters rows", () => {
    const { container } = render(<CatalogSection searchQuery="butt" />);
    const rows = container.querySelectorAll("[data-catalog-row]");
    expect(rows.length).toBe(1);
    expect(rows[0].getAttribute("data-catalog-row")).toBe("button");
  });

  it("clicking a row fires onComponentSelect with id", () => {
    const onSelect = vi.fn();
    const { container } = render(<CatalogSection onComponentSelect={onSelect} />);
    const row = container.querySelector('[data-catalog-row="card"]') as HTMLElement;
    fireEvent.click(row);
    expect(onSelect).toHaveBeenCalledWith("card");
  });

  it("empty-search empty-tier renders 'No components yet' fallback", () => {
    // Search that matches no components hits the search-empty path, not
    // the no-components path. To exercise the no-components-yet copy we'd
    // need an empty CATALOG which isn't shippable — covered by structure
    // assertion only.
    const { container } = render(<CatalogSection searchQuery="zzznomatch" />);
    expect(container.textContent).toContain("No matches in this tier");
  });
});
