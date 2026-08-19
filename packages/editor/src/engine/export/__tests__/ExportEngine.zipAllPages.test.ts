/**
 * "Export code → ZIP" handed back one page.
 *
 * `generateZip` built its archive from `generateHTML`, which is the ACTIVE
 * page. Publish has always run `exportAllPages`. So a twelve-page site
 * downloaded as a ZIP was one index.html and eleven pages silently missing,
 * while the same site published complete — verified on a two-page site whose
 * ZIP held index.html + styles.css and whose React export beside it held both.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import JSZip from "jszip";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
  vi.stubGlobal("fetch", vi.fn());
});

function twoPageComposer(aboutSlug: string) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      {
        id: "home", name: "Home", slug: "", isHome: true,
        root: { id: "r1", type: "container" as const, tagName: "div",
          children: [{ id: "h", type: "heading" as const, tagName: "h1", content: "Home", children: [] }] },
      },
      {
        id: "about", name: "About", slug: aboutSlug,
        root: { id: "r2", type: "container" as const, tagName: "div",
          children: [{ id: "p", type: "paragraph" as const, tagName: "p", content: "About us", children: [] }] },
      },
    ],
  } as never);
  return composer;
}

async function names(composer: Composer): Promise<string[]> {
  const blob = await new ExportEngine(composer).generateZip();
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return Object.keys(zip.files).filter((n) => !zip.files[n].dir).sort();
}

describe("the ZIP is the whole site", () => {
  it("carries every page, not just the open one", async () => {
    const files = await names(twoPageComposer("about"));
    expect(files).toContain("index.html");
    expect(files).toContain("about.html");
  });

  it("names a page whose slug is written as a path, not as a directory", async () => {
    // `normalizeSlug` keeps a leading slash and `validateSlug` allows it, so
    // "/about" is a slug a person can actually save — and it produced a ZIP
    // entry literally named "/about.html", plus a leading-slash path in the
    // publish payload.
    const files = await names(twoPageComposer("/about"));
    expect(files).toContain("about.html");
    expect(files).not.toContain("/about.html");
  });

  it("links each page by the same name the archive uses", async () => {
    const blob = await new ExportEngine(twoPageComposer("/about")).generateZip();
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const home = await zip.file("index.html")!.async("string");
    expect(home).not.toContain('href="/about.html"');
  });
});
