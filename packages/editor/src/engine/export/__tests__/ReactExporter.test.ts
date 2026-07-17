/**
 * ReactExporter Tests
 * TDD anchor + comprehensive coverage
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { ReactExporter } from "../ReactExporter";
import type { Composer } from "../../Composer";
import type { ElementData, PageData } from "../../../shared/types";

function makeTestComposer(pages: PageData[]): Composer {
  return {
    elements: {
      getAllPages: () => pages,
    },
  } as unknown as Composer;
}

function makeElement(data: Partial<ElementData> & { id: string; type: string }): ElementData {
  return {
    id: data.id,
    type: data.type,
    tagName: data.tagName,
    attributes: data.attributes ?? {},
    classes: data.classes ?? [],
    styles: data.styles ?? {},
    breakpointStyles: data.breakpointStyles,
    content: data.content ?? "",
    children: data.children ?? [],
    traits: data.traits ?? [],
    draggable: data.draggable ?? true,
    droppable: data.droppable ?? true,
    resizable: data.resizable ?? true,
    locked: data.locked ?? false,
    data: data.data ?? {},
  };
}

describe("ReactExporter", () => {
  it("exports a single div with red background", () => {
    const composer = makeTestComposer([
      {
        id: "page-1",
        name: "Home",
        root: makeElement({
          id: "el-1",
          type: "container",
          tagName: "div",
          styles: { "background-color": "red" },
        }),
      },
    ]);

    const exporter = new ReactExporter(composer);
    const result = exporter.export();

    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(4);

    const files = result.files!;
    const homeTsx = files.find((f) => f.name === "components/Home.tsx")!;
    expect(homeTsx.content).toContain('className={styles.container_el-1}');

    const homeCss = files.find((f) => f.name === "components/Home.module.css")!;
    expect(homeCss.content).toContain("background-color: red");

    const indexTsx = files.find((f) => f.name === "index.tsx")!;
    expect(indexTsx.content).toContain('export { Home }');
  });

  it("exports nested children correctly", () => {
    const composer = makeTestComposer([
      {
        id: "page-1",
        name: "About",
        root: makeElement({
          id: "el-1",
          type: "container",
          children: [
            makeElement({ id: "el-2", type: "heading", content: "Hello", styles: { color: "blue" }, children: [] }),
            makeElement({ id: "el-3", type: "paragraph", content: "World", children: [] }),
          ],
        }),
      },
    ]);

    const exporter = new ReactExporter(composer);
    const result = exporter.export();

    const aboutTsx = result.files!.find((f) => f.name === "components/About.tsx")!;
    expect(aboutTsx.content).toContain('<h2');
    expect(aboutTsx.content).toContain('Hello');
    expect(aboutTsx.content).toContain('<p');
    expect(aboutTsx.content).toContain('World');
  });

  it("respects an explicit heading tagName (h1) instead of the type default (h2)", () => {
    const composer = makeTestComposer([
      {
        id: "page-1",
        name: "About",
        root: makeElement({
          id: "el-1",
          type: "container",
          children: [
            makeElement({ id: "el-2", type: "heading", tagName: "h1", content: "Title", children: [] }),
          ],
        }),
      },
    ]);

    const exporter = new ReactExporter(composer);
    const result = exporter.export();

    const aboutTsx = result.files!.find((f) => f.name === "components/About.tsx")!;
    expect(aboutTsx.content).toContain("<h1");
    expect(aboutTsx.content).not.toContain("<h2");
  });

  it("handles self-closing tags", () => {
    const composer = makeTestComposer([
      {
        id: "page-1",
        name: "Gallery",
        root: makeElement({
          id: "el-1",
          type: "container",
          children: [
            makeElement({ id: "el-2", type: "image", attributes: { src: "photo.jpg", alt: "A photo" }, children: [] }),
            makeElement({ id: "el-3", type: "input", attributes: { type: "text", placeholder: "Name" }, children: [] }),
          ],
        }),
      },
    ]);

    const exporter = new ReactExporter(composer);
    const result = exporter.export();

    const galleryTsx = result.files!.find((f) => f.name === "components/Gallery.tsx")!;
    expect(galleryTsx.content).toContain('<img src="photo.jpg" alt="A photo" />');
    expect(galleryTsx.content).toContain('<input type="text" placeholder="Name" />');
  });

  it("maps HTML attributes to JSX names", () => {
    const composer = makeTestComposer([
      {
        id: "page-1",
        name: "Form",
        root: makeElement({
          id: "el-1",
          type: "form",
          attributes: {
            class: "my-form",
            for: "email",
            tabindex: "0",
            readonly: "true",
            maxlength: "100",
            autocomplete: "off",
          },
          children: [],
        }),
      },
    ]);

    const exporter = new ReactExporter(composer);
    const result = exporter.export();

    const formTsx = result.files!.find((f) => f.name === "components/Form.tsx")!;
    expect(formTsx.content).toContain('className="my-form"');
    expect(formTsx.content).toContain('htmlFor="email"');
    expect(formTsx.content).toContain('tabIndex="0"');
    expect(formTsx.content).toContain('readOnly="true"');
    expect(formTsx.content).toContain('maxLength="100"');
    expect(formTsx.content).toContain('autoComplete="off"');
  });

  it("strips editor-internal data-buildrick-* attributes", () => {
    const composer = makeTestComposer([
      {
        id: "page-1",
        name: "Clean",
        root: makeElement({
          id: "el-1",
          type: "container",
          attributes: {
            "data-buildrick-id": "el-1",
            "data-buildrick-selected": "true",
            "data-custom": "keep-me",
          },
          children: [],
        }),
      },
    ]);

    const exporter = new ReactExporter(composer);
    const result = exporter.export();

    const cleanTsx = result.files!.find((f) => f.name === "components/Clean.tsx")!;
    expect(cleanTsx.content).not.toContain("data-buildrick-id");
    expect(cleanTsx.content).not.toContain("data-buildrick-selected");
    expect(cleanTsx.content).toContain('data-custom="keep-me"');
  });

  it("exports multiple pages as separate components", () => {
    const composer = makeTestComposer([
      { id: "page-1", name: "Home", root: makeElement({ id: "el-1", type: "container", children: [] }) },
      { id: "page-2", name: "About Us", root: makeElement({ id: "el-2", type: "container", children: [] }) },
    ]);

    const exporter = new ReactExporter(composer);
    const result = exporter.export();

    expect(result.files!.some((f) => f.name === "components/Home.tsx")).toBe(true);
    expect(result.files!.some((f) => f.name === "components/AboutUs.tsx")).toBe(true);

    const indexTsx = result.files!.find((f) => f.name === "index.tsx")!;
    expect(indexTsx.content).toContain('export { Home }');
    expect(indexTsx.content).toContain('export { AboutUs }');
  });

  it("handles empty page root", () => {
    const composer = makeTestComposer([
      { id: "page-1", name: "Empty", root: makeElement({ id: "el-1", type: "container", children: [] }) },
    ]);

    const exporter = new ReactExporter(composer);
    const result = exporter.export();

    const emptyTsx = result.files!.find((f) => f.name === "components/Empty.tsx")!;
    expect(emptyTsx.content).toContain("<div></div>");
  });

  it("generates media queries for breakpoint styles", () => {
    const composer = makeTestComposer([
      {
        id: "page-1",
        name: "Responsive",
        root: makeElement({
          id: "el-1",
          type: "container",
          styles: { "background-color": "red" },
          breakpointStyles: {
            tablet: { "background-color": "blue" },
            mobile: { "background-color": "green" },
          },
        }),
      },
    ]);

    const exporter = new ReactExporter(composer);
    const result = exporter.export();

    const css = result.files!.find((f) => f.name === "components/Responsive.module.css")!;
    expect(css.content).toContain("background-color: red");
    expect(css.content).toContain("@media");
    expect(css.content).toContain("background-color: blue");
    expect(css.content).toContain("background-color: green");
  });

  it("sanitizes page names to valid PascalCase component names", () => {
    const composer = makeTestComposer([
      { id: "page-1", name: "contact-page_v2!", root: makeElement({ id: "el-1", type: "container", children: [] }) },
    ]);

    const exporter = new ReactExporter(composer);
    const result = exporter.export();

    expect(result.files!.some((f) => f.name === "components/ContactPageV2.tsx")).toBe(true);
  });

  it("returns success: false when composer has no pages", () => {
    const composer = makeTestComposer([]);
    const exporter = new ReactExporter(composer);
    const result = exporter.export();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// Extension coverage (2026-07): zip bundling, scaffold files, naming
// fallbacks, escaping, and the duplicate-page-name pin.
describe("ReactExporter — zip bundle, scaffold, naming fallbacks (extension)", () => {
  it("exportZip bundles all exported files into a zip blob", async () => {
    const composer = makeTestComposer([
      {
        id: "page-1",
        name: "Home",
        root: makeElement({ id: "el-1", type: "container", styles: { color: "red" } }),
      },
    ]);

    const blob = await new ReactExporter(composer).exportZip();
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());

    expect(zip.file("components/Home.tsx")).toBeTruthy();
    expect(zip.file("components/Home.module.css")).toBeTruthy();
    expect(zip.file("index.tsx")).toBeTruthy();
    expect(zip.file("package.json")).toBeTruthy();

    const tsx = await zip.file("components/Home.tsx")!.async("string");
    expect(tsx).toContain("export const Home: React.FC");
  });

  it("exportZip rejects when there is nothing to export", async () => {
    const exporter = new ReactExporter(makeTestComposer([]));

    await expect(exporter.exportZip()).rejects.toThrow("No pages to export");
  });

  it("generates a minimal package.json scaffold with React 18 dependencies", () => {
    const composer = makeTestComposer([
      { id: "page-1", name: "Home", root: makeElement({ id: "el-1", type: "container" }) },
    ]);

    const result = new ReactExporter(composer).export();
    const pkgFile = result.files!.find((f) => f.name === "package.json")!;
    const pkg = JSON.parse(pkgFile.content);

    expect(pkg.name).toBe("buildrik-export");
    expect(pkg.private).toBe(true);
    expect(pkg.dependencies.react).toBe("^18.3.0");
    expect(pkg.dependencies["react-dom"]).toBe("^18.3.0");
    expect(pkg.devDependencies.typescript).toBeDefined();
    expect(pkgFile.mimeType).toBe("application/json");
  });

  it("emits no CSS module (and no styles import) for a fully unstyled page", () => {
    const composer = makeTestComposer([
      {
        id: "page-1",
        name: "Plain",
        root: makeElement({
          id: "el-1",
          type: "container",
          children: [makeElement({ id: "el-2", type: "paragraph", content: "Text" })],
        }),
      },
    ]);

    const result = new ReactExporter(composer).export();

    expect(result.files!.map((f) => f.name)).toEqual([
      "components/Plain.tsx",
      "index.tsx",
      "package.json",
    ]);
    const tsx = result.files!.find((f) => f.name === "components/Plain.tsx")!;
    expect(tsx.content).not.toContain("import styles");
  });

  it("falls back to the slug, then 'Page', for the component name", () => {
    const composer = makeTestComposer([
      {
        id: "page-1",
        name: "",
        slug: "pricing-plans",
        root: makeElement({ id: "el-1", type: "container" }),
      },
      { id: "page-2", name: "###", root: makeElement({ id: "el-2", type: "container" }) },
    ]);

    const result = new ReactExporter(composer).export();
    const names = result.files!.map((f) => f.name);

    expect(names).toContain("components/PricingPlans.tsx");
    expect(names).toContain("components/Page.tsx");
  });

  it("escapes HTML-sensitive characters in text content", () => {
    const composer = makeTestComposer([
      {
        id: "page-1",
        name: "Escaped",
        root: makeElement({
          id: "el-1",
          type: "container",
          children: [makeElement({ id: "el-2", type: "paragraph", content: `<b>&"'` })],
        }),
      },
    ]);

    const result = new ReactExporter(composer).export();
    const tsx = result.files!.find((f) => f.name === "components/Escaped.tsx")!;

    expect(tsx.content).toContain("&lt;b&gt;&amp;&quot;&#39;");
    expect(tsx.content).not.toContain("<b>");
  });

  it("de-dupes colliding component names so duplicate page names get distinct files + exports", () => {
    const composer = makeTestComposer([
      { id: "page-1", name: "Home", root: makeElement({ id: "el-1", type: "container" }) },
      { id: "page-2", name: "Home", root: makeElement({ id: "el-2", type: "container" }) },
    ]);

    const result = new ReactExporter(composer).export();

    const names = result.files!.map((f) => f.name);
    expect(names).toContain("components/Home.tsx");
    expect(names).toContain("components/Home2.tsx");
    // Only one file at each path — no last-one-wins collision.
    expect(names.filter((n) => n === "components/Home.tsx")).toHaveLength(1);

    const indexTsx = result.files!.find((f) => f.name === "index.tsx")!;
    expect(indexTsx.content).toContain("export { Home }");
    expect(indexTsx.content).toContain("export { Home2 }");
    // The `Home` identifier is re-exported exactly once (valid TypeScript).
    const homeExports = indexTsx.content
      .split("\n")
      .filter((l) => l.includes("export { Home }"));
    expect(homeExports).toHaveLength(1);
  });

  it("suffixes each further collision incrementally (Home, Home2, Home3)", () => {
    const composer = makeTestComposer([
      { id: "page-1", name: "Home", root: makeElement({ id: "el-1", type: "container" }) },
      { id: "page-2", name: "Home", root: makeElement({ id: "el-2", type: "container" }) },
      { id: "page-3", name: "Home", root: makeElement({ id: "el-3", type: "container" }) },
    ]);

    const result = new ReactExporter(composer).export();
    const names = result.files!.map((f) => f.name);

    expect(names).toContain("components/Home.tsx");
    expect(names).toContain("components/Home2.tsx");
    expect(names).toContain("components/Home3.tsx");
    expect(names.filter((n) => n.startsWith("components/Home") && n.endsWith(".tsx"))).toHaveLength(
      3
    );
  });
});
