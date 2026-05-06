/**
 * ReactExporter Tests
 * TDD anchor + comprehensive coverage
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
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
