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
  it("offers Select pages… · Listings · Show structure · Reload · Recently deleted (board 65:17148, A-21)", () => {
    mount();
    openMenu();
    const labels = screen.getAllByRole("menuitem").map((el) => el.textContent?.trim());
    expect(labels).toEqual(["Select pages…", "Listings", "Show structure", "Reload", "Recently deleted"]);
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
    expect(screen.getByTestId("pages-structure")).toBeInTheDocument();
    openMenu();
    fireEvent.click(screen.getByTestId("pages-open-listings"));
    expect(screen.queryByTestId("pages-structure")).toBeNull();
    expect(screen.getByRole("tab", { name: "Listings" })).toHaveAttribute("aria-selected", "true");
  });

  /* design-2l9 board 63:6393: Pages · Listings · Structure as tabs under the
     search, and the count in the title. */
  it("switches views from the tabs; the title counts the pages", () => {
    mount();
    expect(screen.getByText(/^Pages · \d+$/)).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Pages", "Listings", "Structure"]);
    fireEvent.click(screen.getByRole("tab", { name: "Structure" }));
    expect(screen.getByTestId("pages-structure")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Pages" }));
    expect(screen.queryByTestId("pages-structure")).toBeNull();
  });

  it("Reload re-syncs the page list", () => {
    const composer = mount();
    const before = (composer.elements.getAllPages as ReturnType<typeof vi.fn>).mock.calls.length;
    openMenu();
    fireEvent.click(screen.getByTestId("pages-menu-reload"));
    expect((composer.elements.getAllPages as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(before);
  });

  /* Owner decision 2026-10-03 (v3 4418:92256 had the topbar field read
     "Search pages…"): the filter is the panel's own field, under the header. */
  it("draws its own Search pages field under the header — no keycap, nothing claimed in the topbar", () => {
    const composer = mount();
    expect(screen.queryByTestId("pages-open-palette")).toBeNull();
    expect(screen.getByPlaceholderText("Search pages…")).toBeTruthy();
    expect(composer.emit).not.toHaveBeenCalledWith("ui:search-context", expect.anything());
  });
});
