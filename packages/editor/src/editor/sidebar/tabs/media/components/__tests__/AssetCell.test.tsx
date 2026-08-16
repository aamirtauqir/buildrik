/**
 * AssetCell — prototype-v3 §10 3-col grid cell.
 * Phase 0 Task 5 TDD spec.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssetCell } from "../AssetCell";
import type { LibraryItem } from "../../data/mediaTypes";

/* Note: AssetCell uses alt="" on the thumb (decorative — outer button
 * carries the aria-label), so screen.getByRole("img") would not match.
 * Tests use container.querySelector("img") for the img-tag assertion. */

const baseItem: LibraryItem = {
  key: "img1",
  name: "hero.jpg",
  type: "img",
  src: "https://example.com/hero.jpg",
  thumb: "https://example.com/hero-thumb.jpg",
  size: 1024,
  createdAt: "2026-05-13T00:00:00.000Z",
  mimeType: "image/jpeg",
};
const imgItem: LibraryItem = baseItem;
const vidItem: LibraryItem = {
  ...baseItem,
  key: "vid1",
  name: "intro.mp4",
  type: "vid",
  mimeType: "video/mp4",
};
const icoItem: LibraryItem = {
  ...baseItem,
  key: "ico1",
  name: "star",
  type: "ico",
  mimeType: "image/svg+xml",
};
const fntItem: LibraryItem = {
  ...baseItem,
  key: "fnt1",
  name: "Inter",
  type: "fnt",
  mimeType: "font/woff2",
};

describe("AssetCell", () => {
  it("renders image thumb for img type", () => {
    const { container } = render(<AssetCell item={imgItem} onClick={() => {}} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", expect.stringContaining("hero-thumb"));
  });

  it("renders video icon overlay for vid type", () => {
    const { container } = render(<AssetCell item={vidItem} onClick={() => {}} />);
    expect(container.querySelector(".med-asset-cell--vid")).toBeInTheDocument();
  });

  it("renders icon glyph for ico type", () => {
    const { container } = render(<AssetCell item={icoItem} onClick={() => {}} />);
    expect(container.querySelector(".med-asset-cell--ico")).toBeInTheDocument();
  });

  it("renders font preview for fnt type", () => {
    const { container } = render(<AssetCell item={fntItem} onClick={() => {}} />);
    expect(container.querySelector(".med-asset-cell--fnt")).toBeInTheDocument();
  });

  it("fires onClick with item.key", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<AssetCell item={imgItem} onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledWith("img1");
  });

  it("renders usage pips when usageCount > 0", () => {
    const { container } = render(
      <AssetCell item={imgItem} onClick={() => {}} usageCount={2} />
    );
    expect(container.querySelector(".med-usage-pips")).toBeInTheDocument();
  });

  it("renders APPLIED badge cobalt border when isApplied", () => {
    const { container } = render(
      <AssetCell item={imgItem} onClick={() => {}} isApplied />
    );
    expect(container.querySelector(".med-asset-cell--applied")).toBeInTheDocument();
  });

  it("renders lock state when isLocked", () => {
    const { container } = render(
      <AssetCell item={imgItem} onClick={() => {}} isLocked />
    );
    expect(container.querySelector(".med-asset-cell--locked")).toBeInTheDocument();
  });

  it("locked cell does NOT fire onClick", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<AssetCell item={imgItem} onClick={onClick} isLocked />);
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

/*
  A double-click fires click, click, dblclick. Both handlers were bound bare, so
  opening an asset's details inserted TWO copies of it on the page first.
  Measured live on a blank project before the fix: 0 user inserts read as
  "Used in 2 places", 1 as 3, 2 as 4 — a constant +2 from the double-click that
  opened the panel to read the number.

  fireEvent, not userEvent: the sequence has to be exact (click, click,
  dblclick) and userEvent's own timing machinery deadlocks against the fake
  timers this needs.
*/
describe("AssetCell — click vs double-click", () => {
  const cell = () => screen.getByRole("button", { name: /hero\.jpg asset/i });

  afterEach(() => { vi.useRealTimers(); });

  it("a double-click opens the detail and inserts nothing", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const onDoubleClick = vi.fn();
    render(<AssetCell item={imgItem} onClick={onClick} onDoubleClick={onDoubleClick} />);

    const el = cell();
    fireEvent.click(el);
    fireEvent.click(el);
    fireEvent.doubleClick(el);
    vi.advanceTimersByTime(600);

    expect(onDoubleClick).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("a single click still inserts, once the double-click window passes", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(<AssetCell item={imgItem} onClick={onClick} onDoubleClick={vi.fn()} />);

    fireEvent.click(cell());
    expect(onClick).not.toHaveBeenCalled();   // still inside the window
    vi.advanceTimersByTime(600);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("without a double-click handler the click is immediate", () => {
    // Selection mode has no double-click; its clicks must not be delayed.
    const onClick = vi.fn();
    render(<AssetCell item={imgItem} onClick={onClick} />);
    fireEvent.click(cell());
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
