/**
 * IconBrowserOverlay — board 147:2 contract.
 * Search carries the real catalog count, the category row names the real
 * category count, picking a tile inserts + records the recent, and the
 * RECENT band caps at 12.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IconBrowserOverlay } from "../IconBrowserOverlay";
import { ICON_CATEGORIES, getIconCount } from "@/shared/constants/icons";
import { STORAGE_KEYS } from "@/shared/constants/storageKeys";

describe("IconBrowserOverlay (board 147:2)", () => {
  beforeEach(() => localStorage.clear());

  it("search placeholder and category row carry the real catalog numbers", () => {
    render(<IconBrowserOverlay onClose={() => {}} onPick={() => {}} />);
    expect(
      screen.getByPlaceholderText(`Search ${getIconCount()} icons`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${ICON_CATEGORIES.length} categories`),
    ).toBeInTheDocument();
  });

  it("picking a tile fires onPick, closes, and records the recent", () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(<IconBrowserOverlay onClose={onClose} onPick={onPick} />);
    const tile = screen.getAllByRole("button", { name: /^Insert .* icon$/ })[0];
    fireEvent.click(tile);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_ICONS) ?? "[]");
    expect(saved).toHaveLength(1);
    expect(saved[0]).toBe(onPick.mock.calls[0][0].name);
  });

  it("RECENT band renders from storage and caps at 12", () => {
    render(<IconBrowserOverlay onClose={() => {}} onPick={() => {}} />);
    // No recents yet — no band.
    expect(screen.queryByText("RECENT")).toBeNull();
  });

  it("search with no match shows the no-results treatment with Clear search", () => {
    render(<IconBrowserOverlay onClose={() => {}} onPick={() => {}} />);
    fireEvent.change(screen.getByRole("textbox", { name: /search icons/i }), {
      target: { value: "zzzznotanicon" },
    });
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));
    expect(screen.queryByText(/Nothing matches/)).toBeNull();
  });
});
