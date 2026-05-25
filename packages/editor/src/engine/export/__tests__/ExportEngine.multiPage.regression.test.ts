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

  // Sprint 5 prep: Iter 19's fix only verified single-page (Home) end-to-end.
  // Multi-page sites are common — landing + about + pricing + ... each needs
  // its own element content in the deployed HTML. This locks the contract
  // that every page in the project gets its fresh-tree treatment, not just
  // the active one.
  it("multi-page: every non-Home page also gets fresh-tree content", async () => {
    const aboutPage = {
      id: "p2",
      name: "About",
      slug: "about",
      isHome: false,
      root: {
        id: "root2",
        type: "container",
        tagName: "div",
        children: [
          { id: "h-about", type: "heading", tagName: "h1", content: "About Us", children: [] },
        ],
      },
    };
    const pricingPage = {
      id: "p3",
      name: "Pricing",
      slug: "pricing",
      isHome: false,
      root: {
        id: "root3",
        type: "container",
        tagName: "div",
        children: [
          { id: "p-section", type: "section", tagName: "section", children: [
            { id: "p-h", type: "heading", tagName: "h2", content: "Plans", children: [] },
            { id: "p-btn", type: "button", tagName: "button", content: "Buy", children: [] },
          ] },
        ],
      },
    };
    const composer = makeMockComposer({
      exportPagesReturn: [freshPage, aboutPage, pricingPage],
    });

    const engine = new ExportEngine(composer);
    const result = await engine.exportAllPages({ format: "html", minify: false });

    // 3 HTML files emitted, one per page
    const htmlFiles = result.files.filter((f) => f.type === "html");
    expect(htmlFiles).toHaveLength(3);

    // Each file under expected name: home → index.html, slugged otherwise
    const index = htmlFiles.find((f) => f.name === "index.html");
    const about = htmlFiles.find((f) => f.name === "about.html");
    const pricing = htmlFiles.find((f) => f.name === "pricing.html");
    expect(index, "missing index.html").toBeDefined();
    expect(about, "missing about.html").toBeDefined();
    expect(pricing, "missing pricing.html").toBeDefined();

    // Each page's user content lands in its own body
    expect(index!.content).toContain("<h2>Hello</h2>");
    expect(about!.content).toContain("<h1>About Us</h1>");
    expect(pricing!.content).toContain("<h2>Plans</h2>");
    expect(pricing!.content).toContain("<button>Buy</button>");
    expect(pricing!.content).toContain("<section>");

    // None of the pages should leak into another (no cross-contamination)
    expect(index!.content).not.toContain("About Us");
    expect(about!.content).not.toContain("Hello");
    expect(pricing!.content).not.toContain("About Us");
  });
});
