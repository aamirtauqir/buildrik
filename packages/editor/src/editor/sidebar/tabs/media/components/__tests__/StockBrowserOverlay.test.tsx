/**
 * StockBrowserOverlay — flow-check 2026-09-25 fix: a failed stock search used
 * to leave the drawer's results pane on the pristine "Search to browse free
 * …" idle copy forever (the only signal was a toast that vanished), which is
 * indistinguishable from never having searched. The fullpage StockSourceModal
 * already carried the failure reason as a persistent, retry-capable message
 * for the same action — this brings the drawer into line with it, reusing
 * the same `FAILURE_COPY` map (now exported from this file, the base of the
 * ORIENTATIONS/COLORS/TYPES/FilterDropdown sharing the two already had).
 *
 * @license BSD-3-Clause
 */
import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import * as React from "react";
import { StockBrowserOverlay } from "../StockBrowserOverlay";
import type { StockPhoto } from "../../data/mediaTypes";

function photo(over: Partial<StockPhoto> = {}): StockPhoto {
  return {
    id: "p1",
    url: "https://images.example.com/full.jpg",
    thumb: "https://images.example.com/thumb.jpg",
    alt: "Restaurant interior",
    author: "Ansel Adams",
    authorUrl: "https://unsplash.com/@ansel",
    width: 1920,
    height: 1080,
    source: "unsplash",
    ...over,
  };
}

function mount(over: Partial<React.ComponentProps<typeof StockBrowserOverlay>> = {}) {
  const props: React.ComponentProps<typeof StockBrowserOverlay> = {
    onClose: vi.fn(),
    photos: [],
    videos: [],
    loading: { img: false, vid: false },
    searchQuery: "",
    searchFailed: null,
    orientation: "all",
    color: "all",
    onSearch: vi.fn(),
    onSetOrientation: vi.fn(),
    onSetColor: vi.fn(),
    onLoadMore: vi.fn(),
    onSave: vi.fn(),
    ...over,
  };
  return render(<StockBrowserOverlay {...props} />);
}

describe("StockBrowserOverlay — failed search no longer looks like idle", () => {
  it("idle (no query yet) reads the plain invitation, not an alert", () => {
    mount();
    expect(screen.getByText(/Search to browse free photos/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("a genuine empty result names the query — was indistinguishable from idle before this fix", () => {
    mount({ searchQuery: "asdfgh", searchFailed: null });
    expect(screen.getByText(/No photos found for "asdfgh"/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("a failed search renders a persistent alert, not the idle copy", () => {
    mount({ searchQuery: "restaurant interior", searchFailed: "not-configured" });
    expect(screen.getByRole("alert").textContent).toMatch(/isn't configured|not configured/i);
    expect(screen.queryByText(/Search to browse free photos/i)).toBeNull();
    expect(screen.queryByText(/No photos found for/i)).toBeNull();
  });

  it("distinguishes a rejected key from an unconfigured one, same as the fullpage surface", () => {
    mount({ searchQuery: "cats", searchFailed: "unauthorized" });
    expect(screen.getByRole("alert").textContent).toMatch(/key/i);
  });

  it("offers Try again only for a failure retrying can fix, and it re-issues the same query", () => {
    const onSearch = vi.fn();
    const retryable = mount({ searchQuery: "cats", searchFailed: "request-failed", onSearch });
    fireEvent.click(retryable.getByText("Try again"));
    expect(onSearch).toHaveBeenCalledWith("cats", "all", "all");
    retryable.unmount();

    const unconfigured = mount({ searchQuery: "cats", searchFailed: "not-configured" });
    expect(unconfigured.queryByText("Try again")).toBeNull();
  });

  it("a failure with results already on screen does not blank them out", () => {
    // Orientation/colour changes re-search in place; a stale-provider error
    // on that follow-up call should not erase what's already rendered.
    mount({ searchQuery: "cats", searchFailed: "request-failed", photos: [photo()] });
    expect(screen.getByTestId("stock-thumb-p1")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
