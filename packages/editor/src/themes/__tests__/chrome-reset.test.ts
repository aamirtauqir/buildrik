/**
 * chrome-reset.css leaks into the customer canvas if any `.bd-studio`-rooted
 * selector doesn't exclude the canvas subtree (fix round 1, reviewer finding
 * #1 — CRITICAL). `.bd-studio` is an ANCESTOR of `.buildrick-canvas`
 * (src/editor/canvas/Canvas.tsx — the div that mounts raw customer HTML via
 * dangerouslySetInnerHTML), and the file loads unlayered in default.css, so
 * a bare `.bd-studio *` rule would restyle customer content with maximum
 * cascade priority — the exact violation spec §4.1 exists to prevent.
 *
 * jsdom can't prove computed styles don't leak into a mounted canvas
 * subtree in a meaningful way here (no real cascade/layer resolution), so
 * this asserts the CSS source directly: every `.bd-studio`-rooted selector
 * in the file must carry the `:not(.buildrick-canvas, .buildrick-canvas *)`
 * guard. A selector-parsing test catches a future edit that re-adds a bare
 * `.bd-studio *` rule, which a computed-style test in jsdom would not.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const CSS_PATH = path.resolve(__dirname, "../chrome-reset.css");
const CANVAS_GUARD = ":not(.buildrick-canvas, .buildrick-canvas *)";

/** Splits a selector list on top-level commas only — a naive `.split(",")`
 * would also split inside `:not(a, b)`, which every guarded selector here
 * uses. Depth-tracks parens instead of matching CSS grammar in full; that's
 * enough for this file's selectors (no attribute-value commas, no strings). */
function splitTopLevel(selectorList: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of selectorList) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function parseSelectors(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return withoutComments
    .split("}")
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => splitTopLevel(block.split("{")[0]))
    .map((selector) => selector.trim())
    .filter(Boolean);
}

describe("chrome-reset.css canvas exclusion", () => {
  const css = fs.readFileSync(CSS_PATH, "utf-8");
  const selectors = parseSelectors(css);

  it("parsed at least one rule (a passing empty test would prove nothing)", () => {
    expect(selectors.length).toBeGreaterThan(0);
  });

  it("every .bd-studio-rooted selector carries the canvas-exclusion guard", () => {
    const bdStudioSelectors = selectors.filter((s) => s.startsWith(".bd-studio"));
    expect(bdStudioSelectors.length).toBeGreaterThan(0);

    const missingGuard = bdStudioSelectors.filter((s) => !s.includes(CANVAS_GUARD));
    expect(missingGuard).toEqual([]);
  });
});
