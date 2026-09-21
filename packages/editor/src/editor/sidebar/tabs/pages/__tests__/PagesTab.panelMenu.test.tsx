// @vitest-environment jsdom
/**
 * PagesTab — the header ⋯ panel menu (board 7069:79383 + EP-11 Listings
 * row, audit G2-070) and the ⌘K keycap (board 4418:90494).
 *
 * Select pages… turns the row checkboxes on before anything is ticked;
 * Show structure / Listings swap the body view; Reload re-syncs; the keycap
 * asks the shell for THE palette. The Listings / Structure text links that
 * sat on the search band are gone.
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
  it("offers Select pages… · Show structure · Reload · Listings; the band links are gone", () => {
    mount();
    expect(screen.queryByText(/Listings/)).toBeNull();
    expect(screen.queryByText(/Structure/)).toBeNull();
    openMenu();
    const labels = screen.getAllByRole("menuitem").map((el) => el.textContent?.trim());
    expect(labels).toEqual(["Select pages…", "Show structure", "Reload", "Listings"]);
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

  it("the ⌘K keycap renders in the header and asks the shell for the one palette", () => {
    const composer = mount();
    const keycap = screen.getByTestId("pages-open-palette");
    expect(keycap.closest('[data-testid="panel-header"]')).not.toBeNull();
    fireEvent.click(keycap);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_COMMAND_PALETTE, {});
  });
});
