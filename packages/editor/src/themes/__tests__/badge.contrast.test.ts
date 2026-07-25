/**
 * Badge text must pass WCAG AA against its own tint — computed, not eyeballed.
 *
 * Every badge paired a full-strength semantic hue with that hue's 10% tint.
 * Measured: success 2.95:1, error 4.14:1, warning 4.38:1, accent 4.18:1 — all
 * under the 4.5:1 body-text floor, on an 11px pill. The full-strength hue is a
 * border/icon weight; the `-text` step is the one that survives on a tint.
 *
 * This is the small version of the contrast rule the conformance plan puts in
 * CI: resolve the real token values, flatten alpha over the page background,
 * compute the ratio. A string-match test would not have caught the original
 * pairing, because every token involved was individually valid.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DS = resolve(__dirname, "../design-system");
const COLOR = readFileSync(resolve(DS, "color.css"), "utf8");
const BADGE = readFileSync(resolve(__dirname, "../components/atoms/badge.css"), "utf8");

/** Page background every chrome tint composites over. */
const PAGE = { r: 1, g: 1, b: 1 };

function token(name: string): string | null {
  const m = COLOR.match(new RegExp(`--buildrick-${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
}
function parse(value: string): { r: number; g: number; b: number; a: number } | null {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: 1 };
  }
  const rgb = value.match(/rgba?\(([^)]+)\)/);
  if (rgb) {
    const p = rgb[1].split(",").map((s) => parseFloat(s.trim()));
    return { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255, a: p[3] === undefined ? 1 : p[3] };
  }
  return null;
}
const flatten = (c: { r: number; g: number; b: number; a: number }) => ({
  r: c.r * c.a + PAGE.r * (1 - c.a),
  g: c.g * c.a + PAGE.g * (1 - c.a),
  b: c.b * c.a + PAGE.b * (1 - c.a),
});
const chan = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const lum = (c: { r: number; g: number; b: number }) => 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b);
function contrast(bg: string, fg: string): number {
  const B = parse(token(bg) ?? ""), F = parse(token(fg) ?? "");
  if (!B || !F) throw new Error(`token missing: ${!B ? bg : fg}`);
  const a = lum(flatten(B)), b = lum(flatten(F));
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

// bg token → text token, as badge.css pairs them
const PAIRS: Array<[string, string, string]> = [
  ["published", "success-light", "success-text"],
  ["issues", "error-light", "error-text"],
  ["unsaved", "warning-light", "warning-text"],
  ["draft", "layer-muted-alpha", "text-secondary"],
  ["syncing", "accent-alpha-08", "accent-text"],
  ["new", "accent-tint", "accent-text"],
  ["count", "accent-tint", "accent-text"],
];

describe("badge contrast", () => {
  it.each(PAIRS)("%s passes AA on its own tint", (_variant, bg, fg) => {
    expect(contrast(bg, fg)).toBeGreaterThanOrEqual(4.5);
  });

  it("never pairs badge TEXT with a full-strength semantic hue", () => {
    // the border keeps full strength; only `color:` must use the -text step.
    // Anchored, because `border-color:` also ends in `color:`.
    const colours = [...BADGE.matchAll(/(?:^|[;{])\s*color:\s*var\(--buildrick-([a-z0-9-]+)\)/gm)]
      .map((m) => m[1])
      .filter((t) => !t.startsWith("text-") && t !== "text-on-accent");
    const banned = colours.filter((t) => ["success", "error", "warning", "accent"].includes(t));
    expect(banned).toEqual([]);
  });

  it("every token badge.css references is defined", () => {
    const used = new Set([...BADGE.matchAll(/var\(--buildrick-([a-z0-9-]+)\)/g)].map((m) => m[1]));
    const undef = [...used].filter((t) => !new RegExp(`--buildrick-${t}:`).test(COLOR)
      && !/space|font|radius|text-(xs|2xs)/.test(t));
    expect(undef).toEqual([]);
  });
});
