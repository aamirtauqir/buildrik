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
    expect(indexHtml!.content).toContain(">Hello</h2>");
  });

  // H1: published elements must carry their styling hooks (data-buildrick-id +
  // class + inline base styles). renderPageElement used to emit raw attributes
  // only, so deployed sites rendered structurally but unstyled.
  it("emits data-buildrick-id, class, and inline base styles on published elements (H1)", async () => {
    const styledPage = {
      id: "p1", name: "Home", slug: "home", isHome: true,
      root: {
        id: "root", type: "container", tagName: "div", styles: { backgroundColor: "rgb(1,2,3)" }, classes: ["bd-root"], children: [
          { id: "box", type: "container", tagName: "div", styles: { color: "rgb(9,9,9)", padding: "16px" }, classes: ["card"], children: [] },
        ],
      },
    };
    const composer = makeMockComposer({ exportPagesReturn: [styledPage] });
    const html = (await new ExportEngine(composer).exportAllPages({ format: "html", minify: false }))
      .files.find((f) => f.name === "index.html")!.content;

    expect(html).toContain('data-buildrick-id="root"');
    expect(html).toContain('data-buildrick-id="box"');
    expect(html).toContain('class="bd-root"');
    expect(html).toContain('class="card"');
    // base inline styles carried (stylesToString: no space after colon)
    expect(html).toContain("background-color:rgb(1,2,3)");
    expect(html).toContain("color:rgb(9,9,9)");
    expect(html).toContain("padding:16px");
  });

  it("falls back to getAllPages when exportPages is not exposed on older composer builds", async () => {
    const composer = makeMockComposer({ getAllPagesReturn: [freshPage] });

    const engine = new ExportEngine(composer);
    const result = await engine.exportAllPages({ format: "html", minify: false });

    expect((composer as any).elements.getAllPages).toHaveBeenCalled();
    const indexHtml = result.files.find((f) => f.name === "index.html");
    expect(indexHtml!.content).toContain(">Hello</h2>");
  });

  it("emits empty <div></div> body when both methods return a stale empty root", async () => {
    const composer = makeMockComposer({
      exportPagesReturn: [stalePage],
      getAllPagesReturn: [stalePage],
    });

    const engine = new ExportEngine(composer);
    const result = await engine.exportAllPages({ format: "html", minify: false });

    const indexHtml = result.files.find((f) => f.name === "index.html");
    // H1: even the empty root now carries its data-buildrick-id styling hook.
    expect(indexHtml!.content).toMatch(/<body>\s*<div data-buildrick-id="root"><\/div>\s*<\/body>/);
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
    expect(index!.content).toContain(">Hello</h2>");
    expect(about!.content).toContain(">About Us</h1>");
    expect(pricing!.content).toContain(">Plans</h2>");
    expect(pricing!.content).toContain(">Buy</button>");
    expect(pricing!.content).toContain("<section ");

    // None of the pages should leak into another (no cross-contamination)
    expect(index!.content).not.toContain("About Us");
    expect(about!.content).not.toContain("Hello");
    expect(pricing!.content).not.toContain("About Us");
  });
});

// C2: configured interactions must reach published sites. The editor stores
// interactions on element.data.interactions and runs them via GSAP in the
// canvas, but the published export previously dropped both the attribute and
// any runtime, so interactions silently no-op'd on the live site.
describe("ExportEngine.exportAllPages — interaction export (C2)", () => {
  const interactivePage = {
    id: "p1",
    name: "Home",
    slug: "home",
    isHome: true,
    root: {
      id: "root",
      type: "container",
      tagName: "div",
      children: [
        {
          id: "btn",
          type: "button",
          tagName: "button",
          content: "Hover me",
          children: [],
          data: {
            interactions: [
              {
                id: "i1",
                trigger: "hover",
                enabled: true,
                animation: { preset: "pulse", duration: 300, delay: 0, easing: "easeOut", target: "self" },
              },
            ],
          },
        },
      ],
    },
  };

  it("emits data-buildrick-interactions and injects the runtime when a page uses interactions", async () => {
    const composer = makeMockComposer({ exportPagesReturn: [interactivePage] });
    const engine = new ExportEngine(composer);
    const result = await engine.exportAllPages({ format: "html", minify: false });

    const index = result.files.find((f) => f.name === "index.html")!;
    // Attribute carries the interaction JSON (quotes escaped for the attribute)
    expect(index.content).toContain("data-buildrick-interactions=");
    expect(index.content).toContain("&quot;preset&quot;:&quot;pulse&quot;");
    // Runtime script present, with the WAAPI player and the trigger wiring
    expect(index.content).toContain("<script>");
    expect(index.content).toContain(".animate(");
    expect(index.content).toContain("mouseenter");
  });

  it("does NOT inject the runtime for interaction-free pages (no bloat)", async () => {
    const composer = makeMockComposer({ exportPagesReturn: [freshPage] });
    const engine = new ExportEngine(composer);
    const result = await engine.exportAllPages({ format: "html", minify: false });

    const index = result.files.find((f) => f.name === "index.html")!;
    expect(index.content).not.toContain("data-buildrick-interactions");
    expect(index.content).not.toContain("<script>");
  });
});

// D1 (published half): per-breakpoint hide must reach the live site. The flag
// rides on the element's inline style (--hide-<bp>:true via H1's emission), and
// the export adds @media display:none rules keyed on that inline substring.
describe("ExportEngine.exportAllPages — responsive visibility (D1)", () => {
  it("emits @media display:none rules when an element is hidden on a breakpoint", async () => {
    const page = {
      id: "p1", name: "Home", slug: "home", isHome: true,
      root: { id: "root", type: "container", tagName: "div", children: [
        { id: "promo", type: "container", tagName: "div", styles: { "--hide-mobile": "true" }, classes: [], children: [] },
      ] },
    };
    const html = (await new ExportEngine(makeMockComposer({ exportPagesReturn: [page] }))
      .exportAllPages({ format: "html", minify: false }))
      .files.find((f) => f.name === "index.html")!.content;

    // flag reached the element inline (no space — stylesToString)
    expect(html).toContain("--hide-mobile:true");
    // and a media rule consumes it
    expect(html).toContain("@media (max-width:767px)");
    expect(html).toContain('[style*="--hide-mobile:true"]{display:none!important}');
  });

  it("omits the visibility CSS when no element is hidden", async () => {
    const html = (await new ExportEngine(makeMockComposer({ exportPagesReturn: [freshPage] }))
      .exportAllPages({ format: "html", minify: false }))
      .files.find((f) => f.name === "index.html")!.content;
    expect(html).not.toContain("--hide-");
  });
});
