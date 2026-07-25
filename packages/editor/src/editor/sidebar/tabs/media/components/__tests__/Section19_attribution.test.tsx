/**
 * §19 StockSourceModal tile attribution — Phase 10 Task 59.
 *
 * Asserts each photo/video tile renders an attribution row containing
 * the contributor name + source. Author links are clickable and
 * stop propagation so clicking the link doesn't fire Save.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen, within } from "@testing-library/react";
import { StockSourceModal } from "../StockSourceModal";
import type { StockPhoto, StockVideo } from "../../data/mediaTypes";

function photo(overrides: Partial<StockPhoto> = {}): StockPhoto {
  return {
    id: "p1",
    url: "https://example.com/full.jpg",
    thumb: "https://example.com/thumb.jpg",
    alt: "Sunset",
    author: "Ansel Adams",
    authorUrl: "https://unsplash.com/@ansel",
    width: 1920,
    height: 1080,
    source: "unsplash",
    ...overrides,
  } as StockPhoto;
}

function video(overrides: Partial<StockVideo> = {}): StockVideo {
  return {
    id: "v1",
    url: "https://example.com/clip.mp4",
    thumb: "https://example.com/clip-thumb.jpg",
    duration: 12,
    author: "Filmmaker",
    source: "pexels",
    ...overrides,
  } as StockVideo;
}

function renderModal(extra: Partial<React.ComponentProps<typeof StockSourceModal>> = {}) {
  return render(
    <StockSourceModal
      open
      onClose={() => {}}
      activeType="img"
      photos={[]}
      videos={[]}
      icons={[]}
      fonts={[]}
      loading={{ img: false, vid: false, ico: false, fnt: false }}
      searchQuery=""
      orientation="all"
      color="all"
      source="unsplash"
      onSearch={() => {}}
      onSetOrientation={() => {}}
      onSetColor={() => {}}
      onSetSource={() => {}}
      onLoadMore={async () => {}}
      onSave={vi.fn()}
      onInsert={() => {}}
      {...extra}
    />,
  );
}

describe("§19 — Stock tile attribution", () => {
  it("photo tile shows author + source", () => {
    renderModal({ photos: [photo()] });
    const attribution = document.querySelector(
      "[data-testid='stock-tile-attribution']",
    );
    expect(attribution).toBeInTheDocument();
    expect(attribution?.textContent).toMatch(/Ansel Adams/);
    expect(attribution?.textContent).toMatch(/unsplash/i);
  });

  it("photo author link uses authorUrl with rel noopener", () => {
    renderModal({ photos: [photo()] });
    const link = screen.getByRole("link", { name: /ansel adams/i });
    expect(link).toHaveAttribute("href", "https://unsplash.com/@ansel");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("clicking author link does NOT fire onSave (stopPropagation)", () => {
    const onSave = vi.fn();
    renderModal({ photos: [photo()], onSave });
    const link = screen.getByRole("link", { name: /ansel adams/i });
    fireEvent.click(link);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("photo with no authorUrl renders plain text (no link)", () => {
    renderModal({ photos: [photo({ authorUrl: "" })] });
    expect(
      screen.queryByRole("link", { name: /ansel adams/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Ansel Adams/)).toBeInTheDocument();
  });

  it("video tile shows author + source", () => {
    renderModal({
      activeType: "vid",
      videos: [video()],
    });
    // Modal's internal activeTab defaults to "img"; click the Videos tab.
    fireEvent.click(screen.getByRole("button", { name: /^videos$/i }));
    const attribution = document.querySelector(
      "[data-testid='stock-tile-attribution']",
    );
    expect(attribution).toBeInTheDocument();
    const tile = document.querySelector(".med-vid-card") as HTMLElement;
    expect(within(tile).getByText(/Filmmaker/)).toBeInTheDocument();
    expect(within(tile).getByText(/pexels/i)).toBeInTheDocument();
  });
});
