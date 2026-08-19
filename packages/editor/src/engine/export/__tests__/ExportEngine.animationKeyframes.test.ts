/**
 * An element's animation is `animation: bd-anim-fadeIn …` in its styles, and
 * the keyframes live in the editor's own CSS, which no exported page loads.
 * `generateCSS` has emitted the used blocks since that was found — for the
 * single file. The publish path never did, so an animation worked in a
 * downloaded ZIP and silently did nothing on the live site.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function animated(styles: Record<string, string>) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{ id: "p", name: "Home", slug: "", isHome: true,
      root: { id: "root", type: "container" as const, tagName: "div",
        children: [{ id: "a1", type: "paragraph" as const, tagName: "p", content: "hi", styles, children: [] }] } }],
  } as never);
  return composer;
}

const publishedCss = async (composer: Composer) =>
  (await new ExportEngine(composer).exportAllPages({ format: "html" })).files
    .find((f) => f.name === "styles.css")?.content ?? "";

describe("a published animation has its keyframes", () => {
  it("ships the block the page references", async () => {
    const css = await publishedCss(animated({ animation: "bd-anim-fadeIn 600ms ease both" }));
    expect(css).toContain("@keyframes bd-anim-fadeIn");
  });

  it("ships only what is referenced", async () => {
    const css = await publishedCss(animated({ animation: "bd-anim-fadeIn 600ms ease both" }));
    expect(css).not.toContain("@keyframes bd-anim-bounceIn");
  });

  it("ships nothing for a page that animates nothing", async () => {
    const css = await publishedCss(animated({ color: "red" }));
    expect(css).not.toContain("@keyframes");
  });

  it("agrees with the single file, which has always had them", async () => {
    const composer = animated({ animation: "bd-anim-fadeIn 600ms ease both" });
    expect(new ExportEngine(composer).generateCSS()).toContain("@keyframes bd-anim-fadeIn");
    expect(await publishedCss(composer)).toContain("@keyframes bd-anim-fadeIn");
  });
});
