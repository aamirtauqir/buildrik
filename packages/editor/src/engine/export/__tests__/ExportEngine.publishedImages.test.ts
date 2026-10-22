/**
 * REA audit 2026-10-20 #23 (R4 P1-5): published images.
 *
 * - An Image block with no file chosen published as `<img alt="Image">` with
 *   no `src` — a broken image for every visitor (seen twice in a real
 *   snapshot). It is left out of the shipped page instead; the pre-publish
 *   "Images" check already names it.
 * - No image carried `width`/`height` or `loading`. The media library knows
 *   each asset's intrinsic size, so an image from it ships with both (no
 *   layout shift), and every image after the page's first is lazy-loaded.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import JSZip from "jszip";
import { Composer } from "@/engine/Composer";
import { ExportEngine } from "../ExportEngine";
import type { MediaAsset } from "@/shared/types/media";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
});

const HERO = "https://cdn.example.com/hero.jpg?w=1&amp=2";

function site() {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      {
        id: "home", name: "Home", slug: "", isHome: true,
        root: {
          id: "root", type: "container" as const, tagName: "div",
          children: [
            { id: "hero", type: "image" as const, tagName: "img", attributes: { src: HERO, alt: "Hero" }, children: [] },
            { id: "empty", type: "image" as const, tagName: "img", attributes: { alt: "Image" }, children: [] },
            { id: "blank", type: "image" as const, tagName: "img", attributes: { src: "", alt: "Image" }, children: [] },
            { id: "second", type: "image" as const, tagName: "img", attributes: { src: "https://cdn.example.com/b.png", alt: "B" }, children: [] },
            { id: "own", type: "image" as const, tagName: "img",
              attributes: { src: "https://cdn.example.com/c.png", alt: "C", loading: "eager", width: "10" }, children: [] },
          ],
        },
      },
    ],
  } as never);
  vi.spyOn(composer.media, "getAssets").mockReturnValue([
    { src: HERO, width: 1600, height: 900 },
    { src: "https://cdn.example.com/b.png", width: 400, height: 300 },
    { src: "https://cdn.example.com/c.png", width: 800, height: 800 },
  ] as unknown as MediaAsset[]);
  return composer;
}

const imgTags = (html: string) => html.match(/<img\b[^>]*>/g) ?? [];

async function publishedHome(composer: Composer): Promise<string> {
  const { files } = await new ExportEngine(composer).exportAllPages({ format: "html", minify: true, rootAbsoluteHrefs: true });
  return files.find((f) => f.name === "index.html")!.content;
}

describe("published images (#23)", () => {
  it("never ships an <img> without a src", async () => {
    const tags = imgTags(await publishedHome(site()));
    expect(tags).toHaveLength(3);
    for (const tag of tags) expect(tag).toMatch(/\ssrc="[^"]+"/);
  });

  it("gives the first image the default (eager) load and lazy-loads the rest", async () => {
    const [hero, second, own] = imgTags(await publishedHome(site()));
    expect(hero).not.toContain("loading=");
    expect(second).toContain('loading="lazy"');
    // A loading the user set on the element is theirs.
    expect(own).toContain('loading="eager"');
    expect(own).not.toContain('loading="lazy"');
  });

  it("carries the media library's intrinsic width and height", async () => {
    const [hero, second, own] = imgTags(await publishedHome(site()));
    expect(hero).toContain('width="1600"');
    expect(hero).toContain('height="900"');
    expect(second).toContain('width="400"');
    expect(second).toContain('height="300"');
    // A size the user typed on the element is not overwritten or half-filled.
    expect(own).toContain('width="10"');
    expect(own).not.toContain('height="800"');
  });

  it("keeps sized images in proportion when CSS narrows them", async () => {
    // `max-width:100%` shrinks the width; without `height:auto` the height
    // attribute would stand and squash the picture.
    const { files } = await new ExportEngine(site()).exportAllPages({ format: "html", minify: true });
    expect(files.find((f) => f.name === "styles.css")!.content).toMatch(/img\{height:auto\}/);
  });

  it("does the same in the ZIP", async () => {
    const blob = await new ExportEngine(site()).generateZip();
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const tags = imgTags(await zip.file("index.html")!.async("string"));
    expect(tags).toHaveLength(3);
    expect(tags[1]).toContain('loading="lazy"');
  });
});
