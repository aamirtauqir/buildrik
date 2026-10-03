// @vitest-environment jsdom
/**
 * Q2 migration check: saved projects hold elements stored as `container`.
 *
 * `__fixtures__/legacyContainerTypes.project.json` is a real save produced by
 * the pre-Q2 code: every catalog block the fix re-types, inserted from the
 * registry and exported with `exportProject()`. `legacyContainerTypes.export.json`
 * is what that project rendered on the canvas and published as, captured
 * from the same pre-Q2 code.
 *
 * Loading it now must (1) upgrade an element's type ONLY where its stored
 * markup proves what it is, and (2) render and publish byte-for-byte what it
 * did before.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { ExportEngine } from "@/engine/export/ExportEngine";
import type { ElementData, ProjectData } from "@/shared/types";
import { refineElementTypes } from "../refineElementTypes";
import legacyProject from "./__fixtures__/legacyContainerTypes.project.json";
import legacyExport from "./__fixtures__/legacyContainerTypes.export.json";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

const fresh = (): ProjectData => JSON.parse(JSON.stringify(legacyProject)) as ProjectData;

function load() {
  const composer = createTestComposer();
  composer.importProject(fresh());
  const page = composer.elements.getAllPages()[0];
  const root = composer.elements.getElement(page.root.id)!;
  return { composer, root };
}

async function published(composer: ReturnType<typeof createTestComposer>): Promise<string> {
  const res = await new ExportEngine(composer).exportAllPages({ format: "html", minify: false });
  return res.files
    .filter((f) => /\.(html|css)$/.test(f.name))
    .map((f) => `/* ${f.name} */\n${f.name.endsWith(".html") ? f.content.slice(f.content.indexOf("<body")) : f.content}`)
    .join("\n");
}

/** Top-level blocks of the fixture page, in insert order. */
const ORDER = [
  "checkbox", "radio", "switch", "label", "card", "spacer", "lottie", "video-embed", "map-embed",
  "social-icons", "stack", "tabs", "table", "list", "navbar", "cta", "select", "video", "audio", "svg",
];

describe("the legacy fixture is what it claims to be", () => {
  it("stores the re-typed blocks as generic containers", () => {
    const kids = (fresh().pages[0].root as ElementData).children ?? [];
    expect(kids).toHaveLength(ORDER.length);
    const at = (id: string) => kids[ORDER.indexOf(id)];
    for (const id of ["checkbox", "radio", "switch", "label", "card", "spacer", "lottie", "video-embed", "map-embed", "social-icons", "stack", "tabs", "table"]) {
      expect(at(id).type, id).toBe("container");
    }
    expect(at("navbar").type).toBe("nav");
    expect(at("cta").type).toBe("section");
  });
});

describe("loading a saved project upgrades only what its markup proves", () => {
  it("re-types the blocks whose stored markup identifies them", () => {
    const kids = load().root.getChildren();
    const typeOf = (id: string) => kids[ORDER.indexOf(id)].getType();
    expect(typeOf("checkbox")).toBe("checkbox"); // <label> wrapping <input type=checkbox>
    expect(typeOf("radio")).toBe("radio"); // <label> wrapping <input type=radio>
    expect(typeOf("switch")).toBe("switch"); // .switch-wrapper around the switch input
    expect(typeOf("label")).toBe("label"); // a bare <label>
    expect(typeOf("lottie")).toBe("lottie"); // .lottie-container[data-lottie-src]
    expect(typeOf("video-embed")).toBe("video-embed"); // .buildrick-video-embed
    expect(typeOf("map-embed")).toBe("map-embed"); // .buildrick-map-embed
    expect(typeOf("social-icons")).toBe("social"); // .buildrick-social-icons
    expect(typeOf("stack")).toBe("stack"); // .stack of .stack-items
    expect(typeOf("tabs")).toBe("tabs"); // .tabs with a tablist
  });

  it("re-types structural children by their tag", () => {
    const kids = load().root.getChildren();
    const list = kids[ORDER.indexOf("list")];
    expect(list.getChildren().map((c) => c.getType())).toEqual(["list-item", "list-item", "list-item"]);
    const wrapper = kids[ORDER.indexOf("table")];
    expect(wrapper.getType()).toBe("container"); // the scroll wrapper is a container
    expect(wrapper.getChildren()[0].getType()).toBe("table");
  });

  it("leaves alone what nothing stored can prove", () => {
    const kids = load().root.getChildren();
    const typeOf = (id: string) => kids[ORDER.indexOf(id)].getType();
    // A card and a spacer are a styled div; navbar and CTA are a plain <nav>/<section>.
    expect(typeOf("card")).toBe("container");
    expect(typeOf("spacer")).toBe("container");
    expect(typeOf("navbar")).toBe("nav");
    expect(typeOf("cta")).toBe("section");
    // <option>, <source>, <circle>, table rows and cells have no type of their own.
    const select = kids[ORDER.indexOf("select")];
    expect(select.getChildren().map((c) => c.getType())).toEqual(["container", "container"]);
  });

  it("renders on the canvas exactly as before", () => {
    const { root } = load();
    expect(root.toHTML()).toBe(legacyExport.canvas);
  });

  it("publishes exactly as before", async () => {
    const { composer } = load();
    expect(await published(composer)).toBe(legacyExport.publish);
  });

  it("is stable across a save/load round trip", async () => {
    const { composer } = load();
    const again = createTestComposer();
    again.importProject(JSON.parse(JSON.stringify(composer.exportProject())));
    const page = again.elements.getAllPages()[0];
    expect(again.elements.getElement(page.root.id)!.toHTML()).toBe(legacyExport.canvas);
    expect(await published(again)).toBe(legacyExport.publish);
  });
});

describe("refineElementTypes", () => {
  const el = (over: Partial<ElementData>): ElementData => ({ id: "x", type: "container", ...over });

  it("is idempotent and never touches a type that is already specific", () => {
    const tree = el({ tagName: "div", classes: ["buildrick-video-embed"] });
    refineElementTypes(tree);
    refineElementTypes(tree);
    expect(tree.type).toBe("video-embed");

    const heading = el({ type: "heading", tagName: "label" });
    refineElementTypes(heading);
    expect(heading.type).toBe("heading");
  });

  it("does not take a class name alone as proof", () => {
    const div = el({ tagName: "div", classes: ["stack"] });
    refineElementTypes(div);
    expect(div.type).toBe("container"); // a Stack is .stack AND its .stack-item children
  });

  it("recognises a checkbox wrapper typed `label` by the parser, too", () => {
    const wrapper = el({
      type: "label",
      tagName: "label",
      children: [el({ id: "i", type: "input", tagName: "input", attributes: { type: "checkbox" } })],
    });
    refineElementTypes(wrapper);
    expect(wrapper.type).toBe("checkbox");
  });
});
