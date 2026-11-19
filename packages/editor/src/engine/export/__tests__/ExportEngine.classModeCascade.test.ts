/**
 * CLASS-FIRST-SPEC §6 P0 acceptance 2, at the export level: switching a site
 * to the class style model changes no computed value where nothing competes
 * with an element's own value, and where something does, the class-first
 * ladder decides (tag < class < combo < element-local, at every breakpoint
 * and in every state — owner Q3).
 *
 * Values are read with an exact CSS cascade over the emitted stylesheets
 * (fixtures/cssCascade.ts), on the published pages, Preview and the canvas
 * sheet at each breakpoint. Not a browser: the live Playwright sweep
 * (scripts/class-first/computed-style-sweep.mjs) is the running-app check.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import type { Composer } from "@/engine/Composer";
import type { StyleModel } from "@buildrik/shared/schemas/class-styles";
import { emittedSurfaces, loadStyleModelSite } from "./fixtures/styleModelSite";
import { cascade, pageCss, type ElementDescriptor, type State } from "./fixtures/cssCascade";

beforeAll(() => {
  installEngineBrowserStubs();
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
});
afterAll(() => {
  removeEngineBrowserStubs();
  vi.unstubAllGlobals();
});

const WIDTHS = { desktop: 1280, tablet: 900, mobile: 500 } as const;
const STATES: State[] = ["normal", "hover", "focus"];

/** Every element in a page's HTML, with the classes it is published with. */
function elementsOf(html: string): ElementDescriptor[] {
  return [...html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bdata-buildrick-id="([^"]+)"[^>]*)>/g)].map(([, tag, attrs, id]) => ({
    tag,
    id,
    classes: (/\bclass="([^"]*)"/.exec(attrs)?.[1] ?? "").split(/\s+/).filter(Boolean),
  }));
}

async function surfaces(styleModel: StyleModel, classRules: boolean): Promise<Record<string, string>> {
  const composer: Composer = createTestComposer();
  composer.styleModel = styleModel;
  loadStyleModelSite(composer, { classRules });
  try {
    return await emittedSurfaces(composer);
  } finally {
    composer.destroy();
  }
}

/** Resolved values: surface → element → width/device → state → props. */
function resolveAll(s: Record<string, string>): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  const record = (key: string, css: string, els: ElementDescriptor[], width: number) => {
    for (const el of els) for (const state of STATES) out[`${key} ${el.id} ${width} ${state}`] = cascade(css, el, width, state);
  };
  for (const page of ["publish-index.html", "publish-about.html"]) {
    for (const width of Object.values(WIDTHS)) record(page, pageCss(s[page]), elementsOf(s[page]), width);
  }
  for (const page of ["zip-index.html", "zip-about.html"]) {
    for (const width of Object.values(WIDTHS)) record(page, s["zip-styles.css"], elementsOf(s[page]), width);
  }
  const previewEls = elementsOf(s["preview.html"]);
  for (const width of Object.values(WIDTHS)) record("preview", s["preview.css"], previewEls, width);
  // The canvas sheet carries no media queries: each device's sheet already is that breakpoint.
  for (const device of ["desktop", "tablet", "mobile"] as const) {
    record(`canvas-${device}`, s[`canvas-${device}.css`], previewEls, WIDTHS[device]);
  }
  return out;
}

const pick = (r: Record<string, Record<string, string>>, key: string, prop: string) => r[key]?.[prop];

