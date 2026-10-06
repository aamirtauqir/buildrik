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
import { emitSiteTokenCss, siteFontsFromSettings } from "../ExportHelpers";
import { DEFAULT_TOKENS, DEFAULT_TOKENS_V5 } from "@/engine/designSystem/defaultTokens";
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";

const siteTokensCSS = (designTokens?: unknown[] | null) =>
  emitSiteTokenCss({ designTokens: designTokens ?? undefined });

describe("emitSiteTokenCss", () => {
  it("declares every token that has a cssVar", () => {
    const css = siteTokensCSS([
      v6Token({ id: "color-text-primary", cssVar: "--buildrick-design-color-text-primary", value: "#22AA66" }),
      v6Token({ id: "space-4", cssVar: "--buildrick-design-space-4", value: "16px" }),
    ]);
    expect(css).toContain("--buildrick-design-color-text-primary:#22AA66");
    expect(css).toContain("--buildrick-design-space-4:16px");
    expect(css.trim().startsWith(":root{")).toBe(true);
  });

  /* BRD-23: a site saves only the tokens it touched, while element defaults
     name seed tokens (button and form sizes) the Brand panel never writes.
     "Emits nothing" for a site with no saved tokens was the bug. */
  it("declares the seed when the site has saved no tokens", () => {
    for (const css of [siteTokensCSS([]), siteTokensCSS(), siteTokensCSS(null)]) {
      expect(css).toContain("--buildrick-design-btn-height-md:40px");
      expect(css).toContain("--buildrick-design-input-radius:8px");
      expect(css).toContain("--buildrick-design-color-brand-500:#1A56DB");
      expect(css).toContain("--buildrick-design-color-primary:var(--buildrick-design-color-brand-500)");
    }
  });

  it("a saved value wins over the seed", () => {
    const seed = siteTokensCSS([]);
    expect(seed).toContain("--buildrick-design-btn-radius:8px");
    const css = siteTokensCSS([v6Token({ id: "btn-radius", cssVar: "--buildrick-design-btn-radius", value: "2px" })]);
    expect(css).toContain("--buildrick-design-btn-radius:2px");
    expect(css).not.toContain("--buildrick-design-btn-radius:8px");
  });

  /* D17: an unusable saved row never reverts the site to the default brand. */
  it("an unusable saved row keeps every other saved value and its own value", () => {
    const rows = DEFAULT_TOKENS_V5.map((t) =>
      t.id === "color-primary" ? { ...t, value: "#FF0000" } : t.id === "color-text" ? { ...t, value: "#123456" } : t
    );
    const bad = { id: "My Token", name: "My Token", value: "#00FF00", category: "colors", cssVar: "--buildrick-design-my-token", type: "color" };
    const css = emitSiteTokenCss({ designTokens: [...rows, bad], designTokensSchemaVersion: 5 });
    expect(css).toContain("--buildrick-design-color-primary:#FF0000");
    expect(css).toContain("--buildrick-design-color-text:#123456");
    expect(css).toContain("--buildrick-design-my-token:#00FF00");
    expect(css).not.toContain("undefined");
  });

  it("a bad custom-property name on one token is skipped while the rest export", () => {
    const css = siteTokensCSS([
      ...DEFAULT_TOKENS,
      v6Token({ id: "evil", cssVar: "--x:red}</style><script>", value: "#000" }),
      v6Token({ id: "good", cssVar: "--buildrick-design-good", value: "#123456" }),
    ]);
    expect(css).not.toMatch(/<\/style>|<script|--x:/);
    expect(css).toContain("--buildrick-design-good:#123456");
    expect(css).toContain("--buildrick-design-btn-height-md:40px");
  });

  it("skips a token whose value is empty", () => {
    const css = siteTokensCSS([v6Token({ id: "color-x", cssVar: "--buildrick-design-color-x", value: "" })]);
    expect(css).not.toContain("--buildrick-design-color-x:");
  });

  /* A token value is user data. It must not be able to end its declaration,
     open a block, or close the surrounding </style>. */
  it("strips the characters that would let a value escape its declaration", () => {
    expect(
      siteTokensCSS([v6Token({ id: "x", cssVar: "--buildrick-design-x", value: "red;} body{display:none" })])
    ).toContain("--buildrick-design-x:red bodydisplay:none");
  });

  it("cannot close the style element, by value or by custom-property name", () => {
    const css = siteTokensCSS([
      v6Token({ id: "x", cssVar: "--buildrick-design-x", value: "red</style><script>go()</script>" }),
      v6Token({ id: "y", cssVar: "--y:red}</style><script>", value: "#000" }),
    ]);
    expect(css).not.toContain("</style>");
    expect(css).not.toContain("<script");
  });

  it("ships dark blocks only when the site's Dark mode is auto", () => {
    const tokens = [v6Token({ id: "color-primary", cssVar: "--buildrick-design-color-primary", value: "#111111", dark: "#EEEEEE" })];
    expect(emitSiteTokenCss({ designTokens: tokens, darkMode: "off" })).not.toContain("prefers-color-scheme");
    expect(emitSiteTokenCss({ designTokens: tokens, darkMode: "auto" })).toContain("prefers-color-scheme: dark");
    expect(emitSiteTokenCss({ designTokens: tokens, darkMode: "bogus" })).not.toContain("prefers-color-scheme");
  });
});

/* The same gap was found and fixed three separate times for fonts — single
   file, publish, preview — because each assembles its own document. These
   pin all three at once for the token definitions. */
describe("the three documents carry the token definitions", () => {
  const tokens = [
    v6Token({ id: "color-text-primary", name: "Text Primary", value: "#22AA66" }),
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

describe("siteFontsFromSettings", () => {
  it("resolves a text-only v5 save against the emit list", () => {
    const only = { id: "color-text", name: "Text", value: "#123456", category: "colors", cssVar: "--buildrick-design-color-text", type: "color" };
    expect(siteFontsFromSettings({ designTokens: [only], designTokensSchemaVersion: 5 })).toEqual({ text: "#123456" });
  });
});
