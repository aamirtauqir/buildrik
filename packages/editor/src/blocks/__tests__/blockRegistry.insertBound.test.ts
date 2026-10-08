// @vitest-environment jsdom
/**
 * Spec §3 test 4: every Add-panel block inserts token-bound. No colour literal
 * in any style value; no raw length in a tokenized property. Exceptions live in
 * ALLOWED below, each with a reason (OQ-9: third-party brand colours).
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { COLOR_LITERAL_RE, RAW_VALUE_ALLOWED, TOKENIZED_PROPERTIES } from "@/shared/constants/tokenProperties";
import { insertBlock, getBlockDefinitions } from "../blockRegistry";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

/** `${blockId} ${prop}` → why it stays raw. A RATCHET: the owner kept these
 *  raw rather than snap them to the nearest token (OQ-2, 2026-10-08); the list
 *  may only shrink — an entry nothing needs any more fails the test below. */
const ALLOWED: Record<string, string> = {
  "accordion color": "colour with no exactly-equal token (OQ-2)",
  "card box-shadow": "shadow with no exactly-equal shadow token (OQ-2)",
  "card color": "colour with no exactly-equal token (OQ-2)",
  "cart-button background": "#2563EB button and its white label: no exact token (OQ-2)",
  "cart-button color": "#2563EB button and its white label: no exact token (OQ-2)",
  "checkbox color": "colour with no exactly-equal token (OQ-2)",
  "collection-list border-radius": "off-scale length with no exactly-equal token (OQ-2)",
  "contact padding": "off-scale length with no exactly-equal token (OQ-2)",
  "cta padding": "off-scale length with no exactly-equal token (OQ-2)",
  "date border": "colour with no exactly-equal token (OQ-2)",
  "email border": "colour with no exactly-equal token (OQ-2)",
  "features padding": "off-scale length with no exactly-equal token (OQ-2)",
  "flex background": "colour with no exactly-equal token (OQ-2)",
  "footer background": "dark placeholder fill #1A1A2E: no exact token (OQ-2)",
  "footer color": "white text on the raw #1A1A2E fill stays raw with it (OQ-2)",
  "grid background": "colour with no exactly-equal token (OQ-2)",
  "hero padding": "off-scale length with no exactly-equal token (OQ-2)",
  "icon color": "white glyph with no fill behind it — no token role (OQ-2)",
  "label color": "colour with no exactly-equal token (OQ-2)",
  "list color": "colour with no exactly-equal token (OQ-2)",
  "lottie background": "colour with no exactly-equal token (OQ-2)",
  "lottie color": "colour with no exactly-equal token (OQ-2)",
  "map-embed background": "dark placeholder fill #1A1A2E: no exact token (OQ-2)",
  "map-embed color": "colour with no exactly-equal token (OQ-2)",
  "map-embed font-size": "off-scale length with no exactly-equal token (OQ-2)",
  "menu-grid padding": "off-scale length with no exactly-equal token (OQ-2)",
  "modal background": "colour with no exactly-equal token (OQ-2)",
  "modal boxShadow": "shadow with no exactly-equal shadow token (OQ-2)",
  "modal color": "colour with no exactly-equal token (OQ-2)",
  "navbar box-shadow": "shadow with no exactly-equal shadow token (OQ-2)",
  "navbar color": "colour with no exactly-equal token (OQ-2)",
  "number border": "colour with no exactly-equal token (OQ-2)",
  "paragraph color": "colour with no exactly-equal token (OQ-2)",
  "password border": "colour with no exactly-equal token (OQ-2)",
  "product-card background": "#2563EB button and its white label: no exact token (OQ-2)",
  "product-card box-shadow": "shadow with no exactly-equal shadow token (OQ-2)",
  "product-card color": "#2563EB button and its white label: no exact token (OQ-2)",
  "product-card padding": "off-scale length with no exactly-equal token (OQ-2)",
  "product-detail background": "#2563EB button and its white label: no exact token (OQ-2)",
  "product-detail color": "#2563EB button and its white label: no exact token (OQ-2)",
  "product-detail font-size": "off-scale length with no exactly-equal token (OQ-2)",
  "radio color": "colour with no exactly-equal token (OQ-2)",
  "social-icons border-radius": "circle, not a radius step",
  "stack color": "colour with no exactly-equal token (OQ-2)",
  "submit padding": "off-scale length with no exactly-equal token (OQ-2)",
  "switch background": "colour with no exactly-equal token (OQ-2)",
  "switch boxShadow": "shadow with no exactly-equal shadow token (OQ-2)",
  "switch color": "colour with no exactly-equal token (OQ-2)",
  "table background": "status pill and body-copy colours with no exact token (OQ-2)",
  "table boxShadow": "shadow with no exactly-equal shadow token (OQ-2)",
  "table color": "status pill and body-copy colours with no exact token (OQ-2)",
  "table padding": "off-scale length with no exactly-equal token (OQ-2)",
  "tabs color": "colour with no exactly-equal token (OQ-2)",
  "testimonials-section padding": "off-scale length with no exactly-equal token (OQ-2)",
  "textarea padding-bottom": "off-scale length with no exactly-equal token (OQ-2)",
  "textarea padding-top": "off-scale length with no exactly-equal token (OQ-2)",
  "time border": "colour with no exactly-equal token (OQ-2)",
  "video-embed background": "dark placeholder fill #1A1A2E: no exact token (OQ-2)",
  "video-embed color": "colour with no exactly-equal token (OQ-2)",
  "video-embed font-size": "off-scale length with no exactly-equal token (OQ-2)",
  "video-embed padding-bottom": "16:9 aspect-ratio box, not spacing",
};

interface Node { id: string; type?: string; styles?: Record<string, unknown>; children?: Node[] }

const TOKEN_VAR = /^var\(--buildrick-design-[a-z0-9-]+\)$/;
const isBound = (part: string) => TOKEN_VAR.test(part) || RAW_VALUE_ALLOWED.has(part.toLowerCase());

function isRaw(prop: string, raw: string): boolean {
  if (COLOR_LITERAL_RE.test(raw)) return true;
  return Boolean(TOKENIZED_PROPERTIES[prop]) && !raw.trim().split(/\s+(?![^(]*\))/).every(isBound);
}

function problems(blockId: string, node: Node, out: string[], used: Set<string>) {
  for (const [prop, raw] of Object.entries(node.styles ?? {})) {
    if (typeof raw !== "string" || !isRaw(prop, raw)) continue;
    if (ALLOWED[`${blockId} ${prop}`]) {
      used.add(`${blockId} ${prop}`);
      continue;
    }
    out.push(`${blockId} › ${node.type} › ${prop}: ${raw}`);
  }
  for (const c of node.children ?? []) problems(blockId, c, out, used);
}

describe("every block inserts token-bound (spec test 4)", () => {
  it("leaves no raw colour and no raw tokenized length", () => {
    const found: string[] = [];
    const used = new Set<string>();
    for (const def of getBlockDefinitions()) {
      const composer = createTestComposer();
      const page = composer.elements.createPage("Home");
      insertBlock(composer, def, page.root.id);
      const exported = composer.elements.exportPages().find((p) => p.id === page.id);
      if (exported) problems(def.id, exported.root as Node, found, used);
    }
    expect(found, `raw values:\n${found.join("\n")}`).toEqual([]);
    expect(Object.keys(ALLOWED).filter((k) => !used.has(k)), "stale ALLOWED entries — delete them").toEqual([]);
  });
});