describe("class style model — computed values (P0 acceptance 2)", () => {
  it("a 100% element-local site resolves identically in both models, on every surface", async () => {
    const legacy = resolveAll(await surfaces("element", false));
    const classes = resolveAll(await surfaces("class", false));
    expect(Object.keys(classes).length).toBeGreaterThan(200);
    expect(classes).toEqual(legacy);
  });

  it("the class model emits a different (laddered) stylesheet, not the legacy one", async () => {
    const legacy = await surfaces("element", false);
    const classes = await surfaces("class", false);
    expect(classes["zip-styles.css"]).not.toBe(legacy["zip-styles.css"]);
    expect(classes["zip-styles.css"]).toContain('.buildrick-heroTitle'.repeat(5));
    expect(classes["canvas-tablet.css"]).toContain('[data-buildrick-id="heroTitle"]'.repeat(5));
  });

  it("applies the ladder: tag < class < combo < element-local, at every breakpoint and state", async () => {
    const r = resolveAll(await surfaces("class", true));
    for (const surface of ["publish-index.html", "zip-index.html", "preview"]) {
      const at = (id: string, bp: keyof typeof WIDTHS, state: State, prop: string) => pick(r, `${surface} ${id} ${WIDTHS[bp]} ${state}`, prop);
      // Element-local beats the class's base, its :hover and its tablet value.
      expect(at("heroTitle", "desktop", "normal", "color")).toBe("rgb(10, 20, 30)");
      expect(at("heroTitle", "desktop", "hover", "color")).toBe("rgb(11, 21, 31)");
      expect(at("heroTitle", "tablet", "normal", "font-size")).toBe("36px");
      expect(at("heroTitle", "mobile", "normal", "font-size")).toBe("28px");
      // A class value nothing local competes with applies, per breakpoint.
      expect(at("heroTitle", "desktop", "normal", "letter-spacing")).toBe("1px");
      expect(at("heroTitle", "tablet", "normal", "letter-spacing")).toBe("2px");
      // Class beats tag; the tag value applies where no class sets it.
      expect(at("heroTitle", "desktop", "normal", "font-weight")).toBe("600");
      // Combo beats its base, though the base rule was written later.
      expect(at("cardBox", "desktop", "normal", "border")).toBe("1px solid rgb(9, 9, 9)");
      expect(at("cardBox", "mobile", "normal", "padding")).toBe("12px");
      // Class names match case-sensitively until spellings merge (P1): `Card` gets no
      // `.card` padding (published pages fall back to the reset's).
      expect(at("noteText", "desktop", "normal", "padding")).not.toBe("24px");
    }
  });

  it("canvas and publish agree in the class model, breakpoint by breakpoint", async () => {
    const r = resolveAll(await surfaces("class", true));
    for (const id of ["heroTitle", "cardBox", "noteText", "ctaButton", "cardText"]) {
      for (const bp of ["desktop", "tablet", "mobile"] as const) {
        for (const state of STATES) {
          const canvas = r[`canvas-${bp} ${id} ${WIDTHS[bp]} ${state}`];
          const published = r[`publish-index.html ${id} ${WIDTHS[bp]} ${state}`];
          // The published page also carries the reset and site tokens; compare what the canvas sets.
          for (const prop of Object.keys(canvas)) {
            if (prop === "display") continue; // hide flag: canvas keeps it selectable via the same rule
            expect(published[prop], `${id} ${bp} ${state} ${prop}`).toBe(canvas[prop]);
          }
        }
      }
    }
  });

  it("changes a published value only where an imported class rule competed with a local one (the §5.3 parity case)", async () => {
    const legacy = resolveAll(await surfaces("element", true));
    const classes = resolveAll(await surfaces("class", true));
    const diffs = new Set<string>();
    for (const key of Object.keys(legacy)) {
      if (!key.startsWith("publish-")) continue;
      const [, id, width, state] = key.split(" ");
      const props = new Set([...Object.keys(legacy[key]), ...Object.keys(classes[key])]);
      for (const prop of props) if (legacy[key][prop] !== classes[key][prop]) diffs.add(`${id} ${width} ${state} ${prop}`);
    }
    // heroTitle's own color, :hover color and tablet font-size lost to `.hero-title`,
    // `.hero-title:hover` and the tablet `.hero-title` (written later, same specificity) in
    // legacy order; the ladder gives them back. Nothing else moves.
    expect([...diffs].sort()).toEqual([
      "heroTitle 1280 focus color",
      "heroTitle 1280 hover color",
      "heroTitle 1280 normal color",
      "heroTitle 500 focus color",
      "heroTitle 500 hover color",
      "heroTitle 500 normal color",
      "heroTitle 900 focus color",
      "heroTitle 900 focus font-size",
      "heroTitle 900 hover color",
      "heroTitle 900 hover font-size",
      "heroTitle 900 normal color",
      "heroTitle 900 normal font-size",
    ]);
  });
});
