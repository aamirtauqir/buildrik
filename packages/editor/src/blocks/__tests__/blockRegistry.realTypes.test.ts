// @vitest-environment jsdom
/**
 * Q2 (owner, 2026-09-27): an inserted block keeps its real element type.
 *
 * Walked live, 21 of the 54 Add-panel rows arrived as a type with no profile
 * of its own — Checkbox, Radio, Switch and Label as `container<label>`, Card,
 * Spacer, Stack, Tabs, Table, Social icons, Lottie and both embeds as
 * `container`, Navbar as `nav`, CTA as `section`. The HTML blocks were typed
 * from their TAG, and the `data-buildrick-type` markers two of them carried
 * named types the parser did not accept. Engine, canvas, export and inspector
 * each then read a different answer to "what is this?".
 *
 * The block's declared `elementType` is the one answer: what the insert hands
 * back must be that type, and the catalog's 54 rows are pinned explicitly so a
 * declaration cannot drift back to "container" unnoticed.
 *
 * The type is identity, not markup. Every catalog row must render and publish
 * byte-for-byte what it did before the fix (captured in
 * `__fixtures__/catalogBlockHtml.baseline.json` from the pre-fix code) —
 * except the Carousel, whose old output was the bug (see
 * `sliderExport.test.ts`).
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
import { flatCatalog } from "@/editor/sidebar/tabs/build/catalog/catalog";
import { insertBlock, getBlockById, getBlockDefinitions } from "../blockRegistry";
import baseline from "./__fixtures__/catalogBlockHtml.baseline.json";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

/** Add-panel row (block id) → the type its insert must carry. All 55. */
const EXPECTED_TYPE: Record<string, string> = {
  heading: "heading",
  paragraph: "paragraph",
  link: "link",
  "collection-list": "collection-list",
  list: "list",
  button: "button",
  icon: "icon",
  divider: "divider",
  spacer: "spacer",
  label: "label",
  progress: "progress",
  countdown: "countdown",
  container: "container",
  section: "section",
  grid: "grid",
  columns: "columns",
  flex: "flex",
  stack: "stack",
  card: "card",
  table: "table",
  input: "input",
  textarea: "textarea",
  select: "select",
  checkbox: "checkbox",
  radio: "radio",
  switch: "switch",
  range: "input",
  file: "input",
  submit: "button",
  email: "input",
  password: "input",
  number: "input",
  date: "input",
  time: "input",
  color: "input",
  form: "form",
  image: "image",
  video: "video",
  audio: "audio",
  gallery: "gallery",
  svg: "svg",
  lottie: "lottie",
  "video-embed": "video-embed",
  "map-embed": "map-embed",
  navbar: "navbar",
  footer: "footer",
  cta: "cta",
  accordion: "accordion",
  tabs: "tabs",
  modal: "button",
  testimonials: "testimonials",
  pricing: "pricing",
  "social-icons": "social",
  slider: "slider",
  "theme-toggle": "container",
};

function insert(blockId: string) {
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const def = getBlockById(blockId);
  if (!def) throw new Error(`no block ${blockId}`);
  const id = insertBlock(composer, def, page.root.id);
  if (!id) throw new Error(`block ${blockId} did not insert`);
  return { composer, page, el: composer.elements.getElement(id)! };
}

/** Same normalisation the baseline was captured with: ids are per-run. */
function norm(s: string): string {
  const ids = new Map<string, string>();
  return s
    .replace(/(el|root)-[a-z0-9]+-[a-z0-9]+/g, (id) => {
      if (!ids.has(id)) ids.set(id, `ID${ids.size}`);
      return ids.get(id)!;
    })
    .replace(/page-[a-z0-9-]+/g, "PAGE");
}

async function publishedFiles(composer: ReturnType<typeof createTestComposer>): Promise<string> {
  const res = await new ExportEngine(composer).exportAllPages({ format: "html", minify: false });
  return res.files
    .filter((f) => /\.(html|css)$/.test(f.name))
    .map((f) => `/* ${f.name} */\n${f.name.endsWith(".html") ? f.content.slice(f.content.indexOf("<body")) : f.content}`)
    .join("\n")
    /* The site's token declarations are site-wide, not the block's: since
       BRD-23 every export declares the seed tokens (the baseline predates it).
       That block is pinned by `ExportEngine.tokenClosure.test.ts`. */
    .replace(/\n\n\n:root\{--buildrick-design-[^}]*\}\n/, "");
}

describe("Q2 — inserted blocks keep their real element type", () => {
  it("pins every one of the 55 Add-panel rows", () => {
    expect(flatCatalog).toHaveLength(55);
    expect(flatCatalog.map((e) => e.blockId).sort()).toEqual(Object.keys(EXPECTED_TYPE).sort());
  });

  it.each(flatCatalog.map((e) => [e.name, e.blockId]))("%s (%s) inserts as its real type", (_name, blockId) => {
    expect(insert(blockId).el.getType()).toBe(EXPECTED_TYPE[blockId]);
  });

  it("every registry block inserts as the type it declares", () => {
    const lying = getBlockDefinitions()
      .map((def) => ({ def, type: insert(def.id).el.getType() }))
      .filter(({ def, type }) => type !== def.elementType)
      .map(({ def, type }) => `${def.id}: declares ${def.elementType}, inserts ${type}`);
    expect(lying).toEqual([]);
  });

  it("types a list's items as list items, not generic containers", () => {
    const kids = insert("list").el.getChildren();
    expect(kids.length).toBeGreaterThan(0);
    expect(kids.map((k) => k.getType())).toEqual(kids.map(() => "list-item"));
  });

  it("survives a save/load round trip", () => {
    for (const e of flatCatalog) {
      const { composer, el } = insert(e.blockId);
      const reloaded = createTestComposer();
      reloaded.importProject(JSON.parse(JSON.stringify(composer.exportProject())));
      expect(reloaded.elements.getElement(el.getId())?.getType(), e.blockId).toBe(EXPECTED_TYPE[e.blockId]);
    }
  });
});

describe("Q2 — the type change does not change a single byte of markup", () => {
  const rows = flatCatalog.filter((e) => e.blockId !== "slider").map((e) => [e.name, e.blockId]);
  const recorded = baseline as Record<string, { canvas: string; publish: string }>;

  it.each(rows)("%s (%s) renders on the canvas exactly as before", (_name, blockId) => {
    const { composer, page } = insert(blockId);
    expect(norm(composer.elements.getElement(page.root.id)!.toHTML())).toBe(recorded[blockId].canvas);
  });

  it.each(rows)("%s (%s) publishes exactly as before", async (_name, blockId) => {
    const { composer } = insert(blockId);
    expect(norm(await publishedFiles(composer))).toBe(recorded[blockId].publish);
  });
});
