/**
 * ExportEngine Tests — single-page export() format branches, CSS placement,
 * minify/cssPrefix/page-title config, keyframes, sitemap + SEO fallbacks in
 * exportAllPages, and the ZIP asset-bundling pipeline (fetch stubbed).
 *
 * exportAllPages fresh-tree / interactions / visibility contracts live in
 * ExportEngine.multiPage.regression.test.ts — not duplicated here.
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import JSZip from "jszip";
import { ExportEngine } from "../ExportEngine";
import type { Composer } from "../../Composer";

// ============================================================================
// MOCK HELPERS
// ============================================================================

/** Node shape consumed by the live-element wrapper (single-page export path). */
interface LiveNode {
  id: string;
  type?: string;
  tagName?: string;
  content?: string;
  contentFormat?: "text" | "html";
  attributes?: Record<string, string>;
  styles?: Record<string, string>;
  children?: LiveNode[];
}

interface LiveElement {
  getId: () => string;
  getType: () => string;
  getContent: () => string;
  getAttributes: () => Record<string, string>;
  getStyles: () => Record<string, string>;
  getChildren: () => LiveElement[];
  getData: () => { tagName?: string; contentFormat?: "text" | "html" };
}

function live(node: LiveNode): LiveElement {
  return {
    getId: () => node.id,
    getType: () => node.type ?? "container",
    getContent: () => node.content ?? "",
    getAttributes: () => node.attributes ?? {},
    getStyles: () => node.styles ?? {},
    getChildren: () => (node.children ?? []).map(live),
    // Mirror what the real element exposes. Dropping contentFormat here made
    // the mock disagree with production and hid the export-escaping bug.
    getData: () => ({ tagName: node.tagName, contentFormat: node.contentFormat }),
  };
}

interface ComposerOptions {
  root?: LiveNode;
  pages?: unknown[];
  settings?: Record<string, unknown>;
}

function makeComposer({ root, pages, settings }: ComposerOptions = {}): Composer {
  return {
    elements: {
      getActivePage: () => (root ? { root: { id: root.id } } : undefined),
      getElement: (id: string) => (root && id === root.id ? live(root) : undefined),
      getAllPages: () => pages ?? [],
      exportPages: pages ? () => pages : undefined,
    },
    styles: { generateResponsiveCSS: vi.fn().mockReturnValue("") },
    getProjectSettings: () => settings,
  } as unknown as Composer;
}

