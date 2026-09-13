/**
 * StockSourceModal — Clone 3695:45569 "Stock assets". One `it` per prototype
 * fact a DOM assertion can prove; the visual half is the shot pair the live
 * walk takes.
 *
 * Displaces V1 147:55 / 3397:18464 ("Add from Stock": four underline tabs,
 * an orientation group, twelve colour dots, provider pills, a monthly quota
 * strip, hover-bar "Save to Library" on every tile and click-to-insert icons
 * and fonts). The S19 quota / provider-pill tests that lived here pinned
 * props no consumer ever passed; they go with the chrome they described.
 * `Insert` is gone — stock SAVES to the library, the canvas is untouched.
 *
 * The not-configured / searching / no-results / search-failed states keep
 * their copy: the Clone keeps them as REFERENCE VARIANTs 3397:18935 / 18533
 * / 18581 / 18655.
 *
 * @license BSD-3-Clause
 */
import { render, fireEvent, screen, within, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import * as React from "react";
import { StockSourceModal } from "../StockSourceModal";
import type { DiscIcon, StockPhoto, StockVideo } from "../../data/mediaTypes";

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

function video(over: Partial<StockVideo> = {}): StockVideo {
  return {
    id: "v1",
    url: "https://videos.example.com/clip.mp4",
    thumb: "https://videos.example.com/clip-thumb.jpg",
    duration: 12,
    author: "Filmmaker",
    source: "pexels",
    ...over,
  };
}

const icon: DiscIcon = { id: "ico_1", name: "User", category: "General", svgDataUrl: "data:image/svg+xml;base64,PHN2Zy8+" };

function mount(over: Partial<React.ComponentProps<typeof StockSourceModal>> = {}) {
  const props: React.ComponentProps<typeof StockSourceModal> = {
    open: true,
    onClose: vi.fn(),
    photos: [],
    videos: [],
    icons: [],
    loading: { img: false, vid: false, ico: false, fnt: false },
    searchQuery: "",
    searchFailed: null,
    onSearch: vi.fn(),
    onLoadMore: vi.fn(),
    onSave: vi.fn(() => Promise.resolve()),
    ...over,
  };
  const utils = render(<StockSourceModal {...props} />);
  return { ...utils, props };
}

const save = () => screen.getByTestId("stock-save");

describe("Clone 3695:45569 · Assets · Stock assets", () => {
  it("renders nothing when not open", () => {
    const { container } = mount({ open: false });
    expect(container.firstChild).toBeNull();
  });

  it("reads the board's copy: title, the save-not-insert line, a search field, Cancel, Save to library — and no Insert", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Stock assets" })).toBeInTheDocument();
    expect(screen.getByTestId("stock-body")).toHaveTextContent(
      "Browse stock photos and save an image to this site. Your canvas selection stays unchanged.",
    );
    expect(screen.getByTestId("stock-search")).toBeInTheDocument();
    expect(screen.getByTestId("stock-cancel")).toHaveTextContent("Cancel");
    expect(save()).toHaveTextContent("Save to library");
    expect(screen.queryByText(/^Insert/)).toBeNull();
    expect(screen.queryByText("Add from Stock")).toBeNull();
    expect(screen.queryByText("Use")).toBeNull();
  });

  it("keeps the code's sources behind a compact switch — Photos · Videos · Icons — with Photos pressed", () => {
    mount();
    const sw = screen.getByTestId("stock-source-switch");
    const names = within(sw).getAllByRole("button").map((b) => b.textContent?.trim());
    expect(names).toEqual(["Photos", "Videos", "Icons"]);
    expect(within(sw).getByRole("button", { name: "Photos" })).toHaveAttribute("aria-pressed", "true");
    expect(within(sw).getByRole("button", { name: "Videos" })).toHaveAttribute("aria-pressed", "false");
    /* Fonts have no file to save (MediaManager.getFonts is four stub
       families with no previewUrl); the inspector's Font picker is their
       door, which is what the old Use button's toast already said. */
    expect(screen.queryByRole("button", { name: "Fonts" })).toBeNull();
  });

  it("draws no orientation group, colour dots, provider pills or quota strip — none fit under the search on one row", () => {
    mount({ searchQuery: "restaurant interior", photos: [photo()] });
    expect(screen.queryByTitle("Landscape")).toBeNull();
    expect(screen.queryByTitle("Red")).toBeNull();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.queryByTestId("stock-quota-strip")).toBeNull();
    expect(screen.queryByText("Any")).toBeNull();
  });

  it("types into the search and hands the query up", async () => {
    const onSearch = vi.fn();
    mount({ onSearch });
    fireEvent.change(screen.getByRole("textbox", { name: "Search stock" }), { target: { value: "restaurant interior" } });
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith("restaurant interior"));
  });

  it("a result card is image · title · attribution line; ONE selects; Save to library is disabled until then", () => {
    mount({ searchQuery: "restaurant interior", photos: [photo(), photo({ id: "p2", alt: "Terrace at night", author: "B" })] });
    expect(save()).toBeDisabled();
    const card = screen.getByTestId("stock-card-p1");
    expect(within(card).getByRole("img")).toHaveAttribute("src", "https://images.example.com/thumb.jpg");
    expect(within(card).getByTestId("stock-card-title")).toHaveTextContent("Restaurant interior");
    expect(within(card).getByTestId("stock-tile-attribution")).toHaveTextContent("Ansel Adams · Unsplash");
    fireEvent.click(card);
    expect(card).toHaveAttribute("aria-pressed", "true");
    expect(save()).toBeEnabled();
    fireEvent.click(screen.getByTestId("stock-card-p2"));
    expect(screen.getByTestId("stock-card-p2")).toHaveAttribute("aria-pressed", "true");
    expect(card).toHaveAttribute("aria-pressed", "false");
  });

  it("Save to library saves the selected result once, waits on it, and leaves closing to the orchestrator", async () => {
    let finish: () => void = () => {};
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { props } = mount({ searchQuery: "restaurant interior", photos: [photo()], onSave });
    fireEvent.click(screen.getByTestId("stock-card-p1"));
    fireEvent.click(save());
    expect(onSave).toHaveBeenCalledWith("img", expect.objectContaining({ id: "p1" }));
    expect(save()).toBeDisabled();
    expect(save()).toHaveTextContent("Saving…");
    expect(props.onClose).not.toHaveBeenCalled();
    finish();
    await waitFor(() => expect(save()).toHaveTextContent("Save to library"));
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("clicking a result's author link opens the author, not the selection", () => {
    mount({ searchQuery: "restaurant interior", photos: [photo()] });
    const link = screen.getByRole("link", { name: /ansel adams/i });
    expect(link).toHaveAttribute("href", "https://unsplash.com/@ansel");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
    fireEvent.click(link);
    expect(screen.getByTestId("stock-card-p1")).toHaveAttribute("aria-pressed", "false");
    expect(save()).toBeDisabled();
  });

  // §19 (Phase 10 Task 59) — the contributor credit survives the redraw: a
  // photo with no author page is credited as plain text, never a dead link.
  it("credits a result with no author page as text, not a link", () => {
    mount({ searchQuery: "restaurant interior", photos: [photo({ authorUrl: "" })] });
    expect(screen.queryByRole("link", { name: /ansel adams/i })).toBeNull();
    expect(screen.getByTestId("stock-tile-attribution")).toHaveTextContent("Ansel Adams · Unsplash");
  });

  it("Videos: the switch shows the video results with the same card shape, and Save hands up `vid`", () => {
    const onSave = vi.fn(() => Promise.resolve());
    mount({ searchQuery: "kitchen", videos: [video()], onSave });
    fireEvent.click(screen.getByRole("button", { name: "Videos" }));
    const card = screen.getByTestId("stock-card-v1");
    expect(within(card).getByTestId("stock-tile-attribution")).toHaveTextContent("Filmmaker · Pexels");
    fireEvent.click(card);
    fireEvent.click(save());
    expect(onSave).toHaveBeenCalledWith("vid", expect.objectContaining({ id: "v1" }));
  });

  it("Icons: the stubs are cards too, Save hands up `ico`, and Browse full icon library stays the door to the picker", () => {
    const onSave = vi.fn(() => Promise.resolve());
    const onOpenIconPicker = vi.fn();
    mount({ icons: [icon], onSave, onOpenIconPicker });
    fireEvent.click(screen.getByRole("button", { name: "Icons" }));
    const card = screen.getByTestId("stock-card-ico_1");
    expect(within(card).getByTestId("stock-card-title")).toHaveTextContent("User");
    fireEvent.click(card);
    fireEvent.click(save());
    expect(onSave).toHaveBeenCalledWith("ico", expect.objectContaining({ id: "ico_1" }));
    fireEvent.click(screen.getByTestId("stock-browse-icons"));
    expect(onOpenIconPicker).toHaveBeenCalledTimes(1);
  });

  it("switching the source drops the selection — the primary cannot save a photo from the Videos view", () => {
    mount({ searchQuery: "kitchen", photos: [photo()], videos: [video()] });
    fireEvent.click(screen.getByTestId("stock-card-p1"));
    expect(save()).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Videos" }));
    expect(save()).toBeDisabled();
  });

  it("Load more sits under the results and asks for the active source's next page", () => {
    const onLoadMore = vi.fn();
    mount({ searchQuery: "restaurant interior", photos: [photo()], onLoadMore });
    fireEvent.click(screen.getByTestId("stock-load-more"));
    expect(onLoadMore).toHaveBeenCalledWith("img");
  });

  // Audit A06 — every overlay opened from the library cancels back to it
  // with nothing changed.
  it("Cancel closes and saves nothing", () => {
    const { props } = mount({ searchQuery: "restaurant interior", photos: [photo()] });
    fireEvent.click(screen.getByTestId("stock-card-p1"));
    fireEvent.click(screen.getByTestId("stock-cancel"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSave).not.toHaveBeenCalled();
  });
});

/**
 * The empty state is the product's only voice here. Before 2026-09-07 a
 * deployment with no UNSPLASH_ACCESS_KEY told every user "No photos found for
 * 'x'" — a sentence about their query, describing our configuration. These
 * pin the three failures apart from each other and from a real empty result.
 * The Clone keeps all four as REFERENCE VARIANTs (3397:18935 / 18533 / 18581
 * / 18655), so the copy is unchanged.
 */
describe("StockSourceModal — a failure never poses as an empty result", () => {
  it("says it is searching while a search runs", () => {
    mount({ searchQuery: "cats", loading: { img: true, vid: false, ico: false, fnt: false } });
    expect(screen.getByTestId("stock-loading")).toHaveTextContent("Searching...");
  });

  it("says nothing matched when the search genuinely returned nothing", () => {
    mount({ searchQuery: "asdfgh", searchFailed: null });
    expect(screen.getByText(/No photos found for/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("names the missing configuration instead of blaming the query", () => {
    mount({ searchQuery: "cats", searchFailed: "not-configured" });
    expect(screen.getByRole("alert").textContent).toMatch(/not set up|isn't configured|not configured/i);
    expect(screen.queryByText(/No photos found for/i)).toBeNull();
  });

  it("distinguishes a rejected key from an unconfigured one", () => {
    mount({ searchQuery: "cats", searchFailed: "unauthorized" });
    expect(screen.getByRole("alert").textContent).toMatch(/key/i);
  });

  it("offers Try again only for a failure retrying can fix", () => {
    const onSearch = vi.fn();
    const retryable = mount({ searchQuery: "cats", searchFailed: "request-failed", onSearch });
    fireEvent.click(retryable.getByText("Try again"));
    expect(onSearch).toHaveBeenCalledWith("cats");
    retryable.unmount();

    // Retrying cannot conjure an API key — offering the button would be a lie.
    const unconfigured = mount({ searchQuery: "cats", searchFailed: "not-configured" });
    expect(unconfigured.queryByText("Try again")).toBeNull();
  });

  it("the three failure messages are all different from one another", () => {
    const texts = (["not-configured", "unauthorized", "request-failed"] as const).map((reason) => {
      const { unmount } = mount({ searchQuery: "cats", searchFailed: reason });
      const text = screen.getByRole("alert").textContent ?? "";
      unmount();
      return text;
    });
    expect(new Set(texts).size).toBe(3);
  });
});
