/**
 * R4 P0 #5 (REA audit 2026-10-20): the ZIP was a different, more broken site
 * than Publish. The publish worker post-processed every page (accordion
 * runtime, form wiring, robots.txt) and the ZIP got none of it — every
 * accordion panel open, and the contact form, with no action, submitted the
 * visitor's details as a GET query string.
 *
 * Both now run `postProcessPages` (publishPostProcess.ts). These read the
 * archive the "Export code → ZIP" button downloads.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import JSZip from "jszip";
import { Composer } from "@/engine/Composer";
import { ExportEngine } from "../ExportEngine";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
  vi.stubGlobal("fetch", vi.fn());
});

function siteWithFormAndAccordion() {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      {
        id: "home", name: "Home", slug: "", isHome: true,
        root: { id: "r1", type: "container" as const, tagName: "div", children: [
          { id: "f1", type: "form" as const, tagName: "form", children: [
            { id: "i1", type: "input" as const, tagName: "input", attributes: { type: "email", name: "email" }, children: [] },
          ] },
          { id: "acc", type: "container" as const, tagName: "div", attributes: { "data-allow-multiple": "false" }, children: [
            { id: "it1", type: "container" as const, tagName: "div", attributes: { "data-accordion-state": "closed" }, children: [
              { id: "b1", type: "button" as const, tagName: "button", content: "Q1", children: [] },
              { id: "c1", type: "container" as const, tagName: "div", content: "A1", children: [] },
            ] },
          ] },
        ] },
      },
    ],
  } as never);
  return composer;
}

async function unzip(blob: Blob): Promise<Record<string, string>> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const out: Record<string, string> = {};
  for (const name of Object.keys(zip.files)) {
    if (!zip.files[name].dir) out[name] = await zip.files[name].async("string");
  }
  return out;
}

const formTag = (html: string) => new DOMParser().parseFromString(html, "text/html").querySelector("form")!;

describe("the ZIP runs the same page post-processing as Publish", () => {
  it("ships the accordion runtime, so panels start collapsed and toggle", async () => {
    const files = await unzip(await new ExportEngine(siteWithFormAndAccordion()).generateZip());
    expect(files["index.html"]).toContain("data-buildrick-accordion-runtime");
  });

  it("points the form at the same submissions endpoint as Publish when the site is known", async () => {
    const files = await unzip(
      await new ExportEngine(siteWithFormAndAccordion()).generateZip(undefined, null, {
        siteId: "site-1",
        appOrigin: "https://app.example.io/",
      }),
    );
    const form = formTag(files["index.html"]);
    expect(form.getAttribute("action")).toBe("https://app.example.io/api/public/forms/site-1/f1");
    expect(form.getAttribute("method")).toBe("POST");
  });

  it("never lets a form fall back to GET, even with no site to post to", async () => {
    const files = await unzip(await new ExportEngine(siteWithFormAndAccordion()).generateZip());
    const form = formTag(files["index.html"]);
    expect(form.getAttribute("method")).toBe("POST");
    expect(form.method).toBe("post");
  });

  it("carries robots.txt by the publish worker's rule", async () => {
    const files = await unzip(await new ExportEngine(siteWithFormAndAccordion()).generateZip());
    expect(files["robots.txt"]).toBe("User-agent: *\nAllow: /\n");
    const withOrigin = await unzip(
      await new ExportEngine(siteWithFormAndAccordion()).generateZip(undefined, "https://site.example"),
    );
    expect(withOrigin["robots.txt"]).toContain("Sitemap: https://site.example/sitemap.xml");
    expect(withOrigin["sitemap.xml"]).toBeDefined();
  });
});
