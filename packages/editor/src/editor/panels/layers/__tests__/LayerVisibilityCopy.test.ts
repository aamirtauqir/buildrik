/**
 * The layers eye is an editor affordance, and its name has to say so.
 *
 * "Hide element" already means something specific in this product: a page set
 * to Hidden is EXCLUDED from the publish (ExportEngine.isPageLive). The eye
 * does not touch the element model — `useLayerActions.toggleVisibility` sets
 * `data-hidden` on the canvas node and Canvas.css draws that at opacity .25
 * with pointer-events off. Measured in the running editor: toggling it left
 * the element in the exported body.
 *
 * Hiding an element ON THE SITE is the inspector's Visibility section, which
 * writes a per-breakpoint hide into the exported styles.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const row = readFileSync(join(__dirname, "..", "LayerTreeItem.tsx"), "utf8");
const banner = readFileSync(join(__dirname, "..", "components", "LayerSelectionBanner.tsx"), "utf8");
const actions = readFileSync(join(__dirname, "..", "hooks", "useLayerActions.ts"), "utf8");
const canvasCss = readFileSync(join(__dirname, "..", "..", "..", "canvas", "Canvas.css"), "utf8");

const labels = (src: string) =>
  [...src.matchAll(/aria-label=(?:"([^"]+)"|\{[^}]*?"([^"]+)"[^}]*?\})/g)]
    .flatMap((m) => [m[1], m[2]])
    .filter(Boolean)
    .join(" | ");

describe("layers visibility control", () => {
  it("does not call itself hide, which is what a page does", () => {
    expect(labels(row)).not.toMatch(/Hide element/);
    expect(labels(banner)).not.toMatch(/^Hide$/m);
  });

  it("says the elements still publish", () => {
    expect(row).toMatch(/still publishes/);
    expect(banner).toMatch(/still publish/);
  });

  it("matches the code: the toggle only writes a canvas attribute", () => {
    const fn = actions.slice(actions.indexOf("const toggleVisibility"));
    const body = fn.slice(0, fn.indexOf("const toggleLock"));
    expect(body).toMatch(/data-hidden/);
    expect(body).not.toMatch(/setStyle|removeElement|setData/);
  });

  it("matches the CSS: hidden is dimmed, not removed", () => {
    const rule = canvasCss.slice(canvasCss.indexOf('[data-hidden="true"]'));
    expect(rule.slice(0, 140)).toMatch(/opacity:\s*0?\.25/);
    expect(rule.slice(0, 140)).not.toMatch(/display:\s*none/);
  });
});
