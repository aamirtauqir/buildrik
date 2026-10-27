/**
 * Listings — design-2l9 board 63:21262: Page and URL · SEO score · Visibility.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SearchListingsTable, listingScore } from "../components/SearchListingsTable";
import { calculateSeoScore } from "../utils/seoScore";
import type { PageItem } from "../types";

const pages: PageItem[] = [
  { id: "home", name: "Home", slug: "index", isHome: true, status: "live" },
  { id: "about", name: "About", slug: "about", status: "live", seo: { metaTitle: "About our studio — Fieldwork", metaDescription: "Independent design, thoughtful work and lasting partnerships." } },
  { id: "contact", name: "Contact", slug: "contact", status: "hidden" },
];

describe("SearchListingsTable", () => {
  it("draws the board's columns, the URL under the name, and the note", () => {
    render(<SearchListingsTable pages={pages} onEditPage={vi.fn()} onRowMenu={vi.fn()} />);
    expect(screen.getByText("Page and URL")).toBeInTheDocument();
    expect(screen.getByText("SEO score")).toBeInTheDocument();
    expect(screen.getByText("Visibility")).toBeInTheDocument();
    expect(screen.getByTestId("listing-row-about")).toHaveTextContent("About/about");
    expect(screen.getByTestId("listing-row-home")).toHaveTextContent("Home/");
    expect(screen.getByTestId("listing-visibility-contact")).toHaveTextContent("Hidden");
    expect(screen.getByTestId("listings-note")).toHaveTextContent("Search names and URLs. Scores match Page settings → SEO.");
  });

  it("prints the SEO tab's own score where the page has its own title, — otherwise", () => {
    render(<SearchListingsTable pages={pages} onEditPage={vi.fn()} onRowMenu={vi.fn()} />);
    const expected = calculateSeoScore({
      title: "About our studio — Fieldwork",
      desc: "Independent design, thoughtful work and lasting partnerships.",
      slug: "about",
      allowIndex: true,
    });
    expect(listingScore(pages[1])).toBe(expected);
    expect(screen.getByTestId("listing-score-about")).toHaveTextContent(String(expected));
    expect(screen.getByTestId("listing-score-home")).toHaveTextContent("—");
  });

  it("filters by name and URL", () => {
    render(<SearchListingsTable pages={pages} onEditPage={vi.fn()} onRowMenu={vi.fn()} search="/cont" />);
    expect(screen.queryByTestId("listing-row-about")).toBeNull();
    expect(screen.getByTestId("listing-row-contact")).toBeInTheDocument();
  });

  // re-baseline: Listings — board 63:21262 gives every row its ⋯, the same page menu as the Pages view.
  it("opens the page menu from a row's ⋯ without opening its settings", () => {
    const onEditPage = vi.fn();
    const onRowMenu = vi.fn();
    render(<SearchListingsTable pages={pages} onEditPage={onEditPage} onRowMenu={onRowMenu} />);
    fireEvent.click(screen.getByTestId("listing-menu-about"));
    expect(onRowMenu).toHaveBeenCalledWith("about", expect.any(Number), expect.any(Number));
    expect(onEditPage).not.toHaveBeenCalled();
  });
});
