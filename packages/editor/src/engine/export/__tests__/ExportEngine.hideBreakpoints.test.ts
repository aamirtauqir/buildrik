/**
 * The inspector's Visibility toggles write `--hide-<bp>: true` onto an element.
 * That is an inert custom property in a browser: something has to turn it into
 * a media query. The publish path does. The single HTML file wrote the property
 * into the stylesheet and stopped, so an element hidden on mobile shipped
 * visible on mobile.
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

function composerHiding(styles: Record<string, string>) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{
      id: "p", name: "Home", slug: "", isHome: true,
      root: { id: "root", type: "container" as const, tagName: "div",
        children: [{ id: "secret", type: "paragraph" as const, tagName: "p", content: "hi", styles, children: [] }] },
    }],
  } as never);
  return composer;
}

describe("per-breakpoint hide survives the single-file export", () => {
  it("emits the mobile media query", () => {
    const css = new ExportEngine(composerHiding({ "--hide-mobile": "true" })).generateCSS();
    expect(css).toContain("@media (max-width:767px){.buildrick-secret{display:none!important}}");
  });

  it("emits tablet and desktop from the same map the publish path uses", () => {
    const css = new ExportEngine(
      composerHiding({ "--hide-tablet": "true", "--hide-desktop": "true" })
    ).generateCSS();
    expect(css).toContain("(min-width:768px) and (max-width:1023px)");
    expect(css).toContain("(min-width:1024px)");
  });

  it("says nothing for an element that is hidden nowhere", () => {
    const css = new ExportEngine(composerHiding({ color: "red" })).generateCSS();
    expect(css).not.toContain("display:none!important");
  });

  it("the publish path still emits them too", async () => {
    const { files } = await new ExportEngine(composerHiding({ "--hide-mobile": "true" }))
      .exportAllPages({ format: "html" });
    const css = files.find((f) => f.name === "styles.css")?.content ?? "";
    expect(css).toContain("display:none!important");
  });
});
