// @vitest-environment jsdom
/**
 * Video / Map embeds render an <iframe> — on the canvas (`toHTML`), in the
 * single-file export and on the published page — built from the attributes
 * the type block writes (board 9, Q5). The src only ever comes from
 * parseEmbedUrl's allowlist; with no valid URL the element keeps its
 * placeholder.
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
import { ExportEngine } from "../ExportEngine";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function insert(blockId: string, attrs: Record<string, string>) {
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const id = insertBlock(composer, getBlockById(blockId)!, page.root.id)!;
  const el = composer.elements.getElement(id)!;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return { composer, el };
}

async function publishedBody(composer: ReturnType<typeof createTestComposer>): Promise<string> {
  const res = await new ExportEngine(composer).exportAllPages({ format: "html", minify: false });
  const html = res.files.find((f) => f.name === "index.html")!.content;
  return html.slice(html.indexOf("<body"), html.indexOf("</body>"));
}

const iframeOf = (html: string) => html.match(/<iframe [^>]*><\/iframe>/)?.[0] ?? null;

/** The frame's attributes as a browser reads them — writers differ in entity spelling only. */
function frameAttrs(html: string): Record<string, string> | null {
  const frame = new DOMParser().parseFromString(html, "text/html").querySelector("iframe");
  return frame ? Object.fromEntries(Array.from(frame.attributes, (a) => [a.name, a.value])) : null;
}

describe("video embed", () => {
  const attrs = {
    "data-embed-url": "https://youtu.be/aqz-KE-bpKQ",
    "data-embed-ratio": "4:3",
    "data-embed-autoplay": "true",
    "data-embed-muted": "true",
  };

  it("canvas, single-file export and published page carry the same frame (snapshot)", async () => {
    const { composer, el } = insert("video-embed", attrs);
    const canvasHtml = composer.elements.toHTML();
    const single = new ExportEngine(composer).generateHTML({ minify: false });
    const published = await publishedBody(composer);
    const frame = iframeOf(canvasHtml);
    expect(frame).toMatchInlineSnapshot(
      `"<iframe data-bk-embed src="https:&#47;&#47;www.youtube-nocookie.com&#47;embed&#47;aqz-KE-bpKQ?autoplay=1&amp;mute=1&amp;playsinline=1" title="YouTube video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="display:block;width:100%;aspect-ratio:4/3;border:0"></iframe>"`,
    );
    expect(frameAttrs(single)).toEqual(frameAttrs(canvasHtml));
    expect(frameAttrs(published)).toEqual(frameAttrs(canvasHtml));
    expect(frameAttrs(published)?.src).toBe(
      "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?autoplay=1&mute=1&playsinline=1",
    );
    /* The frame replaces the placeholder, it does not sit beside it. */
    expect(published).not.toContain("Paste YouTube or Vimeo URL");
    expect(el.getChildren().length).toBeGreaterThan(0);
  });

  it("survives a save and reload through the import sanitizer", async () => {
    const { composer } = insert("video-embed", attrs);
    const reloaded = createTestComposer();
    reloaded.importProject(JSON.parse(JSON.stringify(composer.exportProject())));
    expect(frameAttrs(await publishedBody(reloaded))?.src).toContain("youtube-nocookie.com/embed/aqz-KE-bpKQ");
  });

  it("with no URL keeps its placeholder and renders no frame", async () => {
    const { composer } = insert("video-embed", {});
    expect(iframeOf(composer.elements.toHTML())).toBeNull();
    const published = await publishedBody(composer);
    expect(published).not.toContain("<iframe");
    expect(published).toContain("Paste YouTube or Vimeo URL");
  });

  it.each(["javascript:alert(1)", "https://evil.example/v.mp4", "data:text/html,<script>alert(1)</script>"])(
    "a refused URL (%s) never reaches an iframe",
    async (url) => {
      const { composer } = insert("video-embed", { "data-embed-url": url });
      expect(composer.elements.toHTML()).not.toContain("<iframe");
      expect(await publishedBody(composer)).not.toContain("<iframe");
    },
  );
});

describe("map embed", () => {
  it("an address renders a Google Maps frame filling the element", async () => {
    const { composer } = insert("map-embed", { "data-embed-url": "Via Roma 1, Turin" });
    const frame = frameAttrs(await publishedBody(composer));
    expect(frame?.src).toBe("https://www.google.com/maps?q=Via+Roma+1%2C+Turin&output=embed");
    expect(frame?.title).toBe("Map");
    expect(frame?.style).toContain("height:100%");
    expect(frame).not.toHaveProperty("allowfullscreen");
  });
});
