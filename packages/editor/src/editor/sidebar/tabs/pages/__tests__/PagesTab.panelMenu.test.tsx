// @vitest-environment jsdom
/**
 * PagesTab — the header ⋯ panel menu (board 7069:79383 + EP-11 Listings
 * row, audit G2-070), and the topbar field as the panel's filter
 * (v3 4418:92256).
 *
 * Select pages… turns the row checkboxes on before anything is ticked;
 * Show structure / Listings swap the body view; Reload re-syncs. The ⌘K
 * keycap and the search band are gone — v3 4418:90494 draws neither; the
 * topbar field reads "Search pages…" while the drawer is open.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { createMockComposer, pg, type MockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import PagesTab from "../PagesTab";

afterEach(cleanup);

function mount(): MockComposer {
  const composer = createMockComposer({ pages: [pg("p1", "Home", { isHome: true }), pg("p2", "About")] });
  render(
    <ToastProvider>
      <PagesTab composer={composer} />
    </ToastProvider>,
  );
  return composer;
}

const openMenu = () => fireEvent.click(screen.getByTestId("pages-panel-menu"));

describe("PagesTab — header ⋯ menu", () => {
  it("offers Select pages… · Listings · Show structure · Reload (v3 7069:79383); the band links are gone", () => {
    mount();
    expect(screen.queryByText(/Listings/)).toBeNull();
    expect(screen.queryByText(/Structure/)).toBeNull();
    openMenu();
    const labels = screen.getAllByRole("menuitem").map((el) => el.textContent?.trim());
    expect(labels).toEqual(["Select pages…", "Listings", "Show structure", "Reload"]);
  });

  it("select mode swaps the ⋯ for Done, which leaves it (v3 7069:78984)", () => {
    mount();
    openMenu();
    fireEvent.click(screen.getByTestId("pages-menu-select"));
    expect(screen.queryByTestId("pages-panel-menu")).toBeNull();
    fireEvent.click(screen.getByTestId("pages-select-done"));
    expect(document.querySelector(".bd-pg-panel")?.classList.contains("bulk-mode")).toBe(false);
    expect(screen.getByTestId("pages-panel-menu")).toBeInTheDocument();
  });

  it("Select pages… turns bulk mode on with nothing selected; Escape leaves it", () => {
    const { container } = { container: document.body };
    mount();
    const panel = () => container.querySelector(".bd-pg-panel");
    expect(panel()?.classList.contains("bulk-mode")).toBe(false);
    openMenu();
    fireEvent.click(screen.getByTestId("pages-menu-select"));
    expect(panel()?.classList.contains("bulk-mode")).toBe(true);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(panel()?.classList.contains("bulk-mode")).toBe(false);
  });

  it("Show structure opens the route tree; Listings opens the listings table", () => {
    mount();
    openMenu();
    fireEvent.click(screen.getByTestId("pages-open-structure"));
    expect(screen.getByText(/routes?/i)).toBeInTheDocument();
    // back to the tree, then the other view
    fireEvent.click(screen.getByTestId("pages-structure-back"));
    openMenu();
    fireEvent.click(screen.getByTestId("pages-open-listings"));
    expect(screen.getByTestId("pages-listings-back")).toBeInTheDocument();
  });

  it("Reload re-syncs the page list", () => {
    const composer = mount();
    const before = (composer.elements.getAllPages as ReturnType<typeof vi.fn>).mock.calls.length;
    openMenu();
    fireEvent.click(screen.getByTestId("pages-menu-reload"));
    expect((composer.elements.getAllPages as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(before);
  });

  it("hands the topbar field a Pages scope instead of drawing a keycap or search band", () => {
    const composer = mount();
    expect(screen.queryByTestId("pages-open-palette")).toBeNull();
    expect(screen.queryByLabelText("Search pages")).toBeNull();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_SEARCH_CONTEXT, { placeholder: "Search pages…" });
  });
});
