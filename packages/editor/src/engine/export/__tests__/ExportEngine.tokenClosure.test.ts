// @vitest-environment jsdom
/**
 * Every custom property an export READS, it also DECLARES.
 *
 * BRD-23 (Brand re-audit 2026-10-05): element defaults write
 * `var(--buildrick-design-btn-height-md)`, `var(--buildrick-design-input-radius)`
 * and friends. The canvas resolves those from `design.css`; the export declared
 * only the tokens the site had SAVED, which never include the button or form
 * seeds. Measured: a button 40px / 16px padding / 8px radius on the canvas was
 * 24px / 0 / 0 in the exported page.
 *
 * Checked as a closure, not per-property: for every block in the registry,
 * collect every `var(--x)` the exported HTML and CSS name and require a
 * `--x:` declaration for each, in all three documents — the single file, the
 * multi-page export (ZIP and Publish write the same files) and the preview.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { insertBlock, getBlockDefinitions } from "@/blocks/blockRegistry";
import { ExportEngine } from "../ExportEngine";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { CATALOG } from "@/editor/components-catalog/catalog";
import { placeCatalogComponent } from "@/editor/components-catalog/placeCatalogComponent";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

/** Names a document reads through `var(--name` minus the ones it declares. */
function undeclared(doc: string): string[] {
  const text = doc.replace(/&quot;|&#34;/g, '"');
  const read = new Set([...text.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)].map((m) => m[1]));
  const declared = new Set(
    [...text.matchAll(/(?:^|[;{\s"'])(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1])
  );
  return [...read].filter((name) => !declared.has(name)).sort();
}

/* A site that saved its brand once: colours and fonts only — the shape the
   audit's scratch site had. No button or form token among them. */
const SAVED_BRAND = DEFAULT_TOKENS.filter((t) => t.category === "colors" || t.category === "typography").map(
  (t) => (t.id === "color-primary" ? { ...t, value: "#B91C1C" } : t)
);

describe.each([
  ["a site that never saved a brand", undefined],
  ["a site that saved colours and fonts", SAVED_BRAND],
] as const)("token closure — %s", (_label, designTokens) => {
  const defs = getBlockDefinitions();

  async function exportsFor(def: (typeof defs)[number]) {
    const composer = createTestComposer();
    if (designTokens) {
      composer.setProjectSettings({ ...composer.getProjectSettings(), designTokens: [...designTokens] });
    }
    const page = composer.elements.createPage("Home");
    composer.elements.setActivePage?.(page.id);
    insertBlock(composer, def, page.root.id);
    const engine = new ExportEngine(composer);
    const single = engine.generateHTML({ includeResetCSS: true }) + engine.generateCSS();
    const { files } = await engine.exportAllPages({ format: "html" });
    const multi = files
      .filter((f) => f.type === "html" || f.name.endsWith(".css"))
      .map((f) => f.content)
      .join("\n");
    const preview = composer.exportHTML().combined;
    return { single, multi, preview };
  }

  it("declares every var() each block's export reads", async () => {
    expect(defs.length).toBeGreaterThan(40);
    const gaps: string[] = [];
    for (const def of defs) {
      const docs = await exportsFor(def);
      for (const [doc, text] of Object.entries(docs)) {
        const missing = undeclared(text);
        if (missing.length) gaps.push(`${def.id} [${doc}]: ${missing.join(", ")}`);
      }
    }
    expect(gaps).toEqual([]);
  });

  it("a button carries the canvas's size, padding and radius values", async () => {
    const button = defs.find((d) => d.id === "button");
    expect(button).toBeDefined();
    const { single, multi } = await exportsFor(button!);
    for (const doc of [single, multi]) {
      expect(doc).toContain("--buildrick-design-btn-height-md:40px");
      expect(doc).toContain("--buildrick-design-btn-padding-x:16px");
      expect(doc).toContain("--buildrick-design-btn-radius:8px");
      expect(doc).toContain("--buildrick-design-input-height:40px");
    }
    if (designTokens) {
      /* The saved value still wins over the seed. */
      expect(multi).toContain("--buildrick-design-color-primary:#B91C1C");
      expect(multi).not.toContain("--buildrick-design-color-primary:#1A56DB");
    }
  });
});

/* The Components catalog (drag from the Components tab) places through its
   own interpreter and binds each variant inline as `var(--token)`. */
describe("token closure — components catalog", () => {
  it("declares every var() each placed catalog component's export reads", async () => {
    expect(CATALOG.length).toBeGreaterThan(10);
    const gaps: string[] = [];
    for (const component of CATALOG) {
      for (const variant of component.variants.length ? component.variants : ["default"]) {
        const composer = createTestComposer();
        const page = composer.elements.createPage("Home");
        placeCatalogComponent(composer, component, page.root.id, undefined, { variant });
        const engine = new ExportEngine(composer);
        const single = engine.generateHTML({ includeResetCSS: true }) + engine.generateCSS();
        const { files } = await engine.exportAllPages({ format: "html" });
        const multi = files.map((f) => f.content).join("\n");
        for (const [doc, text] of Object.entries({ single, multi, preview: composer.exportHTML().combined })) {
          const missing = undeclared(text);
          if (missing.length) gaps.push(`${component.id}/${variant} [${doc}]: ${missing.join(", ")}`);
        }
      }
    }
    expect(gaps).toEqual([]);
  });
});
