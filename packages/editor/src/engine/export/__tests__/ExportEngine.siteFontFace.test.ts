/**
 * An added site font travels with the page it is used on.
 *
 * BLOCKERS C4, export half (Clone 3721:43423 "Fonts round trip"). The picker
 * half shipped first: a font file in the library is registered with the
 * FontManager and the Family picker offers it, so a heading set in "Inter
 * Var" renders it on the canvas — and the export named the family and
 * declared nothing, so the published page fell to the visitor's sans. The
 * Google families get a <link>; an uploaded file has no Google, so the export
 * has to declare the face itself, from the file's server url.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import JSZip from "jszip";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";
import { devWarn } from "../../../shared/utils/devLogger";

vi.mock("../../../shared/utils/devLogger", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../shared/utils/devLogger")>()),
  devWarn: vi.fn(),
}));

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
  // registerLibraryFont decodes the file through FontFace — jsdom has none.
  vi.stubGlobal("FontFace", class {
    constructor(public family: string, public source: string) {}
    load = async () => this;
  });
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { add: () => {}, delete: () => {}, forEach: () => {}, load: () => Promise.resolve([]), ready: Promise.resolve() },
  });
});

beforeEach(() => {
  vi.mocked(devWarn).mockClear();
});

const SERVER_URL = "https://x.public.blob.vercel-storage.com/Inter-Var-abc123.woff2";
const FACE = `@font-face{font-family:"Inter Var";src:url("${SERVER_URL}") format("woff2");font-display:swap}`;

async function site(opts: {
  headingFamily?: string;
  fontUrl?: string;
  tokens?: Array<{ id: string; value: string }>;
} = {}) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      {
        id: "home", name: "Home", slug: "", isHome: true,
        root: {
          id: "root", type: "container" as const, tagName: "div",
          children: [{
            id: "h", type: "heading" as const, tagName: "h1", content: "Hi",
            styles: opts.headingFamily ? { "font-family": opts.headingFamily } : {}, children: [],
          }],
        },
      },
      { id: "about", name: "About", slug: "about",
        root: { id: "r2", type: "container" as const, tagName: "div", children: [] } },
    ],
  } as never);
  if (opts.tokens) {
    composer.setProjectSettings({
      ...composer.getProjectSettings(),
      designTokens: opts.tokens.map((t) => ({
        ...t, name: t.id, cssVar: `--buildrick-design-${t.id}`, category: "typography" as const, type: "string",
      })),
    } as never);
  }
  // The ADDED site font — what `getAllFonts({ source: "custom" })` lists.
  await composer.fonts.registerLibraryFont({ filename: "Inter-Var.woff2", url: opts.fontUrl ?? SERVER_URL });
  return composer;
}

const usesInter = { headingFamily: "'Inter Var', sans-serif" };

describe("the single-file export declares the site font the page uses", () => {
  it("in the embedded <style>, before the rule that uses it", async () => {
    const html = new ExportEngine(await site(usesInter)).generateHTML();
    expect(html).toContain(FACE);
    expect(html.indexOf("@font-face")).toBeLessThan(html.indexOf("font-family: 'Inter Var'"));
  });

  it("in the CSS the external form writes to styles.css", async () => {
    const engine = new ExportEngine(await site(usesInter));
    const css = engine.generateCSS({ cssStyle: "external" });
    expect(css).toContain(FACE);
    expect(css.indexOf("@font-face")).toBeLessThan(css.indexOf("font-family: 'Inter Var'"));
    // …and the page links that file rather than carrying the face twice.
    const html = engine.generateHTML({ cssStyle: "external" });
    expect(html).toContain('<link rel="stylesheet" href="styles.css">');
    expect(html).not.toContain("@font-face");
  });

  it("survives minification", async () => {
    const css = new ExportEngine(await site(usesInter)).generateCSS({ minify: true });
    expect(css).toContain(FACE);
  });

  it("when only the site's own font token names it", async () => {
    const html = new ExportEngine(
      await site({ tokens: [{ id: "font-heading", value: "Inter Var" }] })
    ).generateHTML();
    expect(html).toContain(FACE);
  });

  it("not for a site font the page never uses", async () => {
    const html = new ExportEngine(await site({ headingFamily: "Georgia, serif" })).generateHTML();
    expect(html).not.toContain("@font-face");
    expect(devWarn).not.toHaveBeenCalled();
  });
});

describe("the head declares the site's own faces before it asks Google for the rest", () => {
  const google = { headingFamily: "'Inter Var', sans-serif" };
  const withPoppins = async () => {
    const composer = await site(google);
    composer.setProjectSettings({
      ...composer.getProjectSettings(),
      designTokens: [{ id: "font-body", name: "font-body", value: "Poppins",
        cssVar: "--buildrick-design-font-body", category: "typography", type: "string" }],
    } as never);
    return composer;
  };

  it("embedded: the @font-face precedes the Google <link>s", async () => {
    const html = new ExportEngine(await withPoppins()).generateHTML();
    expect(html).toContain("family=Poppins");
    expect(html).toContain(FACE);
    expect(html.indexOf("@font-face")).toBeLessThan(html.indexOf("fonts.googleapis.com"));
  });

  it("external: the stylesheet that carries it precedes the Google <link>s", async () => {
    const html = new ExportEngine(await withPoppins()).generateHTML({ cssStyle: "external" });
    expect(html.indexOf('href="styles.css"')).toBeLessThan(html.indexOf("fonts.googleapis.com"));
  });

  it("published: each page links styles.css before the Google <link>s", async () => {
    const { files } = await new ExportEngine(await withPoppins()).exportAllPages({ format: "html" });
    for (const page of files.filter((f) => f.type === "html")) {
      expect(page.content.indexOf('href="styles.css"')).toBeLessThan(page.content.indexOf("fonts.googleapis.com"));
    }
  });
});

describe("the published site (exportAllPages) carries the face once, in styles.css", () => {
  it("at the top of the stylesheet every page links", async () => {
    const { files } = await new ExportEngine(await site(usesInter)).exportAllPages({ format: "html", minify: true });
    const css = files.find((f) => f.name === "styles.css")?.content ?? "";
    expect(css.startsWith(FACE)).toBe(true);
    expect(css.match(/@font-face/g)).toHaveLength(1);
    for (const page of files.filter((f) => f.type === "html")) {
      expect(page.content).toContain('href="styles.css"');
      expect(page.content).not.toContain("@font-face");
    }
  });

  it("finds a use on ANY page, not just the home page", async () => {
    const composer = await site();
    composer.importProject({
      pages: [
        { id: "home", name: "Home", slug: "", isHome: true,
          root: { id: "r1", type: "container" as const, tagName: "div", children: [] } },
        { id: "about", name: "About", slug: "about",
          root: { id: "r2", type: "container" as const, tagName: "div", children: [{
            id: "p", type: "paragraph" as const, tagName: "p", content: "x",
            styles: { "font-family": "'Inter Var', sans-serif" }, children: [] }] } },
      ],
    } as never);
    const { files } = await new ExportEngine(composer).exportAllPages({ format: "html" });
    expect(files.find((f) => f.name === "styles.css")?.content).toContain(FACE);
  });

  it("declares nothing when no page uses the font", async () => {
    const { files } = await new ExportEngine(await site()).exportAllPages({ format: "html" });
    expect(files.find((f) => f.name === "styles.css")?.content ?? "").not.toContain("@font-face");
  });
});

describe("a font that never reached the server", () => {
  it("is skipped, and the export says so the way it reports any asset it cannot ship", async () => {
    const html = new ExportEngine(
      await site({ ...usesInter, fontUrl: "blob:http://localhost:3000/9f1c" })
    ).generateHTML();
    expect(html).not.toContain("@font-face");
    expect(html).not.toContain("blob:");
    expect(devWarn).toHaveBeenCalledWith(
      "ExportEngine",
      expect.stringMatching(/Inter Var.*blob:/),
    );
  });

  it("is skipped on the publish path too", async () => {
    const { files } = await new ExportEngine(
      await site({ ...usesInter, fontUrl: "blob:http://localhost:3000/9f1c" })
    ).exportAllPages({ format: "html" });
    expect(files.find((f) => f.name === "styles.css")?.content ?? "").not.toContain("@font-face");
    expect(devWarn).toHaveBeenCalled();
  });

  /* A page must not NAME a font it never loads: the family is dropped from
     the stacks, which then say what the visitor gets. */
  it("is not named by the page either — the stack falls to what IS loaded", async () => {
    const engine = new ExportEngine(await site({ ...usesInter, fontUrl: "blob:http://localhost:3000/9f1c" }));
    const { files } = await engine.exportAllPages({ format: "html" });
    const css = files.find((f) => f.name === "styles.css")?.content ?? "";
    expect(css).not.toMatch(/Inter Var/i);
    expect(css).toMatch(/\.buildrick-h\s*\{[^}]*font-family:\s*sans-serif/);
    expect(engine.generateHTML()).not.toMatch(/Inter Var/i);
  });
});

