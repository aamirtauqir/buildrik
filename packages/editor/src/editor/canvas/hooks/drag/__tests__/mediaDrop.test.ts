// @vitest-environment jsdom
/**
 * Media dropped on the canvas (audit 2026-10-08, media P0-1). The drop target
 * was handed to insertMediaAt as `targetElementId`, which REPLACES the target's
 * src — and the target is whatever sits under the cursor, falling back to the
 * page root. So a library image dropped on a section wrote `src` onto the
 * section and inserted nothing, while the toast said "applied ✓".
 *
 * Now: dropped on an image (or a background-image element) it replaces — one
 * undo step, the asset's alt replaces the old one, a lock refuses it.
 * Anywhere else it inserts a new image at the drop point, selected, one undo
 * step.
 *
 * A REAL Composer: transactions, selection and the lock gate are the point.
 *
 * @license BSD-3-Clause
 */
import { beforeAll, describe, it, expect, vi } from "vitest";
import { Composer } from "@/engine/Composer";
import { EVENTS } from "@/shared/constants/events";
import { dropMedia, isLibraryAsset } from "../mediaDrop";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

const NEW = "https://cdn.example/new.png";

function load(): Composer {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{
      id: "p", name: "Home", slug: "", isHome: true,
      root: {
        id: "root", type: "container", tagName: "div",
        children: [
          { id: "section", type: "section", tagName: "section", children: [], styles: {} },
          { id: "img", type: "image", tagName: "img", children: [], attributes: { src: "https://cdn.example/old.png", alt: "Old photo" } },
          { id: "hero", type: "section", tagName: "section", children: [], styles: { "background-image": "url(https://cdn.example/bg.png)" } },
        ],
      },
    }],
  } as never);
  composer.history.flushPending();
  return composer;
}

const ids = (c: Composer) => c.elements.getElement("root")!.getChildren().map((el) => el.getId());

describe("dropMedia — elsewhere inserts a new image", () => {
  it("dropped on a section: a new image at the drop point, selected, the section untouched", () => {
    const c = load();
    const out = dropMedia(c, { src: NEW, type: "image", alt: "A cat", targetId: "section", x: 40, y: 60 });
    if (out?.kind !== "added") throw new Error(`expected an insert, got ${JSON.stringify(out)}`);
    const added = c.elements.getElement(out.elementId)!;
    expect(added.getType()).toBe("image");
    expect(added.getAttribute("src")).toBe(NEW);
    expect(added.getAttribute("alt")).toBe("A cat");
    expect(added.getStyle("left")).toBe("40px");
    expect(c.elements.getElement("section")!.getAttribute("src")).toBeFalsy();
    expect(c.selection.getSelected()?.getId()).toBe(out.elementId);
  });

  it("dropped on the page root (empty canvas) inserts too", () => {
    const c = load();
    const out = dropMedia(c, { src: NEW, type: "image", targetId: "root", x: 0, y: 0 });
    expect(out?.kind).toBe("added");
    expect(c.elements.getElement("root")!.getAttribute("src")).toBeFalsy();
    expect(ids(c)).toHaveLength(4);
  });

  it("is one undo step", () => {
    const c = load();
    dropMedia(c, { src: NEW, type: "image", targetId: "section", x: 1, y: 1 });
    c.history.flushPending();
    c.history.undo();
    expect(ids(c)).toEqual(["section", "img", "hero"]);
  });
});

describe("dropMedia — on an image replaces it", () => {
  it("replaces src and the alt, in one undo step", () => {
    const c = load();
    const out = dropMedia(c, { src: NEW, type: "image", alt: "A cat", targetId: "img", x: 1, y: 1 });
    expect(out).toEqual({ kind: "replaced", elementId: "img" });
    const img = c.elements.getElement("img")!;
    expect(img.getAttribute("src")).toBe(NEW);
    expect(img.getAttribute("alt")).toBe("A cat");
    expect(ids(c)).toHaveLength(3);
    c.history.flushPending();
    c.history.undo();
    expect(c.elements.getElement("img")!.getAttribute("src")).toBe("https://cdn.example/old.png");
  });

  it("an asset without alt clears the old image's alt rather than keep a wrong one", () => {
    const c = load();
    dropMedia(c, { src: NEW, type: "image", targetId: "img", x: 1, y: 1 });
    expect(c.elements.getElement("img")!.getAttribute("alt")).toBeFalsy();
  });

  it("swaps a background-image element's url", () => {
    const c = load();
    const out = dropMedia(c, { src: NEW, type: "image", targetId: "hero", x: 1, y: 1 });
    expect(out?.kind).toBe("replaced");
    expect(c.elements.getElement("hero")!.getStyle("background-image")).toContain(NEW);
  });

  it("refuses a locked image with the locked signal and changes nothing", () => {
    const c = load();
    c.elements.getElement("img")!.setLocked(true);
    const skipped = vi.fn();
    c.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, skipped);
    const out = dropMedia(c, { src: NEW, type: "image", targetId: "img", x: 1, y: 1 });
    expect(out).toEqual({ kind: "locked" });
    expect(c.elements.getElement("img")!.getAttribute("src")).toBe("https://cdn.example/old.png");
    expect(ids(c)).toHaveLength(3);
    expect(skipped).toHaveBeenCalledTimes(1);
  });
});

describe("isLibraryAsset", () => {
  it("is true for a src the library already holds, so a drop does not upload it again", () => {
    const c = load();
    vi.spyOn(c.media, "getAssets").mockReturnValue([{ src: NEW } as never]);
    expect(isLibraryAsset(c, NEW)).toBe(true);
    expect(isLibraryAsset(c, "https://images.pexels.com/x.jpg")).toBe(false);
  });
});
