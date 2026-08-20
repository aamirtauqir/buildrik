/**
 * A published page has to carry the design tokens it references.
 *
 * The Brand panel writes every token into the project ("Apply Changes to go
 * live") and the canvas paints from them. Nothing emitted their DEFINITIONS
 * into an export: measured in the running editor on a site whose Text Primary
 * token was changed to #22AA66 — the value reached project settings and the
 * canvas custom property `--buildrick-design-color-text-primary`, while the
 * exported document contained no `--buildrick-design-*` declaration at all.
 * Every Brand preset and class binding resolves to nothing in that state.
 *
 * All three documents are covered here, because the same gap was found (and
 * fixed) three separate times for fonts: single-file export, publish, preview.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { siteTokensCSS } from "../ExportHelpers";

describe("siteTokensCSS", () => {
  it("declares every token that has a cssVar", () => {
    const css = siteTokensCSS([
      { cssVar: "--buildrick-design-color-text-primary", value: "#22AA66" },
      { cssVar: "--buildrick-design-space-4", value: "16px" },
    ]);
    expect(css).toContain("--buildrick-design-color-text-primary:#22AA66");
    expect(css).toContain("--buildrick-design-space-4:16px");
    expect(css.trim().startsWith(":root{")).toBe(true);
  });

  it("emits nothing when the site has no tokens", () => {
    expect(siteTokensCSS([])).toBe("");
    expect(siteTokensCSS()).toBe("");
  });

  it("skips records with no cssVar or no value rather than writing `:undefined`", () => {
    const css = siteTokensCSS([
      { cssVar: "", value: "#fff" },
      { cssVar: "--buildrick-design-color-x", value: "" },
      { cssVar: "color-y", value: "#000" },
      { cssVar: "--buildrick-design-ok", value: "#123456" },
    ]);
    expect(css).toBe("\n:root{--buildrick-design-ok:#123456}\n");
  });

  it("keeps the first declaration when a cssVar repeats", () => {
    const css = siteTokensCSS([
      { cssVar: "--buildrick-design-color-a", value: "#111111" },
      { cssVar: "--buildrick-design-color-a", value: "#222222" },
    ]);
    expect(css).toBe("\n:root{--buildrick-design-color-a:#111111}\n");
  });

  /* A token value is user data. It must not be able to end its declaration,
     open a block, or close the surrounding </style>. */
  it("strips the characters that would let a value escape its declaration", () => {
    expect(
      siteTokensCSS([{ cssVar: "--buildrick-design-x", value: "red;} body{display:none" }])
    ).toBe("\n:root{--buildrick-design-x:red bodydisplay:none}\n");
  });

  it("cannot close the style element", () => {
    const css = siteTokensCSS([
      { cssVar: "--buildrick-design-x", value: "red</style><script>go()</script>" },
    ]);
    expect(css).not.toContain("</style>");
    expect(css).not.toContain("<script");
  });
});

/* The same gap was found and fixed three separate times for fonts — single
   file, publish, preview — because each assembles its own document. These
   pin all three at once for the token definitions. */
describe("the three documents carry the token definitions", () => {
  const tokens = [
    { id: "color-text-primary", name: "Text Primary", cssVar: "--buildrick-design-color-text-primary", value: "#22AA66", category: "colors", type: "color" },
  ];

  function makeComposer() {
    const page = { id: "p1", name: "Home", slug: "home", isHome: true, root: { id: "r1" }, settings: {} };
    return {
      getProjectSettings: () => ({ designTokens: tokens }),
      elements: {
        getActivePage: () => page,
        getAllPages: () => [page],
        exportPages: () => [page],
        getElement: () => null,
        toHTML: () => "<div></div>",
      },
      styles: { toCSS: () => "", generateResponsiveCSS: () => "" },
      getProjectMetadata: () => ({ name: "Site" }),
    };
  }

  it("single-file export declares them", async () => {
    const { ExportEngine } = await import("../ExportEngine");
    const engine = new ExportEngine(makeComposer() as never);
    expect(engine.generateCSS()).toContain("--buildrick-design-color-text-primary:#22AA66");
  });

  it("the preview document declares them", async () => {
    const { Composer } = await import("../../Composer");
    const c = Object.create(Composer.prototype) as InstanceType<typeof Composer>;
    Object.assign(c, {
      elements: { toHTML: () => "<div></div>", getActivePage: () => ({ name: "Home" }) },
      styles: { toCSS: () => "" },
      getProjectSettings: () => ({ designTokens: tokens }),
    });
    expect(c.exportHTML().combined).toContain("--buildrick-design-color-text-primary:#22AA66");
  });

  it("the published page declares them", async () => {
    const { ExportEngine } = await import("../ExportEngine");
    const engine = new ExportEngine(makeComposer() as never);
    const { files } = await engine.exportAllPages({ format: "html" });
    const css = files.find((f) => f.name === "styles.css")?.content ?? "";
    expect(css).toContain("--buildrick-design-color-text-primary:#22AA66");
  });
});
