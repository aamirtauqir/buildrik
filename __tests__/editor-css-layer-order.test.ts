/**
 * The embedded editor's `reset` layer must be ordered before Tailwind's.
 *
 * Whichever stylesheet loads first fixes the order of every layer it names, and
 * a layer nobody has named yet is appended AFTER all of them. The editor ships
 * its own `reset` layer (packages/editor/src/themes/chrome-reset.css —
 * `font: inherit` on button/input/select/textarea, preflight's normalisation).
 * In the editor's own Vite build that layer is declared first, so `tw:text-*`
 * utilities beat it. In the dashboard build the dashboard's CSS loads first,
 * `@import 'tailwindcss'` fixes the order as theme/base/components/utilities,
 * and the editor's `reset` then arrives as a brand-new layer — landing ON TOP
 * of the utilities and silently defeating them.
 *
 * Measured in a real browser at /edit/<siteId> before the fix: a `<button>` and
 * a `<div>` carrying the identical class string computed 16px/400 and 11px/500;
 * on the editor's own port 5050 both computed 11px/500. Every chrome button in
 * the SHIPPING editor was ignoring its own text size, weight and colour — the
 * exact failure `chrome-reset.css` documents and believed it had fixed.
 *
 * A layer-order bug cannot be caught by either package's unit tests (neither
 * renders the other's CSS) or by the editor's parity probe (that runs the Vite
 * build, where the order is already right), so this guards the one line that
 * decides it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CSS = readFileSync(resolve(__dirname, "..", "packages", "dashboard", "app", "globals.css"), "utf8");

describe("dashboard globals.css — layer order for the embedded editor", () => {
  it("names the reset layer", () => {
    expect(CSS).toMatch(/@layer\s+reset\s*;/);
  });

  it("names it BEFORE the tailwind import — after it, the order is already fixed", () => {
    const layer = CSS.search(/@layer\s+reset\s*;/);
    const tw = CSS.search(/@import\s+['"]tailwindcss['"]/);
    expect(layer).toBeGreaterThanOrEqual(0);
    expect(tw).toBeGreaterThanOrEqual(0);
    expect(layer).toBeLessThan(tw);
  });

  it("still imports tailwind — the guard is about order, not removal", () => {
    expect(CSS).toMatch(/@import\s+['"]tailwindcss['"]/);
  });
});

describe("the editor's reset is a layer at all", () => {
  const RESET = readFileSync(
    resolve(__dirname, "..", "packages", "editor", "src", "themes", "chrome-reset.css"),
    "utf8",
  );

  it("wraps its normalisation in @layer reset", () => {
    expect(RESET).toMatch(/@layer\s+reset\s*\{/);
  });

  it("keeps the font/colour normalisation the utilities have to beat", () => {
    // If this ever moves out of the layer, unlayered author CSS beats every
    // layered rule and the order fix above stops mattering.
    const layerStart = RESET.indexOf("@layer reset");
    expect(RESET.slice(layerStart)).toMatch(/font:\s*inherit/);
  });
});