const simpleRoot: LiveNode = {
  id: "root",
  type: "container",
  styles: { backgroundColor: "red" },
  children: [{ id: "head1", type: "heading", content: "Hi" }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

// ============================================================================
// export() FORMAT BRANCHES
// ============================================================================

describe("ExportEngine.export — format branches", () => {
  it("html format returns html + css + stats with the default embedded style", async () => {
    const engine = new ExportEngine(makeComposer({ root: simpleRoot }));

    const result = await engine.export();

    expect(result.success).toBe(true);
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("<title>Buildrick Export</title>"); // default page-title fallback
    expect(result.html).toContain("<style>");
    expect(result.html).toContain(".buildrick-root");
    expect(result.css).toContain("box-sizing:border-box"); // reset css included by default
    expect(result.css).toContain(".buildrick-root");
    expect(result.stats?.elementCount).toBe(2);
    expect(result.stats?.cssRuleCount).toBeGreaterThan(0);
    expect(result.stats?.htmlSize).toBeGreaterThan(0);
    expect(result.files).toBeUndefined();
  });

  it("zip format with external css returns index.html + styles.css files", async () => {
    const engine = new ExportEngine(makeComposer({ root: simpleRoot }));

    const result = await engine.export({ format: "zip", cssStyle: "external" });

    expect(result.success).toBe(true);
    expect(result.files?.map((f) => f.name)).toEqual(["index.html", "styles.css"]);
    expect(result.files?.[0].mimeType).toBe("text/html");
    expect(result.files?.[1].mimeType).toBe("text/css");
  });

  it("zip format with embedded css omits styles.css from the file list", async () => {
    const engine = new ExportEngine(makeComposer({ root: simpleRoot }));

    const result = await engine.export({ format: "zip", cssStyle: "embedded" });

    expect(result.files?.map((f) => f.name)).toEqual(["index.html"]);
  });

  it("react format delegates to ReactExporter and returns component files", async () => {
    const pages = [
      {
        id: "p1",
        name: "Home",
        root: { id: "el-1", type: "container", styles: { color: "red" }, children: [] },
      },
    ];
    const engine = new ExportEngine(makeComposer({ pages }));

    const result = await engine.export({ format: "react" });

    expect(result.success).toBe(true);
    const names = result.files?.map((f) => f.name) ?? [];
    expect(names).toContain("components/Home.tsx");
    expect(names).toContain("package.json");
    expect(result.html).toBeUndefined();
  });

  it("returns success:false with the error message when generation throws", async () => {
    const composer = {
      elements: {
        getActivePage: () => {
          throw new Error("boom");
        },
      },
    } as unknown as Composer;

    const result = await new ExportEngine(composer).export();

    expect(result).toEqual({ success: false, error: "boom" });
  });
});

// ============================================================================
// generateHTML — CSS PLACEMENT / PREFIX / MINIFY / TITLES
// ============================================================================

describe("ExportEngine.generateHTML — css placement", () => {
  it("inline: styles land in a style attribute, with no <style> block and no <link>", () => {
    const engine = new ExportEngine(makeComposer({ root: simpleRoot }), { cssStyle: "inline" });

    const html = engine.generateHTML();

    expect(html).toContain('style="background-color:red"');
    expect(html).not.toContain("<style>");
    expect(html).not.toContain("<link rel=");
  });

  it("embedded: styles land in a head <style> block, not on the elements", () => {
    const engine = new ExportEngine(makeComposer({ root: simpleRoot }), { cssStyle: "embedded" });

    const html = engine.generateHTML();

    expect(html).toContain("<style>");
    expect(html).toContain(".buildrick-root");
    expect(html).not.toContain('style="');
    expect(html).not.toContain("<link rel=");
  });

  it("external: head links styles.css and emits neither inline styles nor a <style> block", () => {
    const engine = new ExportEngine(makeComposer({ root: simpleRoot }), { cssStyle: "external" });

    const html = engine.generateHTML();

    expect(html).toContain('<link rel="stylesheet" href="styles.css">');
    expect(html).not.toContain("<style>");
    expect(html).not.toContain('style="');
  });

  it("wraps an empty document when there is no active page", () => {
    const engine = new ExportEngine(makeComposer());

    const html = engine.generateHTML();

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toMatch(/<body>\s*<\/body>/);
  });
});

describe("ExportEngine.generateHTML — config knobs", () => {
  it("applies a custom cssPrefix to classes and CSS selectors", () => {
    const engine = new ExportEngine(makeComposer({ root: simpleRoot }), { cssPrefix: "acme-" });

    expect(engine.generateHTML()).toContain('class="acme-root"');
    expect(engine.generateCSS()).toContain(".acme-root");
  });

  it("minify strips newlines from the HTML and whitespace from the CSS", () => {
    const engine = new ExportEngine(makeComposer({ root: simpleRoot }), {
      minify: true,
      includeResetCSS: false,
    });

    const html = engine.generateHTML({ cssStyle: "external" });
    expect(html).not.toContain("\n");
    expect(html).toContain("<title>Buildrick Export</title>");

    const css = engine.generateCSS();
    expect(css).toContain(".buildrick-root{background-color:red;}");
  });

  it("escapes the page title and meta description", () => {
    const engine = new ExportEngine(makeComposer({ root: simpleRoot }), {
      pageTitle: 'A "B" <C>',
      metaDescription: "Say <hi>",
    });

    const html = engine.generateHTML();

    expect(html).toContain("<title>A &quot;B&quot; &lt;C&gt;</title>");
    expect(html).toContain('<meta name="description" content="Say &lt;hi&gt;">');
  });

  it("omits the <title> tag entirely when pageTitle is explicitly empty", () => {
    const engine = new ExportEngine(makeComposer({ root: simpleRoot }), { pageTitle: "" });

    expect(engine.generateHTML()).not.toContain("<title>");
  });

  it("prefers the element's explicit tagName over the type→tag map", () => {
    const root: LiveNode = {
      id: "root",
      children: [
        { id: "h1", type: "heading", tagName: "h4", content: "Custom" },
        { id: "h2", type: "heading", content: "Default" },
      ],
    };
    const html = new ExportEngine(makeComposer({ root })).generateHTML();

    expect(html).toContain("<h4");
    expect(html).toContain(">Custom</h4>");
    expect(html).toContain(">Default</h2>");
  });

  /* This asserted `data-custom` was DROPPED, which pinned a five-name whitelist
     — alt, href, src, target, id — in the writer behind the HTML and ZIP
     exports. The multi-page writer that publish uses has always emitted every
     attribute, so the two disagreed and the download was the lossy one.
     Attributes are vetted by the sanitizer at import (DEFAULT_ALLOWED_ATTRS,
     no on* handlers), so there is nothing here for a whitelist to add. */
  /* Publish (renderPageElement) has always emitted every attribute; this
     writer emitted five. Same project, two exports, different HTML. */
  it("keeps rel / title / data- / aria- on a link, like the publish writer does", () => {
    const attrs = {
      href: "https://example.com",
      rel: "noopener noreferrer",
      title: "Read more",
      target: "_blank",
      "data-analytics": "cta",
      "aria-label": "Read more about pricing",
    };
    const root: LiveNode = {
      id: "root",
      children: [{ id: "a1", type: "link", tagName: "a", attributes: attrs, content: "Go" }],
    };
    const html = new ExportEngine(makeComposer({ root })).generateHTML();

    for (const [k, v] of Object.entries(attrs)) {
      expect(html, `${k} missing from the single-page export`).toContain(`${k}="${v}"`);
    }
  });

  it("renders self-closing tags with every attribute, escaped", () => {
    const root: LiveNode = {
      id: "root",
      children: [
        {
          id: "img1",
          type: "image",
          attributes: {
            src: "https://x.test/a.png?w=1&h=2",
            alt: 'A "photo"',
            "data-custom": "dropped",
          },
        },
      ],
    };
    const html = new ExportEngine(makeComposer({ root })).generateHTML();

    expect(html).toMatch(/<img [^>]*\/>/);
    expect(html).toContain('src="https://x.test/a.png?w=1&amp;h=2"');
    expect(html).toContain('alt="A &quot;photo&quot;"');
    expect(html).toContain('data-custom="dropped"');
  });

  it("injects the project's global custom CSS in a trailing <style> block", () => {
    const engine = new ExportEngine(
      makeComposer({
        root: simpleRoot,
        settings: { customCode: { globalCss: ".hero{color:pink}" } },
      })
    );

    expect(engine.generateHTML()).toContain(".hero{color:pink}");
  });

  // Text content stays escaped. This is the safe default and the reason the
  // escape exists: a user who types markup must not get markup on their site.
  it("escapes plain text content verbatim", () => {
    const root: LiveNode = {
      id: "root",
      children: [{ id: "t1", type: "text", content: '<b>bold</b> & "quotes"' }],
    };
    const html = new ExportEngine(makeComposer({ root })).generateHTML();

    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt; &amp; &quot;quotes&quot;");
    expect(html).not.toContain("<b>bold</b>");
  });

  // Regression: every AI-generated site published as visible angle brackets.
  // The AI worker stores a whole generated section as markup in `content` and
  // the canvas mounts it un-escaped, but export escaped it like plain text.
  // A test that asserted the escaped output pinned the bug in place and passed.
  it("emits contentFormat:html content as markup, not escaped text", () => {
    const root: LiveNode = {
      id: "root",
      children: [
        { id: "s1", type: "container", contentFormat: "html", content: "<h1>Hero</h1><p>Copy</p>" },
      ],
    };
    const html = new ExportEngine(makeComposer({ root })).generateHTML();

    expect(html).toContain("<h1>Hero</h1>");
    expect(html).not.toContain("&lt;h1&gt;");
  });

  // Emitting it as markup is not the same as trusting it. Model output is
  // untrusted input; the export path sanitizes before it emits.
  it("sanitizes contentFormat:html content before emitting it", () => {
    const root: LiveNode = {
      id: "root",
      children: [
        {
          id: "s2",
          type: "container",
          contentFormat: "html",
          content: '<p>ok</p><script>alert(1)</script><img src=x onerror="alert(2)">',
        },
      ],
    };
    const html = new ExportEngine(makeComposer({ root })).generateHTML();

    expect(html).toContain("<p>ok</p>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("onerror");
  });

  // Regression: template & AI page seeds store raw HTML in a container's
  // `content` WITHOUT stamping contentFormat:"html", so export escaped it and
  // the published site showed literal `&lt;h1&gt;`. Tag-shaped content on a
  // container with no explicit format is treated as markup (sanitized), the same
  // way the canvas mounts it — while hand-authored text elements stay escaped.
  it("renders raw-HTML content that omits contentFormat (template/AI seed shape)", async () => {
    const root: LiveNode = {
      id: "root",
      children: [{ id: "sec1", type: "container", tagName: "section", content: "<h1>Hi</h1>" }],
    };
    const result = await new ExportEngine(makeComposer({ root })).export({
      format: "zip",
      cssStyle: "embedded",
    });
    const html = result.files!.find((f) => f.name === "index.html")!.content;

    expect(html).toContain("<h1>Hi</h1>");
    expect(html).not.toContain("&lt;h1&gt;");
  });
});

describe("ExportEngine.generateCSS — reset & keyframes", () => {
  it("omits the reset when includeResetCSS is false", () => {
    const engine = new ExportEngine(makeComposer({ root: simpleRoot }), {
      includeResetCSS: false,
    });

    expect(engine.generateCSS()).not.toContain("box-sizing");
  });

  it("emits @keyframes only for bd-anim-* animations the styles actually use", () => {
    const root: LiveNode = {
      id: "root",
      styles: { animation: "bd-anim-fadeIn 1s ease" },
    };
    const css = new ExportEngine(makeComposer({ root })).generateCSS();

    expect(css).toContain("@keyframes bd-anim-fadeIn");
    expect(css).not.toContain("@keyframes bd-anim-zoomIn");
  });

  it("emits no keyframes for animation-free designs", () => {
    const css = new ExportEngine(makeComposer({ root: simpleRoot })).generateCSS();

    expect(css).not.toContain("@keyframes");
  });
});

// ============================================================================
// exportAllPages — SITEMAP / SEO TITLE FALLBACKS / FORMAT QUIRK
// ============================================================================

function page(name: string, opts: Record<string, unknown> = {}) {
  return {
    id: `p-${name || "blank"}`,
    name,
    slug: name.toLowerCase() || undefined,
    isHome: false,
    root: { id: `root-${name || "blank"}`, type: "container", tagName: "div", children: [] },
    ...opts,
  };
}

describe("ExportEngine.exportAllPages — sitemap & SEO titles", () => {
  it("adds sitemap.xml only when includeSitemap AND baseUrl are provided", async () => {
    const pages = [page("Home", { isHome: true })];

    const withSitemap = await new ExportEngine(makeComposer({ pages })).exportAllPages({
      format: "html",
      includeSitemap: true,
      baseUrl: "https://example.com",
    });
    const sitemap = withSitemap.files.find((f) => f.name === "sitemap.xml");
    expect(sitemap).toBeDefined();
    expect(sitemap!.type).toBe("xml");
    expect(sitemap!.content).toContain("<urlset");
    expect(sitemap!.content).toContain("https://example.com");

    const noBaseUrl = await new ExportEngine(makeComposer({ pages })).exportAllPages({
      format: "html",
      includeSitemap: true,
    });
    expect(noBaseUrl.files.some((f) => f.name === "sitemap.xml")).toBe(false);
  });

  it("falls back through metaTitle → settings.title → page.name → 'Untitled' for the <title>", async () => {
    const pages = [
      page("Home", { isHome: true }),
      page("About", { settings: { title: "Custom About" } }),
      page("Pricing", { settings: { title: "Ignored", seo: { metaTitle: "SEO Pricing" } } }),
      page("", { slug: "blank" }),
    ];
    const result = await new ExportEngine(makeComposer({ pages })).exportAllPages({
      format: "html",
    });

    const byName = (n: string) => result.files.find((f) => f.name === n)!.content;
    expect(byName("index.html")).toContain("<title>Home</title>");
    expect(byName("about.html")).toContain("<title>Custom About</title>");
    expect(byName("pricing.html")).toContain("<title>SEO Pricing</title>");
    expect(byName("blank.html")).toContain("<title>Untitled</title>");
  });

  it("injects the project's global custom CSS after the stylesheet link on every page", async () => {
    const pages = [page("Home", { isHome: true })];
    const composer = makeComposer({
      pages,
      settings: { customCode: { globalCss: ".hero{color:pink}" } },
    });

    const result = await new ExportEngine(composer).exportAllPages({ format: "html" });
    const html = result.files.find((f) => f.name === "index.html")!.content;

    expect(html).toContain(".hero{color:pink}");
  });

  it("honors options.format 'react' — delegates to ReactExporter and emits .tsx components, not .html", async () => {
    const pages = [page("Home", { isHome: true })];
    const result = await new ExportEngine(makeComposer({ pages })).exportAllPages({
      format: "react",
    });

    expect(result.files.some((f) => f.name === "components/Home.tsx")).toBe(true);
    expect(result.files.some((f) => f.name.endsWith(".tsx"))).toBe(true);
    expect(result.files.some((f) => f.name === "index.html")).toBe(false);
  });

  it("throws a clear not-implemented error for the vue format", async () => {
    const pages = [page("Home", { isHome: true })];
    await expect(
      new ExportEngine(makeComposer({ pages })).exportAllPages({ format: "vue" })
    ).rejects.toThrow(/not implemented/i);
  });
});

// ============================================================================
// generateZip — ASSET BUNDLING PIPELINE
// ============================================================================

describe("ExportEngine.generateZip", () => {
  async function unzip(blob: Blob) {
    return JSZip.loadAsync(await blob.arrayBuffer());
  }

  it("bundles a fetched image into assets/ and rewrites the HTML src", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: { get: () => "image/png" },
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const root: LiveNode = {
      id: "root",
      children: [
        { id: "img1", type: "image", attributes: { src: "https://cdn.example.com/pic.png" } },
      ],
    };
    const blob = await new ExportEngine(makeComposer({ root })).generateZip();
    const zip = await unzip(blob);

    expect(fetchMock).toHaveBeenCalledWith("https://cdn.example.com/pic.png", { mode: "cors" });
    expect(zip.file("index.html")).toBeTruthy();
    expect(zip.file("styles.css")).toBeTruthy();
    expect(zip.file("assets/asset-1.png")).toBeTruthy();

    const html = await zip.file("index.html")!.async("string");
    expect(html).toContain('src="assets/asset-1.png"');
    expect(html).not.toContain("cdn.example.com");
  });

  it("produces just index.html + styles.css when there are no assets", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const blob = await new ExportEngine(makeComposer({ root: simpleRoot })).generateZip();
    const zip = await unzip(blob);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(Object.keys(zip.files).sort()).toEqual(["index.html", "styles.css"]);
  });
});
