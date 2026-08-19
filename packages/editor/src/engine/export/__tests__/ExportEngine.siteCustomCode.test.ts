/**
 * Settings → Custom code says "Custom code runs on all pages". It ran on none.
 *
 * Walked it: typed into Head Scripts, watched the dirty chip go 1 → 0 on Save,
 * reloaded and the value came back — so it stores. Nothing read it. Not this
 * export, and not the publish worker, which selects the site's icons, SEO,
 * badge and workspace-app scripts and never its head code. Only `globalCss`
 * from that same screen was ever injected.
 *
 * The per-page head field had the identical bug — "the 'runs on every page
 * load' banner was a lie" is still in SEOInjector's comment — and was fixed
 * for pages only.
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

function composerWithCustomCode(customCode: Record<string, string>) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{ id: "p", name: "Home", slug: "", isHome: true,
      root: { id: "root", type: "container" as const, tagName: "div", children: [] } }],
  } as never);
  composer.setProjectSettings({ ...composer.getProjectSettings(), customCode } as never);
  return composer;
}

const SRC = '<script src="https://plausible.io/js/script.js"></script>';

describe("the site's custom code reaches the page", () => {
  it("puts head scripts in the head of the single file", () => {
    const html = new ExportEngine(composerWithCustomCode({ headScripts: SRC })).generateHTML();
    expect(html.slice(0, html.indexOf("</head>"))).toContain("plausible.io/js/script.js");
  });

  it("puts body scripts at the end of the body", () => {
    const html = new ExportEngine(composerWithCustomCode({ bodyScripts: SRC })).generateHTML();
    const body = html.slice(html.indexOf("<body>"));
    expect(body).toContain("plausible.io/js/script.js");
    expect(body.indexOf("plausible")).toBeLessThan(body.indexOf("</body>"));
  });

  it("puts them on every published page too", async () => {
    const { files } = await new ExportEngine(
      composerWithCustomCode({ headScripts: SRC, bodyScripts: SRC })
    ).exportAllPages({ format: "html" });
    const page = files.find((f) => f.name === "index.html")?.content ?? "";
    expect(page.slice(0, page.indexOf("</head>"))).toContain("plausible");
    expect(page.slice(page.indexOf("<body>"))).toContain("plausible");
  });

  it("does not let an inline script through — same allowlist as the page field", () => {
    const html = new ExportEngine(
      composerWithCustomCode({ headScripts: "<script>steal()</script>" })
    ).generateHTML();
    expect(html).not.toContain("steal()");
  });

  it("stays quiet when the site has no custom code", () => {
    const html = new ExportEngine(composerWithCustomCode({})).generateHTML();
    expect(html).toContain("<body>");
    expect(html).not.toContain("<script src");
  });
});
