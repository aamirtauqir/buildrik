// @vitest-environment jsdom
/**
 * The Carousel (Slider block, type `slider`) exports its slides.
 *
 * `TYPE_TO_TAG_MAP` mapped `slider` to "input" — a leftover of treating
 * "slider" as the range control, which the catalog has always inserted as an
 * `input[type=range]` instead. The block is a `<div class="buildrick-slider">`,
 * its stored tag "div" defers to the type's tag, and the carousel therefore
 * came out as a void `<input class="buildrick-slider" />`: no slides on the
 * canvas, and a published `<input type="range">` where the carousel should be.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { insertBlock, getBlockById } from "@/blocks/blockRegistry";
import type { ProjectData } from "@/shared/types";
import { ExportEngine } from "../ExportEngine";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

async function publishedBody(composer: ReturnType<typeof createTestComposer>): Promise<string> {
  const res = await new ExportEngine(composer).exportAllPages({ format: "html", minify: false });
  const html = res.files.find((f) => f.name === "index.html")!.content;
  return html.slice(html.indexOf("<body"), html.indexOf("</body>"));
}

function insertCarousel() {
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const id = insertBlock(composer, getBlockById("slider")!, page.root.id)!;
  return { composer, slider: composer.elements.getElement(id)! };
}

describe("Carousel export", () => {
  it("renders on the canvas as a container holding its slides", () => {
    const { slider } = insertCarousel();
    const html = slider.toHTML();
    expect(html.startsWith('<div class="buildrick-slider"')).toBe(true);
    expect(html).not.toContain("<input");
    expect(html.match(/class="buildrick-slide"/g)).toHaveLength(2);
    expect(html).toContain("Slide One");
    expect(html).toContain("Slide Two");
  });

  it("publishes as a container holding its slides, not a range control", async () => {
    const { composer } = insertCarousel();
    const body = await publishedBody(composer);
    expect(body).not.toContain("<input");
    expect(body).not.toContain('type="range"');
    expect(body).toMatch(/<div [^>]*buildrick-slider"/);
    expect(body.match(/buildrick-slide"/g)).toHaveLength(2);
    expect(body).toContain("Slide One");
    expect(body).toContain("Slide Two");
  });

  it("heals a carousel already saved (type slider, stored div)", async () => {
    const { composer } = insertCarousel();
    const saved = JSON.parse(JSON.stringify(composer.exportProject())) as ProjectData;
    const reloaded = createTestComposer();
    reloaded.importProject(saved);
    const body = await publishedBody(reloaded);
    expect(body).not.toContain("<input");
    expect(body.match(/buildrick-slide"/g)).toHaveLength(2);
  });

  it("leaves the form Slider (a range input) a range input", async () => {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    insertBlock(composer, getBlockById("range")!, page.root.id);
    expect(await publishedBody(composer)).toMatch(/<input [^>]*type="range"/);
  });
});
