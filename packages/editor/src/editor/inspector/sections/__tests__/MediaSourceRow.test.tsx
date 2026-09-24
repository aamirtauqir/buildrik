/**
 * Clone 3724:43815 / 44339 / 3721:45178 — a media element's inspector opens
 * with its SOURCE: `Video source` · `chef-intro.mp4` · [Manage video];
 * `SVG image source` · `logo-mark.svg` · [Manage SVG]; `Image source` ·
 * `team-photo.jpg` · [Choose image]. Manage opens the Asset library with that
 * file selected (edge → 3696:20326 "Selected · chef-intro.mp4"); Choose opens
 * the picker. Before this the source lived four sections down as an
 * "Image URL · Browse" row inside Element Properties.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { MediaSourceRow } from "../MediaSourceRow";

function makeComposer(over: { src?: string; assets?: Array<{ id: string; name: string; mimeType: string; src: string }> } = {}) {
  const el = { getAttribute: (n: string) => (n === "src" ? (over.src ?? "") : undefined) };
  const selectAssets = vi.fn();
  const emit = vi.fn();
  return {
    composer: {
      elements: { getElement: () => el },
      media: { getAssets: () => over.assets ?? [], selectAssets },
      emit,
      on: vi.fn(),
      off: vi.fn(),
    } as never,
    selectAssets,
    emit,
  };
}

const CHEF = { id: "chef", name: "chef-intro", mimeType: "video/mp4", src: "blob:chef" };
const LOGO = { id: "logo", name: "logo-mark", mimeType: "image/svg+xml", src: "blob:logo" };

describe("MediaSourceRow — Clone 3724:43815 / 44339 / 3721:45178", () => {
  /* Owner decision (G2-145, 2026-09-24): "Manage video" picks a video like
     "Choose image" picks an image, so the Video URL row can go. The pick
     writes src AND the <source> child, as the URL row did. */
  it("a video reads 'Video source · chef-intro.mp4 · Manage video'; Manage picks a video and writes src + <source>", () => {
    const setAttribute = vi.fn();
    const sourceSet = vi.fn();
    const onOpenMediaLibrary = vi.fn();
    const { composer } = makeComposer({ src: "blob:chef", assets: [CHEF] });
    const el = (composer as unknown as { elements: { getElement: () => Record<string, unknown> } }).elements.getElement();
    Object.assign(el, {
      setAttribute,
      getChildren: () => [{ getTagName: () => "SOURCE", setAttribute: sourceSet }],
    });
    Object.assign(composer as object, { beginTransaction: vi.fn(), endTransaction: vi.fn() });
    render(<MediaSourceRow composer={composer} selectedElement={{ id: "v1", type: "video" }} onOpenMediaLibrary={onOpenMediaLibrary} />);
    expect(screen.getByTestId("inspector-source-label")).toHaveTextContent("Video source");
    expect(screen.getByTestId("inspector-source-name")).toHaveTextContent("chef-intro.mp4");
    fireEvent.click(screen.getByRole("button", { name: "Manage video" }));
    expect(onOpenMediaLibrary).toHaveBeenCalledWith(["video"], expect.any(Function));
    const pick = onOpenMediaLibrary.mock.calls[0][1] as (a: { src: string }) => void;
    pick({ src: "blob:new" });
    expect(setAttribute).toHaveBeenCalledWith("src", "blob:new");
    expect(sourceSet).toHaveBeenCalledWith("src", "blob:new");
  });

  it("an SVG reads 'SVG image source · logo-mark.svg · Manage SVG'", () => {
    const { composer } = makeComposer({ src: "blob:logo", assets: [LOGO] });
    render(<MediaSourceRow composer={composer} selectedElement={{ id: "s1", type: "svg" }} />);
    expect(screen.getByTestId("inspector-source-label")).toHaveTextContent("SVG image source");
    expect(screen.getByTestId("inspector-source-name")).toHaveTextContent("logo-mark.svg");
    expect(screen.getByRole("button", { name: "Manage SVG" })).toBeInTheDocument();
  });

  it("an image reads 'Image source' and Choose image opens the picker for the element's src", () => {
    const onOpenMediaLibrary = vi.fn();
    const { composer } = makeComposer({ src: "https://cdn/team-photo.jpg" });
    render(
      <MediaSourceRow composer={composer} selectedElement={{ id: "i1", type: "image" }} onOpenMediaLibrary={onOpenMediaLibrary} />,
    );
    expect(screen.getByTestId("inspector-source-label")).toHaveTextContent("Image source");
    // Not in the library — the URL's own file name.
    expect(screen.getByTestId("inspector-source-name")).toHaveTextContent("team-photo.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Choose image" }));
    expect(onOpenMediaLibrary).toHaveBeenCalledWith(["image"], expect.any(Function));
  });

  it("an empty source says so and still offers the door", () => {
    const { composer } = makeComposer({ src: "" });
    render(<MediaSourceRow composer={composer} selectedElement={{ id: "v2", type: "video" }} />);
    expect(screen.getByTestId("inspector-source-name")).toHaveTextContent("No source yet");
    expect(screen.getByRole("button", { name: "Manage video" })).toBeInTheDocument();
  });

  it("renders nothing for a non-media element", () => {
    const { composer } = makeComposer();
    const { container } = render(<MediaSourceRow composer={composer} selectedElement={{ id: "h1", type: "heading" }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