/* Found 2026-09-24 on the /share draft preview, which renders the publish
   export: headings came out in the browser's default SERIF. The publish
   stylesheet never carried the reset, so a page with no Brand body font had
   no base family at all, and nothing asked any provider for one. */
describe("the published page always has a loaded base font", () => {
  it("styles.css sets the base body family, and every page's head loads it", async () => {
    const { files } = await new ExportEngine(await site()).exportAllPages({ format: "html" });
    const css = files.find((f) => f.name === "styles.css")?.content ?? "";
    expect(css).toMatch(/body\s*\{[^}]*font-family:\s*Inter,\s*sans-serif/);
    for (const page of files.filter((f) => f.name.endsWith(".html"))) {
      expect(page.content).toContain('href="styles.css"');
      expect(page.content).toMatch(/fonts\.googleapis\.com\/css2\?family=Inter[:&]/);
    }
  });

  it("the Brand body font still wins over the reset, and is the one loaded", async () => {
    const { files } = await new ExportEngine(
      await site({ tokens: [{ id: "font-body", value: "Poppins" }] }),
    ).exportAllPages({ format: "html" });
    const css = files.find((f) => f.name === "styles.css")?.content ?? "";
    expect(css.lastIndexOf("font-family:Poppins")).toBeGreaterThan(css.indexOf("font-family:Inter"));
    const home = files.find((f) => f.name === "index.html")!.content;
    expect(home).toMatch(/family=Poppins/);
  });
});

describe("the ZIP bundles the face's file like any other asset", () => {
  it("fetches the url the @font-face names and rewrites it to the archive's path", async () => {
    const fetched: string[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      fetched.push(url);
      return {
        ok: true,
        headers: { get: () => "font/woff2" },
        arrayBuffer: async () => new Uint8Array([119, 79, 70, 50]).buffer,
      };
    }) as unknown as typeof fetch;
    try {
      const blob = await new ExportEngine(await site(usesInter)).generateZip();
      const zip = await JSZip.loadAsync(await blob.arrayBuffer());
      expect(fetched).toContain(SERVER_URL);
      const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
      expect(names).toContain("assets/asset-1.woff2");
      const css = await zip.file("styles.css")!.async("string");
      expect(css).toContain('src:url("assets/asset-1.woff2") format("woff2")');
      expect(css).not.toContain(SERVER_URL);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
