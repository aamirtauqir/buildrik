// Regression: V1 walk Iter 19 — exportAllPages was reading the stale
// ctx.pages snapshot via getAllPages(), so click-to-add elements never made
// it into the published HTML. Found by /qa on 2026-05-24.
// Report: packages/editor/src/.gstack/qa-reports/qa-report-buildrik-2026-05-24.md

import { describe, it, expect, vi } from "vitest";
import { ExportEngine } from "../ExportEngine";

const stalePage = {
  id: "p1",
  name: "Home",
  slug: "home",
  isHome: true,
  root: {
    id: "root",
    type: "container",
    tagName: "div",
    children: [],
  },
};

const freshPage = {
  id: "p1",
  name: "Home",
  slug: "home",
  isHome: true,
  root: {
    id: "root",
    type: "container",
    tagName: "div",
    children: [
      { id: "h1", type: "heading", tagName: "h2", content: "Hello", children: [] },
    ],
  },
};

function makeMockComposer({
  exportPagesReturn,
  getAllPagesReturn,
}: {
  exportPagesReturn?: unknown[];
  getAllPagesReturn?: unknown[];
}) {
  return {
    elements: {
      exportPages: exportPagesReturn !== undefined ? vi.fn().mockReturnValue(exportPagesReturn) : undefined,
      getAllPages: vi.fn().mockReturnValue(getAllPagesReturn ?? []),
    },
    styles: {
      generateResponsiveCSS: vi.fn().mockReturnValue(""),
      generateCSS: vi.fn().mockReturnValue(""),
    },
    getProjectSettings: vi.fn().mockReturnValue(undefined),
  } as unknown as ConstructorParameters<typeof ExportEngine>[0];
}

describe("ExportEngine.exportAllPages — live tree contract", () => {
  it("prefers elements.exportPages (fresh Element.toJSON) over getAllPages", async () => {
    const composer = makeMockComposer({
      exportPagesReturn: [freshPage],
      getAllPagesReturn: [stalePage],
    });

    const engine = new ExportEngine(composer);
    const result = await engine.exportAllPages({ format: "html", minify: false });

    expect((composer as any).elements.exportPages).toHaveBeenCalled();
    expect((composer as any).elements.getAllPages).not.toHaveBeenCalled();

    const indexHtml = result.files.find((f) => f.name === "index.html");
    expect(indexHtml, "index.html missing from export").toBeDefined();
    expect(indexHtml!.content).toContain("<h2>Hello</h2>");
  });

  it("falls back to getAllPages when exportPages is not exposed on older composer builds", async () => {
    const composer = makeMockComposer({ getAllPagesReturn: [freshPage] });

    const engine = new ExportEngine(composer);
    const result = await engine.exportAllPages({ format: "html", minify: false });

    expect((composer as any).elements.getAllPages).toHaveBeenCalled();
    const indexHtml = result.files.find((f) => f.name === "index.html");
    expect(indexHtml!.content).toContain("<h2>Hello</h2>");
  });

  it("emits empty <div></div> body when both methods return a stale empty root", async () => {
    const composer = makeMockComposer({
      exportPagesReturn: [stalePage],
      getAllPagesReturn: [stalePage],
    });

    const engine = new ExportEngine(composer);
    const result = await engine.exportAllPages({ format: "html", minify: false });

    const indexHtml = result.files.find((f) => f.name === "index.html");
    expect(indexHtml!.content).toMatch(/<body>\s*<div><\/div>\s*<\/body>/);
  });
});
