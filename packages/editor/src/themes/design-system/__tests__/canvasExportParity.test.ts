/**
 * The canvas may only restore what the PUBLISHED page keeps.
 *
 * The editor bundles into a Next app whose `globals.css` imports Tailwind
 * whole, so preflight reaches the canvas and flattens customer content. The fix
 * is to put things back — but only the things the export does not itself
 * remove, or the canvas drifts from the live site in the other direction.
 *
 * That is not hypothetical: the first version of the restore block put the
 * browser's heading margins and list padding back, and `RESET_CSS` zeroes both
 * on every export. Caught in review; pinned here so it cannot return.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RESET_CSS } from "../../../engine/export/ExportHelpers";

const css = readFileSync(join(__dirname, "..", "site-content.css"), "utf8");
/** Just the canvas-restore block — the rest of the file is site DS defaults. */
const restore = css
  .split("\n")
  .filter((l) => l.startsWith(":where(.buildrick-canvas"))
  .join("\n");

describe("canvas restore vs the export reset", () => {
  it("the block exists at all", () => {
    expect(restore).toMatch(/:where\(\.buildrick-canvas h1\)/);
  });

  it("restores nothing the export zeroes — margin", () => {
    // RESET_CSS carries `*{margin:0;padding:0}`, so a margin here would show in
    // the canvas and never on the site.
    expect(RESET_CSS).toMatch(/\*\{margin:0;padding:0\}/);
    expect(restore).not.toMatch(/\bmargin\b/);
  });

  it("restores nothing the export zeroes — padding", () => {
    expect(restore).not.toMatch(/\bpadding\b/);
  });

  it("does restore what the export leaves alone — heading scale", () => {
    // RESET_CSS never sets font-size, so the published page keeps the UA scale
    // and the canvas has to as well.
    expect(RESET_CSS).not.toMatch(/font-size/);
    expect(restore).toMatch(/h1\) \{ font-size: 2em/);
    expect(restore).toMatch(/h6\) \{ font-size: 0\.67em/);
  });

  it("does restore what the export leaves alone — list markers", () => {
    expect(RESET_CSS).not.toMatch(/list-style/);
    expect(restore).toMatch(/ul\) \{ list-style: disc/);
    expect(restore).toMatch(/ol\) \{ list-style: decimal/);
  });

  it("every restore rule is zero-specificity, so a customer rule still wins", () => {
    for (const line of restore.split("\n").filter(Boolean)) {
      expect(line).toMatch(/^:where\(/);
    }
  });
});
