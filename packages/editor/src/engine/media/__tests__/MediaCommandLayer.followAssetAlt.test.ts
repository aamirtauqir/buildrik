/**
 * L4-014: an asset's alt text was copied into the element at insert time with
 * no link back, so a library alt edit (or AI alt arriving after placement)
 * never reached the placed images. Placements whose alt is still the asset's
 * old one — or empty — follow the asset; one written by hand keeps its own.
 * One undo step; a locked element is left alone.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { MediaCommandLayer } from "../MediaCommandLayer";
import type { Composer } from "../../Composer";

type El = { id: string; src: string; alt?: string; locked?: boolean };

function harness(els: El[]) {
  const state = els.map((e) => ({ ...e }));
  const facade = (e: El) => ({
    getId: () => e.id,
    isLocked: () => !!e.locked,
    getAttribute: (n: string) => (n === "src" ? e.src : n === "alt" ? e.alt : undefined),
    setAttribute: (n: string, v: string) => {
      if (n === "alt") e.alt = v;
    },
    removeAttribute: (n: string) => {
      if (n === "alt") delete e.alt;
    },
  });
  const composer = {
    elements: { findByMediaSrc: (src: string) => state.filter((e) => e.src === src).map(facade) },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
  } as unknown as Composer & { beginTransaction: ReturnType<typeof vi.fn>; endTransaction: ReturnType<typeof vi.fn> };
  return { layer: new MediaCommandLayer(composer), state, composer };
}

describe("MediaCommandLayer.followAssetAlt (L4-014)", () => {
  it("moves placements that carried the old alt, or none, to the new alt", () => {
    const h = harness([
      { id: "a", src: "https://cdn/red.png", alt: "A red square" },
      { id: "b", src: "https://cdn/red.png" },
      { id: "c", src: "https://cdn/red.png", alt: "Hand-written" },
      { id: "d", src: "https://cdn/blue.png", alt: "A red square" },
    ]);
    const n = h.layer.followAssetAlt("https://cdn/red.png", "A red square", "Red brand swatch");
    expect(n).toBe(2);
    expect(h.state.map((e) => e.alt)).toEqual(["Red brand swatch", "Red brand swatch", "Hand-written", "A red square"]);
  });

  it("is one undo step", () => {
    const h = harness([{ id: "a", src: "s", alt: "old" }]);
    h.layer.followAssetAlt("s", "old", "new");
    expect(h.composer.beginTransaction).toHaveBeenCalledTimes(1);
    expect(h.composer.endTransaction).toHaveBeenCalledTimes(1);
  });

  it("leaves a locked element alone", () => {
    const h = harness([{ id: "a", src: "s", alt: "old", locked: true }]);
    expect(h.layer.followAssetAlt("s", "old", "new")).toBe(0);
    expect(h.state[0].alt).toBe("old");
  });

  it("writes nothing and opens no step when nothing follows", () => {
    const h = harness([{ id: "a", src: "s", alt: "Hand-written" }]);
    expect(h.layer.followAssetAlt("s", "old", "new")).toBe(0);
    expect(h.composer.beginTransaction).not.toHaveBeenCalled();
  });
});
