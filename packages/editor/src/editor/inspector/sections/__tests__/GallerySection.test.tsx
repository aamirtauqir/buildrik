// @vitest-environment jsdom
/**
 * Content › Images (2L9 B69/04 249:72335): a gallery lists its images,
 * opens the exact one, moves them, adds a picked asset; an image returns.
 * @license BSD-3-Clause
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { getBlockById, insertBlock } from "@/blocks/blockRegistry";
import type { MediaAsset } from "@/shared/types/media";
import { GalleryImageBackSection, GallerySection, galleryList } from "../GallerySection";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

function gallery() {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  c.elements.setActivePage(page.id);
  const elId = insertBlock(c, getBlockById("gallery")!, page.root.id)!;
  c.history.flushPending();
  return { c, elId, list: () => galleryList(c.elements.getElement(elId)!) };
}

describe("Gallery images (B69/04)", () => {
  it("counts the images in the grid and opens the exact one", () => {
    const { c, elId, list } = gallery();
    render(<GallerySection composer={c} elementId={elId} isOpen />);
    expect(screen.getByTestId("gallery-count")).toHaveTextContent("3 image children");
    fireEvent.click(screen.getAllByTestId("gallery-open")[1]);
    expect(c.selection.getSelected()?.getId()).toBe(list().getChildren()[1].getId());
  });

  it("Move down swaps an image with the next, one Undo", () => {
    const { c, elId, list } = gallery();
    const [first, second] = list().getChildren();
    render(<GallerySection composer={c} elementId={elId} isOpen />);
    const steps = c.history.getUndoCount();
    fireEvent.click(screen.getByRole("button", { name: "Move Gallery item 1 down" }));
    c.history.flushPending();
    expect(list().getChildren().map((e) => e.getId()).slice(0, 2)).toEqual([second.getId(), first.getId()]);
    expect(c.history.getUndoCount()).toBe(steps + 1);
    expect(screen.getByRole("button", { name: "Move Gallery item 2 up" })).toBeDisabled();
  });

  it("Choose asset adds an <img> of the picked file at the end", () => {
    const { c, elId, list } = gallery();
    let pick: ((a: MediaAsset) => void) | null = null;
    render(<GallerySection composer={c} elementId={elId} isOpen onOpenMediaLibrary={(types, onSelect) => { expect(types).toEqual(["image"]); pick = onSelect; }} />);
    fireEvent.click(screen.getByTestId("gallery-choose-asset"));
    pick!({ src: "https://x/a.jpg", altText: "Dining room" } as MediaAsset);
    const imgs = list().getChildren();
    expect(imgs).toHaveLength(4);
    expect(imgs[3].getAttribute("src")).toBe("https://x/a.jpg");
    expect(imgs[3].getAttribute("alt")).toBe("Dining room");
  });

  it("an image of the gallery offers Back to the gallery", () => {
    const { c, elId, list } = gallery();
    render(<GalleryImageBackSection composer={c} elementId={list().getChildren()[0].getId()} />);
    fireEvent.click(screen.getByTestId("gallery-back"));
    expect(c.selection.getSelected()?.getId()).toBe(elId);
  });
});
