/**
 * dropSessionMediaUrls — a stored `blob:` is a broken image on every later
 * open (walk 2026-09-24). Known ones are re-pointed, the rest are dropped.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { dropSessionMediaUrls } from "../sanitization";
import type { ElementData } from "../../../types";

const tree = (): ElementData =>
  ({
    id: "r",
    type: "container",
    children: [
      { id: "a", type: "image", tagName: "img", attributes: { src: "blob:http://x/dead", alt: "A" } },
      { id: "b", type: "image", tagName: "img", attributes: { src: "blob:http://x/old" } },
      { id: "c", type: "video", tagName: "video", attributes: { src: "https://cdn/v.mp4", poster: "blob:http://x/p" } },
      { id: "d", type: "container", styles: { "background-image": "url(blob:http://x/bg)", padding: "8px" } },
    ],
  }) as unknown as ElementData;

describe("dropSessionMediaUrls", () => {
  it("re-points a remapped blob, drops the rest, keeps real URLs and other fields", () => {
    const t = tree();
    const dropped = dropSessionMediaUrls(t, { "blob:http://x/old": "blob:http://x/new" });
    const [a, b, c, d] = t.children!;
    expect(a.attributes).toEqual({ alt: "A" });
    expect(b.attributes!.src).toBe("blob:http://x/new");
    expect(c.attributes).toEqual({ src: "https://cdn/v.mp4" });
    expect(d.styles).toEqual({ padding: "8px" });
    expect(dropped).toBe(3);
  });
});
